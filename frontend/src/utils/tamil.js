/**
 * Thanglish → தமிழ் transliteration (phonetic).
 *   vanakkam → வனக்கம்   vaNakkam → வணக்கம்   kadhai → கதை   nanba → நன்ப
 *   Capital letters: N=ண  L=ள  R=ற  T/D=ட  S=ஸ  E=ஏ  O=ஓ  A=ஆ  I=ஈ  U=ஊ
 *   zh=ழ  th/dh=த  sh=ஷ  nj=ஞ்ச  ng=ங்க  nd=ண்ட  ndh/nth=ந்த  tr=ற்ற
 */

// [latin, independent vowel, vowel sign]
const VOWELS = [
  ['aa', 'ஆ', 'ா'], ['A', 'ஆ', 'ா'], ['ai', 'ஐ', 'ை'], ['au', 'ஔ', 'ௌ'],
  ['ii', 'ஈ', 'ீ'], ['ee', 'ஈ', 'ீ'], ['I', 'ஈ', 'ீ'],
  ['uu', 'ஊ', 'ூ'], ['oo', 'ஊ', 'ூ'], ['U', 'ஊ', 'ூ'],
  ['ae', 'ஏ', 'ே'], ['E', 'ஏ', 'ே'], ['oa', 'ஓ', 'ோ'], ['O', 'ஓ', 'ோ'],
  ['a', 'அ', ''], ['i', 'இ', 'ி'], ['u', 'உ', 'ு'], ['e', 'எ', 'ெ'], ['o', 'ஒ', 'ொ'],
]

// [latin, tamil consonant (or cluster — vowel sign last letter ku pogum)]
const CONSONANTS = [
  ['ndh', 'ந்த'], ['nth', 'ந்த'], ['ngk', 'ங்க'],
  ['ng', 'ங்க'], ['nj', 'ஞ்ச'], ['nd', 'ண்ட'], ['tr', 'ற்ற'],
  ['zh', 'ழ'], ['th', 'த'], ['dh', 'த'], ['sh', 'ஷ'], ['ch', 'ச'], ['ksh', 'க்ஷ'],
  ['k', 'க'], ['g', 'க'], ['c', 'ச'], ['s', 'ச'], ['S', 'ஸ'], ['j', 'ஜ'], ['J', 'ஜ'],
  ['t', 'ட'], ['T', 'ட'], ['d', 'ட'], ['D', 'ட'], ['N', 'ண'], ['n', 'ன'],
  ['p', 'ப'], ['b', 'ப'], ['f', 'ஃப'], ['m', 'ம'], ['y', 'ய'], ['r', 'ர'], ['R', 'ற'],
  ['l', 'ல'], ['L', 'ள'], ['v', 'வ'], ['w', 'வ'], ['h', 'ஹ'], ['x', 'க்ஸ'], ['q', 'க'], ['z', 'ஜ'],
]
const PULLI = '்'

function match(list, word, i) {
  for (const item of list) {
    if (word.startsWith(item[0], i)) return item
  }
  return null
}

export function toTamil(word) {
  // Phone auto-capitalize: "Naan" → "naan" (full caps letters mattum special)
  if (/^[A-Z][a-z]+$/.test(word)) word = word[0].toLowerCase() + word.slice(1)
  let out = ''
  let open = false // last consonant ku innum vowel varala
  let i = 0
  while (i < word.length) {
    const v = match(VOWELS, word, i)
    if (v) {
      out += open ? v[2] : v[1]
      open = false
      i += v[0].length
      continue
    }
    const c = match(CONSONANTS, word, i)
    if (c) {
      if (open) out += PULLI
      let tamil = c[1]
      // 'n' word start la ந (nanba → நன்ப), mathapadi ன
      if (c[0] === 'n' && i === 0) tamil = 'ந'
      // 'ng'/'nj' word mudivula: ங் / ஞ்
      if ((c[0] === 'ng' || c[0] === 'nj') && i + 2 >= word.length) tamil = tamil[0]
      // naduvula 'ch' (vowel apram) → ச்ச : aachu → ஆச்சு
      if (c[0] === 'ch' && i > 0 && !open) tamil = 'ச்ச'
      out += tamil
      open = true
      i += c[0].length
      continue
    }
    if (open) { out += PULLI; open = false }
    out += word[i]
    i += 1
  }
  if (open) out += PULLI
  return out
}

/** Text la irukkura ella English words um Tamil ah maathum (numbers, emoji, punctuation apdiye). */
export function convertText(text) {
  return text.replace(/[A-Za-z]+/g, (w) => toTamil(w))
}
