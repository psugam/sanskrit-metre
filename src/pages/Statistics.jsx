import { useMemo, useState } from 'react'
import { syllabize } from '../lib/syllabizer'
import { scan, runMeterCheck } from '../lib/scanner'
import { METER_LOOKUP, METER_OPTIONS } from '../data/meters'
import { buildTotalScansionPdf } from '../lib/pdf'

const SAMPLE_INPUT = 
`kaścit kāntāvirahaguruṇā svādhikārapramattaḥ
śāpenāstaṃgamitamahimā varṣabhogyeṇa bhartuḥ
yakṣaś cakre janakatanayāsnānapuṇyodakeṣu
snigdhacchāyātaruṣu vasatiṃ rāmagiryāśrameṣu`

const toTitleCase = (value) => String(value || '').charAt(0).toUpperCase() + String(value || '').slice(1)

const SyllableRow = ({ line }) => {
  const caesuraPositions = new Set(line.caesura_positions || [])

  return (
    <div className="syllable-row">
      {caesuraPositions.has(0) && <span className="caesura-mark">|</span>}
      {line.syllables.map((syllable, index) => (
        <span className="syllable-wrap" key={`${line.line_number}-${index}`}>
          <span className={`syl-cell ${line.weights[index] === 1 ? 'light' : 'heavy'}`}>
            <span className="syl-text">{syllable}</span>
            <span className="syl-weight">{line.weights[index] === 1 ? 'L' : 'G'}</span>
          </span>
          {caesuraPositions.has(index + 1) && <span className="caesura-mark">|</span>}
        </span>
      ))}
    </div>
  )
}

const Statistics = () => {
  const [mode, setMode] = useState('default')
  const [inputText, setInputText] = useState('')
  const [selectedMeterId, setSelectedMeterId] = useState('')
  const [selectedMeterIds, setSelectedMeterIds] = useState([])
  const [limitWarning, setLimitWarning] = useState('')

  const [error, setError] = useState('')
  const [analysisTime, setAnalysisTime] = useState(null)
  const [defaultResult, setDefaultResult] = useState(null)
  const [checkingReport, setCheckingReport] = useState(null)
  const [totalResult, setTotalResult] = useState(null)
  const [expandedLine, setExpandedLine] = useState(null)
  const [expandedFailedLine, setExpandedFailedLine] = useState(null)

  const meterOptions = useMemo(() => METER_OPTIONS, [])

  const resetResults = () => {
    setError('')
    setAnalysisTime(null)
    setDefaultResult(null)
    setCheckingReport(null)
    setTotalResult(null)
    setExpandedLine(null)
    setExpandedFailedLine(null)
  }

  const handleAnalyze = () => {
    resetResults()

    const trimmed = inputText.trim()
    if (!trimmed) {
      setError('Please enter some Sanskrit text.')
      return
    }

    const syllabized = syllabize(trimmed)
    if (!syllabized.length) {
      setError('No recognizable Sanskrit syllables found in the input.')
      return
    }

    const start = performance.now()

    if (mode === 'total') {
      const result = scan(syllabized)
      setTotalResult(result)
    } else if (mode === 'mixed') {
      if (!selectedMeterIds.length) {
        setError('Please select at least one valid metre for mixed checking mode.')
        return
      }
      if (selectedMeterIds.length > 10) {
        setError('Mixed checking mode supports up to 10 selected metres.')
        return
      }
      const selectedMeters = selectedMeterIds
        .map((id) => METER_LOOKUP[id])
        .filter(Boolean)
      if (!selectedMeters.length) {
        setError('Please select only valid metres for mixed checking mode.')
        return
      }
      const report = runMeterCheck(syllabized, selectedMeters, true)
      setCheckingReport(report)
    } else if (mode === 'checking') {
      const meter = METER_LOOKUP[selectedMeterId]
      if (!meter) {
        setError('Please select a valid metre for checking mode.')
        return
      }
      const report = runMeterCheck(syllabized, [meter], false)
      setCheckingReport(report)
    } else {
      const result = scan(syllabized)
      setDefaultResult(result)
    }

    const duration = (performance.now() - start) / 1000
    setAnalysisTime(duration.toFixed(4))
  }

  const toggleLine = (key) => {
    setExpandedLine((prev) => (prev === key ? null : key))
  }

  const toggleFailedLine = (key) => {
    setExpandedFailedLine((prev) => (prev === key ? null : key))
  }

  const handleSample = () => {
    setInputText(SAMPLE_INPUT)
  }

  const handleClear = () => {
    setInputText('')
    setSelectedMeterId('')
    setSelectedMeterIds([])
    setLimitWarning('')
    resetResults()
  }

  const handlePaste= async () => {
    try{
      const clipboardText = await navigator.clipboard.readText();
      setInputText(clipboardText) 
    }
    catch(err){
      console.error('Error accessing clipboard:', err)
    }
  }

  const handleModeChange = (value) => {
    setMode(value)
    setLimitWarning('')
  }

  const handleMeterToggle = (id) => {
    setSelectedMeterIds((prev) => {
      if (prev.includes(id)) {
        setLimitWarning('')
        return prev.filter((item) => item !== id)
      }
      if (prev.length >= 10) {
        setLimitWarning('Mixed checking mode supports up to 10 metres.')
        return prev
      }
      setLimitWarning('')
      return [...prev, id]
    })
  }

  const handlePdf = async () => {
    if (!totalResult) return
    const pdf = await buildTotalScansionPdf(totalResult)
    pdf.save('total_scansion_report.pdf')
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <h2>Statistics & Scansion</h2>
          <p>Analyze verses, compare metres, and explore syllable weights.</p>
        </div>

        <div className="workspace-grid">
          <div className="workspace-form">
            <div className="mode-row">
              {[
                { key: 'default', label: 'Default Scansion' },
                { key: 'checking', label: 'Checking Mode' },
                { key: 'mixed', label: 'Mixed Checking' },
                { key: 'total', label: 'Total Scansion' },
              ].map((item) => (
                <label key={item.key} className={`mode-pill ${mode === item.key ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="mode"
                    value={item.key}
                    checked={mode === item.key}
                    onChange={() => handleModeChange(item.key)}
                  />
                  <span className="mode-radio" aria-hidden="true"></span>
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            {mode === 'checking' && (
              <div className="field-group">
                <label className="field-label" htmlFor="meter-select">Select Metre</label>
                <select
                  id="meter-select"
                  value={selectedMeterId}
                  onChange={(event) => setSelectedMeterId(event.target.value)}
                  required={mode === 'checking'}
                >
                  <option value="">Choose a metre...</option>
                  {meterOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}

            {mode === 'mixed' && (
              <div className="field-group">
                <label className="field-label">Select Metres (up to 10)</label>
                <div className="meter-checklist">
                  {meterOptions.map((option) => (
                    <label className="meter-check-item" key={option.id}>
                      <input
                        type="checkbox"
                        value={option.id}
                        checked={selectedMeterIds.includes(option.id)}
                        onChange={() => handleMeterToggle(option.id)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {limitWarning && <div className="field-help warn">{limitWarning}</div>}
                {!limitWarning && <div className="field-help">Each verse passes if it matches any selected metre.</div>}
              </div>
            )}

            <div className="field-group">
              <label className="field-label" htmlFor="stats-input">Sanskrit Verses</label>
              <textarea
                id="stats-input"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="Enter Sanskrit text in IAST or Devanagari, one pada per line."
              />
            </div>

            <div className="btn-row">
              <button type="button" className="primary-action" onClick={handleAnalyze}>Run Analysis</button>
              <button type="button" className="ghost-action" onClick={handleSample}>Load sample verse</button>
              <button type="button" className="ghost-action" onClick={handleClear}>Clear input</button>
              <button type="button" className="ghost-action" onClick={handlePaste}>Paste from clipboard</button>
            </div>
          </div>

          <div className="workspace-side">
            <div className="info-card">
              <h3>Input Format</h3>
              <ul>
                <li>One pada (quarter-verse) per line.</li>
                <li>IAST and Devanagari input supported. Other transliterations may lead to errors.</li>
              </ul>
            </div>
            <div className="info-card">
              <h3>Scansion Key</h3>
              <div className="legend">
                <span><span className="legend-dot light"></span> L Laghu</span>
                <span><span className="legend-dot heavy"></span> G Guru</span>
                <span><span className="legend-dot">|</span> Caesura</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="error-banner">{error}</div>
      )}

      {analysisTime && (
        <section className="panel panel-tight">
          <div className="timing">Processing time: {analysisTime} sec</div>
        </section>
      )}

      {defaultResult && (
        <section className="panel">
          <div className="panel-header">
            <h2>Default Scansion Result</h2>
            <p>Click any line to show or hide scansion details.</p>
          </div>
          {defaultResult.verses.map((verse) => (
            <div className="verse-group" key={`verse-${verse.verse_number}`}>
              <div className="verse-header">
                <span>Verse {verse.verse_number}</span>
                {verse.jati && <span>Jati: {verse.jati}</span>}
                {verse.meter_types?.length ? (
                  <span>Type: {verse.meter_types.map(toTitleCase).join(', ')}</span>
                ) : verse.meter_type ? (
                  <span>Type: {toTitleCase(verse.meter_type)}</span>
                ) : null}
                <span>Metre: {verse.match_found ? verse.meters.join(', ') : 'Unrecognized'}</span>
              </div>
              <div className="verse-lines">
                {verse.lines.map((line) => {
                  const key = `default-${verse.verse_number}-${line.line_number}`
                  const expanded = expandedLine === key
                  return (
                    <div
                      className={`line-block ${expanded ? 'expanded' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-expanded={expanded}
                      key={key}
                      onClick={() => toggleLine(key)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggleLine(key)
                        }
                      }}
                    >
                      <div className="line-summary">
                        <p className="original-text">{line.original}</p>
                        {line.line_only_meters?.length ? (
                          <span className="line-meter">{line.line_only_meters.join(', ')}</span>
                        ) : null}
                      </div>
                      {expanded && (
                        <div className="line-details">
                          <SyllableRow line={line} />
                          <div className="syl-count">{line.syllable_count} syllable{line.syllable_count !== 1 ? 's' : ''}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {checkingReport && (
        <section className="panel">
          <div className="panel-header">
            <h2>{checkingReport.mode === 'mixed' ? 'Mixed Checking Mode Result' : 'Checking Mode Result'}</h2>
            <p>Review pass rates and pattern alignment.</p>
          </div>

          <div className="stats-grid">
            {checkingReport.mode === 'mixed' ? (
              <div className="stat-card">
                <div className="stat-label">Selected Metres</div>
                <div className="stat-value">{checkingReport.selected_meter_count}</div>
              </div>
            ) : (
              <>
                <div className="stat-card">
                  <div className="stat-label">Metre Name</div>
                  <div className="stat-value">{checkingReport.meter_name}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Metre Type</div>
                  <div className="stat-value">{checkingReport.meter_kind}</div>
                </div>
              </>
            )}
            <div className="stat-card">
              <div className="stat-label">Total Verses</div>
              <div className="stat-value">{checkingReport.total_verses}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Lines</div>
              <div className="stat-value">{checkingReport.total_lines}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Correct Lines</div>
              <div className="stat-value">{checkingReport.correct_lines}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Correct Verses</div>
              <div className="stat-value">{checkingReport.correct_verses}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Line Passed %</div>
              <div className="stat-value">{checkingReport.line_percent}%</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Verse Passed %</div>
              <div className="stat-value">{checkingReport.verse_percent}%</div>
            </div>
          </div>

          {checkingReport.mode === 'mixed' ? (
            <>
              <div className="pattern-box">
                <div className="stat-label">Selected Metres</div>
                <div className="pattern-line">{checkingReport.selected_meter_names.join(', ')}</div>
              </div>

              {checkingReport.matched_verse_assignments?.length ? (
                <div className="table-wrap assignment-wrap">
                  <table className="assignment-table">
                    <thead>
                      <tr>
                        <th>Verse</th>
                        <th>Assigned Metre</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkingReport.matched_verse_assignments.map((item) => (
                        <tr key={`assign-${item.verse_number}-${item.meter_name}`}>
                          <td>{item.verse_number}</td>
                          <td>{item.meter_name}</td>
                          <td>{item.meter_kind}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <div className="meter-breakdown-grid">
                {checkingReport.meter_breakdown.map((meterStat) => (
                  <div className="stat-card meter-breakdown-card" key={meterStat.meter_id}>
                    <div className="stat-label">Metre</div>
                    <div className="stat-value">{meterStat.meter_name}</div>
                    <div className="small-meta">{meterStat.meter_kind}</div>
                    <div className="small-meta">Matched verses: {meterStat.matched_verses}</div>
                    <div className="small-meta">Matched lines: {meterStat.matched_lines}</div>
                    <div className="small-meta">
                      Verse numbers: {meterStat.verse_numbers.length ? meterStat.verse_numbers.join(', ') : '-'}
                    </div>
                    {meterStat.meter_pattern_lines.map((line, idx) => (
                      <div className="pattern-line" key={`${meterStat.meter_id}-${idx}`}>{line}</div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="pattern-box">
              <div className="stat-label">Metre Pattern</div>
              {checkingReport.meter_pattern_lines.map((line, idx) => (
                <div className="pattern-line" key={`${checkingReport.meter_name}-${idx}`}>{line}</div>
              ))}
            </div>
          )}

          {checkingReport.failed_verse_numbers?.length ? (
            <>
              <div className="failure-list">
                Verses where scansion failed: {checkingReport.failed_verse_numbers.join(', ')}
              </div>

              {checkingReport.failed_verses.map((verse) => (
                <div className="verse-group" key={`failed-${verse.verse_number}`}>
                  <div className="verse-header">
                    <span>Verse {verse.verse_number}</span>
                    {!verse.line_count_match && (
                      <span>Expected {verse.expected_line_count} lines, got {verse.actual_line_count}</span>
                    )}
                    {verse.recognized_meters?.length ? (
                      <span>Recognized as: {verse.recognized_meters.join(', ')}</span>
                    ) : null}
                  </div>

                  {verse.lines.map((line) => {
                    const key = `failed-${verse.verse_number}-${line.line_number}`
                    const expanded = expandedFailedLine === key
                    return (
                      <div
                        className={`line-block ${!line.passes_selected ? 'failed' : ''} ${expanded ? 'expanded' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-expanded={expanded}
                        key={key}
                        onClick={() => toggleFailedLine(key)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            toggleFailedLine(key)
                          }
                        }}
                      >
                        <div className="line-summary">
                          <p className="original-text">{line.original}</p>
                          <span className="pass-label">{line.passes_selected ? 'PASS' : 'FAIL'}</span>
                        </div>
                        {expanded && (
                          <div className="line-details">
                            <SyllableRow line={line} />
                            <div className="expected-pattern">Expected pattern alignment shown via caesura markers.</div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          ) : (
            <div className="success-banner">
              {checkingReport.mode === 'mixed'
                ? 'All entered verses passed against at least one selected metre.'
                : 'All entered verses passed against the selected metre.'}
            </div>
          )}
        </section>
      )}

      {totalResult && (
        <section className="panel">
          <div className="panel-header">
            <h2>Total Scansion Mode Result</h2>
            <p>Full scansion overview for every verse.</p>
          </div>

          <div className="pdf-row">
            <button type="button" className="ghost-action" onClick={handlePdf}>Generate Print-Ready PDF</button>
          </div>

          {totalResult.verses.map((verse) => (
            <div className="scan-verse" key={`total-${verse.verse_number}`}>
              <div className="verse-header">
                <span>Verse {verse.verse_number}</span>
                {verse.jati && <span>Jati: {verse.jati}</span>}
                {verse.meter_types?.length ? (
                  <span>Type: {verse.meter_types.map(toTitleCase).join(', ')}</span>
                ) : verse.meter_type ? (
                  <span>Type: {toTitleCase(verse.meter_type)}</span>
                ) : null}
                <span>Metre: {verse.match_found ? verse.meters.join(', ') : 'Unrecognized'}</span>
              </div>

              {verse.lines.map((line) => (
                <div className="scan-line" key={`total-line-${verse.verse_number}-${line.line_number}`}>
                  <p className="original-text">{line.original}</p>
                  <SyllableRow line={line} />
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

    </>
  )
}

export default Statistics
