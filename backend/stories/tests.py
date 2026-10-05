from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from .models import Story, Part, Notification

User = get_user_model()


class ThodarTests(APITestCase):
    def setUp(self):
        self.ravi = User.objects.create_user('ravi', password='pass1234')
        self.priya = User.objects.create_user('priya', password='pass1234')

    def login(self, user):
        self.client.force_authenticate(user)

    def create_story(self):
        self.login(self.ravi)
        r = self.client.post('/api/stories/', {'title': 'Test', 'genre': 'horror',
                                               'opening': 'Oru naal night 12 manikku phone ring aachu...'})
        self.assertEqual(r.status_code, 201)
        return Story.objects.get(pk=r.data['id'])

    def test_register_and_login(self):
        r = self.client.post('/api/auth/register/', {'username': 'jeeva', 'password': 'secret123'})
        self.assertEqual(r.status_code, 201)
        r = self.client.post('/api/auth/login/', {'username': 'jeeva', 'password': 'secret123'})
        self.assertIn('access', r.data)

    def test_story_creates_root_part(self):
        story = self.create_story()
        self.assertEqual(story.parts.count(), 1)
        self.assertIsNone(story.root_part.parent)

    def test_branching_and_notification(self):
        story = self.create_story()
        root = story.root_part
        self.login(self.priya)
        for text in ['Branch one continues here', 'Branch two goes elsewhere']:
            r = self.client.post(f'/api/parts/{root.id}/continue/', {'content': text})
            self.assertEqual(r.status_code, 201)
        self.assertEqual(root.children.count(), 2)
        self.assertEqual(Notification.objects.filter(recipient=self.ravi, verb='continue').count(), 2)
        tree = self.client.get(f'/api/stories/{story.id}/tree/').data
        self.assertEqual(len(tree['parts']), 3)

    def test_cannot_continue_ending(self):
        story = self.create_story()
        end = Part.objects.create(story=story, parent=story.root_part, author=self.ravi,
                                  content='The end of the story.', is_ending=True)
        self.login(self.priya)
        r = self.client.post(f'/api/parts/{end.id}/continue/', {'content': 'Trying to continue...'})
        self.assertEqual(r.status_code, 400)

    def test_like_toggle(self):
        story = self.create_story()
        self.login(self.priya)
        url = f'/api/parts/{story.root_part.id}/like/'
        self.assertTrue(self.client.post(url).data['liked'])
        self.assertFalse(self.client.post(url).data['liked'])

    def test_only_author_can_edit_and_not_after_continued(self):
        story = self.create_story()
        root = story.root_part
        self.login(self.priya)
        self.assertEqual(self.client.patch(f'/api/parts/{root.id}/', {'content': 'hacked content!!'}).status_code, 403)
        self.client.post(f'/api/parts/{root.id}/continue/', {'content': 'Priya continues this'})
        self.login(self.ravi)
        self.assertEqual(self.client.patch(f'/api/parts/{root.id}/', {'content': 'edited content!!'}).status_code, 400)

    def test_follow_bookmark_and_feed(self):
        story = self.create_story()
        self.login(self.priya)
        self.assertTrue(self.client.post('/api/auth/users/ravi/follow/').data['is_following'])
        feed = self.client.get('/api/stories/?feed=following').data
        self.assertEqual(feed['count'], 1)
        self.assertTrue(self.client.post(f'/api/stories/{story.id}/bookmark/').data['bookmarked'])
        self.assertEqual(self.client.get('/api/bookmarks/').data['count'], 1)

    def test_notifications_read(self):
        story = self.create_story()
        self.login(self.priya)
        self.client.post(f'/api/parts/{story.root_part.id}/comments/', {'text': 'Semma!'})
        self.login(self.ravi)
        self.assertEqual(self.client.get('/api/notifications/unread/').data['count'], 1)
        self.client.post('/api/notifications/read-all/')
        self.assertEqual(self.client.get('/api/notifications/unread/').data['count'], 0)


class AdminAndNewFeatureTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user('boss', password='pass1234', is_staff=True)
        self.ravi = User.objects.create_user('ravi', password='pass1234')
        self.priya = User.objects.create_user('priya', password='pass1234')
        self.client.force_authenticate(self.ravi)
        r = self.client.post('/api/stories/', {'title': 'மழை', 'genre': 'drama', 'language': 'ta',
                                               'opening': 'அன்று மழை கொட்டிக்கொண்டிருந்தது, நான் காத்திருந்தேன்.'})
        self.story = Story.objects.get(pk=r.data['id'])
        self.root = self.story.root_part

    def test_language_filter(self):
        self.assertEqual(self.client.get('/api/stories/?lang=ta').data['count'], 1)
        self.assertEqual(self.client.get('/api/stories/?lang=en').data['count'], 0)

    def test_emoji_reactions(self):
        self.client.force_authenticate(self.priya)
        url = f'/api/parts/{self.root.id}/like/'
        r = self.client.post(url, {'emoji': '😱'})
        self.assertEqual(r.data['my_reaction'], '😱')
        r = self.client.post(url, {'emoji': '🔥'})          # change
        self.assertEqual(r.data['reactions'], {'🔥': 1})
        r = self.client.post(url, {'emoji': '🔥'})          # remove
        self.assertIsNone(r.data['my_reaction'])
        self.assertEqual(self.client.post(url, {'emoji': '💩'}).status_code, 400)

    def test_non_admin_blocked_from_admin_api(self):
        self.assertEqual(self.client.get('/api/admin/stats/').status_code, 403)

    def test_admin_stats_and_block_user(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get('/api/admin/stats/').data['totals']['stories'], 1)
        self.client.patch(f'/api/admin/users/{self.priya.id}/', {'is_active': False})
        self.client.force_authenticate(None)
        r = self.client.post('/api/auth/login/', {'username': 'priya', 'password': 'pass1234'})
        self.assertEqual(r.status_code, 401)

    def test_approval_flow(self):
        self.client.force_authenticate(self.admin)
        self.client.patch('/api/admin/settings/', {'require_approval': True})
        self.client.force_authenticate(None)
        r = self.client.post('/api/auth/register/', {'username': 'newbie', 'password': 'secret123'})
        self.assertTrue(r.data['pending'])
        r = self.client.post('/api/auth/login/', {'username': 'newbie', 'password': 'secret123'})
        self.assertIn('approval', str(r.data['detail']))
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post('/api/admin/users/approve-all/').data['approved'], 1)
        self.client.force_authenticate(None)
        r = self.client.post('/api/auth/login/', {'username': 'newbie', 'password': 'secret123'})
        self.assertIn('access', r.data)

    def test_report_and_hide(self):
        self.client.force_authenticate(self.priya)
        self.assertEqual(self.client.post(f'/api/parts/{self.root.id}/report/', {'reason': 'spam'}).status_code, 201)
        self.client.force_authenticate(self.admin)
        reps = self.client.get('/api/admin/reports/').data
        self.assertEqual(len(reps), 1)
        self.client.post(f'/api/admin/reports/{reps[0]["id"]}/', {'action': 'remove'})
        self.story.refresh_from_db()
        self.assertTrue(self.story.is_hidden)
        self.client.force_authenticate(self.priya)
        self.assertEqual(self.client.get('/api/stories/').data['count'], 0)
        self.assertEqual(self.client.get(f'/api/stories/{self.story.id}/tree/').status_code, 404)

    def test_change_password_and_badges(self):
        r = self.client.post('/api/auth/password/', {'old_password': 'pass1234', 'new_password': 'NewStrong#99'})
        self.assertTrue(r.data['ok'])
        prof = self.client.get('/api/auth/users/ravi/').data
        earned = {b['key'] for b in prof['badges'] if b['earned']}
        self.assertIn('first_story', earned)


class ContentAndProfileTests(APITestCase):
    def setUp(self):
        self.ravi = User.objects.create_user('ravi', password='pass1234')
        self.priya = User.objects.create_user('priya', password='pass1234')
        self.admin = User.objects.create_user('boss', password='pass1234', is_staff=True)

    def png(self, name='a.png', size=(300, 200)):
        from io import BytesIO
        from PIL import Image
        from django.core.files.uploadedfile import SimpleUploadedFile
        buf = BytesIO()
        Image.new('RGB', size, (200, 50, 120)).save(buf, 'PNG')
        return SimpleUploadedFile(name, buf.getvalue(), content_type='image/png')

    def test_register_with_profile_and_photo(self):
        r = self.client.post('/api/auth/register/', {
            'username': 'kavin', 'password': 'secret123', 'full_name': 'Kavin K', 'state': 'Tamil Nadu',
            'city': 'Salem', 'gender': 'male', 'birth_year': '2001', 'languages': 'ta,en',
            'interests': 'kavithai', 'avatar': self.png()}, format='multipart')
        self.assertEqual(r.status_code, 201, r.data)
        self.client.force_authenticate(User.objects.get(username='kavin'))
        me = self.client.get('/api/auth/me/').data
        self.assertTrue(me['avatar'].startswith('url:/media/avatars/'))
        self.assertEqual(me['state'], 'Tamil Nadu')
        pub = self.client.get('/api/auth/users/kavin/').data
        self.assertNotIn('gender', pub)          # private
        self.assertNotIn('birth_year', pub)

    def test_fake_image_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.client.force_authenticate(self.ravi)
        bad = SimpleUploadedFile('x.png', b'not an image', content_type='image/png')
        r = self.client.patch('/api/auth/me/', {'avatar': bad}, format='multipart')
        self.assertEqual(r.status_code, 400)

    def test_preset_avatar(self):
        self.client.force_authenticate(self.ravi)
        self.assertEqual(self.client.patch('/api/auth/me/', {'avatar_preset': 'lion'}).data['avatar'], 'preset:lion')

    def test_quote_cannot_be_continued(self):
        self.client.force_authenticate(self.ravi)
        r = self.client.post('/api/stories/', {'content_type': 'quote', 'genre': 'life', 'opening': 'Be brave.'})
        self.assertEqual(r.status_code, 201, r.data)
        root = Story.objects.get(pk=r.data['id']).root_part
        r = self.client.post(f'/api/parts/{root.id}/continue/', {'content': 'Trying to continue this'})
        self.assertEqual(r.status_code, 400)

    def test_dialogue_needs_speaker(self):
        self.client.force_authenticate(self.ravi)
        r = self.client.post('/api/stories/', {'title': 'Chat', 'content_type': 'dialogue', 'genre': 'comedy',
                                               'speaker': 'Ravi', 'opening': 'Hello, yaaru neenga? Enna venum?'})
        root = Story.objects.get(pk=r.data['id']).root_part
        self.assertEqual(root.speaker, 'Ravi')
        self.client.force_authenticate(self.priya)
        self.assertEqual(self.client.post(f'/api/parts/{root.id}/continue/', {'content': 'Naan dhaan'}).status_code, 400)
        r = self.client.post(f'/api/parts/{root.id}/continue/', {'content': 'Naan dhaan', 'speaker': 'Priya'})
        self.assertEqual(r.status_code, 201)

    def test_anonymous_personal_story(self):
        self.client.force_authenticate(self.ravi)
        r = self.client.post('/api/stories/', {'title': 'Secret', 'content_type': 'personal', 'genre': 'life',
                                               'is_anonymous': True, 'opening': 'Idhu en life la nadandha oru vishayam...'})
        sid = r.data['id']
        self.client.force_authenticate(self.priya)
        tree = self.client.get(f'/api/stories/{sid}/tree/').data
        self.assertEqual(tree['story']['created_by'], 'anonymous')
        self.assertEqual(tree['parts'][0]['author'], 'anonymous')
        prof = self.client.get('/api/auth/users/ravi/').data
        self.assertEqual(len(prof['stories']), 0)
        self.client.force_authenticate(self.ravi)       # owner sees own name
        self.assertEqual(self.client.get(f'/api/stories/{sid}/tree/').data['story']['created_by'], 'ravi')

    def test_draft_then_publish(self):
        self.client.force_authenticate(self.ravi)
        r = self.client.post('/api/stories/', {'title': 'WIP', 'content_type': 'kadhai', 'genre': 'drama',
                                               'status': 'draft', 'opening': 'half'})
        sid = r.data['id']
        self.assertEqual(len(self.client.get('/api/drafts/').data), 1)
        self.client.force_authenticate(self.priya)
        self.assertEqual(self.client.get(f'/api/stories/{sid}/tree/').status_code, 404)
        self.assertEqual(self.client.get('/api/stories/').data['count'], 0)
        self.client.force_authenticate(self.ravi)
        r = self.client.patch(f'/api/stories/{sid}/tree/', {'status': 'published',
                                                            'opening': 'Ippo full ah ezhudhiten, ready to publish!'})
        self.assertEqual(r.data['story']['status'], 'published')
        self.client.force_authenticate(self.priya)
        self.assertEqual(self.client.get('/api/stories/').data['count'], 1)

    def test_series_auto_chapters_and_cover(self):
        self.client.force_authenticate(self.ravi)
        r1 = self.client.post('/api/stories/', {'title': 'Ch1', 'content_type': 'kadhai', 'genre': 'drama',
                                                'series_title': 'My Saga', 'cover': self.png('c.png', (1200, 600)),
                                                'opening': 'Chapter one begins here with a bang.'}, format='multipart')
        self.assertEqual(r1.status_code, 201, r1.data)
        self.assertTrue(r1.data['cover'].startswith('/media/story_covers/'))
        sid = r1.data['series']
        r2 = self.client.post('/api/stories/', {'title': 'Ch2', 'content_type': 'kadhai', 'genre': 'drama',
                                                'series': sid, 'opening': 'Chapter two continues the saga.'})
        self.assertEqual(r2.data['chapter'], 2)
        self.assertEqual(len(self.client.get(f'/api/series/{sid}/').data['chapters']), 2)

    def test_challenge_flow(self):
        from django.utils import timezone
        from datetime import timedelta
        self.client.force_authenticate(self.admin)
        now = timezone.now()
        r = self.client.post('/api/admin/challenges/', {'title': 'Mazhai', 'emoji': '🌧️',
                             'starts_at': (now - timedelta(hours=1)).isoformat(),
                             'ends_at': (now + timedelta(days=3)).isoformat()})
        self.assertEqual(r.status_code, 201, r.data)
        cid = r.data['id']
        self.client.force_authenticate(self.ravi)
        self.assertEqual(len(self.client.get('/api/challenges/').data['active']), 1)
        r = self.client.post('/api/stories/', {'title': 'Rain', 'content_type': 'kavithai', 'genre': 'nature',
                                               'challenge': cid, 'opening': 'Mazhai vandhadhu, manasu nanaindhadhu.'})
        self.client.force_authenticate(self.admin)
        self.client.patch(f'/api/admin/stories/{r.data["id"]}/', {'is_winner': True})
        detail = self.client.get(f'/api/challenges/{cid}/').data
        self.assertTrue(detail['entries'][0]['is_winner'])
        self.client.patch(f'/api/admin/challenges/{cid}/', {'end_now': True})
        self.client.force_authenticate(self.ravi)
        r = self.client.post('/api/stories/', {'title': 'Late', 'content_type': 'quote', 'genre': 'nature',
                                               'challenge': cid, 'opening': 'Too late for this.'})
        self.assertEqual(r.status_code, 400)


class StayLoggedInTests(APITestCase):
    def setUp(self):
        self.u = User.objects.create_user('ravi', password='pass1234')

    def login(self):
        return self.client.post('/api/auth/login/', {'username': 'ravi', 'password': 'pass1234'}).data

    def test_refresh_gives_new_tokens_and_old_refresh_dies(self):
        t = self.login()
        r = self.client.post('/api/auth/refresh/', {'refresh': t['refresh']})
        self.assertIn('access', r.data)
        self.assertIn('refresh', r.data)                     # rotation → pudhu refresh
        again = self.client.post('/api/auth/refresh/', {'refresh': t['refresh']})
        self.assertEqual(again.status_code, 401)             # pazhaya token reuse aagaadhu

    def test_logout_kills_refresh(self):
        t = self.login()
        self.client.post('/api/auth/logout/', {'refresh': t['refresh']})
        self.assertEqual(self.client.post('/api/auth/refresh/', {'refresh': t['refresh']}).status_code, 401)

    def test_blocked_user_cannot_refresh(self):
        t = self.login()
        self.u.is_active = False
        self.u.save()
        self.assertEqual(self.client.post('/api/auth/refresh/', {'refresh': t['refresh']}).status_code, 401)

    def test_login_marks_last_login_so_block_shows_blocked(self):
        self.login()
        self.u.refresh_from_db()
        self.assertIsNotNone(self.u.last_login)
        self.u.is_active = False
        self.u.save()
        r = self.client.post('/api/auth/login/', {'username': 'ravi', 'password': 'pass1234'})
        self.assertIn('block', str(r.data['detail']))


class LongTamilStoryTests(APITestCase):
    """Tamil kadhai + browser \\r\\n line breaks limit ah thaandakoodaadhu."""
    def test_crlf_counts_as_one_and_5000_limit(self):
        from django.contrib.auth.models import User
        from rest_framework.test import APIClient
        u = User.objects.create_user('tamilwriter', password='x12345678!')
        c = APIClient(); c.force_authenticate(u)
        body = 'கதை வரி\r\n' * 600   # CRLF-oda 5400, normalize aana 4800
        self.assertGreater(len(body), 5000)
        r = c.post('/api/stories/', {'title': 'காதல்', 'genre': 'love', 'language': 'ta',
                                      'content_type': 'kadhai', 'opening': body}, format='multipart')
        self.assertEqual(r.status_code, 201, r.content)
        r = c.post('/api/stories/', {'title': 'Too long', 'genre': 'love', 'language': 'ta',
                                      'content_type': 'kadhai', 'opening': 'அ' * 5001}, format='multipart')
        self.assertEqual(r.status_code, 400)
