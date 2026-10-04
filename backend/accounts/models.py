from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


def upload_avatar(instance, filename):
    return f'avatars/{instance.user_id}/{filename}'


def upload_cover(instance, filename):
    return f'covers/{instance.user_id}/{filename}'


class Profile(models.Model):
    GENDERS = [('female', 'Female'), ('male', 'Male'), ('other', 'Other'), ('', 'Prefer not to say')]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.CharField(max_length=200, blank=True)
    full_name = models.CharField(max_length=80, blank=True)
    state = models.CharField(max_length=40, blank=True)
    city = models.CharField(max_length=60, blank=True)
    # Private — profile la public ah kaattaadhu
    gender = models.CharField(max_length=10, choices=GENDERS, blank=True)
    birth_year = models.PositiveSmallIntegerField(null=True, blank=True)
    languages = models.CharField(max_length=120, blank=True)   # "ta,en,hi"
    interests = models.CharField(max_length=160, blank=True)   # "kavithai,kadhai"
    avatar = models.ImageField(upload_to=upload_avatar, blank=True)
    avatar_preset = models.CharField(max_length=20, blank=True)  # eg "lion"
    cover = models.ImageField(upload_to=upload_cover, blank=True)

    def __str__(self):
        return f'Profile({self.user})'


class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following_set')
    following = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')


class SiteSettings(models.Model):
    """Admin control panel settings (oru row mattum dhaan irukkum)."""
    require_approval = models.BooleanField(
        default=False, help_text='On pannina, pudhu users ah admin approve pannina dhaan login panna mudiyum')
    announcement = models.CharField(max_length=300, blank=True,
                                    help_text='Home page la ellarukkum theriyura banner message')

    class Meta:
        verbose_name_plural = 'site settings'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return 'Site settings'
