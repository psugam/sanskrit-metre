import {
  SAMAVRTTA_CATEGORY_ROWS,
  SAMAVRTTA_PATTERN_ROWS,
  ARDHASAMAVRTTA_PATTERN_ROWS,
  VISAMAVRTTA_PATTERN_ROWS,
} from './meterPatterns'

const ANUSTUP_ARDHA_NAMES = new Set([
  'śloka',
  'vipulā a',
  'vipulā b',
  'vipulā c',
  'vipulā d',
])

const slugify = (name) => {
  const base = String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return base || 'meter'
}

export const parsePatternLines = (rawPattern = '') => {
  const clean = String(rawPattern).replace(/`/g, '').replace(/\s+/g, '')
  const lines = []
  let currentWeights = []
  let currentCaesura = []

  let i = 0
  while (i < clean.length) {
    const ch = clean[i]

    if (ch === '1') {
      currentWeights.push(1)
      i += 1
      continue
    }

    if (ch === '2') {
      currentWeights.push(2)
      i += 1
      continue
    }

    if (ch === 'x' || ch === 'X') {
      currentWeights.push(0)
      i += 1
      continue
    }

    if (ch === '|') {
      let j = i
      while (j < clean.length && clean[j] === '|') {
        j += 1
      }
      const runLen = j - i
      const lineBreaks = Math.floor(runLen / 2)
      const hasCaesura = runLen % 2 === 1

      for (let k = 0; k < lineBreaks; k += 1) {
        lines.push({ weights: currentWeights, caesura: currentCaesura })
        currentWeights = []
        currentCaesura = []
      }

      if (hasCaesura) {
        currentCaesura.push(currentWeights.length)
      }

      i = j
      continue
    }

    i += 1
  }

  lines.push({ weights: currentWeights, caesura: currentCaesura })
  return lines
}

const buildMeter = (meterName, rawPattern, kind, syllableCount, uniqueSuffix = '') => {
  const slug = slugify(meterName)
  let meterId = `${kind}_${slug}`
  if (uniqueSuffix) {
    meterId = `${meterId}_${uniqueSuffix}`
  }

  const lines = parsePatternLines(rawPattern)
  let effectiveCount = syllableCount
  if (effectiveCount == null && lines.length) {
    effectiveCount = lines[0].weights.length
  }

  return {
    id: meterId,
    name: meterName,
    displayName: meterName,
    kind,
    rawPattern,
    lines,
    syllableCount: effectiveCount ?? '',
  }
}

const buildMeterList = (rows, kind, hasCount) => {
  const meters = []
  const seenIds = new Map()

  rows.forEach((row) => {
    if (hasCount) {
      const [name, count, rawPattern] = row
      let meter = buildMeter(String(name), String(rawPattern), kind, Number(count))
      const meterId = String(meter.id)
      const seen = seenIds.get(meterId) || 0
      if (seen) {
        meter = buildMeter(String(name), String(rawPattern), kind, Number(count), String(seen + 1))
      }
      seenIds.set(meterId, seen + 1)
      meters.push(meter)
    } else {
      const [name, rawPattern] = row
      let meter = buildMeter(String(name), String(rawPattern), kind, null)
      const meterId = String(meter.id)
      const seen = seenIds.get(meterId) || 0
      if (seen) {
        meter = buildMeter(String(name), String(rawPattern), kind, null, String(seen + 1))
      }
      seenIds.set(meterId, seen + 1)
      meters.push(meter)
    }
  })

  return meters
}

export const SAMAVRTTA_CATEGORIES = Object.fromEntries(
  SAMAVRTTA_CATEGORY_ROWS.map(([count, name]) => [Number(count), String(name)])
)

export const SAMAVRTTA_METERS = buildMeterList(SAMAVRTTA_PATTERN_ROWS, 'samavrtta', true)
export const ARDHASAMAVRTTA_METERS = buildMeterList(ARDHASAMAVRTTA_PATTERN_ROWS, 'ardhasamavrtta', false)
export const VISAMAVRTTA_METERS = buildMeterList(VISAMAVRTTA_PATTERN_ROWS, 'visamavrtta', false)

export const getSamavrttaCategory = (syllableCount) => SAMAVRTTA_CATEGORIES[Number(syllableCount)] || null

export const getSamavrttaBySyllableCount = (syllableCount) =>
  SAMAVRTTA_METERS.filter((meter) => Number(meter.syllableCount) === Number(syllableCount))

export const formatScansionLine = (line) => {
  const weights = line.weights || []
  const caesuraPositions = new Set(line.caesura || [])
  const parts = []

  if (caesuraPositions.has(0)) {
    parts.push('|')
  }

  weights.forEach((weight, index) => {
    if (weight === 1) {
      parts.push('।')
    } else if (weight === 2) {
      parts.push('ऽ')
    } else {
      parts.push('x')
    }

    if (caesuraPositions.has(index + 1)) {
      parts.push('|')
    }
  })

  return parts.join('')
}

export const kindLabel = (kind) => {
  const mapping = {
    samavrtta: 'Samavrtta',
    ardhasamavrtta: 'Ardhasamavrtta',
    visamavrtta: 'Visamavrtta',
  }
  return mapping[kind] || kind
}

const uniformLineSyllableCount = (meter) => {
  const lines = meter.lines || []
  if (!lines.length) {
    return null
  }
  const counts = lines.map((line) => line.weights.length)
  if (!counts.length || new Set(counts).size !== 1) {
    return null
  }
  return counts[0]
}

const buildMeterEntries = () => {
  const entries = []

  SAMAVRTTA_METERS.forEach((meter) => {
    entries.push({
      id: meter.id,
      kind: 'Samavrtta',
      kindCode: meter.kind,
      name: meter.displayName || meter.name,
      jati: getSamavrttaCategory(Number(meter.syllableCount) || 0) || '',
      syllableCount: meter.syllableCount || '',
      scansionLines: meter.lines.map(formatScansionLine),
    })
  })

  ARDHASAMAVRTTA_METERS.forEach((meter) => {
    const displayName = meter.displayName || meter.name
    const uniformCount = uniformLineSyllableCount(meter)
    let jati = ''
    if (ANUSTUP_ARDHA_NAMES.has(String(displayName).trim().toLowerCase())) {
      const baseJati = getSamavrttaCategory(uniformCount || 0)
      if (baseJati) {
        jati = `${baseJati} type`
      }
    }

    entries.push({
      id: meter.id,
      kind: 'Ardhasamavrtta',
      kindCode: meter.kind,
      name: displayName,
      jati,
      syllableCount: uniformCount || '',
      scansionLines: meter.lines.map(formatScansionLine),
    })
  })

  VISAMAVRTTA_METERS.forEach((meter) => {
    entries.push({
      id: meter.id,
      kind: 'Visamavrtta',
      kindCode: meter.kind,
      name: meter.displayName || meter.name,
      jati: '',
      syllableCount: '',
      scansionLines: meter.lines.map(formatScansionLine),
    })
  })

  return entries
}

const buildMeterOptions = (entries) => {
  const kindOrder = { Samavrtta: 0, Ardhasamavrtta: 1, Visamavrtta: 2 }

  const sorted = [...entries].sort((a, b) => {
    const countA = typeof a.syllableCount === 'number' || /\d+/.test(String(a.syllableCount))
      ? Number(a.syllableCount)
      : 999
    const countB = typeof b.syllableCount === 'number' || /\d+/.test(String(b.syllableCount))
      ? Number(b.syllableCount)
      : 999
    const kindDiff = (kindOrder[a.kind] ?? 99) - (kindOrder[b.kind] ?? 99)
    if (kindDiff !== 0) return kindDiff
    if (countA !== countB) return countA - countB
    return String(a.name).localeCompare(String(b.name))
  })

  return sorted.map((item) => {
    const parts = [item.kind]
    if (item.jati) {
      parts.push(`Jati: ${item.jati}`)
    }
    if (item.syllableCount) {
      parts.push(`Syllables: ${item.syllableCount}`)
    }

    return {
      id: String(item.id),
      label: `${item.name} (${parts.join(', ')})`,
    }
  })
}

export const METER_ENTRIES = buildMeterEntries()
export const METER_OPTIONS = buildMeterOptions(METER_ENTRIES)
export const METER_LOOKUP = Object.fromEntries(
  [...SAMAVRTTA_METERS, ...ARDHASAMAVRTTA_METERS, ...VISAMAVRTTA_METERS].map((meter) => [
    String(meter.id),
    meter,
  ])
)

export const ANUSTUP_ARDHA_NAME_SET = ANUSTUP_ARDHA_NAMES
