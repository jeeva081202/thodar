from datetime import timedelta

from django.db.models import Count, F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from accounts.utils import avatar_of, clean_image
from .models import (Story, Part, Like, Comment, Bookmark, Notification, Report, Series, Challenge,
                     REACTIONS, notify)
from .serializers import (StoryListSerializer, StoryWriteSerializer, PartSerializer, CommentSerializer,
                          NotificationSerializer, SeriesSerializer, ChallengeSerializer,
                          story_list_queryset, viewer_sees_author, reading_minutes, media_url, ANON)

TRUE = ('1', 'true', 'on', 'yes')


def flag(v):
    return str(v).lower() in TRUE


def annotated_parts():
    return Part.objects.select_related('author__profile').annotate(
        likes_count=Count('likes', distinct=True),
        children_count=Count('children', distinct=True),
        comments_count=Count('comments', distinct=True),
    )


def part_context(request, parts, story=None):
    """Ella parts kum emoji reaction counts + en reaction — 2 query la."""
    ids = [p.id for p in parts]
    reactions = {}
    for row in (Like.objects.filter(part_id__in=ids).values('part_id', 'emoji')
                .annotate(c=Count('id')).order_by('-c')):
        reactions.setdefault(row['part_id'], {})[row['emoji']] = row['c']
    mine = {}
    if request.user.is_authenticated:
        mine = dict(Like.objects.filter(user=request.user, part_id__in=ids).values_list('part_id', 'emoji'))
    return {'request': request, 'reactions': reactions, 'mine': mine, 'story': story}


def is_admin(request):
    return request.user.is_authenticated and request.user.is_staff


def visible_stories():
    return story_list_queryset().filter(status='published', is_hidden=False, created_by__is_active=True)


# ---------------- Stories ----------------

class StoryListCreate(generics.ListCreateAPIView):
    """GET /api/stories/?type=kavithai&genre=love&lang=ta&search=&sort=popular&feed=following&featured=1"""

    def get_serializer_class(self):
        return StoryWriteSerializer if self.request.method == 'POST' else StoryListSerializer

    def get_queryset(self):
        qs = visible_stories().order_by('-published_at', '-created_at')
        p = self.request.query_params
        if p.get('type'):
            qs = qs.filter(content_type=p['type'])
        if p.get('genre'):
            qs = qs.filter(genre=p['genre'])
        if p.get('lang'):
            qs = qs.filter(language=p['lang'])
        if p.get('featured'):
            qs = qs.filter(is_featured=True)
        if p.get('challenge'):
            qs = qs.filter(challenge_id=p['challenge'])
        if p.get('search'):
            s = p['search']
            qs = qs.filter(Q(title__icontains=s) | Q(parts__content__icontains=s)).distinct()
        if p.get('feed') == 'following' and self.request.user.is_authenticated:
            ids = self.request.user.following_set.values_list('following_id', flat=True)
            qs = qs.filter(Q(created_by__in=ids, is_anonymous=False) | Q(parts__author__in=ids)).distinct()
        if p.get('sort') == 'popular':
            qs = qs.order_by('-likes_count', '-parts_count', '-created_at')
        return qs

    def create(self, request, *args, **kwargs):
        ser = StoryWriteSerializer(data=request.data, context={'request': request})
        ser.is_valid(raise_exception=True)
        story = save_story(ser, request)
        return Response(StoryListSerializer(story_list_queryset().get(pk=story.pk),
                                            context={'request': request}).data, status=201)


def save_story(ser, request, instance=None):
    """Create / edit common logic: series, cover, opening part, image, publish time."""
    data = dict(ser.validated_data)
    opening = data.pop('opening', None)
    speaker = data.pop('speaker', None)
    series_title = (data.pop('series_title', '') or '').strip()
    if series_title and not data.get('series'):
        data['series'] = Series.objects.create(title=series_title, author=request.user)
    if data.get('series') and not data.get('chapter') and not (instance and instance.chapter):
        data['chapter'] = Story.objects.filter(series=data['series']).count() + 1
    if instance is None:
        story = Story(created_by=request.user, **data)
    else:
        story = instance
        for k, v in data.items():
            setattr(story, k, v)
    if 'cover' in request.FILES:
        story.cover.save('c', clean_image(request.FILES['cover']), save=False)
    elif flag(request.data.get('remove_cover')):
        story.cover = ''
    if story.status == 'published' and not story.published_at:
        story.published_at = timezone.now()
    if not story.title and opening:
        story.title = opening.strip().split('\n')[0][:60]
    story.save()

    root = story.root_part
    if root is None:
        root = Part(story=story, author=request.user, content='')
    if opening is not None:
        root.content = opening.strip()
    if speaker is not None:
        root.speaker = speaker.strip()
    if 'image' in request.FILES:
        root.image.save('i', clean_image(request.FILES['image']), save=False)
    elif flag(request.data.get('remove_image')):
        root.image = ''
    root.save()
    return story


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def story_tree(request, pk):
    """Full kadhai: story info + ella parts (flat list, parent id oda). PATCH = owner edit / publish."""
    story = get_object_or_404(Story.objects.select_related('created_by__profile', 'series', 'challenge'), pk=pk)
    owner = request.user.is_authenticated and request.user.id == story.created_by_id
    if (story.is_hidden or story.status == 'draft') and not (owner or is_admin(request)):
        return Response({'detail': 'Indha kadhai kidaikkala.'}, status=404)
    if request.method == 'DELETE':
        if not owner and not is_admin(request):
            return Response({'detail': 'Ungal kadhai mattum dhaan delete panna mudiyum.'}, status=403)
        story.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    if request.method == 'PATCH':
        if not owner:
            return Response({'detail': 'Ungal kadhai mattum dhaan edit panna mudiyum.'}, status=403)
        root = story.root_part
        if 'opening' in request.data and root and root.children.exists():
            return Response({'detail': 'Yaaro continue pannitaanga, first part ah ippo maatha mudiyaadhu.'}, status=400)
        ser = StoryWriteSerializer(story, data=request.data, partial=True, context={'request': request})
        ser.is_valid(raise_exception=True)
        save_story(ser, request, instance=story)
        story.refresh_from_db()

    if request.method == 'GET':
        Story.objects.filter(pk=pk).update(views=F('views') + 1)
        story.views += 1
    parts = list(annotated_parts().filter(story=story))
    bookmarked = (request.user.is_authenticated and
                  Bookmark.objects.filter(user=request.user, story=story).exists())
    show = viewer_sees_author(story, request)
    root = next((p for p in parts if p.parent_id is None), None)
    chapters = []
    if story.series_id:
        chapters = list(Story.objects.filter(series=story.series, status='published', is_hidden=False)
                        .order_by('chapter', 'created_at').values('id', 'title', 'chapter'))
    return Response({
        'story': {
            'id': story.id, 'title': story.title, 'genre': story.genre, 'language': story.language,
            'content_type': story.content_type, 'can_continue': story.can_continue,
            'status': story.status, 'is_anonymous': story.is_anonymous, 'cover': media_url(story.cover),
            'is_featured': story.is_featured, 'is_winner': story.is_winner, 'views': story.views,
            'created_by': story.created_by.username if show else ANON,
            'avatar': avatar_of(story.created_by) if show else 'preset:mask',
            'is_owner': owner, 'created_at': story.published_at or story.created_at,
            'reading_time': reading_minutes(root.content if root else ''),
            'bookmarked': bookmarked, 'bookmarks_count': story.bookmarks.count(),
            'series': {'id': story.series_id, 'title': story.series.title, 'chapter': story.chapter,
                       'chapters': chapters} if story.series_id else None,
            'challenge': {'id': story.challenge_id, 'title': story.challenge.title,
                          'emoji': story.challenge.emoji} if story.challenge_id else None,
        },
        'parts': PartSerializer(parts, many=True, context=part_context(request, parts, story)).data,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_drafts(request):
    qs = story_list_queryset().filter(created_by=request.user, status='draft').order_by('-created_at')
    return Response(StoryListSerializer(qs, many=True, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def story_of_week(request):
    """Last 7 naal la adhigam likes vaangina kadhai."""
    since = timezone.now() - timedelta(days=7)
    qs = visible_stories().annotate(
        week_likes=Count('parts__likes', filter=Q(parts__likes__created_at__gte=since), distinct=True),
    ).order_by('-week_likes', '-likes_count', '-parts_count')
    story = qs.first()
    if not story:
        return Response(None)
    data = StoryListSerializer(story, context={'request': request}).data
    data['week_likes'] = story.week_likes
    return Response(data)


# ---------------- Series ----------------

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_series(request):
    return Response(SeriesSerializer(Series.objects.filter(author=request.user).order_by('-created_at'), many=True).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def series_detail(request, pk):
    s = get_object_or_404(Series.objects.select_related('author'), pk=pk)
    chapters = visible_stories().filter(series=s).order_by('chapter', 'created_at')
    return Response({**SeriesSerializer(s).data, 'author_avatar': avatar_of(s.author),
                     'chapters': StoryListSerializer(chapters, many=True, context={'request': request}).data})


# ---------------- Challenges ----------------

def challenge_qs():
    return Challenge.objects.annotate(
        entries_count=Count('entries', filter=Q(entries__status='published', entries__is_hidden=False)))


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def challenges(request):
    now = timezone.now()
    qs = challenge_qs()
    return Response({
        'active': ChallengeSerializer(qs.filter(starts_at__lte=now, ends_at__gte=now), many=True).data,
        'upcoming': ChallengeSerializer(qs.filter(starts_at__gt=now).order_by('starts_at'), many=True).data,
        'past': ChallengeSerializer(qs.filter(ends_at__lt=now)[:20], many=True).data,
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def challenge_detail(request, pk):
    c = get_object_or_404(challenge_qs(), pk=pk)
    entries = visible_stories().filter(challenge=c).order_by('-is_winner', '-likes_count', '-created_at')
    return Response({**ChallengeSerializer(c).data,
                     'entries': StoryListSerializer(entries, many=True, context={'request': request}).data})


# ---------------- Parts ----------------

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def part_path(request, pk):
    """Root la irundhu indha part varaikkum ulla full path (book view ku)."""
    part = get_object_or_404(Part.objects.select_related('story'), pk=pk)
    story = part.story
    if story.is_hidden or story.status == 'draft':
        if not (request.user.is_authenticated and (request.user.id == story.created_by_id or request.user.is_staff)):
            return Response({'detail': 'Kidaikkala.'}, status=404)
    ids = []
    node = part
    while node:
        ids.append(node.id)
        node = node.parent
    ids.reverse()
    parts = {p.id: p for p in annotated_parts().filter(id__in=ids)}
    ordered = [parts[i] for i in ids]
    return Response({
        'story': {'id': story.id, 'title': story.title, 'genre': story.genre,
                  'language': story.language, 'content_type': story.content_type},
        'parts': PartSerializer(ordered, many=True, context=part_context(request, ordered, story)).data,
    })


def check_content(story, content, speaker=''):
    limit = story.max_len()
    if story.content_type == 'dialogue':
        if not speaker.strip():
            return 'Character peru (speaker) venum.'
        if len(content) < 2:
            return 'Dialogue ezhudhunga.'
    elif len(content) < 10:
        return 'Konjam adhigam ezhudhunga (min 10 letters).'
    if len(content) > limit:
        return f'Max {limit} letters.'
    return None


@api_view(['PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def part_detail(request, pk):
    part = get_object_or_404(Part.objects.select_related('story'), pk=pk)
    if part.author != request.user:
        return Response({'detail': 'Ungal part mattum dhaan maatha mudiyum.'}, status=403)
    if part.children.exists():
        return Response({'detail': 'Yaaro idha continue pannitaanga, ippo maatha mudiyaadhu.'},
                        status=status.HTTP_400_BAD_REQUEST)
    if request.method == 'DELETE':
        if part.parent is None:
            return Response({'detail': 'First part ah delete panna, kadhaiye delete pannunga.'},
                            status=status.HTTP_400_BAD_REQUEST)
        part.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    content = request.data.get('content')
    speaker = request.data.get('speaker', part.speaker)
    if content is not None:
        content = content.strip()
        err = check_content(part.story, content, speaker or '')
        if err:
            return Response({'detail': err}, status=400)
        part.content = content
    part.speaker = (speaker or '')[:40]
    if 'is_ending' in request.data:
        part.is_ending = flag(request.data['is_ending'])
    if 'image' in request.FILES:
        part.image.save('i', clean_image(request.FILES['image']), save=False)
    elif flag(request.data.get('remove_image')):
        part.image = ''
    part.save()
    p = annotated_parts().get(pk=pk)
    return Response(PartSerializer(p, context=part_context(request, [p], part.story)).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def continue_part(request, pk):
    """POST /api/parts/<id>/continue/  { content, speaker?, is_ending?, image? }"""
    parent = get_object_or_404(Part.objects.select_related('story', 'author'), pk=pk)
    story = parent.story
    if not story.can_continue or story.status != 'published':
        return Response({'detail': 'Indha post ah continue panna mudiyaadhu.'}, status=400)
    if parent.is_ending:
        return Response({'detail': 'Indha branch mudinjidichu. Vera part ah continue pannunga.'},
                        status=status.HTTP_400_BAD_REQUEST)
    content = (request.data.get('content') or '').strip()
    speaker = (request.data.get('speaker') or '').strip()[:40]
    err = check_content(story, content, speaker)
    if err:
        return Response({'detail': err}, status=status.HTTP_400_BAD_REQUEST)
    part = Part(story=story, parent=parent, author=request.user, content=content, speaker=speaker,
                is_ending=flag(request.data.get('is_ending')))
    if 'image' in request.FILES:
        part.image.save('i', clean_image(request.FILES['image']), save=False)
    part.save()
    notify(parent.author, request.user, 'continue', story=story, part=part)
    part = annotated_parts().get(pk=part.pk)
    return Response(PartSerializer(part, context=part_context(request, [part], story)).data,
                    status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_like(request, pk):
    """POST /api/parts/<id>/like/ { emoji }  — same emoji thirumba anuppina remove aagum."""
    part = get_object_or_404(Part.objects.select_related('story', 'author'), pk=pk)
    emoji = request.data.get('emoji') or '❤️'
    if emoji not in REACTIONS:
        return Response({'detail': 'Indha emoji allowed illa.'}, status=400)
    like = Like.objects.filter(user=request.user, part=part).first()
    if like and like.emoji == emoji:
        like.delete()
        mine = None
    elif like:
        like.emoji = emoji
        like.save(update_fields=['emoji'])
        mine = emoji
    else:
        Like.objects.create(user=request.user, part=part, emoji=emoji)
        notify(part.author, request.user, 'like', story=part.story, part=part, extra=emoji)
        mine = emoji
    ctx = part_context(request, [part])
    return Response({'liked': mine is not None, 'my_reaction': mine,
                     'likes_count': part.likes.count(), 'reactions': ctx['reactions'].get(part.id, {})})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def report_part(request, pk):
    part = get_object_or_404(Part, pk=pk)
    reason = request.data.get('reason')
    if reason not in dict(Report.REASONS):
        return Response({'detail': 'Reason select pannunga.'}, status=400)
    if Report.objects.filter(reporter=request.user, part=part, status='open').exists():
        return Response({'detail': 'Already report pannirukeenga. Admin paappaanga 🙏'}, status=400)
    Report.objects.create(reporter=request.user, part=part, reason=reason,
                          note=str(request.data.get('note', ''))[:300])
    return Response({'ok': True}, status=201)


class CommentListCreate(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    pagination_class = None

    def get_queryset(self):
        return Comment.objects.filter(part_id=self.kwargs['pk']).select_related('user__profile')

    def perform_create(self, serializer):
        part = get_object_or_404(Part.objects.select_related('story', 'author'), pk=self.kwargs['pk'])
        serializer.save(user=self.request.user, part=part)
        notify(part.author, self.request.user, 'comment', story=part.story, part=part)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_comment(request, pk):
    c = get_object_or_404(Comment, pk=pk)
    if c.user != request.user:
        return Response({'detail': 'Ungal comment mattum dhaan delete panna mudiyum.'}, status=403)
    c.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------- Bookmarks ----------------

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_bookmark(request, pk):
    story = get_object_or_404(Story, pk=pk)
    b, created = Bookmark.objects.get_or_create(user=request.user, story=story)
    if not created:
        b.delete()
    return Response({'bookmarked': created})


class BookmarkList(generics.ListAPIView):
    serializer_class = StoryListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return visible_stories().filter(bookmarks__user=self.request.user).order_by('-bookmarks__created_at')


# ---------------- Notifications ----------------

class NotificationList(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (Notification.objects.filter(recipient=self.request.user)
                .select_related('actor__profile', 'story'))


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_count(request):
    return Response({'count': Notification.objects.filter(recipient=request.user, is_read=False).count()})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_read(request):
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({'ok': True})


# ---------------- Leaderboard ----------------

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def leaderboard(request):
    """Top writers (adhigam reactions vaangunavanga) + top parts."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    writers = (User.objects.filter(is_active=True).select_related('profile')
               .annotate(total_likes=Count('parts__likes', distinct=True), total_parts=Count('parts', distinct=True))
               .filter(total_parts__gt=0).order_by('-total_likes', '-total_parts')[:10])
    top_parts = list(annotated_parts().select_related('story')
                     .filter(story__is_hidden=False, story__status='published', story__is_anonymous=False)
                     .order_by('-likes_count', '-created_at')[:5])
    ctx = part_context(request, top_parts)
    return Response({
        'writers': [{'username': w.username, 'avatar': avatar_of(w), 'likes': w.total_likes, 'parts': w.total_parts}
                    for w in writers],
        'top_parts': [{**PartSerializer(p, context=ctx).data, 'story_title': p.story.title,
                       'content_type': p.story.content_type} for p in top_parts],
    })
