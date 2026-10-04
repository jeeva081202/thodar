"""
🧹 python manage.py freshstart

Demo / test data ellaam azhichu, app ah pudhusa aakkum.
  - Ellaa stories, parts, reactions, comments, bookmarks, notifications, reports, series, challenges → delete
  - Admin (staff) illaadha ellaa users → delete
  - Announcement → clear
  - Admin account(s) apdiye irukkum ✅

Confirm kekkum. Kekkaama run panna: python manage.py freshstart --yes
"""
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import Follow, SiteSettings
from stories.models import (Bookmark, Challenge, Comment, Like, Notification, Part, Report, Series, Story)


class Command(BaseCommand):
    help = 'Demo/test data ellaam delete panni fresh start (admin accounts mattum irukkum)'

    def add_arguments(self, parser):
        parser.add_argument('--yes', action='store_true', help='Confirm kekkaama run pannu')

    def handle(self, *args, yes=False, **opts):
        admins = list(User.objects.filter(is_staff=True).values_list('username', flat=True))
        if not admins:
            self.stderr.write('⚠️  Admin account illa! Mudhal la "python manage.py makeadmin" run pannu.')
            return
        others = User.objects.filter(is_staff=False)
        self.stdout.write(f'Irukkum (admin): {", ".join(admins)}')
        self.stdout.write(f'Delete aagum users: {", ".join(others.values_list("username", flat=True)) or "-"}')
        self.stdout.write(f'Delete aagum stories: {Story.objects.count()}, parts: {Part.objects.count()}')
        if not yes and input('Ellaam delete pannalaama? (yes/no): ').strip().lower() not in ('yes', 'y'):
            self.stdout.write('Cancel panniyaachu. Onnum delete aagala.')
            return

        with transaction.atomic():
            for m in (Notification, Report, Like, Comment, Bookmark):
                m.objects.all().delete()
            # Parts parent → child order la irukkum, adhanaala kadaisi la irundhu delete
            Part.objects.update(parent=None)
            Part.objects.all().delete()
            Story.objects.all().delete()
            Series.objects.all().delete()
            Challenge.objects.all().delete()
            Follow.objects.all().delete()
            others.delete()
            s = SiteSettings.load()
            s.announcement = ''
            s.save()

        self.stdout.write(self.style.SUCCESS('🧹 Fresh start ready! Ippo Thodar pudhusa irukku 🦚'))
