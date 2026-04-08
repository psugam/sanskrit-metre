const formatInline = (text) => {
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const withStrong = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  const withCode = withStrong.replace(/`([^`]+)`/g, '<code>$1</code>')
  return withCode
}

export const markdownToHtml = (markdownText) => {
  const parts = []
  let paragraph = []
  let codeLines = []
  let inCode = false
  let inList = false

  const flushParagraph = () => {
    if (!paragraph.length) return
    const merged = paragraph.join(' ')
    parts.push(`<p>${formatInline(merged)}</p>`)
    paragraph = []
  }

  const closeList = () => {
    if (inList) {
      parts.push('</ol>')
      inList = false
    }
  }

  const lines = String(markdownText || '').split(/\r?\n/)
  lines.forEach((rawLine) => {
    const line = rawLine.replace(/\s+$/g, '')
    const stripped = line.trim()

    if (inCode) {
      if (stripped.startsWith('```')) {
        const codeContent = codeLines.join('\n')
        parts.push(`<pre><code>${codeContent.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code></pre>`)
        codeLines = []
        inCode = false
      } else {
        codeLines.push(line)
      }
      return
    }

    if (stripped.startsWith('```') && stripped.endsWith('```') && stripped.length > 6) {
      flushParagraph()
      closeList()
      const inner = stripped.slice(3, -3).trim()
      parts.push(`<pre><code>${inner.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code></pre>`)
      return
    }

    if (stripped.startsWith('```')) {
      flushParagraph()
      closeList()
      inCode = true
      codeLines = []
      return
    }

    if (!stripped) {
      flushParagraph()
      closeList()
      return
    }

    const imageMatch = stripped.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (imageMatch) {
      flushParagraph()
      closeList()
      const altText = imageMatch[1].trim() || 'Image'
      const source = imageMatch[2].trim()
      const base = import.meta.env.BASE_URL || '/'
      const normalizedBase = base.endsWith('/') ? base : `${base}/`
      const src = source.startsWith('http')
        ? source
        : `${normalizedBase}${source.replace(/^\.\//, '').replace(/^\/+/, '')}`
      parts.push(
        `<figure class="content-figure"><img src="${src}" alt="${altText}" />` +
          `<figcaption>${altText}</figcaption></figure>`
      )
      return
    }

    const headingMatch = stripped.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      closeList()
      const level = headingMatch[1].length
      const headingText = formatInline(headingMatch[2].trim())
      parts.push(`<h${level}>${headingText}</h${level}>`)
      return
    }

    const listMatch = stripped.match(/^(\d+)\.\s+(.*)$/)
    if (listMatch) {
      flushParagraph()
      if (!inList) {
        parts.push('<ol>')
        inList = true
      }
      parts.push(`<li>${formatInline(listMatch[2].trim())}</li>`)
      return
    }

    if (inList) {
      closeList()
    }

    paragraph.push(stripped)
  })

  if (inCode) {
    const codeContent = codeLines.join('\n')
    parts.push(`<pre><code>${codeContent.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code></pre>`)
  }

  flushParagraph()
  closeList()

  return parts.join('\n')
}
