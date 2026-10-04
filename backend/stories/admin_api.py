"""
👑 Admin Dashboard APIs — is_staff users mattum dhaan use panna mudiyum.
/api/admin/...
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.models import SiteSettings
from accounts.utils import avatar_of
from .models import Story, Part, Like, Comment, Report, Challenge
from .serializers import ChallengeSerializer
from .serializers import StoryListSerializer, story_list_queryset

User = get_user_model()
admin_only = permission_classes([permissions.IsAdminUser])


def to_bool(v):
    """JSON true/false, form 'true'/'False'/'1'/'0' ellam correct ah handle pannum."""
    if isinstance(v, str):
        return v.strip().lower() in ('1', 'true', 'yes', 'on')
    return bool(v)


def daily(qs, field, days=14):
    """Last N naal ku per-day count — missing days ku 0."""
    since = timezone.now() - timedelta(days=days - 1)
    rows = (qs.filter(**{f'{field}__gte': since}).annotate(d=TruncDate(field))
            .values('d').annotate(c=Count('id')))
    counts = {r['d']: r['c'] for r in rows}
    today = timezone.localdate()
    return [{'date': (today - timedelta(days=i)).isoformat(),
             'count': counts.get(today - timedelta(days=i), 0)} for i in range(days - 1, -1, -1)]


@api_view(['GET'])
@admin_only
def stats(request):
    week = timezone.now() - timedelta(days=7)
    return Response({
        'totals': {
            'users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'pending_users': User.objects.filter(is_active=False, last_login__isnull=True).count(),
            'blocked_users': User.objects.filter(is_active=False, last_login__isnull=False).count(),
            'new_users_week': User.objects.filter(date_joined__gte=week).count(),
            'stories': Story.objects.count(),
            'parts': Part.objects.count(),
            'parts_week': Part.objects.filter(created_at__gte=week).count(),
            'reactions': Like.objects.count(),
            'comments': Comment.objects.count(),
            'views': sum(Story.objects.values_list('views', flat=True)),
            'open_reports': Report.objects.filter(status='open').count(),
        },
        'signups': daily(User.objects.all(), 'date_joined'),
        'parts_daily': daily(Part.objects.all(), 'created_at'),
        'types': list(Story.objects.values('content_type').annotate(count=Count('id')).order_by('-count')),
        'genres': list(Story.objects.values('genre').annotate(count=Count('id')).order_by('-count')),
        'languages': list(Story.objects.values('language').annotate(count=Count('id')).order_by('-count')),
        'reactions': list(Like.objects.values('emoji').annotate(count=Count('id')).order_by('-count')),
    })


# ---------------- Users ----------------

def user_row(u):
    return {
        'id': u.id, 'username': u.username, 'email': u.email, 'avatar': avatar_of(u),
        'full_name': getattr(getattr(u, 'profile', None), 'full_name', ''),
        'state': getattr(getattr(u, 'profile', None), 'state', ''),
        'is_active': u.is_active, 'is_staff': u.is_staff,
        'status': 'active' if u.is_active else ('pending' if u.last_login is None else 'blocked'),
        'date_joined': u.date_joined, 'last_login': u.last_login,
        'stories': getattr(u, 'n_stories', 0), 'parts': getattr(u, 'n_parts', 0),
        'likes': getattr(u, 'n_likes', 0),
    }


@api_view(['GET'])
@admin_only
def users(request):
    qs = User.objects.select_related('profile').annotate(
        n_stories=Count('stories', distinct=True), n_parts=Count('parts', distinct=True),
        n_likes=Count('parts__likes', distinct=True),
    ).order_by('-date_joined')
    q = request.query_params.get('q')
    if q:
        qs = qs.filter(Q(username__icontains=q) | Q(email__icontains=q))
    st = request.query_params.get('status')
    if st == 'active':
        qs = qs.filter(is_active=True)
    elif st == 'pending':
        qs = qs.filter(is_active=False, last_login__isnull=True)
    elif st == 'blocked':
        qs = qs.filter(is_active=False, last_login__isnull=False)
    elif st == 'admins':
        qs = qs.filter(is_staff=True)
    return Response([user_row(u) for u in qs[:200]])


@api_view(['PATCH', 'DELETE'])
@admin_only
def user_detail(request, pk):
    u = get_object_or_404(User, pk=pk)
    if u == request.user:
        return Response({'detail': 'Ungal sondha account ah inga maatha mudiyaadhu 🙂'}, status=400)
    if request.method == 'DELETE':
        u.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    for f in ('is_active', 'is_staff'):
        if f in request.data:
            setattr(u, f, to_bool(request.data[f]))
    u.save()
    return Response(user_row(u))


@api_view(['POST'])
@admin_only
def approve_all(request):
    n = User.objects.filter(is_active=False, last_login__isnull=True).update(is_active=True)
    return Response({'approved': n})


# ---------------- Stories ----------------

@api_view(['GET'])
@admin_only
def stories(request):
    qs = story_list_queryset().order_by('-created_at')
    q = request.query_params.get('q')
    if q:
        qs = qs.filter(Q(title__icontains=q) | Q(created_by__username__icontains=q))
    f = request.query_params.get('filter')
    if f == 'featured':
        qs = qs.filter(is_featured=True)
    elif f == 'hidden':
        qs = qs.filter(is_hidden=True)
    return Response(StoryListSerializer(qs[:200], many=True).data)


@api_view(['PATCH', 'DELETE'])
@admin_only
def story_detail(request, pk):
    s = get_object_or_404(Story, pk=pk)
    if request.method == 'DELETE':
        s.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    for f in ('is_featured', 'is_hidden', 'is_winner'):
        if f in request.data:
            setattr(s, f, to_bool(request.data[f]))
    s.save()
    return Response({'id': s.id, 'is_featured': s.is_featured, 'is_hidden': s.is_hidden, 'is_winner': s.is_winner})


# ---------------- Reports ----------------

@api_view(['GET'])
@admin_only
def reports(request):
    st = request.query_params.get('status', 'open')
    qs = Report.objects.select_related('reporter', 'part__author', 'part__story')
    if st != 'all':
        qs = qs.filter(status=st)
    return Response([{
        'id': r.id, 'reason': r.reason, 'note': r.note, 'status': r.status, 'created_at': r.created_at,
        'reporter': r.reporter.username, 'part_id': r.part_id, 'part_author': r.part.author.username,
        'content': r.part.content[:300], 'story_id': r.part.story_id, 'story_title': r.part.story.title,
        'is_root': r.part.parent_id is None,
    } for r in qs[:200]])


@api_view(['POST'])
@admin_only
def report_action(request, pk):
    """action: dismiss | remove (part delete, first part na kadhai hide) | block (author block + remove)"""
    r = get_object_or_404(Report.objects.select_related('part__story', 'part__author'), pk=pk)
    action = request.data.get('action')
    if action == 'dismiss':
        r.status = 'dismissed'
        r.save()
        return Response({'ok': True})
    if action not in ('remove', 'block'):
        return Response({'detail': 'Action thappu.'}, status=400)
    part = r.part
    if action == 'block' and not part.author.is_staff:
        part.author.is_active = False
        part.author.save()
    Report.objects.filter(part=part).update(status='resolved')
    if part.parent_id is None:
        part.story.is_hidden = True
        part.story.save()
    else:
        part.delete()
    return Response({'ok': True})


# ---------------- Site settings ----------------

@api_view(['GET', 'PATCH'])
@admin_only
def site_settings(request):
    s = SiteSettings.load()
    if request.method == 'PATCH':
        if 'require_approval' in request.data:
            s.require_approval = to_bool(request.data['require_approval'])
        if 'announcement' in request.data:
            s.announcement = str(request.data['announcement'])[:300]
        s.save()
    return Response({'require_approval': s.require_approval, 'announcement': s.announcement})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_site(request):
    s = SiteSettings.load()
    return Response({'announcement': s.announcement, 'require_approval': s.require_approval})


# ---------------- Challenges ----------------

@api_view(['GET', 'POST'])
@admin_only
def challenges(request):
    if request.method == 'POST':
        ser = ChallengeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        if ser.validated_data['ends_at'] <= ser.validated_data['starts_at']:
            return Response({'detail': 'End date, start date ku apram irukkanum.'}, status=400)
        ser.save()
        return Response(ser.data, status=201)
    qs = Challenge.objects.annotate(entries_count=Count('entries'))
    return Response(ChallengeSerializer(qs, many=True).data)


@api_view(['PATCH', 'DELETE'])
@admin_only
def challenge_detail(request, pk):
    c = get_object_or_404(Challenge, pk=pk)
    if request.method == 'DELETE':
        c.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    if to_bool(request.data.get('end_now')):
        c.ends_at = timezone.now()
        c.save()
        return Response(ChallengeSerializer(c).data)
    ser = ChallengeSerializer(c, data=request.data, partial=True)
    ser.is_valid(raise_exception=True)
    ser.save()
    return Response(ser.data)
