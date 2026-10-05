import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useT } from '../i18n'
import { TYPES } from '../api/client'
import { Feathers, Sparkles } from '../components/Decor'

/* 📘 Thodar Guide — oru sheet la ellaa instructions um.
   Pudhu instruction add panna: SECTIONS la oru item serthu, en + ta ezhudhu. */

const WHY = [
  { e: '🌱', en: ['Why we built Thodar', 'Everyone has a story inside them. Many people start writing but stop because they feel alone. In Thodar, you write one line — and the whole world helps finish it.'],
             ta: ['தொடர் ஏன் உருவாக்கினோம்?', 'ஒவ்வொருவருக்குள்ளும் ஒரு கதை இருக்கு. பலர் எழுத ஆரம்பித்து, தனியாக இருப்பதால் நிறுத்திவிடுகிறார்கள். தொடரில் நீ ஒரு வரி எழுது — உலகமே சேர்ந்து அதை முடிக்கும்.'] },
  { e: '🌏', en: ['A home for our languages', 'Write in Tamil, English or Tanglish. Writers from every corner of India get the same space — big writer or first-time writer.'],
             ta: ['நம் மொழிகளுக்கு ஒரு வீடு', 'தமிழ், English, Tanglish — எதிலும் எழுதலாம். பெரிய எழுத்தாளரோ முதல் முறை எழுதுபவரோ — எல்லாருக்கும் ஒரே இடம்.'] },
  { e: '🤝', en: ['Create together', 'One person starts, others continue, stories branch like a peacock\'s feathers 🦚 — many endings, many imaginations.'],
             ta: ['சேர்ந்து உருவாக்கு', 'ஒருவர் தொடங்க, மற்றவர்கள் தொடர, கதைகள் மயில் தோகை போல 🦚 கிளைக்கும் — பல முடிவுகள், பல கற்பனைகள்.'] },
  { e: '💛', en: ['Free forever, for everyone', 'No premium, no paywall, no ads, no selling your data. Every feature is for every person — always.'],
             ta: ['என்றும் இலவசம், அனைவருக்கும்', 'பிரீமியம் இல்லை, கட்டணம் இல்லை, விளம்பரம் இல்லை, உன் தகவலை விற்பதில்லை. எல்லா வசதியும் எல்லாருக்கும் — எப்போதும்.'] },
]

const AUTH = [
  { e: '📝', en: ['Create an account', 'Tap "Join Thodar" → choose a username & password (min 6 letters) → add your name, place, languages → pick a photo or avatar → done 🎉'],
             ta: ['கணக்கு உருவாக்கு', '"Join Thodar" அழுத்து → username & password (குறைந்தது 6 எழுத்து) → பெயர், ஊர், மொழி → போட்டோ அல்லது அவதார் → முடிந்தது 🎉'] },
  { e: '⏳', en: ['Waiting for approval?', 'Sometimes the admin checks new accounts first. If you see "approval pending", wait a little and try again.'],
             ta: ['அனுமதிக்காக காத்திருக்கிறாயா?', 'சில நேரம் admin புதிய கணக்குகளை முதலில் சரிபார்ப்பார். "approval pending" வந்தால் கொஞ்சம் காத்திருந்து மீண்டும் முயற்சி செய்.'] },
  { e: '🔑', en: ['Login', 'Tap "Login" → type your username and password → Login. That\'s it!'],
             ta: ['லாகின்', '"Login" அழுத்து → username, password டைப் செய் → Login. அவ்வளவு தான்!'] },
  { e: '💾', en: ['You stay logged in', 'Close the browser, restart the phone — you are still logged in. No need to login again and again.'],
             ta: ['லாகின் அப்படியே இருக்கும்', 'Browser மூடினாலும், போன் restart செய்தாலும் — லாகின் இருக்கும். திரும்ப திரும்ப லாகின் தேவையில்லை.'] },
  { e: '🚪', en: ['Logout', 'Computer: click the ⇥ button next to your name at the bottom of the menu. Phone: ⚙️ Settings → Logout. Always logout on a shared / friend\'s phone.'],
             ta: ['லாகவுட்', 'கணினி: மெனு கீழே உன் பெயர் அருகில் ⇥ பட்டன். போன்: ⚙️ Settings → Logout. நண்பர் போனில் பயன்படுத்தினால் கண்டிப்பாக logout செய்.'] },
  { e: '🔒', en: ['Forgot password?', 'Change it any time in ⚙️ Settings → Change password. If you can\'t login at all, contact the admin.'],
             ta: ['Password மறந்துவிட்டதா?', '⚙️ Settings → Change password-ல் எப்போதும் மாற்றலாம். லாகினே ஆகவில்லை என்றால் admin-ஐ தொடர்பு கொள்.'] },
]

const STEPS = [
  { e: '📝', en: ['Sign up', 'Create your account, add a photo or pick a cute avatar.'], ta: ['பதிவு செய்', 'கணக்கு உருவாக்கு, போட்டோ போடு அல்லது ஒரு அவதார் தேர்வு செய்.'] },
  { e: '👀', en: ['Read', 'Open any story from Home. Filter by type, genre or language.'], ta: ['படி', 'Home-ல் எந்த கதையையும் திற. வகை, மொழி வைத்து filter செய்.'] },
  { e: '🌿', en: ['Continue', 'Add the next line to any story — or start a new branch.'], ta: ['தொடர்', 'எந்த கதைக்கும் அடுத்த வரியை சேர் — அல்லது புதிய கிளை தொடங்கு.'] },
  { e: '✍️', en: ['Write', 'Tap Write and start your own story, poem or quote.'], ta: ['எழுது', 'Write அழுத்தி உன் சொந்த கதை, கவிதை, quote தொடங்கு.'] },
]

const TYPE_TIPS = {
  kadhai: { en: 'Write the beginning of a story. Others continue it and it grows like a tree.', ta: 'கதையின் ஆரம்பத்தை எழுது. மற்றவர்கள் தொடர, அது மரம் போல வளரும்.' },
  kavithai: { en: 'Press Enter after every line. Others can reply with their own kavithai.', ta: 'ஒவ்வொரு வரிக்கும் பிறகு Enter அழுத்து. மற்றவர்கள் பதில் கவிதை எழுதலாம்.' },
  dialogue: { en: 'Fill in "Character name" for every line (eg. Ravi) — the Add button works only then.', ta: 'ஒவ்வொரு வரிக்கும் "Character name" போடு (உ.தா. ரவி) — அப்போது தான் Add வேலை செய்யும்.' },
  personal: { en: 'Share a real life experience. Turn on 🎭 Anonymous to hide your name.', ta: 'உண்மை அனுபவத்தை பகிர். பெயர் மறைக்க 🎭 Anonymous on செய்.' },
  article: { en: 'Longer writing with a cover image (up to 12000 letters). Readers can comment.', ta: 'Cover படத்துடன் நீண்ட எழுத்து (12000 எழுத்துகள் வரை). வாசகர்கள் கமெண்ட் செய்யலாம்.' },
  quote: { en: 'One short line (max 300 letters). Title is optional — it shows as a big card.', ta: 'ஒரு சிறிய வரி (அதிகபட்சம் 300). தலைப்பு தேவையில்லை — பெரிய கார்டாக தெரியும்.' },
}

const SECTIONS = [
  { id: 'tree', e: '🌳', en: 'Story tree & branches', ta: 'கதை மரம் & கிளைகள்', items: [
    { en: 'Every story is a tree. When you continue from a line, your line is added below it.', ta: 'ஒவ்வொரு கதையும் ஒரு மரம். ஒரு வரியிலிருந்து தொடர்ந்தால், உன் வரி அதன் கீழ் சேரும்.' },
    { en: 'If someone already continued that line, your line becomes a new branch 🌿 — a different direction.', ta: 'அந்த வரியை ஏற்கனவே யாராவது தொடர்ந்திருந்தால், உன் வரி புதிய கிளை 🌿 ஆகும்.' },
    { en: 'Click any box in the tree to read that path. Blue = your reading path, gold = current part.', ta: 'மரத்தில் எந்த பெட்டியையும் click செய்து அந்த பாதையை படி. நீலம் = நீ படிக்கும் பாதை, தங்கம் = இப்போதைய பகுதி.' },
    { en: 'Tick "This is the ending 🏁" to finish a path. 📕 Book view shows one full path like a book.', ta: '"This is the ending 🏁" tick செய்தால் அந்த பாதை முடியும். 📕 Book view ஒரு முழு பாதையை புத்தகம் போல காட்டும்.' },
  ] },
  { id: 'tamil', e: 'அ', en: 'Typing in Tamil', ta: 'தமிழில் டைப் செய்வது', items: [
    { en: 'Turn on the "அ Tamil typing" button below the box.', ta: 'பெட்டியின் கீழ் உள்ள "அ Tamil typing" பட்டனை on செய்.' },
    { en: 'Type in English letters and press Space: naan oru kadhai → நான் ஒரு கதை', ta: 'ஆங்கில எழுத்தில் டைப் செய்து Space அழுத்து: naan oru kadhai → நான் ஒரு கதை' },
    { en: 'Capitals for special letters: N = ண, L = ள, R = ற, zh = ழ', ta: 'சிறப்பு எழுத்துகள்: N = ண, L = ள, R = ற, zh = ழ' },
    { en: 'You can also use your phone\'s Tamil keyboard directly.', ta: 'உன் போனின் தமிழ் கீபோர்டையும் நேரடியாக பயன்படுத்தலாம்.' },
  ] },
  { id: 'social', e: '😍', en: 'Reactions, comments & sharing', ta: 'ரியாக்ஷன், கமெண்ட் & பகிர்வு', items: [
    { en: 'Tap ❤️ to like. Long-press / hover for more: 😂 😱 😢 🔥 👏', ta: '❤️ அழுத்தி லைக் செய். அதிகம் வேண்டுமா? அழுத்தி பிடி: 😂 😱 😢 🔥 👏' },
    { en: 'Use 💬 to comment, 🔖 to save a story, and follow writers you like.', ta: '💬 கமெண்ட், 🔖 கதையை சேமி, பிடித்த எழுத்தாளர்களை follow செய்.' },
    { en: '📲 Share as image makes a beautiful card for WhatsApp / Instagram.', ta: '📲 Share as image — WhatsApp / Instagram-க்கு அழகான கார்டு உருவாக்கும்.' },
  ] },
  { id: 'more', e: '📚', en: 'Drafts, series & challenges', ta: 'டிராஃப்ட், தொடர் & சவால்கள்', items: [
    { en: '📝 Save as draft to finish later — find it in Drafts in the menu.', ta: '📝 பிறகு முடிக்க Draft-ஆக சேமி — மெனுவில் Drafts-ல் இருக்கும்.' },
    { en: '📚 Series: give a series name while writing, chapters get numbered automatically.', ta: '📚 Series: எழுதும்போது series பெயர் கொடு, அத்தியாயங்கள் தானாக எண்ணிடப்படும்.' },
    { en: '🎯 Challenges: join the weekly topic. The admin picks 🏆 winners.', ta: '🎯 Challenges: வாரத் தலைப்பில் பங்கேற்று எழுது. Admin 🏆 வெற்றியாளரை தேர்வு செய்வார்.' },
    { en: '🏆 Earn badges like First Story, Writer, Branch Maker, Bilingual by writing more.', ta: '🏆 அதிகம் எழுதி First Story, Writer, Branch Maker, Bilingual போன்ற badges பெறு.' },
  ] },
]

const RULES = [
  { e: '🤝', en: 'Be kind. Respect every writer and reader.', ta: 'அன்பாக இரு. ஒவ்வொரு எழுத்தாளரையும் வாசகரையும் மதி.' },
  { e: '✍️', en: 'Post your own writing. Don\'t copy others\' work.', ta: 'உன் சொந்த எழுத்தை மட்டும் பதிவிடு. மற்றவர் படைப்பை copy செய்யாதே.' },
  { e: '🚫', en: 'No hate, abuse, adult content or personal attacks.', ta: 'வெறுப்பு, வசை, ஆபாசம், தனிப்பட்ட தாக்குதல் வேண்டாம்.' },
  { e: '🔒', en: 'Never share phone numbers or addresses — yours or anyone\'s.', ta: 'போன் நம்பர், முகவரி பகிராதே — உன்னுடையதோ மற்றவருடையதோ.' },
  { e: '🚩', en: 'See something wrong? Tap 🚩 Report. The admin will check it.', ta: 'தவறாக ஏதாவது தெரிகிறதா? 🚩 Report அழுத்து. Admin பார்ப்பார்.' },
]

const FAQ = [
  { en: ['Is Thodar free?', 'Yes — free forever, for everyone. No premium, no ads.'], ta: ['தொடர் இலவசமா?', 'ஆம் — என்றும் இலவசம், அனைவருக்கும். பிரீமியம் இல்லை, விளம்பரம் இல்லை.'] },
  { en: ['Why is the Add button grey?', 'Write at least 10 letters. In Dialogue, also fill "Character name".'], ta: ['Add பட்டன் ஏன் சாம்பல் நிறம்?', 'குறைந்தது 10 எழுத்துகள் எழுது. Dialogue-ல் "Character name" கூட போடு.'] },
  { en: ['What does 29/5000 mean?', 'Letters typed / maximum allowed (stories 5000, articles 12000). You don\'t need to write that much. Longer story? Continue it as the next part 🌳'], ta: ['29/5000 என்றால் என்ன?', 'டைப் செய்த எழுத்துகள் / அதிகபட்சம் (கதை 5000, கட்டுரை 12000). அவ்வளவு எழுத வேண்டியதில்லை. நீண்ட கதையா? அடுத்த பகுதியாக தொடருங்கள் 🌳'] },
  { en: ['Can I edit or delete my part?', 'Yes. Open the story and use ✏️ / 🗑️ on your own part.'], ta: ['என் பகுதியை மாற்றலாமா, நீக்கலாமா?', 'ஆம். கதையைத் திறந்து உன் பகுதியில் ✏️ / 🗑️ பயன்படுத்து.'] },
  { en: ['I can\'t log in?', 'Your account may be waiting for approval, or blocked. Contact the admin.'], ta: ['லாகின் ஆகவில்லையா?', 'உன் கணக்கு அனுமதிக்காக காத்திருக்கலாம் அல்லது block ஆகியிருக்கலாம். Admin-ஐ தொடர்பு கொள்.'] },
]

function Fold({ e, title, children, open, onToggle, i }) {
  return (
    <motion.section className={`guide-fold ${open ? 'open' : ''}`} initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
      <button className="guide-fold-head" onClick={onToggle} aria-expanded={open}>
        <span className="guide-ico">{e}</span><b>{title}</b>
        <motion.span className="guide-chev" animate={{ rotate: open ? 180 : 0 }}>⌄</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="guide-fold-body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }}>
            <div className="guide-fold-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

export function GuideContent({ inSheet, onClose }) {
  const { t, lang } = useT()
  const L = (o) => o[lang] || o.en
  const [open, setOpen] = useState('tree')
  const toggle = (id) => setOpen((o) => (o === id ? null : id))
  const ta = lang === 'ta'
  const jump = (id) => {
    if (SECTIONS.some((s) => s.id === id)) setOpen(id)
    setTimeout(() => document.getElementById(`g-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  return (
    <div className={`guide ${inSheet ? 'in-sheet' : ''}`}>
      <motion.section className="about-hero guide-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Feathers count={4} seed={5} />
        <Sparkles count={8} seed={2} />
        <span className="free-pill">📘 {ta ? 'தொடர் வழிமுறைகள்' : 'Thodar Instructions'}</span>
        <h1>{ta ? 'தொடர் — எல்லாம் ஒரே இடத்தில்' : 'Everything about Thodar'}</h1>
        <p>{ta ? 'நோக்கம், விதிகள், லாகின்/லாகவுட், எப்படி எழுதுவது — எல்லாம் இங்கே. 2 நிமிடம் படி!' : 'Our motive, rules, login / logout and how to write — all in one sheet. Read for 2 minutes!'}</p>
        <div className="guide-jump">
          {[['why', '🌱'], ['auth', '🔑'], ['start', '🚀'], ['types', '📝'], ...SECTIONS.map((s) => [s.id, s.e]), ['rules', '📜'], ['faq', '❓']].map(([id, e]) => (
            <button key={id} type="button" onClick={() => jump(id)}>{e}</button>
          ))}
        </div>
      </motion.section>

      <h2 className="section-title" id="g-why">🌱 {ta ? 'எங்கள் நோக்கம்' : 'Our motive'}</h2>
      <div className="guide-why">
        {WHY.map((w, i) => (
          <motion.div key={i} className="guide-why-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.07 }}>
            <span className="guide-why-emoji">{w.e}</span>
            <div><b>{L(w)[0]}</b><p>{L(w)[1]}</p></div>
          </motion.div>
        ))}
      </div>

      <h2 className="section-title" id="g-auth">🔑 {ta ? 'கணக்கு, லாகின் & லாகவுட்' : 'Account, login & logout'}</h2>
      <div className="guide-auth">
        {AUTH.map((a, i) => (
          <motion.div key={i} className="guide-auth-row" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}>
            <span className="guide-auth-ico">{a.e}</span>
            <div><b>{L(a)[0]}</b><p>{L(a)[1]}</p></div>
          </motion.div>
        ))}
      </div>
      <p className="guide-note">🔐 {ta ? 'பாலினம், பிறந்த வருடம் தனிப்பட்டவை — வேறு யாருக்கும் தெரியாது.' : 'Your gender and birth year are private — nobody else can see them.'}</p>

      <h2 className="section-title" id="g-start">🚀 {ta ? '4 படிகளில் தொடங்கு' : 'Start in 4 steps'}</h2>
      <div className="guide-steps">
        {STEPS.map((s, i) => (
          <motion.div key={i} className="guide-step" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }} whileHover={{ y: -4 }}>
            <span className="guide-num">{i + 1}</span>
            <span className="guide-step-emoji">{s.e}</span>
            <b>{L(s)[0]}</b>
            <p>{L(s)[1]}</p>
          </motion.div>
        ))}
      </div>

      <h2 className="section-title" id="g-types">📝 {ta ? 'எதை எழுதலாம்?' : 'What can I write?'}</h2>
      <div className="guide-types">
        {Object.entries(TYPE_TIPS).map(([k, tip], i) => TYPES[k] && (
          <motion.div key={k} className="guide-type" style={{ '--tc': TYPES[k].color }}
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}>
            <span className="type-badge small" style={{ '--tc': TYPES[k].color }}>{TYPES[k].emoji} {t('t_' + k)}</span>
            <p>{L(tip)}</p>
          </motion.div>
        ))}
        <motion.div className="guide-type" style={{ '--tc': '#E11D48' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="type-badge small" style={{ '--tc': '#E11D48' }}>💕 Love story</span>
          <p>{ta ? 'கதை தேர்வு செய்து, genre-ல் ❤️ Love தேர்வு செய்.' : 'Pick Kadhai, then choose the ❤️ Love genre.'}</p>
        </motion.div>
      </div>

      {SECTIONS.map((s, i) => (
        <div key={s.id} id={`g-${s.id}`}>
          <Fold e={s.e} title={L(s)} open={open === s.id} onToggle={() => toggle(s.id)} i={i}>
            <ul className="guide-list">{s.items.map((it, j) => <li key={j}>{L(it)}</li>)}</ul>
          </Fold>
        </div>
      ))}

      <h2 className="section-title" id="g-rules">📜 {ta ? 'சமூக விதிகள்' : 'Community rules'}</h2>
      <div className="guide-rules">
        {RULES.map((r, i) => (
          <motion.div key={i} className="guide-rule" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
            <span>{r.e}</span><p>{L(r)}</p>
          </motion.div>
        ))}
      </div>

      <h2 className="section-title" id="g-faq">❓ {ta ? 'அடிக்கடி கேட்கப்படும் கேள்விகள்' : 'Quick questions'}</h2>
      <div className="guide-faq">
        {FAQ.map((f, i) => (
          <details key={i} className="guide-q">
            <summary>{L(f)[0]}</summary>
            <p>{L(f)[1]}</p>
          </details>
        ))}
      </div>

      <motion.div className="guide-cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <b>{ta ? 'தயாரா? உன் முதல் வரியை எழுது ✨' : 'Ready? Write your first line ✨'}</b>
        <Link to="/new" className="btn btn-grad shine" onClick={onClose}>✍️ {t('write')}</Link>
      </motion.div>
    </div>
  )
}

export default function Guide() { return <GuideContent /> }

/* 📘 "Thodar Instructions" button click panna mela varum sheet */
export const openGuide = () => window.dispatchEvent(new Event('thodar:guide'))

export function GuideSheet() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const on = () => setShow(true)
    window.addEventListener('thodar:guide', on)
    return () => window.removeEventListener('thodar:guide', on)
  }, [])
  useEffect(() => {
    if (!show) return
    const esc = (e) => e.key === 'Escape' && setShow(false)
    window.addEventListener('keydown', esc)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = prev }
  }, [show])
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="sheet-backdrop" onClick={() => setShow(false)}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
                      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                      transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
            <div className="sheet-grip" />
            <button className="sheet-close" onClick={() => setShow(false)} aria-label="Close">✕</button>
            <div className="sheet-scroll"><GuideContent inSheet onClose={() => setShow(false)} /></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function GuideButton({ compact }) {
  const { lang } = useT()
  if (compact) return <button className="icon-btn" onClick={openGuide} aria-label="Thodar Instructions">📘</button>
  return (
    <motion.button className="guide-btn shine" onClick={openGuide} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
      <span>📘</span> {lang === 'ta' ? 'தொடர் வழிமுறைகள்' : 'Thodar Instructions'}
    </motion.button>
  )
}
