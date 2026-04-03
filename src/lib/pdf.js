import { jsPDF } from 'jspdf'

const FONT_FAMILY_LATIN = 'NotoSans'
const FONT_FAMILY_DEV = 'NotoSansDeva'
const FONT_LATIN_FILE = 'NotoSans-Regular.ttf'
const FONT_DEV_FILE = 'NotoSansDevanagari-Regular.ttf'

const fontCache = {
  promise: null,
}

const arrayBufferToBase64 = (buffer) => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

const getFontUrls = () => {
  const base = import.meta.env.BASE_URL || '/'
  const normalized = base.endsWith('/') ? base : `${base}/`
  return {
    latin: `${normalized}fonts/${FONT_LATIN_FILE}`,
    devanagari: `${normalized}fonts/${FONT_DEV_FILE}`,
  }
}

const ensurePdfFonts = async (pdf) => {
  if (!fontCache.promise) {
    const { latin, devanagari } = getFontUrls()
    fontCache.promise = Promise.all([
      fetch(latin).then((res) => {
        if (!res.ok) throw new Error(`Failed to load font: ${FONT_LATIN_FILE}`)
        return res.arrayBuffer()
      }),
      fetch(devanagari).then((res) => {
        if (!res.ok) throw new Error(`Failed to load font: ${FONT_DEV_FILE}`)
        return res.arrayBuffer()
      }),
    ]).then(([latinBuffer, devBuffer]) => ({
      latin: arrayBufferToBase64(latinBuffer),
      devanagari: arrayBufferToBase64(devBuffer),
    }))
  }

  const { latin, devanagari } = await fontCache.promise
  pdf.addFileToVFS(FONT_LATIN_FILE, latin)
  pdf.addFont(FONT_LATIN_FILE, FONT_FAMILY_LATIN, 'normal')
  pdf.addFileToVFS(FONT_DEV_FILE, devanagari)
  pdf.addFont(FONT_DEV_FILE, FONT_FAMILY_DEV, 'normal')
}

const devanagariRegex = /[\u0900-\u097F]/

const setFontForText = (pdf, text = '') => {
  const sample = String(text || '')
  const family = devanagariRegex.test(sample) ? FONT_FAMILY_DEV : FONT_FAMILY_LATIN
  pdf.setFont(family, 'normal')
}

const palette = {
  lightBg: [234, 243, 251],
  lightFg: [39, 77, 115],
  lightBorder: [196, 212, 232],
  heavyBg: [248, 236, 228],
  heavyFg: [122, 58, 31],
  heavyBorder: [228, 197, 185],
  ink: [29, 36, 48],
  muted: [95, 104, 117],
  line: [208, 214, 224],
}

const drawLegend = (pdf, x, y) => {
  setFontForText(pdf, 'Legend')
  pdf.setFontSize(8)
  pdf.setTextColor(...palette.muted)
  pdf.text('Legend:', x, y)

  let cursor = x + 16
  const drawChip = (label, fill, fg) => {
    const chipW = 8
    const chipH = 4
    pdf.setFillColor(...fill)
    pdf.setDrawColor(190, 200, 212)
    pdf.rect(cursor, y - 2.5, chipW, chipH, 'FD')
    pdf.setTextColor(...fg)
    setFontForText(pdf, label)
    pdf.setFontSize(7)
    pdf.text(label === 'Laghu' ? 'L' : 'G', cursor + 2.6, y)
    cursor += chipW + 2

    setFontForText(pdf, label)
    pdf.setFontSize(8)
    pdf.setTextColor(...palette.muted)
    pdf.text(label, cursor, y)
    cursor += pdf.getTextWidth(label) + 6
  }

  drawChip('Laghu', palette.lightBg, palette.lightFg)
  drawChip('Guru', palette.heavyBg, palette.heavyFg)

  setFontForText(pdf, '|')
  pdf.setFontSize(8)
  pdf.setTextColor(...palette.muted)
  pdf.text('| Caesura', cursor, y)
}

const renderScanLine = (pdf, line, startX, maxX, startY) => {
  const textH = 5.2
  const weightH = 3.2
  const rowGap = 2.2
  const cellGap = 1.1
  const barW = 2.2

  const caesuraPositions = new Set(line.caesura_positions || [])
  const syllables = line.syllables || []
  const weights = line.weights || []

  const tokens = []
  if (caesuraPositions.has(0)) {
    tokens.push({ type: 'bar' })
  }

  syllables.forEach((syllable, idx) => {
    tokens.push({ type: 'cell', syllable, weight: weights[idx] })
    if (caesuraPositions.has(idx + 1)) {
      tokens.push({ type: 'bar' })
    }
  })

  let x = startX
  let rowTop = startY

  tokens.forEach((token) => {
    if (token.type === 'bar') {
      const needed = barW + 0.4
      if (x + needed > maxX) {
        rowTop += textH + weightH + rowGap
        x = startX
      }
      setFontForText(pdf, '|')
      pdf.setFontSize(10)
      pdf.setTextColor(...palette.muted)
      pdf.text('|', x + 0.8, rowTop + 4.1)
      x += needed
      return
    }

    const syllableText = token.syllable || '-'
    const weightLabel = token.weight === 1 ? 'L' : 'G'

    setFontForText(pdf, syllableText)
    pdf.setFontSize(8.8)
    const rawW = pdf.getTextWidth(syllableText) + 3
    const cellW = Math.max(8.2, Math.min(22, rawW))
    const needed = cellW + cellGap

    if (x + needed > maxX) {
      rowTop += textH + weightH + rowGap
      x = startX
    }

    const isLight = token.weight === 1
    const bg = isLight ? palette.lightBg : palette.heavyBg
    const fg = isLight ? palette.lightFg : palette.heavyFg
    const border = isLight ? palette.lightBorder : palette.heavyBorder

    pdf.setFillColor(...bg)
    pdf.setDrawColor(...border)
    pdf.rect(x, rowTop, cellW, textH, 'FD')
    pdf.rect(x, rowTop + textH, cellW, weightH, 'FD')

    pdf.setTextColor(...fg)
    setFontForText(pdf, syllableText)
    pdf.setFontSize(8.8)
    pdf.text(syllableText, x + (cellW - pdf.getTextWidth(syllableText)) / 2, rowTop + 3.4)

    setFontForText(pdf, weightLabel)
    pdf.setFontSize(6.8)
    pdf.text(weightLabel, x + (cellW - pdf.getTextWidth(weightLabel)) / 2, rowTop + textH + 2.4)

    x += needed
  })

  return rowTop + textH + weightH
}

export const buildTotalScansionPdf = async (totalResult) => {
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  await ensurePdfFonts(pdf)

  const margin = 12
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const pageBottom = pageHeight - margin

  const drawHeader = () => {
    setFontForText(pdf, 'Sanskrit Metrical Analyzer')
    pdf.setFontSize(13)
    pdf.setTextColor(...palette.ink)
    pdf.text('Sanskrit Metrical Analyzer - Total Scansion', pageWidth / 2, margin, { align: 'center' })

    setFontForText(pdf, 'Generated on')
    pdf.setFontSize(8)
    pdf.setTextColor(...palette.muted)
    const generatedOn = new Date().toLocaleString()
    pdf.text(`Generated on: ${generatedOn}`, pageWidth / 2, margin + 4.2, { align: 'center' })
    drawLegend(pdf, margin, margin + 9)
    pdf.setDrawColor(...palette.line)
  }

  drawHeader()
  let y = margin + 13

  const verses = totalResult?.verses || []
  verses.forEach((verse) => {
    const verseLines = verse.lines || []
    const estimatedHeight = 15 + verseLines.length * 11

    if (y + estimatedHeight > pageBottom) {
      pdf.addPage()
      drawHeader()
      y = margin + 13
    }

    const boxX = margin
    const boxY = y
    const boxW = pageWidth - margin * 2

    setFontForText(pdf, `Verse ${verse.verse_number}`)
    pdf.setFontSize(9)
    pdf.setTextColor(...palette.muted)
    pdf.text(`Verse ${verse.verse_number}`, boxX + 2, y + 4)

    const meterParts = []
    if (verse.jati) meterParts.push(`Jati: ${verse.jati}`)
    if (verse.meter_types?.length) {
      meterParts.push(`Type: ${verse.meter_types.map((kind) => kind.charAt(0).toUpperCase() + kind.slice(1)).join(', ')}`)
    } else if (verse.meter_type) {
      meterParts.push(`Type: ${verse.meter_type}`)
    }
    meterParts.push(`Metre: ${verse.meters?.length ? verse.meters.join(', ') : 'Unrecognized'}`)

    const meterLine = meterParts.join(' | ')
    setFontForText(pdf, meterLine)
    pdf.setFontSize(8)
    pdf.text(meterLine, boxX + 2, y + 7.5)

    let cursor = y + 10
    const lineStartX = boxX + 8
    const lineMaxX = boxX + boxW - 3

    verseLines.forEach((line, idx) => {
      if (cursor + 12 > pageBottom) {
        pdf.addPage()
        drawHeader()
        cursor = margin + 13
      }

      setFontForText(pdf, `L${idx + 1}`)
      pdf.setFontSize(8)
      pdf.setTextColor(...palette.muted)
      pdf.text(`L${idx + 1}`, boxX + 2.2, cursor + 3.8)

      const bottom = renderScanLine(pdf, line, lineStartX, lineMaxX, cursor)
      cursor = bottom + 2.1
    })

    const boxH = Math.max(12, cursor - boxY + 1.2)
    pdf.setDrawColor(...palette.line)
    pdf.rect(boxX, boxY, boxW, boxH)

    y = boxY + boxH + 3.4
  })

  return pdf
}
