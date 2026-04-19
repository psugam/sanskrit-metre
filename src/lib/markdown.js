import { marked } from 'marked'

const normalizeInlineFences = (markdownText) =>
  String(markdownText || '').replace(/^```([^`\n]+)```$/gm, '```\n$1\n```')

const resolveImageSrc = (source) => {
  const raw = String(source || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${raw.replace(/^\.\//, '').replace(/^\/+/, '')}`
}

export const markdownToHtml = (markdownText, options = {}) => {
  const renderer = new marked.Renderer()
  const resolveImage = typeof options.resolveImage === 'function' ? options.resolveImage : resolveImageSrc

  renderer.image = (href, title, text) => {
    const src = resolveImage(href)
    const altText = text || 'Image'
    const titleAttr = title ? ` title="${title}"` : ''
    const caption = altText ? `<figcaption>${altText}</figcaption>` : ''
    return `<figure class="content-figure"><img src="${src}" alt="${altText}"${titleAttr} />${caption}</figure>`
  }

  const normalized = normalizeInlineFences(markdownText)
  return marked.parse(normalized, {
    renderer,
    gfm: true,
    breaks: false,
    headerIds: false,
    mangle: false,
  })
}
