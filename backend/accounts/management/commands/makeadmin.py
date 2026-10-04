"""
👑 Unakku admin account create pannum.

    python manage.py makeadmin                 ← username, password kekkum
    python manage.py makeadmin --username jeeva --password 'Strong@Pass123'
"""
import getpass

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = 'Thodar admin account create / update pannum'

    def add_arguments(self, parser):
        parser.add_argument('--username')
        parser.add_argument('--password')
        parser.add_argument('--email', default='')

    def handle(self, *args, **o):
        username = o['username'] or input('Admin username: ').strip()
        if not username:
            raise CommandError('Username venum.')
        password = o['password']
        if not password:
            password = getpass.getpass('Admin password: ')
            if password != getpass.getpass('Password thirumba: '):
                raise CommandError('Rendu password um match aagala.')
        try:
            validate_password(password)
        except ValidationError as e:
            raise CommandError('Password weak ah irukku: ' + ' '.join(e.messages))

        user, created = User.objects.get_or_create(username=username, defaults={'email': o['email']})
        user.is_staff = user.is_superuser = user.is_active = True
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS(
            f"👑 Admin {'create' if created else 'update'} aachu: {username}\n"
            f"   Website la login panni sidebar la 'Admin' click pannu."))
