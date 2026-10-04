# 🌳 Thodar — Story Chain Social Media

> **ஒரு வரி நீ எழுது, கதை உலகம் எழுதும்.**
> *You write one line, the world writes the story.*

## 💛 Free forever · For everyone
Thodar eppavume **free**. Premium illa, paid features illa, ads illa, user data vikkaradhu illa.
Ellaa features um ellarukkum, ellaa languages um ellarukkum. Code **MIT license** la open source (`LICENSE` file paaru).

Oruthar kadhai start pannuvaanga, mathavanga continue pannuvaanga. Ovvoru kadhaiyum **maram (tree)** maadhiri pala direction la branch aagum. **Tamil, English, Tanglish** moonu la um ezhudhalam.

**Stack:** Python · Django 5 · Django REST Framework · JWT · Pillow · SQLite / PostgreSQL · React 19 (Vite) · React Flow · Motion · canvas-confetti

---

## ⬆️ Pazhaya version la irundhu upgrade (un data, admin ellam apdiye irukkum)

1. Rendu terminal layum `Ctrl + C` press panni servers ah stop pannu
2. Pudhu zip ah **adhe folder la** extract pannu (eg. `Downloads\thodar_1`) → **"Replace the files"** select pannu
3. Backend terminal:
   ```
   cd backend
   venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py seed
   python manage.py runserver
   ```
4. Frontend terminal: `cd frontend` → `npm install` → `npm run dev`

---

## ▶️ Local la run pannradhu

### 1. Backend (terminal 1)
```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # Mac / Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py seed            # demo users + kadhaigal
python manage.py makeadmin       # 👑 UN admin account — username, password kekkum
python manage.py runserver
```

### 2. Frontend (terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Website → **http://localhost:5173**

- **Admin:** `makeadmin` la kudutha username/password vechu login → sidebar la **👑 Admin**
- **Demo user:** `ravi` / `thodar123` (priya, karthik, arun, meena ku um same)

### 🧹 Fresh start (demo data ellaam azhikka)
```bash
python manage.py freshstart      # ellaa stories + admin illaadha users delete; admin apdiye irukkum
```
⚠️ Adhukku apram `python manage.py seed` run pannaadha — demo data thirumba vandhudum.

### Tests
```bash
cd backend && python manage.py test      # 28 tests
```

---

## 👑 Admin Dashboard (`/admin` page in the app)

Admin password unakku mattum dhaan theriyum — `python manage.py makeadmin` run pannumbodhu nee set pannu.
Password maatha: app la **Settings → Change password**, illa `makeadmin` thirumba run pannu.

| Tab | Enna pannalam |
|---|---|
| **Overview** | Users, stories, parts, reactions, views, comments, pending, reports — animated stat tiles + 14-day charts, genre / language / reaction breakdown |
| **Users** | Search, filter (Pending / Active / Blocked / Admins), ✅ **Approve**, 🚫 **Block / Unblock**, 👑 make admin, delete, **Approve all pending** |
| **Stories** | ⭐ **Feature** (Home la "Admin Picks" carousel la varum), 👁 **Hide / Unhide**, 🏆 **challenge winner**, delete |
| **Challenges** | Create (title, emoji, dates, type), End now, delete |
| **Reports** | Users report panna content — Dismiss / Remove / Remove + block user |
| **Site** | 🔒 **"New users need my approval"** switch, 📢 **Announcement banner** (ellaar home page layum varum) |

Approval ON pannina: pudhu user signup → "Admin approval pending ⏳" → nee approve pannina dhaan login panna mudiyum.
Full database access ku Django admin um irukku: `http://127.0.0.1:8000/admin/`

---

## ✨ Features

**📝 7 content types** — ovvoru type kum sondha color & layout
| Type | Look | Mathavanga |
|---|---|---|
| 📖 Kadhai | Story + tree | Continue / branch |
| 💕 Love story | Kadhai + love genre | Continue / branch |
| 🌸 Kavithai | Centered poem | Badhil kavithai (reply poems) |
| 💬 Dialogue | Chat bubbles, character names | Next line |
| 🙋 Personal | Life experience, **anonymous option** 🎭 | Comments |
| 📰 Article | Blog, cover image, reading time | Comments |
| 💭 Quote | Big gradient card | React, share |

**🔐 Login stays saved**
- Login once → browser close pannaalum, computer restart pannaalum login la ye irukkum (1 varusham varaikkum, daily use pannina eppavum)
- **Logout** click pannina mattum dhaan veliya pogum (andha device oda token server la cancel aagum)
- Admin **block** pannina, adutha click la ye automatic ah logout aagum

**👤 Signup & profile**
- 3-step signup: account → name, state, city, languages, gender/birth year (optional, **private**) → photo, interests, bio
- 📸 **Profile photo upload with crop & zoom**, or pick from **24 cute avatars**
- 🖼️ Cover photo, location, languages, interests on profile; edit anytime in Settings

**🚀 More**
- 📝 **Drafts** — save, edit later, publish
- 🖼️ **Images in posts** (auto-resized, fake files rejected)
- 📲 **Share as image** — any post → 1080×1350 card for WhatsApp / Instagram
- 📚 **Series / chapters** — Chapter 1, 2, 3 with prev/next
- 🎯 **Weekly challenges** — admin creates, users join, admin picks 🏆 winners

**✍️ Writing — Tamil + English**
- Story language: **தமிழ் / English / Tanglish**, feed la language filter
- **தமிழ் typing:** "அ" button on pannu → English letters la type panni space press panna Tamil ah maarum
  (`naan oru kadhai` → `நான் ஒரு கதை`). Capital: N=ண L=ள R=ற, zh=ழ. Phone keyboard la um work aagum.
- **Emoji picker** — story, continue, comments ellathulayum
- Branching: endha part la irundhu venaalum continue → pudhu branch 🌿
- "This is the ending 🏁", edit / delete own part, delete own story
- 📕 Book view + PDF download

**😍 Social**
- **Emoji reactions:** ❤️ 😂 😱 😢 🔥 👏 — animated tray + emoji burst
- Comments, follow, Following feed, bookmarks, share link
- 🔔 Notifications (reaction emoji kooda kaattum)
- 🚩 Report inappropriate content
- 🏆 **Achievements:** 🌱 First Story, ✍️ Writer, 🌿 Branch Maker, 🏁 Finisher, 💖 Loved, 🌟 Superstar, 👥 Popular, 🌏 Bilingual, 👑 Admin
- ⭐ Admin Picks carousel, Story of the Week, leaderboard podium, view counts

**🎨 Look & feel**
- **App language:** English ⇄ தமிழ் (full UI)
- **🦚 Peacock (Mayil) theme** by default: teal → royal blue with gold highlights, soft cream background (+ Dark mode)
- **7 color themes:** Peacock, Candy, Sunset, Ocean, Forest, Neon, Rose Gold
- Rich animations: floating peacock feathers, gold sparkles ✦, 3D tilt cards with gloss, glowing buttons, shimmering gold text, smooth page slides
- Animations: page transitions, animated aurora background, sliding tab indicators, staggered cards, count-up numbers, animated charts, 🎉 confetti on publish / signup / new branch, shake on wrong password
- Tamil fonts bundled (Noto Sans / Serif Tamil) — offline la um correct ah theriyum
- Mobile: app-style bottom bar, reduced-motion support

---

## 🚀 Deploy (free ₹0)

| Part | Enga | |
|---|---|---|
| Frontend | **Vercel** | Root `frontend`, env `VITE_API_URL=https://<render-app>.onrender.com/api` |
| Backend | **Render** (free) | New → Blueprint → indha repo (`render.yaml`) |
| Database | **Neon** (free, expire aagaadhu) | Connection string → Render `DATABASE_URL` |
| Photos | **Cloudinary** (free) | API environment variable → Render `CLOUDINARY_URL` |

Render env la podanum: `DATABASE_URL`, `CLOUDINARY_URL`, `CORS_ORIGINS` (Vercel URL), `ADMIN_USERNAME`, `ADMIN_PASSWORD`.
Build aagumbodhu admin account automatic ah create aagum (free plan la Shell illa). Apram `ADMIN_PASSWORD` env ah delete pannidalaam.
Domain (eg. `thodar.co.in`) vaangina: Vercel → Settings → Domains la add pannu, adhai `CORS_ORIGINS` la um serthu podu.

## 🔌 API

| Method | URL | |
|---|---|---|
| POST | `/api/auth/register/` · `/login/` | Signup (approval aware) / JWT |
| GET/PATCH | `/api/auth/me/` | Current user, bio |
| POST | `/api/auth/password/` | Change password |
| GET | `/api/auth/users/<u>/` | Profile + badges |
| POST | `/api/auth/users/<u>/follow/` | Follow toggle |
| GET/POST | `/api/stories/?genre=&lang=&search=&sort=popular&feed=following&featured=1` | List / create |
| GET | `/api/stories/of-the-week/` · `/api/site/` | Story of week · announcement |
| GET/DELETE | `/api/stories/<id>/tree/` | Full tree |
| POST | `/api/stories/<id>/bookmark/` | Bookmark |
| PATCH/DELETE | `/api/parts/<id>/` | Edit / delete |
| POST | `/api/parts/<id>/continue/` · `/like/` `{emoji}` · `/report/` | Continue · react · report |
| GET/POST | `/api/parts/<id>/comments/` | Comments |
| GET | `/api/notifications/` · `/unread/` | Notifications |
| 👑 | `/api/admin/stats/` · `users/` · `stories/` · `reports/` · `settings/` | Admin only |

## 🗄️ Database
User · Profile (name, state, city, languages, interests, avatar, cover, private gender/birth year) · Follow · SiteSettings · Story (content type, language, draft/published, anonymous, cover, series, challenge, featured, hidden, winner, views) · **Part** (self FK `parent` → tree 🌳, speaker, image) · Series · Challenge · Like (emoji reaction) · Comment · Bookmark · Notification · Report

## 📸 Uploaded images
Local la `backend/media/` folder la save aagum. Deploy pannumbodhu (Render free disk restart la azhiyum) Cloudinary / S3 maadhiri storage connect pannanum.

## 💡 Next ideas
AI "next line" suggestion · real-time notifications (WebSockets) · voice stories 🎙️ · weekly writing contests · PWA install
