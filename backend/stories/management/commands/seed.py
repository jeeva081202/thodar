"""python manage.py seed  → demo users + branching kadhaigal create pannum"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounts.models import Profile, Follow, SiteSettings
from datetime import timedelta

from django.utils import timezone

from stories.models import Story, Part, Like, Comment, Bookmark, Series, Challenge, notify

User = get_user_model()

PROFILES = {
    'ravi': dict(full_name='Ravi Kumar', state='Tamil Nadu', city='Chennai', avatar_preset='tiger', languages='ta,en', interests='kadhai,dialogue'),
    'priya': dict(full_name='Priya S', state='Tamil Nadu', city='Madurai', avatar_preset='sunflower', languages='ta,en', interests='kadhai,quote'),
    'karthik': dict(full_name='Karthik R', state='Karnataka', city='Bengaluru', avatar_preset='fox', languages='en,ta', interests='kadhai,article'),
    'arun': dict(full_name='Arun Prakash', state='Kerala', city='Kochi', avatar_preset='octopus', languages='en,ta', interests='kadhai,article'),
    'meena': dict(full_name='Meena Lakshmi', state='Tamil Nadu', city='Coimbatore', avatar_preset='blossom', languages='ta', interests='kavithai,personal'),
}

BIOS = {
    'ravi': 'Horror kadhai pidikkum. Night la dhaan ezhudhuven 👻',
    'priya': 'Comedy queen 😂 Chennai ponnu',
    'karthik': 'Twist illaama kadhai illa 🔪',
    'arun': 'Sci-fi & chai ☕🚀',
    'meena': 'Ella kadhaikum happy ending venum 💕',
}


class Command(BaseCommand):
    help = 'Demo data create pannum'

    def handle(self, *args, **kwargs):
        u = {}
        for name, bio in BIOS.items():
            user, created = User.objects.get_or_create(username=name, defaults={'email': f'{name}@thodar.app'})
            if created:
                user.set_password('thodar123')
                user.save()
            Profile.objects.update_or_create(user=user, defaults={'bio': bio, **PROFILES[name]})
            u[name] = user

        self.u = u
        if Story.objects.filter(title='Night 12 Mani Call').exists():
            if not Story.objects.filter(content_type='kavithai').exists():
                self.seed_v5()
                self.stdout.write(self.style.SUCCESS('✅ Pudhu demo content (kavithai, dialogue, article, quote, series, challenge) add aachu!'))
            else:
                self.stdout.write('Demo data already irukku.')
            return

        def part(story, parent, author, text, ending=False):
            p = Part.objects.create(story=story, parent=parent, author=u[author],
                                    content=text, is_ending=ending)
            if parent:
                notify(parent.author, u[author], 'continue', story=story, part=p)
            return p

        EMOJIS = ['❤️', '😱', '🔥', '😂', '👏', '😢']

        def like(names, p, emojis=None):
            for i, n in enumerate(names):
                e = (emojis or EMOJIS)[i % len(emojis or EMOJIS)]
                Like.objects.get_or_create(user=u[n], part=p, defaults={'emoji': e})
                notify(p.author, u[n], 'like', story=p.story, part=p, extra=e)

        # 1. Horror
        s = Story.objects.create(title='Night 12 Mani Call', genre='horror', language='mix', is_featured=True, created_by=u['ravi'])
        root = part(s, None, 'ravi', "Night 12 manikku en phone ring aachu. Screen la 'Amma' nu irundhuchu... "
                                     "aana amma 2 varusham munnaadi iranthutaanga.")
        p1 = part(s, root, 'priya', "Naan nadungura kaiyoda phone edutthen. Andha pakkam amma kural: "
                                    "'Kanna, kadhava thirakkaadha...'")
        p2 = part(s, root, 'karthik', "Phone edukkala. Adhe nimisham kadhavu 'thak thak thak' nu moonu thadava thattura sathham ketuchu.")
        p3 = part(s, p1, 'arun', "Veliya irundhu en kural laye oruthan kooppitaan: 'Dei, naan dhaan, kadhava thora!' "
                                 "Aana naan ulla dhaane irukken?")
        part(s, p2, 'meena', "Kadhava thirandhen. Pakkathu veetu thatha nikkuraaru: 'Thambi, un amma number "
                             "ippo en phone la irukku, SIM ah recycle pannitaanga pola!' 😂", ending=True)
        p5 = part(s, p1, 'meena', "Phone la amma kural thodarndhudhu: 'Window vazhiya paaru...' Naan mella curtain ah thalli paathen.")
        part(s, p5, 'karthik', "Window la en reflection illa. Aana en pinnaadi oru nizhal sirichukittu nikkudhu...")
        like(['priya', 'karthik', 'meena'], p3, ['😱', '😱', '🔥'])
        like(['arun', 'karthik'], p1)
        like(['ravi'], p5)
        Comment.objects.create(user=u['meena'], part=p3, text='Goosebumps! 😱')
        notify(p3.author, u['meena'], 'comment', story=s, part=p3)
        Comment.objects.create(user=u['ravi'], part=p3, text='Semma twist da Arun!')

        # 2. Comedy
        s2 = Story.objects.create(title='Auto Driver Oda Last Savaari', genre='comedy', language='mix', created_by=u['priya'])
        r2 = part(s2, None, 'priya', "Chennai la oru auto driver, meter podaama 'meter la dhaan poven' nu sonnaar. "
                                     "Ellarum shock! Passenger mayakkame pottutaaru.")
        a = part(s2, r2, 'ravi', "Auto driver panic aagi 108 ku call panninaaru. 108 driver vandhu: "
                                 "'Meter la dhaan poveengala? Appo naane un auto la varen!'")
        part(s2, a, 'arun', "Moonu perum auto la hospital pogumbodhu, meter reading ₹0 nu kaattudhu. "
                            "Auto driver: 'Innaiki Chennai ku oru adhisayam!' 🎉", ending=True)
        like(['meena', 'karthik', 'arun', 'ravi'], a, ['😂', '😂', '😂', '👏'])

        # 3. Sci-fi
        s3 = Story.objects.create(title='2090 la Madurai', genre='scifi', language='mix', is_featured=True, created_by=u['arun'])
        r3 = part(s3, None, 'arun', "2090. Madurai Meenakshi kovil gopuram mela flying auto parking. "
                                    "En AI assistant 'Kutti' thideernu Tamil la kavidhai solla aarambichudhu...")
        b = part(s3, r3, 'meena', "'Kutti, yaaru unakku kavidhai solli kuduthaa?' nu kettaen. "
                                  "Adhu: 'Neenga 2026 la ezhudhina diary la irundhu' nu sonnadhu.")
        part(s3, r3, 'karthik', "Kutti oda kavidhai mudinjadhum, Madurai la ella flying autos um oru nimisham nikkudhu.")
        like(['ravi', 'priya'], b)

        # 4. Love
        s4 = Story.objects.create(title='Rail Station la Oru Kaditham', genre='love', language='mix', created_by=u['meena'])
        r4 = part(s4, None, 'meena', "Egmore station, platform 4. Bench la oru pazhaya kaditham: "
                                     "'Indha kaditham padikkaravanga, 5.40 train la jannal seat la paarunga.'")
        part(s4, r4, 'priya', "5.40 train vandhudhu. Jannal seat la yaarum illa, aana oru red rose um innoru kaditham um...")
        like(['arun'], r4)

        # 5. Tamil script
        s5 = Story.objects.create(title='மழை நாளில் ஒரு குடை', genre='drama', language='ta', created_by=u['meena'])
        r5 = part(s5, None, 'meena', "அன்று மழை கொட்டிக்கொண்டிருந்தது. பஸ் ஸ்டாப்பில் ஒரு சிறுமி குடை இல்லாமல் "
                                     "நின்றாள். நான் என் குடையை அவளிடம் கொடுத்தேன்...")
        m5 = part(s5, r5, 'ravi', "இருபது வருடங்கள் கழித்து, அதே பஸ் ஸ்டாப். மழை. ஒரு பெண் என்னிடம் வந்து "
                                  "அதே பழைய குடையை நீட்டினாள்: 'இது உங்களுடையது தானே?'")
        part(s5, r5, 'priya', "சிறுமி குடையை வாங்கவில்லை. 'மழையில் நனைவது தான் எனக்குப் பிடிக்கும்' என்று சிரித்தாள்.")
        like(['arun', 'priya', 'karthik', 'ravi'], m5, ['😢', '❤️', '😢', '👏'])

        # 6. English
        s6 = Story.objects.create(title='The Last Library on Earth', genre='scifi', language='en', created_by=u['arun'])
        r6 = part(s6, None, 'arun', "In 2150, every book had been uploaded and every library demolished. Except one. "
                                    "And tonight, its lights turned on by themselves.")
        part(s6, r6, 'karthik', "Inside, a robot librarian was dusting the shelves. 'You're late,' it said. "
                                "'I've been waiting 47 years for a reader.'")
        like(['meena', 'priya'], r6, ['🔥', '👏'])

        # Follows & bookmarks
        for a_, b_ in [('ravi', 'arun'), ('ravi', 'priya'), ('priya', 'ravi'), ('meena', 'ravi'),
                       ('karthik', 'ravi'), ('arun', 'meena')]:
            Follow.objects.get_or_create(follower=u[a_], following=u[b_])
            notify(u[b_], u[a_], 'follow')
        Bookmark.objects.get_or_create(user=u['ravi'], story=s3)
        Bookmark.objects.get_or_create(user=u['ravi'], story=s2)

        self.seed_v5()

        site = SiteSettings.load()
        site.announcement = '🎉 Thodar ku welcome! Indha vaaram theme: "Mazhai" 🌧️ — mazhai kadhai ezhudhu, top kadhai featured aagum!'
        site.save()

        self.stdout.write(self.style.SUCCESS('✅ Demo data ready! Login: ravi / thodar123'))
        self.stdout.write('👑 Admin create panna: python manage.py makeadmin')

    def seed_v5(self):
        u = self.u

        def part(story, parent, author, text, ending=False):
            p = Part.objects.create(story=story, parent=parent, author=u[author], content=text, is_ending=ending)
            if parent:
                notify(parent.author, u[author], 'continue', story=story, part=p)
            return p

        def like(names, p, emojis):
            for i, n in enumerate(names):
                e = emojis[i % len(emojis)]
                Like.objects.get_or_create(user=u[n], part=p, defaults={'emoji': e})
                notify(p.author, u[n], 'like', story=p.story, part=p, extra=e)

        s5 = Story.objects.filter(language='ta', content_type='kadhai').first()
        # 7. Kavithai + badhil kavithai
        k = Story.objects.create(title='அம்மாவின் கை', genre='family', language='ta', content_type='kavithai', created_by=u['meena'])
        kr = part(k, None, 'meena', "உலகம் முழுதும் தேடினேன்\nஒரு மென்மையான இடம்…\nகடைசியில் கிடைத்தது\nஅம்மாவின் கை ரேகைக்குள்.")
        part(k, kr, 'priya', "அந்தக் கை ரேகைக்குள்\nஎன் பசியும் இருந்தது,\nஎன் பயமும் இருந்தது,\nஎல்லாவற்றுக்கும் மேல்\nஎன் பெயர் இருந்தது.")
        like(['ravi', 'arun', 'karthik', 'priya'], kr, ['❤️', '😢', '❤️', '👏'])

        # 8. Dialogue
        d = Story.objects.create(title='Tea Kadai Philosophy', genre='comedy', language='mix', content_type='dialogue', created_by=u['ravi'])
        d1 = part(d, None, 'ravi', "Anna, oru strong tea… life ae weak ah irukku.", )
        d1.speaker = 'Ravi'; d1.save()
        d2 = part(d, d1, 'karthik', "Thambi, tea strong ah podalam. Life ah neeye dhaan strong aakkanum. ₹15.")
        d2.speaker = 'Tea kadai Anna'; d2.save()
        d3 = part(d, d2, 'priya', "Anna, enakku philosophy venaam, change mattum kudunga!")
        d3.speaker = 'Customer'; d3.save()
        like(['meena', 'arun', 'karthik'], d2, ['😂', '😂', '👏'])

        # 9. Personal (anonymous)
        pe = Story.objects.create(title='First salary', genre='life', language='mix', content_type='personal',
                                  is_anonymous=True, created_by=u['karthik'])
        pr = part(pe, None, 'karthik', "En first salary vandha naal, appa ku oru watch vaanginen. Avar onnum sollala, "
                                       "aana night la avar room la light off pannaama adha paathukittu irundhaar. "
                                       "Andha naal dhaan purinjudhu, avar ivlo naal enakkaaga evlo sacrifice pannirukkaar nu.")
        like(['meena', 'priya', 'ravi', 'arun'], pr, ['😢', '❤️', '😢', '❤️'])
        Comment.objects.create(user=u['meena'], part=pr, text='Kanneer vandhuduchu 🥹')

        # 10. Article
        ar = Story.objects.create(title='5 tips to write a story people want to continue', genre='motivation',
                                  language='en', content_type='article', created_by=u['arun'])
        part(ar, None, 'arun', "Writing on Thodar is different: your story is only the beginning.\n\n"
             "1. End with a question, not an answer. A door that knocks, a call from an unknown number.\n\n"
             "2. Leave room for other voices. Introduce a character you never explain.\n\n"
             "3. Keep the first part short. 150 words is plenty — readers want to write, not just read.\n\n"
             "4. Pick a strong place. A tea shop, a rainy bus stop, a temple festival at midnight.\n\n"
             "5. Read the branches. The best part of Thodar is seeing where others take your idea.")

        # 11. Quotes
        q1 = Story.objects.create(title='Mazhai', genre='nature', language='ta', content_type='quote', created_by=u['priya'])
        q1r = part(q1, None, 'priya', "மழை வரும்போது குடை தேடாதே, அது உன்னை நனைக்க வந்த நினைவு.")
        q2 = Story.objects.create(title='Begin', genre='motivation', language='en', content_type='quote', created_by=u['ravi'])
        part(q2, None, 'ravi', "Every story you love started with one brave first line.")
        like(['meena', 'arun', 'karthik'], q1r, ['❤️', '🔥', '❤️'])

        # 12. Series (2 chapters)
        se = Series.objects.create(title='Chennai Night Rider', description='Oru auto driver oda midnight savaarigal', author=u['priya'])
        for n, (t, txt) in enumerate([
            ('Chapter 1: Kadaisi Savaari', "Night 2 manikku oru periyavar auto la erinaaru. 'Marina beach, aana kadal ku pakkathula illa, "
             "kadal ku ulla' nu sonnaaru…"),
            ('Chapter 2: Kadal Kulla Oru Ooru', "Auto beach sand la odudhu, apram thanni mela… Naan brake pottaen, aana auto nikkala!"),
        ], start=1):
            ch = Story.objects.create(title=t, genre='mystery', language='mix', content_type='kadhai',
                                      series=se, chapter=n, created_by=u['priya'])
            part(ch, None, 'priya', txt)

        # Weekly challenge (active) — Tamil mazhai kadhai um quote um entries
        now = timezone.now()
        ch = Challenge.objects.create(title='Mazhai 🌧️', emoji='🌧️', description='Mazhai pathi edhavadhu ezhudhunga — kadhai, kavithai, quote, edhuvum!',
                                      starts_at=now - timedelta(days=2), ends_at=now + timedelta(days=5))
        Story.objects.filter(pk__in=[x.pk for x in (s5, q1) if x]).update(challenge=ch)
        Challenge.objects.create(title='First Love 💕', emoji='💕', description='Mudhal kaadhal kadhaigal',
                                 content_type='kadhai', starts_at=now - timedelta(days=20), ends_at=now - timedelta(days=13))
        Story.objects.filter(published_at__isnull=True).update(published_at=now)

