import { useMemo } from 'react'
import homeContent from '../content/home.md?raw'
import { markdownToHtml } from '../lib/markdown'

const Home = () => {
  const homeHtml = useMemo(() => markdownToHtml(homeContent), [])

  return (
    <section className="panel home-panel">
      <div className="panel-header">
        <h2>Introduction</h2>
        <p>Notes, examples, and context for Sanskrit prosody.</p>
      </div>
      <article className="markdown-content" dangerouslySetInnerHTML={{ __html: homeHtml }} />
    </section>
  )
}

export default Home
