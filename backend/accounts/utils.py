"""Avatar + image helpers — ellaa app layum use aagum."""
from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageOps, UnidentifiedImageError
from rest_framework.exceptions import ValidationError

AVATAR_PRESETS = [
    'lion', 'tiger', 'fox', 'panda', 'koala', 'frog', 'unicorn', 'octopus', 'butterfly', 'sunflower',
    'moon', 'star', 'mask', 'art', 'guitar', 'books', 'wave', 'fire', 'clover', 'blossom',
    'elephant', 'peacock', 'lotus', 'coffee',
]
MAX_UPLOAD = 6 * 1024 * 1024


def avatar_of(user):
    """'url:/media/..' | 'preset:lion' | '' — frontend Avatar component idha purinjukkum."""
    if user is None:
        return ''
    try:
        p = user.profile
    except Exception:
        return ''
    if p.avatar:
        return 'url:' + p.avatar.url
    if p.avatar_preset:
        return 'preset:' + p.avatar_preset
    return ''


def clean_image(f, max_side=1600, square=False):
    """Upload aana image ah check panni, resize panni, JPEG/PNG ah save pannum.
    Fake files, periya files ellam reject aagum."""
    if f is None:
        return None
    if f.size > MAX_UPLOAD:
        raise ValidationError({'detail': 'Image 6MB ku keezha irukkanum.'})
    try:
        img = Image.open(f)
        img.verify()
        f.seek(0)
        img = Image.open(f)
        img = ImageOps.exif_transpose(img)
    except (UnidentifiedImageError, OSError, ValueError):
        raise ValidationError({'detail': 'Idhu valid image illa (JPG / PNG / WEBP podunga).'})
    if square:
        side = min(img.size)
        img = ImageOps.fit(img, (side, side))
    img.thumbnail((max_side, max_side))
    has_alpha = img.mode in ('RGBA', 'LA', 'P')
    buf = BytesIO()
    if has_alpha:
        img.convert('RGBA').save(buf, 'PNG', optimize=True)
        ext = 'png'
    else:
        img.convert('RGB').save(buf, 'JPEG', quality=86, optimize=True)
        ext = 'jpg'
    import uuid
    return ContentFile(buf.getvalue(), name=f'{uuid.uuid4().hex[:12]}.{ext}')
