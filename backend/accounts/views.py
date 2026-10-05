from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from stories.models import Like, Part, notify
from stories.serializers import StoryListSerializer, story_list_queryset
from .models import Profile, Follow, SiteSettings
from .serializers import RegisterSerializer, LoginSerializer, RefreshSerializer
from .utils import AVATAR_PRESETS, avatar_of, clean_image

PROFILE_TEXT = {'bio': 200, 'full_name': 80, 'state': 40, 'city': 60, 'languages': 120, 'interests': 160}


def apply_profile(profile, data, files):
    """Signup + edit profile common: text fields, gender, birth year, avatar (photo / preset), cover."""
    for f, n in PROFILE_TEXT.items():
        if f in data:
            setattr(profile, f, str(data[f]).strip()[:n])
    if 'gender' in data:
        g = data['gender']
        profile.gender = g if g in dict(Profile.GENDERS) else ''
    if 'birth_year' in data:
        try:
            y = int(data['birth_year'])
            profile.birth_year = y if 1920 <= y <= 2015 else None
        except (TypeError, ValueError):
            profile.birth_year = None
    if 'avatar' in files:
        profile.avatar.save('a', clean_image(files['avatar'], max_side=512, square=True), save=False)
        profile.avatar_preset = ''
    elif 'avatar_preset' in data:
        preset = data['avatar_preset']
        if preset in AVATAR_PRESETS or preset == '':
            profile.avatar_preset = preset
            profile.avatar = ''
    if 'cover' in files:
        profile.cover.save('c', clean_image(files['cover'], max_side=1600), save=False)
    elif str(data.get('remove_cover', '')).lower() in ('1', 'true'):
        profile.cover = ''
    profile.save()

User = get_user_model()


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class RefreshView(TokenRefreshView):
    serializer_class = RefreshSerializer


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def logout(request):
    """Logout: indha device oda refresh token ah cancel pannum (thirumba use panna mudiyaadhu)."""
    try:
        RefreshToken(request.data.get('refresh', '')).blacklist()
    except (TokenError, KeyError):
        pass
    return Response({'ok': True})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    ser = RegisterSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    user = ser.save()
    profile, _ = Profile.objects.get_or_create(user=user)
    try:
        apply_profile(profile, request.data, request.FILES)
    except Exception:
        user.delete()   # photo thappu na account um create aaga koodadhu
        raise
    # First user ku approval venaam. Approval on na, mathavanga inactive ah start aaguvaanga.
    pending = SiteSettings.load().require_approval and User.objects.count() > 1
    if pending:
        user.is_active = False
        user.save()
    return Response({'id': user.id, 'username': user.username, 'pending': pending},
                    status=status.HTTP_201_CREATED)


def me_data(u):
    p, _ = Profile.objects.get_or_create(user=u)
    return {'id': u.id, 'username': u.username, 'email': u.email, 'is_staff': u.is_staff,
            'bio': p.bio, 'full_name': p.full_name, 'state': p.state, 'city': p.city,
            'gender': p.gender, 'birth_year': p.birth_year, 'languages': p.languages, 'interests': p.interests,
            'avatar': avatar_of(u), 'avatar_preset': p.avatar_preset, 'cover': p.cover.url if p.cover else None}


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    u = request.user
    if request.method == 'PATCH':
        profile, _ = Profile.objects.get_or_create(user=u)
        apply_profile(profile, request.data, request.FILES)
        if request.data.get('email') is not None:
            u.email = request.data['email']
            u.save()
    return Response(me_data(u))


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    u = request.user
    if not u.check_password(request.data.get('old_password', '')):
        return Response({'detail': 'Your current password is incorrect.'}, status=400)
    new = request.data.get('new_password', '')
    try:
        validate_password(new, u)
    except ValidationError as e:
        return Response({'detail': ' '.join(e.messages)}, status=400)
    u.set_password(new)
    u.save()
    return Response({'ok': True})


def badges(u, likes, followers):
    """Achievements — earned true/false. Names frontend la translate aagum."""
    stories = u.stories.all()
    langs = set(stories.filter(status='published').values_list('language', flat=True))
    branch_maker = (Part.objects.filter(author=u, parent__isnull=False)
                    .annotate(sib=Count('parent__children')).filter(sib__gt=1).exists())
    n_parts = u.parts.count()
    return [
        {'key': 'first_story', 'emoji': '🌱', 'earned': stories.exists()},
        {'key': 'writer', 'emoji': '✍️', 'earned': n_parts >= 5},
        {'key': 'branch_maker', 'emoji': '🌿', 'earned': branch_maker},
        {'key': 'finisher', 'emoji': '🏁', 'earned': u.parts.filter(is_ending=True).exists()},
        {'key': 'loved', 'emoji': '💖', 'earned': likes >= 10},
        {'key': 'superstar', 'emoji': '🌟', 'earned': likes >= 50},
        {'key': 'popular', 'emoji': '👥', 'earned': followers >= 5},
        {'key': 'bilingual', 'emoji': '🌏', 'earned': len(langs) >= 2},
        {'key': 'poet', 'emoji': '🌸', 'earned': stories.filter(content_type='kavithai', status='published').exists()},
        {'key': 'champion', 'emoji': '🏆', 'earned': stories.filter(is_winner=True).exists()},
        {'key': 'admin', 'emoji': '👑', 'earned': u.is_staff},
    ]


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def profile(request, username):
    u = get_object_or_404(User, username=username)
    if not u.is_active and not (request.user.is_authenticated and request.user.is_staff):
        return Response({'detail': 'User not found.'}, status=404)
    prof, _ = Profile.objects.get_or_create(user=u)
    me = request.user.is_authenticated and request.user.id == u.id
    parts = (u.parts.select_related('story').filter(story__is_hidden=False, story__status='published')
             .exclude(story__is_anonymous=True, story__created_by=u, parent__isnull=True)
             .annotate(likes_count=Count('likes')).order_by('-created_at')[:20])
    stories = story_list_queryset().filter(created_by=u, is_hidden=False, status='published')
    if not me:
        stories = stories.exclude(is_anonymous=True)
    stories = stories.order_by('-created_at')[:30]
    is_following = (request.user.is_authenticated and
                    Follow.objects.filter(follower=request.user, following=u).exists())
    likes = Like.objects.filter(part__author=u).count()
    followers = u.followers_set.count()
    return Response({
        'username': u.username,
        'bio': prof.bio,
        'full_name': prof.full_name, 'state': prof.state, 'city': prof.city,
        'languages': prof.languages, 'interests': prof.interests,
        'avatar': avatar_of(u), 'cover': prof.cover.url if prof.cover else None,
        'is_staff': u.is_staff,
        'joined': u.date_joined,
        'stories_started': u.stories.count(),
        'parts_written': u.parts.count(),
        'total_likes': likes,
        'followers': followers,
        'following': u.following_set.count(),
        'is_following': is_following,
        'badges': badges(u, likes, followers),
        'stories': StoryListSerializer(stories, many=True, context={'request': request}).data,
        'recent_parts': [{'id': p.id, 'story_id': p.story_id, 'story_title': p.story.title,
                          'content': p.content[:150], 'likes_count': p.likes_count}
                         for p in parts],
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_follow(request, username):
    target = get_object_or_404(User, username=username)
    if target == request.user:
        return Response({'detail': 'You can\'t follow yourself 😄'},
                        status=status.HTTP_400_BAD_REQUEST)
    f, created = Follow.objects.get_or_create(follower=request.user, following=target)
    if created:
        notify(target, request.user, 'follow')
    else:
        f.delete()
    return Response({'is_following': created, 'followers': target.followers_set.count()})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def follow_list(request, username, kind):
    u = get_object_or_404(User, username=username)
    if kind == 'followers':
        users = [f.follower for f in u.followers_set.select_related('follower__profile')]
    else:
        users = [f.following for f in u.following_set.select_related('following__profile')]
    return Response([{'username': x.username, 'avatar': avatar_of(x)} for x in users])
