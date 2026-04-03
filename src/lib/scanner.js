import {
  ANUSTUP_ARDHA_NAME_SET,
  ARDHASAMAVRTTA_METERS,
  VISAMAVRTTA_METERS,
  getSamavrttaBySyllableCount,
  getSamavrttaCategory,
  kindLabel,
  formatScansionLine,
} from '../data/meters'

const lineMatchesPattern = (weights, pattern, ignoreLastSyllable = false) => {
  if (weights.length !== pattern.length) return false

  const lastIndex = pattern.length - 1
  for (let idx = 0; idx < pattern.length; idx += 1) {
    if (ignoreLastSyllable && idx === lastIndex) continue
    const expected = pattern[idx]
    if (expected === 0) continue
    if (weights[idx] !== expected) return false
  }

  return true
}

const linePatternForMeter = (meter, lineIndex) => {
  const lines = meter.lines || []
  const kind = meter.kind
  if (!lines.length) return null

  if (kind === 'samavrtta') {
    return lines[0]
  }

  if (kind === 'ardhasamavrtta') {
    const mapped = lineIndex % 2 === 0 ? 0 : 1
    if (mapped >= lines.length) return null
    return lines[mapped]
  }

  if (kind === 'visamavrtta') {
    if (lineIndex >= lines.length) return null
    return lines[lineIndex]
  }

  return null
}

const meterMatchesVerse = (meter, verseLines) => {
  const ignoreLast = ['samavrtta', 'ardhasamavrtta'].includes(meter.kind)

  for (let idx = 0; idx < verseLines.length; idx += 1) {
    const expected = linePatternForMeter(meter, idx)
    if (!expected) return false
    if (!lineMatchesPattern(verseLines[idx].weights, expected.weights, ignoreLast)) {
      return false
    }
  }

  return true
}

const matchSamavrtta = (verseLines) => {
  if (verseLines.length !== 4) return []
  const firstLen = verseLines[0].weights.length
  if (verseLines.some((line) => line.weights.length !== firstLen)) return []

  const candidates = getSamavrttaBySyllableCount(firstLen)
  return candidates.filter((meter) => meterMatchesVerse(meter, verseLines))
}

const matchArdhasamavrtta = (verseLines) => {
  if (verseLines.length !== 4) return []
  return ARDHASAMAVRTTA_METERS.filter((meter) => {
    if ((meter.lines || []).length < 2) return false
    return meterMatchesVerse(meter, verseLines)
  })
}

const matchVisamavrtta = (verseLines) => {
  if (verseLines.length !== 4) return []
  return VISAMAVRTTA_METERS.filter((meter) => (meter.lines || []).length === 4)
    .filter((meter) => meterMatchesVerse(meter, verseLines))
}

const resolveCommonMeters = (lines) => {
  if (!lines.length) return []
  let common = new Set(lines[0].matched_meters)
  for (const line of lines.slice(1)) {
    common = new Set(line.matched_meters.filter((name) => common.has(name)))
  }
  return lines[0].matched_meters.filter((name) => common.has(name))
}

const mergeMeterMatches = (...groups) => {
  const merged = []
  const seen = new Set()
  groups.flat().forEach((meter) => {
    const meterId = String(meter.id)
    if (seen.has(meterId)) return
    seen.add(meterId)
    merged.push(meter)
  })
  return merged
}

const applyLineMeterData = (verseLines, matchedMeters) => {
  const names = []
  const seen = new Set()
  matchedMeters.forEach((meter) => {
    const displayName = meter.displayName
    if (seen.has(displayName)) return
    seen.add(displayName)
    names.push(displayName)
  })

  verseLines.forEach((line, idx) => {
    line.matched_meters = [...names]
    line.caesura_positions = []

    if (matchedMeters.length) {
      const selected = matchedMeters[0]
      const patternLine = linePatternForMeter(selected, idx)
      if (patternLine) {
        line.caesura_positions = [...(patternLine.caesura || [])]
      }
    }
  })
}

export const scan = (syllabizedLines) => {
  const lineResults = syllabizedLines.map((lineData, idx) => ({
    line_number: idx + 1,
    original: lineData.original,
    syllables: lineData.syllables,
    weights: lineData.weights,
    syllable_count: lineData.syllables.length,
    matched_meters: [],
    line_only_meters: [],
    caesura_positions: [],
    match_found: false,
  }))

  const verses = []
  const verseSize = 4

  for (let start = 0; start < lineResults.length; start += verseSize) {
    const verseLines = lineResults.slice(start, start + verseSize)
    const syllableCounts = verseLines.map((line) => line.syllable_count)
    const isFullVerse = verseLines.length === verseSize
    const allEqual = syllableCounts.length && new Set(syllableCounts).size === 1

    let jati = null
    if (isFullVerse && allEqual && syllableCounts.length) {
      jati = getSamavrttaCategory(syllableCounts[0])
    }

    let matched = []
    let meterTypes = []
    let meterType = null

    if (isFullVerse) {
      const samavrttaMatches = allEqual ? matchSamavrtta(verseLines) : []
      const ardhasamavrttaMatches = matchArdhasamavrtta(verseLines)
      const visamavrttaMatches = matchVisamavrtta(verseLines)
      matched = mergeMeterMatches(samavrttaMatches, ardhasamavrttaMatches, visamavrttaMatches)

      const hasAnustupArdha = matched.some(
        (meter) =>
          meter.kind === 'ardhasamavrtta' &&
          ANUSTUP_ARDHA_NAME_SET.has(String(meter.displayName).trim().toLowerCase())
      )
      if (jati === 'anuṣṭup' && hasAnustupArdha) {
        jati = 'anuṣṭup type'
      }

      const kindOrder = hasAnustupArdha
        ? ['ardhasamavrtta', 'samavrtta', 'visamavrtta']
        : ['samavrtta', 'ardhasamavrtta', 'visamavrtta']

      const seenKinds = new Set()
      kindOrder.forEach((kind) => {
        if (seenKinds.has(kind)) return
        if (matched.some((meter) => meter.kind === kind)) {
          meterTypes.push(kind)
          seenKinds.add(kind)
        }
      })

      if (meterTypes.length) {
        meterType = meterTypes[0]
      }
    }

    applyLineMeterData(verseLines, matched)

    verseLines.forEach((line) => {
      line.match_found = line.matched_meters.length > 0
    })

    const commonMeters = resolveCommonMeters(verseLines)
    const commonSet = new Set(commonMeters)

    verseLines.forEach((line) => {
      line.line_only_meters = line.matched_meters.filter((name) => !commonSet.has(name))
    })

    verses.push({
      verse_number: verses.length + 1,
      lines: verseLines,
      syllable_counts: syllableCounts,
      equal_syllable_count: allEqual,
      jati,
      meter_type: meterType,
      meter_types: meterTypes,
      meters: commonMeters,
      meter: commonMeters.length ? commonMeters.join(', ') : null,
      match_found: commonMeters.length > 0,
    })
  }

  return {
    verses,
    lines: lineResults,
  }
}

const expectedLineCount = (meter) => {
  if (!meter) return 0
  if (['samavrtta', 'ardhasamavrtta'].includes(meter.kind)) return 4
  return (meter.lines || []).length
}

const buildSelectedLineReports = (verseLines, meter) => {
  const lineReports = []
  const ignoreLast = meter && ['samavrtta', 'ardhasamavrtta'].includes(meter.kind)

  verseLines.forEach((line, idx) => {
    const expected = meter ? linePatternForMeter(meter, idx) : null
    const linePass = Boolean(
      expected &&
        lineMatchesPattern(line.weights, expected.weights, ignoreLast)
    )

    lineReports.push({
      ...line,
      passes_selected: linePass,
      caesura_positions: expected ? [...(expected.caesura || [])] : [],
    })
  })

  return lineReports
}

export const runMeterCheck = (syllabized, selectedMeters, mixedMode = false) => {
  const base = scan(syllabized)
  const verses = base.verses || []

  let totalLines = 0
  let correctLines = 0
  let correctVerses = 0
  const failedVerses = []
  const matchedVerseAssignments = []

  const meterBreakdown = {}
  selectedMeters.forEach((meter) => {
    const meterId = String(meter.id)
    meterBreakdown[meterId] = {
      meter_id: meterId,
      meter_name: meter.displayName || meter.name,
      meter_kind: kindLabel(meter.kind),
      meter_pattern_lines: (meter.lines || []).map(formatScansionLine),
      matched_verses: 0,
      matched_lines: 0,
      verse_numbers: [],
    }
  })

  verses.forEach((verse) => {
    const verseLines = verse.lines || []
    totalLines += verseLines.length

    const matchedSelected = selectedMeters.filter((meter) => meterMatchesVerse(meter, verseLines))
    const assignedMeter = matchedSelected.length ? matchedSelected[0] : null

    const lineReports = buildSelectedLineReports(verseLines, assignedMeter || selectedMeters[0] || null)
    const versePass = assignedMeter ? lineReports.every((line) => line.passes_selected) : false

    if (mixedMode) {
      if (versePass) {
        correctLines += verseLines.length
      }
    } else {
      correctLines += lineReports.filter((line) => line.passes_selected).length
    }

    if (versePass) {
      correctVerses += 1
      if (assignedMeter) {
        const meterId = String(assignedMeter.id)
        if (meterBreakdown[meterId]) {
          meterBreakdown[meterId].matched_verses += 1
          meterBreakdown[meterId].matched_lines += verseLines.length
          meterBreakdown[meterId].verse_numbers.push(verse.verse_number)
        }
        matchedVerseAssignments.push({
          verse_number: verse.verse_number,
          meter_name: assignedMeter.displayName || assignedMeter.name,
          meter_kind: kindLabel(assignedMeter.kind),
        })
      }
    } else {
      const primaryMeter = selectedMeters[0] || null
      const expectedCount = expectedLineCount(primaryMeter)
      failedVerses.push({
        verse_number: verse.verse_number,
        lines: lineReports,
        line_count_match: primaryMeter ? verseLines.length === expectedCount : false,
        expected_line_count: expectedCount,
        actual_line_count: verseLines.length,
        recognized_meters: verse.meters || [],
      })
    }
  })

  const totalVerses = verses.length
  const linePercent = totalLines ? Number(((correctLines / totalLines) * 100).toFixed(2)) : 0
  const versePercent = totalVerses ? Number(((correctVerses / totalVerses) * 100).toFixed(2)) : 0

  const breakdownList = selectedMeters
    .map((meter) => meterBreakdown[String(meter.id)])
    .filter(Boolean)

  const primaryMeter = selectedMeters[0] || {}

  return {
    mode: mixedMode ? 'mixed' : 'checking',
    meter_name: primaryMeter.displayName || primaryMeter.name || '',
    meter_kind: kindLabel(primaryMeter.kind || ''),
    meter_pattern_lines: (primaryMeter.lines || []).map(formatScansionLine),
    selected_meter_names: selectedMeters.map((meter) => meter.displayName || meter.name),
    selected_meter_count: selectedMeters.length,
    meter_breakdown: breakdownList,
    matched_verse_assignments: matchedVerseAssignments,
    total_verses: totalVerses,
    total_lines: totalLines,
    correct_lines: correctLines,
    correct_verses: correctVerses,
    line_percent: linePercent,
    verse_percent: versePercent,
    failed_verse_numbers: failedVerses.map((verse) => verse.verse_number),
    failed_verses: failedVerses,
  }
}
