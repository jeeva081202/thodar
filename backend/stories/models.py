from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class Story(models.Model):
    GENRES = [
        ('horror', 'Horror'),
        ('comedy', 'Comedy'),
        ('love', 'Love'),
        ('thriller', 'Thriller'),
        ('scifi', 'Sci-Fi'),
        ('drama', 'Drama'),
        ('life', 'Life'),
        ('family', 'Family'),
        ('friendship', 'Friendship'),
        ('motivation', 'Motivation'),
        ('nature', 'Nature'),
        ('mystery', 'Mystery'),
    ]
    TYPES = [
        ('kadhai', 'Kadhai / Story'),        # branch aagum
        ('kavithai', 'Kavithai / Poem'),     # badhil kavithai
        ('dialogue', 'Dialogue'),            # next line
        ('personal', 'Personal story'),      # comments mattum, anonymous option
        ('article', 'Article / Blog'),       # comments mattum
        ('quote', 'Quote'),                  # chinna lines
    ]
    CONTINUABLE = {'kadhai', 'kavithai', 'dialogue'}
    MAX_LEN = {'article': 12000, 'quote': 300}
    LANGUAGES = [('ta', 'தமிழ்'), ('en', 'English'), ('mix', 'Tanglish')]

    title = models.CharField(max_length=200)
    genre = models.CharField(max_length=20, choices=GENRES)
    language = models.CharField(max_length=5, choices=LANGUAGES, default='en')
    content_type = models.CharField(max_length=10, choices=TYPES, default='kadhai')
    status = models.CharField(max_length=10, choices=[('draft', 'Draft'), ('published', 'Published')],
                              default='published')
    is_anonymous = models.BooleanField(default=False)  # personal story ku
    cover = models.ImageField(upload_to='story_covers/', blank=True)
    series = models.ForeignKey('Series', null=True, blank=True, on_delete=models.SET_NULL, related_name='chapters')
    chapter = models.PositiveSmallIntegerField(null=True, blank=True)
    challenge = models.ForeignKey('Challenge', null=True, blank=True, on_delete=models.SET_NULL, related_name='entries')
    is_winner = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)   # admin pick ⭐
    is_hidden = models.BooleanField(default=False)     # admin moderation
    views = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'stories'

    def __str__(self):
        return self.title

    @property
    def root_part(self):
        return self.parts.filter(parent__isnull=True).first()

    @property
    def can_continue(self):
        return self.content_type in self.CONTINUABLE

    def max_len(self):
        return self.MAX_LEN.get(self.content_type, 2000)


class Series(models.Model):
    """Periya kadhai ah chapters ah — Part 1, Part 2…"""
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=300, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='series')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'series'

    def __str__(self):
        return self.title


class Challenge(models.Model):
    """Weekly writing challenge — admin create pannuvaan."""
    title = models.CharField(max_length=120)
    emoji = models.CharField(max_length=8, default='🏆')
    description = models.CharField(max_length=400, blank=True)
    content_type = models.CharField(max_length=10, choices=Story.TYPES, blank=True)  # blank = endha type um
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-starts_at']

    def __str__(self):
        return self.title

    @property
    def is_active(self):
        from django.utils import timezone
        return self.starts_at <= timezone.now() <= self.ends_at


class Part(models.Model):
    """Kadhai oda oru paguthi. `parent` dhaan tree magic 🌳"""
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='parts')
    parent = models.ForeignKey('self', null=True, blank=True,
                               on_delete=models.CASCADE, related_name='children')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='parts')
    content = models.TextField(max_length=12000)
    speaker = models.CharField(max_length=40, blank=True)          # dialogue character name
    image = models.ImageField(upload_to='part_images/', blank=True)
    is_ending = models.BooleanField(default=False)   # "idhu dhaan mudivu" nu mark pannalam
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.author} - {self.content[:30]}'


REACTIONS = ['❤️', '😂', '😱', '😢', '🔥', '👏']


class Like(models.Model):
    """Emoji reaction. Oru user oru part ku oru reaction mattum."""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    part = models.ForeignKey(Part, on_delete=models.CASCADE, related_name='likes')
    emoji = models.CharField(max_length=16, default='❤️')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'part')   # oru aal oru part ku oru like mattum


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    part = models.ForeignKey(Part, on_delete=models.CASCADE, related_name='comments')
    text = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='bookmarks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'story')
        ordering = ['-created_at']


class Notification(models.Model):
    VERBS = [
        ('continue', 'continued your part'),
        ('like', 'liked your part'),
        ('comment', 'commented on your part'),
        ('follow', 'started following you'),
    ]
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='+')
    verb = models.CharField(max_length=20, choices=VERBS)
    story = models.ForeignKey(Story, null=True, blank=True, on_delete=models.CASCADE)
    part = models.ForeignKey(Part, null=True, blank=True, on_delete=models.CASCADE)
    extra = models.CharField(max_length=16, blank=True)   # eg: reaction emoji
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


def notify(recipient, actor, verb, story=None, part=None, extra=''):
    """Notification create pannum (thanakku thaane anuppa koodadhu)."""
    if recipient != actor:
        Notification.objects.create(recipient=recipient, actor=actor, verb=verb,
                                    story=story, part=part, extra=extra)


class Report(models.Model):
    REASONS = [('spam', 'Spam'), ('abuse', 'Abuse / hate'), ('adult', 'Adult content'),
               ('copy', 'Copied content'), ('other', 'Other')]
    STATUS = [('open', 'Open'), ('resolved', 'Resolved'), ('dismissed', 'Dismissed')]
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_made')
    part = models.ForeignKey(Part, on_delete=models.CASCADE, related_name='reports')
    reason = models.CharField(max_length=10, choices=REASONS)
    note = models.CharField(max_length=300, blank=True)
    status = models.CharField(max_length=10, choices=STATUS, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
