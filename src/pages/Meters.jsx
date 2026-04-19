import { useMemo } from 'react'
import { METER_ENTRIES } from '../data/meters'

const Meters = () => {
  const meterEntries = useMemo(() => METER_ENTRIES, [])

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>List of Meters</h2>
        <p>Reference catalog for samavrtta, ardhasamavrtta, and visamavrtta patterns.</p>
      </div>
      <div className="legend-text">
        Scansion symbols: <strong>।</strong> = Laghu, <strong>ऽ</strong> = Guru, <strong>x</strong> = Anceps,{' '}
        <strong>|</strong> = Caesura.
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Jati / Group</th>
              <th>Syllables</th>
              <th>Meter</th>
              <th>Scansion</th>
            </tr>
          </thead>
          <tbody>
            {meterEntries.map((meter) => (
              <tr key={meter.id}>
                <td className="kind">{meter.kind}</td>
                <td>{meter.jati || '-'}</td>
                <td>{meter.syllableCount || '-'}</td>
                <td className="name">{meter.name}</td>
                <td>
                  <div className="scansion-box">
                    {meter.scansionLines.map((line, idx) => (
                      <div className="scan-line" key={`${meter.id}-${idx}`}>{line}</div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="panel panel-tight sub-panel">
        <h3 className="section-title">Anuṣṭup-Type Ardhasamavrtta Definitions</h3>
        {meterEntries
          .filter((meter) =>
            ['śloka', 'vipulā a', 'vipulā b', 'vipulā c', 'vipulā d'].includes(
              String(meter.name).trim().toLowerCase()
            )
          )
          .map((meter) => (
            <div className="definition-row" key={`def-${meter.id}`}>
              <strong>{meter.name}</strong>:{' '}
              {meter.scansionLines.map((line, idx) => (
                <span className="pattern-line" key={`${meter.id}-line-${idx}`}>
                  {line}{idx < meter.scansionLines.length - 1 ? ' / ' : ''}
                </span>
              ))}
            </div>
          ))}
      </section>
    </section>
  )
}

export default Meters
