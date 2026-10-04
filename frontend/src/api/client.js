import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
})

// ---------- Login tokens (localStorage la save → browser close pannaalum login irukkum) ----------
const safe = (fn, fallback = null) => { try { return fn() } catch { return fallback } }
export const tokens = {
  access: () => safe(() => localStorage.getItem('access')),
  refresh: () => safe(() => localStorage.getItem('refresh')),
  set: ({ access, refresh }) => safe(() => {
    if (access) localStorage.setItem('access', access)
    if (refresh) localStorage.setItem('refresh', refresh)
  }),
  clear: () => safe(() => { localStorage.removeItem('access'); localStorage.removeItem('refresh') }),
}

// Ovvoru request kum token automatic ah add aagum
api.interceptors.request.use((config) => {
  const token = tokens.access()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Access token expire aana, refresh token vechu amaidhiya pudhusa vaangi, request ah thirumba anuppum.
// Ore neram la niraya requests fail aanaalum, oru thadava mattum refresh pannum.
let refreshing = null
function refreshAccess() {
  if (!refreshing) {
    const used = tokens.refresh()
    refreshing = axios.post(`${api.defaults.baseURL}/auth/refresh/`, { refresh: used })
      .then(({ data }) => { tokens.set(data); return data.access })
      .catch((e) => {
        // Vera tab already refresh pannirundha, adhoda pudhu token ah use pannu
        if (tokens.refresh() && tokens.refresh() !== used) return tokens.access()
        throw e
      })
      .finally(() => { refreshing = null })
  }
  return refreshing
}

const isAuthCall = (url = '') => /\/auth\/(login|refresh|register|logout)\//.test(url)

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err.config
    if (err.response?.status === 401 && cfg && !cfg._retry && !isAuthCall(cfg.url) && tokens.refresh()) {
      cfg._retry = true
      try {
        const access = await refreshAccess()
        cfg.headers.Authorization = `Bearer ${access}`
        return api(cfg)
      } catch (e) {
        // Refresh token invalid / user blocked → logout. Network problem na logout pannaadhu.
        if (e.response && [400, 401].includes(e.response.status)) {
          tokens.clear()
          window.dispatchEvent(new Event('thodar:logout'))
        }
      }
    }
    return Promise.reject(err)
  },
)

export const errorText = (err) => {
  const d = err?.response?.data
  if (!d) return 'Server kooda connect aagala. Backend run aagudha?'
  if (typeof d === 'string') return d
  if (d.detail) return d.detail
  return Object.entries(d).map(([k, v]) => `${k}: ${[].concat(v).join(' ')}`).join(' • ')
}

export const GENRES = {
  horror: { label: 'Horror', emoji: '👻' },
  comedy: { label: 'Comedy', emoji: '😂' },
  love: { label: 'Love', emoji: '💕' },
  thriller: { label: 'Thriller', emoji: '🔪' },
  scifi: { label: 'Sci-Fi', emoji: '🚀' },
  drama: { label: 'Drama', emoji: '🎭' },
  mystery: { label: 'Mystery', emoji: '🕵️' },
  life: { label: 'Life', emoji: '🌱' },
  family: { label: 'Family', emoji: '🏡' },
  friendship: { label: 'Friendship', emoji: '🤝' },
  motivation: { label: 'Motivation', emoji: '💪' },
  nature: { label: 'Nature', emoji: '🌿' },
}

// Content types — ovvoru type kum sondha color, emoji, behaviour
export const TYPES = {
  kadhai: { emoji: '📖', color: '#0F766E', canContinue: true },
  kavithai: { emoji: '🌸', color: '#DB2777', canContinue: true },
  dialogue: { emoji: '💬', color: '#2563EB', canContinue: true },
  personal: { emoji: '🙋', color: '#EA580C', canContinue: false },
  article: { emoji: '📰', color: '#7C3AED', canContinue: false },
  quote: { emoji: '💭', color: '#D97706', canContinue: false },
}

export const STATES = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'Puducherry', 'Maharashtra',
  'Delhi', 'West Bengal', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'Madhya Pradesh', 'Bihar', 'Odisha', 'Punjab',
  'Haryana', 'Assam', 'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh', 'Goa', 'Jammu & Kashmir',
  'Tripura', 'Meghalaya', 'Manipur', 'Nagaland', 'Mizoram', 'Arunachal Pradesh', 'Sikkim', 'Ladakh',
  'Chandigarh', 'Andaman & Nicobar', 'Lakshadweep', 'Dadra & Nagar Haveli and Daman & Diu', 'Outside India']

export const SPOKEN = { ta: 'தமிழ்', en: 'English', hi: 'हिन्दी', te: 'తెలుగు', ml: 'മലയാളം', kn: 'ಕನ್ನಡ',
  mr: 'मराठी', bn: 'বাংলা', gu: 'ગુજરાતી', pa: 'ਪੰਜਾਬੀ', or: 'ଓଡ଼ିଆ', ur: 'اردو' }

// Backend media (uploaded images) full URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
export const mediaUrl = (path) => (!path ? null : path.startsWith('http') ? path : API_BASE.replace(/\/api\/?$/, '') + path)

export const LANGS = { ta: 'தமிழ்', en: 'English', mix: 'Tanglish' }

export default api
