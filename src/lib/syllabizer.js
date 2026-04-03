const DEV_VOWELS = {
  'अ': 'a',
  'आ': 'ā',
  'इ': 'i',
  'ई': 'ī',
  'उ': 'u',
  'ऊ': 'ū',
  'ऋ': 'ṛ',
  'ॠ': 'ṝ',
  'ऌ': 'ḷ',
  'ए': 'e',
  'ऐ': 'ai',
  'ओ': 'o',
  'औ': 'au',
}

const DEV_MATRAS = {
  'ा': 'ā',
  'ि': 'i',
  'ी': 'ī',
  'ु': 'u',
  'ू': 'ū',
  'ृ': 'ṛ',
  'ॄ': 'ṝ',
  'ॢ': 'ḷ',
  'े': 'e',
  'ै': 'ai',
  'ो': 'o',
  'ौ': 'au',
}

const DEV_CONSONANTS = {
  'क': 'k',
  'ख': 'kh',
  'ग': 'g',
  'घ': 'gh',
  'ङ': 'ṅ',
  'च': 'c',
  'छ': 'ch',
  'ज': 'j',
  'झ': 'jh',
  'ञ': 'ñ',
  'ट': 'ṭ',
  'ठ': 'ṭh',
  'ड': 'ḍ',
  'ढ': 'ḍh',
  'ण': 'ṇ',
  'त': 't',
  'थ': 'th',
  'द': 'd',
  'ध': 'dh',
  'न': 'n',
  'प': 'p',
  'फ': 'ph',
  'ब': 'b',
  'भ': 'bh',
  'म': 'm',
  'य': 'y',
  'र': 'r',
  'ल': 'l',
  'व': 'v',
  'श': 'ś',
  'ष': 'ṣ',
  'स': 's',
  'ह': 'h',
  'ळ': 'ḷ',
}

const VIRAMA = '्'
const ANUSVARA = 'ं'
const VISARGA = 'ः'
const CHANDRABINDU = 'ँ'

export const isDevanagari = (text) => {
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp >= 0x0900 && cp <= 0x097f) {
      return true
    }
  }
  return false
}

const devanagariToIast = (text) => {
  const chars = Array.from(text)
  let out = ''

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i]
    const next = chars[i + 1]
    const afterNext = chars[i + 2]

    if (ch === 'क' && next === VIRAMA && afterNext === 'ष') {
      out += 'kṣ'
      i += 2
      continue
    }
    if (ch === 'ज' && next === VIRAMA && afterNext === 'ञ') {
      out += 'jñ'
      i += 2
      continue
    }

    if (DEV_VOWELS[ch]) {
      out += DEV_VOWELS[ch]
      continue
    }

    if (DEV_CONSONANTS[ch]) {
      const consonant = DEV_CONSONANTS[ch]
      if (next === VIRAMA) {
        out += consonant
        i += 1
        continue
      }
      if (next && DEV_MATRAS[next]) {
        out += consonant + DEV_MATRAS[next]
        i += 1
        continue
      }
      out += consonant + 'a'
      continue
    }

    if (DEV_MATRAS[ch]) {
      out += DEV_MATRAS[ch]
      continue
    }

    if (ch === ANUSVARA || ch === CHANDRABINDU) {
      out += 'ṃ'
      continue
    }
    if (ch === VISARGA) {
      out += 'ḥ'
      continue
    }

    out += ch
  }

  return out.replace(/ṁ/g, 'ṃ')
}

const SHORT_VOWELS = new Set(['a', 'i', 'u', 'ṛ', 'ḷ'])
const LONG_VOWELS = new Set(['ā', 'ī', 'ū', 'ṝ', 'e', 'ai', 'o', 'au'])
const ALL_VOWELS = new Set([...SHORT_VOWELS, ...LONG_VOWELS])

const CONSONANT_LIST = [
  'kh', 'gh', 'ch', 'jh', 'ṭh', 'ḍh', 'th', 'dh', 'ph', 'bh',
  'kṣ',
  'k', 'g', 'ṅ', 'c', 'j', 'ñ', 'ṭ', 'ḍ', 'ṇ',
  't', 'd', 'n', 'p', 'b', 'm',
  'y', 'r', 'l', 'v', 'ś', 'ṣ', 's', 'h', 'ḷ',
]

const CONSONANT_SET = new Set(CONSONANT_LIST)

const preprocessIASTLine = (line) =>
  line
    .replace(/[।॥]/g, '')
    .replace(/[^\p{L}\p{M}]/gu, '')

const tokenizeIAST = (text) => {
  const tokens = []
  let i = 0

  while (i < text.length) {
    let matched = false

    for (const dv of ['ai', 'au']) {
      if (text.slice(i, i + dv.length) === dv) {
        tokens.push(dv)
        i += dv.length
        matched = true
        break
      }
    }
    if (matched) continue

    for (const cons of CONSONANT_LIST) {
      if (text.slice(i, i + cons.length) === cons) {
        tokens.push(cons)
        i += cons.length
        matched = true
        break
      }
    }
    if (matched) continue

    const ch = text[i]
    if (ALL_VOWELS.has(ch)) {
      tokens.push(ch)
      i += 1
      continue
    }

    if (ch === 'ṃ' || ch === 'ṁ') {
      tokens.push('ṃ')
      i += 1
      continue
    }

    if (ch === 'ḥ') {
      tokens.push('ḥ')
      i += 1
      continue
    }

    i += 1
  }

  return tokens
}

const isVowelToken = (tok) => ALL_VOWELS.has(tok)
const isConsonantToken = (tok) => CONSONANT_SET.has(tok)

const syllabifyTokens = (tokens) => {
  const syllables = []
  let current = []
  let hasVowel = false

  let i = 0
  while (i < tokens.length) {
    const tok = tokens[i]

    if (isVowelToken(tok)) {
      if (hasVowel) {
        syllables.push(current)
        current = [tok]
        hasVowel = true
      } else {
        current.push(tok)
        hasVowel = true
      }
      i += 1
      continue
    }

    if (tok === 'ṃ' || tok === 'ḥ') {
      current.push(tok)
      syllables.push(current)
      current = []
      hasVowel = false
      i += 1
      continue
    }

    if (isConsonantToken(tok)) {
      if (!hasVowel) {
        current.push(tok)
        i += 1
        continue
      }

      const clusterStart = i
      let j = i
      const cluster = []
      while (j < tokens.length && isConsonantToken(tokens[j])) {
        cluster.push(tokens[j])
        j += 1
      }

      if (j >= tokens.length) {
        current.push(...cluster)
        syllables.push(current)
        current = []
        hasVowel = false
        i = j
        continue
      }

      if (cluster.length === 1) {
        if (cluster[0] === 'kṣ') {
          current.push('k')
          syllables.push(current)
          current = ['ṣ']
          hasVowel = false
          i = clusterStart + 1
          continue
        }

        syllables.push(current)
        current = [cluster[0]]
        hasVowel = false
        i = clusterStart + 1
      } else {
        const coda = cluster[0]
        const nextOnset = cluster.slice(1)
        current.push(coda)
        syllables.push(current)
        current = nextOnset
        hasVowel = false
        i = clusterStart + cluster.length
      }
      continue
    }

    i += 1
  }

  if (current.length) {
    syllables.push(current)
  }

  return syllables
}

const syllableToString = (syllable) => syllable.join('')

const assignWeight = (syllable) => {
  if (!syllable.length) return 1

  let vowelIdx = -1
  let vowelTok = ''
  for (let idx = 0; idx < syllable.length; idx += 1) {
    if (isVowelToken(syllable[idx])) {
      vowelIdx = idx
      vowelTok = syllable[idx]
      break
    }
  }

  if (vowelIdx === -1) {
    return 1
  }

  if (LONG_VOWELS.has(vowelTok)) {
    return 2
  }

  const tail = syllable.slice(vowelIdx + 1)
  if (tail.length) {
    return 2
  }

  return 1
}

export const syllabize = (text) => {
  let working = String(text || '')
  if (isDevanagari(working)) {
    working = devanagariToIast(working)
  }

  working = working.normalize('NFC')
  const lines = working.split(/\r?\n/)
  const results = []

  for (const rawLine of lines) {
    const original = rawLine.trim()
    if (!original) continue

    const clean = preprocessIASTLine(original)
    if (!clean) continue

    const tokens = tokenizeIAST(clean)
    if (!tokens.length) continue

    const syllableGroups = syllabifyTokens(tokens)
    const syllableStrings = syllableGroups.map(syllableToString)
    const weights = syllableGroups.map(assignWeight)

    results.push({
      original,
      syllables: syllableStrings,
      weights,
    })
  }

  return results
}
