from django.db.models import Count
from rest_framework import serializers

from accounts.utils import avatar_of
from .models import Story, Part, Comment, Notification, Series, Challenge

ANON = 'anonymous'


def story_list_queryset():
    return Story.objects.select_related('created_by__profile', 'series', 'challenge').annotate(
        parts_count=Count('parts', distinct=True),
        writers_count=Count('parts__author', distinct=True),
        likes_count=Count('parts__likes', distinct=True),
        comments_count=Count('parts__comments', distinct=True),
    )


def viewer_sees_author(story, request):
    """Anonymous personal story — author um admin um mattum dhaan real peru paappaanga."""
    if not story.is_anonymous:
        return True
    u = getattr(request, 'user', None)
    return bool(u and u.is_authenticated and (u.id == story.created_by_id or u.is_staff))


def media_url(f):
    return f.url if f else None


def reading_minutes(text):
    return max(1, round(len((text or '').split()) / 200))


class CommentSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'user', 'avatar', 'text', 'created_at']

    def get_avatar(self, obj):
        return avatar_of(obj.user)


class PartSerializer(serializers.ModelSerializer):
    """context: 'reactions' {part_id: {emoji: count}}, 'mine' {part_id: emoji}, 'story'"""
    author = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(read_only=True, default=0)
    children_count = serializers.IntegerField(read_only=True, default=0)
    comments_count = serializers.IntegerField(read_only=True, default=0)
    reactions = serializers.SerializerMethodField()
    my_reaction = serializers.SerializerMethodField()
    liked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Part
        fields = ['id', 'story', 'parent', 'author', 'author_avatar', 'speaker', 'content', 'image', 'is_ending',
                  'likes_count', 'children_count', 'comments_count',
                  'reactions', 'my_reaction', 'liked_by_me', 'created_at']
        read_only_fields = ['story']

    def _hidden(self, obj):
        story = self.context.get('story') or obj.story
        return (story.is_anonymous and obj.author_id == story.created_by_id
                and not viewer_sees_author(story, self.context.get('request')))

    def get_author(self, obj):
        return ANON if self._hidden(obj) else obj.author.username

    def get_author_avatar(self, obj):
        return 'preset:mask' if self._hidden(obj) else avatar_of(obj.author)

    def get_image(self, obj):
        return media_url(obj.image)

    def get_reactions(self, obj):
        return self.context.get('reactions', {}).get(obj.id, {})

    def get_my_reaction(self, obj):
        return self.context.get('mine', {}).get(obj.id)

    def get_liked_by_me(self, obj):
        return obj.id in self.context.get('mine', {})


class StoryListSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    opening = serializers.SerializerMethodField()
    speaker = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()
    reading_time = serializers.SerializerMethodField()
    series_title = serializers.CharField(source='series.title', default=None, read_only=True)
    challenge_title = serializers.CharField(source='challenge.title', default=None, read_only=True)
    parts_count = serializers.IntegerField(read_only=True, default=0)
    writers_count = serializers.IntegerField(read_only=True, default=0)
    likes_count = serializers.IntegerField(read_only=True, default=0)
    comments_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Story
        fields = ['id', 'title', 'genre', 'language', 'content_type', 'status', 'is_anonymous', 'cover',
                  'is_featured', 'is_hidden', 'is_winner', 'views', 'created_by', 'avatar', 'opening', 'speaker',
                  'reading_time', 'series', 'series_title', 'chapter', 'challenge', 'challenge_title',
                  'parts_count', 'writers_count', 'likes_count', 'comments_count', 'created_at']

    def _root(self, obj):
        if not hasattr(obj, '_root_cache'):
            obj._root_cache = obj.root_part
        return obj._root_cache

    def get_created_by(self, obj):
        return obj.created_by.username if viewer_sees_author(obj, self.context.get('request')) else ANON

    def get_avatar(self, obj):
        return avatar_of(obj.created_by) if viewer_sees_author(obj, self.context.get('request')) else 'preset:mask'

    def get_opening(self, obj):
        root = self._root(obj)
        if not root:
            return ''
        limit = 400 if obj.content_type in ('kavithai', 'quote') else 220
        return root.content[:limit]

    def get_speaker(self, obj):
        root = self._root(obj)
        return root.speaker if root else ''

    def get_cover(self, obj):
        return media_url(obj.cover)

    def get_reading_time(self, obj):
        root = self._root(obj)
        return reading_minutes(root.content if root else '')


class StoryWriteSerializer(serializers.ModelSerializer):
    """Create + draft edit. opening = first part text. multipart la cover / image um varalam."""
    opening = serializers.CharField(write_only=True, required=False, allow_blank=True)
    speaker = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=40)
    series_title = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=200)

    class Meta:
        model = Story
        fields = ['id', 'title', 'genre', 'language', 'content_type', 'status', 'is_anonymous',
                  'series', 'chapter', 'challenge', 'opening', 'speaker', 'series_title']
        extra_kwargs = {'title': {'required': False, 'allow_blank': True}}

    def validate(self, data):
        ctype = data.get('content_type') or getattr(self.instance, 'content_type', 'kadhai')
        title = data.get('title', getattr(self.instance, 'title', ''))
        if ctype != 'quote' and not (title or '').strip() and data.get('status', 'published') == 'published':
            raise serializers.ValidationError({'title': 'Please add a title.'})
        status = data.get('status') or getattr(self.instance, 'status', 'published')
        opening = data.get('opening')
        if opening is not None:
            # Browser form \r\n (2 letters) anuppum — oru line break = 1 letter dhaan
            opening = data['opening'] = opening.replace('\r\n', '\n').replace('\r', '\n')
            limit = Story.MAX_LEN.get(ctype, Story.DEFAULT_LEN)
            if len(opening) > limit:
                raise serializers.ValidationError({'opening': f'Too long: maximum {limit} letters.'})
            if status == 'published' and len(opening.strip()) < (5 if ctype == 'quote' else 20):
                raise serializers.ValidationError({'opening': 'Please write a little more (at least 20 letters).'})
        elif not self.instance and status == 'published':
            raise serializers.ValidationError({'opening': 'Please write something first.'})
        if data.get('is_anonymous') and ctype != 'personal':
            data['is_anonymous'] = False
        user = self.context['request'].user
        if data.get('series') and data['series'].author_id != user.id:
            raise serializers.ValidationError({'series': 'You can only add to your own series.'})
        ch = data.get('challenge')
        if ch and not ch.is_active:
            raise serializers.ValidationError({'challenge': 'This challenge has ended.'})
        return data


class SeriesSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Series
        fields = ['id', 'title', 'description', 'author', 'created_at']


class ChallengeSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(read_only=True)
    entries_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Challenge
        fields = ['id', 'title', 'emoji', 'description', 'content_type', 'starts_at', 'ends_at',
                  'is_active', 'entries_count']


class NotificationSerializer(serializers.ModelSerializer):
    actor = serializers.CharField(source='actor.username')
    actor_avatar = serializers.SerializerMethodField()
    story_title = serializers.CharField(source='story.title', default=None)

    class Meta:
        model = Notification
        fields = ['id', 'actor', 'actor_avatar', 'verb', 'extra', 'story', 'story_title', 'part', 'is_read', 'created_at']

    def get_actor_avatar(self, obj):
        return avatar_of(obj.actor)
