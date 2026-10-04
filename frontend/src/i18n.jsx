import { createContext, useContext, useState } from 'react'
import EXTRA from './i18n_extra'

/**
 * UI language: English ⇄ தமிழ்
 * t('key') → current language text. t('key', { n: 5 }) → {n} replace aagum.
 */
const DICT = {
  en: {
    // nav
    home: 'Home', top_writers: 'Top Writers', notifications: 'Notifications', saved: 'Saved',
    profile: 'Profile', settings: 'Settings', admin: 'Admin', write: 'Write', logout: 'Logout',
    login: 'Login', join: 'Join Thodar', light_mode: 'Light mode', dark_mode: 'Dark mode',
    join_cta: 'Join to write stories, react and follow writers.',
    tagline_1: 'You write one line,', tagline_2: 'the world writes the story.',
    hero_sub: 'Start a story. Others continue it. Every story grows like a tree, in many directions. In Tamil or English.',
    join_free: 'Join free ✨', composer: 'Start a new story, {name}…',
    latest: 'Latest', popular: 'Popular', following: 'Following',
    search: 'Search stories, titles, words…', all: 'All',
    lang_ta: 'தமிழ்', lang_en: 'English', lang_mix: 'Tanglish',
    load_more: 'Show more', empty_following: 'People you follow haven\'t written yet.',
    follow_top: 'Follow top writers →', empty_search: 'No stories here yet. Be the first to write one! ✍️',
    featured: 'Admin Picks', story_of_week: 'Story of the Week',
    // story card / page
    parts: 'parts', paths: 'paths', views: 'views', by: 'by', back_stories: 'Stories',
    save: 'Save', saved_one: 'Saved', share: 'Share', book_pdf: 'Book / PDF', delete: 'Delete',
    read: 'Read', tree: 'Tree', branches: '{n} branches', ending: 'The End', part_n: 'Part {n}',
    what_next: 'What happened next? Pick a path', continue_title: 'Continue the story',
    continue_ph: 'What happened next?', new_branch_ph: 'Take it in a new direction… (creates a new branch)',
    this_is_end: 'This is the ending 🏁', add: 'Add', adding: 'Adding…', new_branch: 'Add new branch',
    path_ended: '🏁 This path ends here.', read_book: 'Read as a book / download PDF →',
    try_other: 'or try another branch on the tree', login_to_continue: 'to continue this story ✍️',
    legend_path: 'Your reading path', legend_now: 'Current part', legend_click: 'Click any node to read that path',
    edit: 'Edit', cancel: 'Cancel', report: 'Report', comments: 'Comments',
    comment_ph: 'Write a comment…', post: 'Post', no_comments: 'No comments yet. Be the first 💬',
    // write
    new_story: 'New story', title_ph: 'Story title…', genre: 'Genre', language: 'Story language',
    opening: 'Opening', opening_ph: 'At midnight, my phone rang…', publish: 'Publish', publishing: 'Publishing…',
    tip: '💡 Tip: End on suspense — make others want to write the next line!',
    tamil_typing: 'Tamil typing', tamil_hint: 'Type in English letters, press space → தமிழ். N=ண L=ள R=ற zh=ழ',
    emoji: 'Emoji',
    // auth
    welcome_back: 'Welcome back 👋', welcome_sub: 'Your stories are waiting for you.',
    username: 'Username', password: 'Password', email_opt: 'Email (optional)', password_min: 'Password (min 6)',
    no_account: 'No account?', join_now: 'Join now', have_account: 'Already have an account?',
    create_account: 'Create account', join_title: 'Join Thodar ✨', join_sub: 'Takes 30 seconds. Then write your first line.',
    demo: 'Demo account', pending_msg: '✅ Account created! Admin approval pending ⏳ — you can login once approved.',
    // profile
    follow: 'Follow', unfollow: 'Following', edit_bio: 'Edit bio', no_bio: 'No bio yet.',
    stories: 'stories', likes: 'reactions', followers: 'followers', following_n: 'following', joined: 'Joined',
    started: 'Started', achievements: 'Achievements', bio_ph: 'One line about you…', nobody: 'Nobody yet',
    no_stories: 'No stories started yet.', no_parts: 'Nothing written yet.',
    b_first_story: 'First Story', b_writer: 'Writer', b_branch_maker: 'Branch Maker', b_finisher: 'Finisher',
    b_loved: 'Loved', b_superstar: 'Superstar', b_popular: 'Popular', b_bilingual: 'Bilingual', b_admin: 'Admin',
    // leaderboard / notifications / bookmarks
    most_loved: 'Most loved parts', in_story: 'in',
    n_continue: 'continued your part', n_like: 'reacted {e} to your part', n_comment: 'commented on your part',
    n_follow: 'started following you', no_notifs: 'Nothing yet. Start writing and notifications will come! ✍️',
    saved_title: 'Saved stories', no_saved: 'Nothing saved yet. Tap Save on a story 🔖',
    // settings
    appearance: 'Appearance', theme: 'Theme', accent: 'Color theme', ui_language: 'App language',
    change_password: 'Change password', old_password: 'Current password', new_password: 'New password',
    update_password: 'Update password', password_updated: 'Password updated ✅',
    // report
    report_title: 'Report this part', report_sent: 'Report sent. Admin will review 🙏',
    r_spam: 'Spam', r_abuse: 'Abuse / hate', r_adult: 'Adult content', r_copy: 'Copied content', r_other: 'Other',
    note_ph: 'Anything else? (optional)', send: 'Send',
    // toasts
    login_needed: 'Please login first 🙂', published: '🌱 Story published!', branch_added: '🌿 New branch created!',
    continued: '✍️ Story continued!', link_copied: '🔗 Link copied!', bookmarked: '🔖 Saved!', unbookmarked: 'Removed from saved',
    updated: 'Updated ✅', deleted: 'Deleted', confirm_delete_part: 'Delete this part?',
    confirm_delete_story: 'The whole story (all branches) will be deleted. Sure?',
    not_found: 'Page not found 🤷', loading: 'Loading…',
    // admin
    dashboard: 'Dashboard', overview: 'Overview', users: 'Users', moderation: 'Reports', site: 'Site',
    total_users: 'Users', pending_users: 'Pending', blocked_users: 'Blocked', total_stories: 'Stories',
    total_parts: 'Parts', total_reactions: 'Reactions', total_views: 'Views', open_reports: 'Open reports',
    new_this_week: '+{n} this week', signups_14: 'New users · last 14 days', parts_14: 'Parts written · last 14 days',
    by_genre: 'Stories by genre', by_language: 'Stories by language', top_reactions: 'Reactions',
    approve: 'Approve', approve_all: 'Approve all pending', block: 'Block', unblock: 'Unblock', make_admin: 'Make admin',
    remove_admin: 'Remove admin', status_active: 'Active', status_pending: 'Pending', status_blocked: 'Blocked',
    you: 'You', feature: 'Feature', unfeature: 'Unfeature', hide: 'Hide', unhide: 'Unhide', hidden: 'Hidden',
    dismiss: 'Dismiss', remove_content: 'Remove', remove_block: 'Remove + block user', reported_by: 'reported by',
    no_reports: 'No open reports. All clean! ✨', require_approval: 'New users need my approval',
    require_approval_sub: 'When on, new sign-ups can\'t login until you approve them.',
    announcement: 'Announcement banner', announcement_sub: 'Shown on everyone\'s home page. Leave empty to hide.',
    save_settings: 'Save', settings_saved: 'Settings saved ✅', admin_only: 'Admin only 👑',
    confirm_delete_user: 'Delete this user and everything they wrote?', filter_all: 'All', admins: 'Admins',
    featured_f: 'Featured', open: 'Open', resolved: 'Resolved',
  },
  ta: {
    home: 'முகப்பு', top_writers: 'சிறந்த எழுத்தாளர்கள்', notifications: 'அறிவிப்புகள்', saved: 'சேமித்தவை',
    profile: 'சுயவிவரம்', settings: 'அமைப்புகள்', admin: 'நிர்வாகம்', write: 'எழுது', logout: 'வெளியேறு',
    login: 'உள்நுழை', join: 'தொடரில் சேர்', light_mode: 'வெளிச்ச தீம்', dark_mode: 'இருள் தீம்',
    join_cta: 'கதை எழுத, ரியாக்ட் செய்ய, எழுத்தாளர்களை பின்தொடர சேருங்கள்.',
    tagline_1: 'ஒரு வரி நீ எழுது,', tagline_2: 'கதை உலகம் எழுதும்.',
    hero_sub: 'ஒரு கதையைத் தொடங்கு. மற்றவர்கள் தொடர்வார்கள். ஒவ்வொரு கதையும் மரம் போல பல திசைகளில் வளரும். தமிழிலோ ஆங்கிலத்திலோ.',
    join_free: 'இலவசமாக சேர் ✨', composer: 'புதிய கதையைத் தொடங்கு, {name}…',
    latest: 'புதியவை', popular: 'பிரபலம்', following: 'பின்தொடர்பவை',
    search: 'கதை, தலைப்பு, வார்த்தை தேடு…', all: 'அனைத்தும்',
    lang_ta: 'தமிழ்', lang_en: 'English', lang_mix: 'Tanglish',
    load_more: 'மேலும் காட்டு', empty_following: 'நீங்கள் பின்தொடர்பவர்கள் இன்னும் எழுதவில்லை.',
    follow_top: 'சிறந்த எழுத்தாளர்களைப் பின்தொடர் →', empty_search: 'இங்கே இன்னும் கதை இல்லை. நீயே முதலில் எழுது! ✍️',
    featured: 'நிர்வாகி தேர்வு', story_of_week: 'இந்த வாரக் கதை',
    parts: 'பகுதிகள்', paths: 'பாதைகள்', views: 'பார்வைகள்', by: '', back_stories: 'கதைகள்',
    save: 'சேமி', saved_one: 'சேமிக்கப்பட்டது', share: 'பகிர்', book_pdf: 'புத்தகம் / PDF', delete: 'நீக்கு',
    read: 'படி', tree: 'மரம்', branches: '{n} கிளைகள்', ending: 'முடிவு', part_n: 'பகுதி {n}',
    what_next: 'அடுத்து என்ன ஆச்சு? ஒரு பாதையைத் தேர்ந்தெடு', continue_title: 'நீ தொடர்',
    continue_ph: 'அடுத்து என்ன நடந்தது?', new_branch_ph: 'புதிய திசையில் கொண்டு போ… (புதிய கிளை உருவாகும்)',
    this_is_end: 'இதுதான் முடிவு 🏁', add: 'சேர்', adding: 'சேர்க்கிறது…', new_branch: 'புதிய கிளை போடு',
    path_ended: '🏁 இந்தப் பாதை இங்கே முடிகிறது.', read_book: 'புத்தகமாகப் படி / PDF பதிவிறக்கு →',
    try_other: 'அல்லது மரத்தில் வேறு கிளையை முயற்சி செய்', login_to_continue: 'செய்து இந்தக் கதையைத் தொடர் ✍️',
    legend_path: 'நீ படிக்கும் பாதை', legend_now: 'இப்போதைய பகுதி', legend_click: 'எந்த முனையையும் கிளிக் செய்து படி',
    edit: 'திருத்து', cancel: 'ரத்து', report: 'புகார்', comments: 'கருத்துகள்',
    comment_ph: 'கருத்து எழுது…', post: 'பதிவிடு', no_comments: 'இன்னும் கருத்து இல்லை. நீயே முதலில் சொல் 💬',
    new_story: 'புதிய கதை', title_ph: 'கதையின் தலைப்பு…', genre: 'வகை', language: 'கதையின் மொழி',
    opening: 'தொடக்கம்', opening_ph: 'இரவு 12 மணிக்கு என் போன் ஒலித்தது…', publish: 'வெளியிடு', publishing: 'வெளியிடுகிறது…',
    tip: '💡 குறிப்பு: சஸ்பென்ஸில் முடி — அடுத்த வரியை எழுத மற்றவர்களுக்கு ஆசை வரணும்!',
    tamil_typing: 'தமிழ் டைப்பிங்', tamil_hint: 'ஆங்கில எழுத்தில் டைப் செய், space அழுத்து → தமிழ். N=ண L=ள R=ற zh=ழ',
    emoji: 'எமோஜி',
    welcome_back: 'வணக்கம் 👋', welcome_sub: 'உன் கதைகள் உனக்காகக் காத்திருக்கின்றன.',
    username: 'பயனர் பெயர்', password: 'கடவுச்சொல்', email_opt: 'மின்னஞ்சல் (விருப்பம்)', password_min: 'கடவுச்சொல் (குறைந்தது 6)',
    no_account: 'கணக்கு இல்லையா?', join_now: 'சேர்', have_account: 'ஏற்கனவே கணக்கு உள்ளதா?',
    create_account: 'கணக்கை உருவாக்கு', join_title: 'தொடரில் சேர் ✨', join_sub: '30 வினாடிகள் போதும். பிறகு உன் முதல் வரியை எழுது.',
    demo: 'டெமோ கணக்கு', pending_msg: '✅ கணக்கு உருவானது! நிர்வாகி ஒப்புதலுக்குக் காத்திருக்கிறது ⏳',
    follow: 'பின்தொடர்', unfollow: 'பின்தொடர்கிறாய்', edit_bio: 'பயோ திருத்து', no_bio: 'இன்னும் பயோ இல்லை.',
    stories: 'கதைகள்', likes: 'ரியாக்ஷன்கள்', followers: 'பின்தொடர்பவர்கள்', following_n: 'பின்தொடர்கிறார்', joined: 'சேர்ந்தது',
    started: 'தொடங்கியவை', achievements: 'சாதனைகள்', bio_ph: 'உன்னைப் பற்றி ஒரு வரி…', nobody: 'யாரும் இல்லை',
    no_stories: 'இன்னும் கதை தொடங்கவில்லை.', no_parts: 'இன்னும் எதுவும் எழுதவில்லை.',
    b_first_story: 'முதல் கதை', b_writer: 'எழுத்தாளர்', b_branch_maker: 'கிளை வீரர்', b_finisher: 'முடிவு தந்தவர்',
    b_loved: 'பிரியமானவர்', b_superstar: 'சூப்பர்ஸ்டார்', b_popular: 'பிரபலம்', b_bilingual: 'இருமொழி', b_admin: 'நிர்வாகி',
    most_loved: 'அதிகம் விரும்பப்பட்ட பகுதிகள்', in_story: '',
    n_continue: 'உன் பகுதியைத் தொடர்ந்தார்', n_like: 'உன் பகுதிக்கு {e} ரியாக்ட் செய்தார்', n_comment: 'உன் பகுதியில் கருத்து சொன்னார்',
    n_follow: 'உன்னைப் பின்தொடரத் தொடங்கினார்', no_notifs: 'இன்னும் எதுவும் இல்லை. எழுதத் தொடங்கு! ✍️',
    saved_title: 'சேமித்த கதைகள்', no_saved: 'இன்னும் எதுவும் சேமிக்கவில்லை 🔖',
    appearance: 'தோற்றம்', theme: 'தீம்', accent: 'வண்ண தீம்', ui_language: 'ஆப் மொழி',
    change_password: 'கடவுச்சொல் மாற்று', old_password: 'தற்போதைய கடவுச்சொல்', new_password: 'புதிய கடவுச்சொல்',
    update_password: 'மாற்று', password_updated: 'கடவுச்சொல் மாற்றப்பட்டது ✅',
    report_title: 'இந்தப் பகுதியைப் புகார் செய்', report_sent: 'புகார் அனுப்பப்பட்டது 🙏',
    r_spam: 'ஸ்பேம்', r_abuse: 'அவதூறு / வெறுப்பு', r_adult: 'வயது வந்தோர் உள்ளடக்கம்', r_copy: 'நகல் உள்ளடக்கம்', r_other: 'மற்றவை',
    note_ph: 'வேறு ஏதாவது? (விருப்பம்)', send: 'அனுப்பு',
    login_needed: 'முதலில் உள்நுழையுங்கள் 🙂', published: '🌱 கதை வெளியிடப்பட்டது!', branch_added: '🌿 புதிய கிளை உருவானது!',
    continued: '✍️ கதை தொடர்ந்தது!', link_copied: '🔗 இணைப்பு நகலெடுக்கப்பட்டது!', bookmarked: '🔖 சேமிக்கப்பட்டது!', unbookmarked: 'நீக்கப்பட்டது',
    updated: 'மாற்றப்பட்டது ✅', deleted: 'நீக்கப்பட்டது', confirm_delete_part: 'இந்தப் பகுதியை நீக்கவா?',
    confirm_delete_story: 'முழுக் கதையும் (எல்லாக் கிளைகளும்) நீக்கப்படும். உறுதியா?',
    not_found: 'பக்கம் கிடைக்கவில்லை 🤷', loading: 'ஏற்றுகிறது…',
    dashboard: 'டாஷ்போர்டு', overview: 'மேலோட்டம்', users: 'பயனர்கள்', moderation: 'புகார்கள்', site: 'தளம்',
    total_users: 'பயனர்கள்', pending_users: 'காத்திருப்பு', blocked_users: 'தடுக்கப்பட்டவை', total_stories: 'கதைகள்',
    total_parts: 'பகுதிகள்', total_reactions: 'ரியாக்ஷன்கள்', total_views: 'பார்வைகள்', open_reports: 'திறந்த புகார்கள்',
    new_this_week: 'இந்த வாரம் +{n}', signups_14: 'புதிய பயனர்கள் · 14 நாட்கள்', parts_14: 'எழுதிய பகுதிகள் · 14 நாட்கள்',
    by_genre: 'வகை வாரியாக', by_language: 'மொழி வாரியாக', top_reactions: 'ரியாக்ஷன்கள்',
    approve: 'ஒப்புதல்', approve_all: 'அனைவருக்கும் ஒப்புதல்', block: 'தடு', unblock: 'தடை நீக்கு', make_admin: 'நிர்வாகி ஆக்கு',
    remove_admin: 'நிர்வாகி நீக்கு', status_active: 'செயலில்', status_pending: 'காத்திருப்பு', status_blocked: 'தடுக்கப்பட்டது',
    you: 'நீ', feature: 'சிறப்பி', unfeature: 'சிறப்பு நீக்கு', hide: 'மறை', unhide: 'காட்டு', hidden: 'மறைக்கப்பட்டது',
    dismiss: 'நிராகரி', remove_content: 'நீக்கு', remove_block: 'நீக்கு + பயனரைத் தடு', reported_by: 'புகார் செய்தவர்',
    no_reports: 'திறந்த புகார்கள் இல்லை ✨', require_approval: 'புதிய பயனர்களுக்கு என் ஒப்புதல் தேவை',
    require_approval_sub: 'இயக்கினால், நீங்கள் ஒப்புதல் தரும் வரை புதியவர்கள் உள்நுழைய முடியாது.',
    announcement: 'அறிவிப்புப் பதாகை', announcement_sub: 'அனைவரின் முகப்புப் பக்கத்திலும் தெரியும்.',
    save_settings: 'சேமி', settings_saved: 'சேமிக்கப்பட்டது ✅', admin_only: 'நிர்வாகிக்கு மட்டும் 👑',
    confirm_delete_user: 'இந்தப் பயனரையும் அவர் எழுதிய அனைத்தையும் நீக்கவா?', filter_all: 'அனைத்தும்', admins: 'நிர்வாகிகள்',
    featured_f: 'சிறப்பு', open: 'திறந்தவை', resolved: 'தீர்க்கப்பட்டவை',
  },
}

Object.assign(DICT.en, EXTRA.en)
Object.assign(DICT.ta, EXTRA.ta)

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k })

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('lang') || 'en' } catch { return 'en' }
  })
  const setLang = (l) => {
    setLangState(l)
    document.documentElement.lang = l
    try { localStorage.setItem('lang', l) } catch { /* ignore */ }
  }
  const t = (key, vars) => {
    let s = DICT[lang]?.[key] ?? DICT.en[key] ?? key
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v)
    return s
  }
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export const useT = () => useContext(LangContext)
