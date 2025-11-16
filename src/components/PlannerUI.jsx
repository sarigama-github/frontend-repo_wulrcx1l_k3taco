import { useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function DayPicker({ value, onChange }) {
  return (
    <input
      type="date"
      className="border rounded px-3 py-2"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function Section({ title, children, right }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

function BlockItem({ b, onExtend, onShift }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div>
        <div className="font-medium text-gray-800">{b.title}</div>
        <div className="text-xs text-gray-500">
          {formatTime(b.start_iso)} – {formatTime(b.end_iso)} • {b.duration_minutes} Min • {b.category || 'Allgemein'} {b.fixed ? '• fest' : ''}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onShift(b, -15)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">-15m</button>
        <button onClick={() => onShift(b, 15)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">+15m</button>
        <button onClick={() => onExtend(b, 15)} className="px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded">verlängern +15m</button>
      </div>
    </div>
  )
}

export default function PlannerUI() {
  const [text, setText] = useState('Ich muss heute Ads erstellen.')
  const [priority, setPriority] = useState(3)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [blocks, setBlocks] = useState([])
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [nlpText, setNlpText] = useState('Plane 2 Stunden Lernen ein.')
  const [message, setMessage] = useState('')

  const fetchBlocks = async () => {
    const res = await fetch(`${API}/api/blocks?date=${date}`)
    const data = await res.json()
    setBlocks(data)
  }

  useEffect(() => {
    fetchBlocks()
  }, [date])

  const handlePreview = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${API}/api/notes/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, priority: Number(priority) || undefined })
      })
      const data = await res.json()
      setPreview(data)
    } catch (e) {
      setMessage('Fehler bei der Vorschau.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!preview) return
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${API}/api/notes/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: preview.steps,
          blocks: preview.suggested_blocks,
          category: preview.suggested_blocks?.[0]?.category,
          note_text: text,
        })
      })
      const data = await res.json()
      setPreview(null)
      await fetchBlocks()
      setMessage('Plan gespeichert.')
    } catch (e) {
      setMessage('Fehler beim Speichern.')
    } finally {
      setLoading(false)
    }
  }

  const handleNlpPlan = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${API}/api/nlp/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlpText })
      })
      const data = await res.json()
      setPreview(data)
    } catch (e) {
      setMessage('Fehler bei der NLP-Planung.')
    } finally {
      setLoading(false)
    }
  }

  const adjustBlock = async (b, deltaStartMin = 0, extendMin = 0) => {
    const newStart = new Date(b.start_iso)
    const newEnd = new Date(b.end_iso)
    if (deltaStartMin) {
      newStart.setMinutes(newStart.getMinutes() + deltaStartMin)
      newEnd.setMinutes(newEnd.getMinutes() + deltaStartMin)
    }
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${API}/api/blocks/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_id: b._id || b.id || '',
          new_start_iso: deltaStartMin ? newStart.toISOString() : undefined,
          new_end_iso: deltaStartMin ? newEnd.toISOString() : undefined,
          extend_minutes: extendMin || undefined,
        })
      })
      await res.json()
      await fetchBlocks()
      setMessage('Plan aktualisiert.')
    } catch (e) {
      setMessage('Fehler bei der Anpassung.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Intelligenter Kalender</h2>
        <div className="flex items-center gap-3">
          <DayPicker value={date} onChange={setDate} />
          <button onClick={fetchBlocks} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded">Aktualisieren</button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">{message}</div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Section title="Intelligente Notiz">
          <div className="space-y-3">
            <textarea
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Kurze Notiz oder Idee eingeben"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Priorität</label>
              <input type="number" min="1" max="5" className="w-20 border rounded p-2" value={priority} onChange={(e) => setPriority(e.target.value)} />
              <button onClick={handlePreview} disabled={loading} className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                Vorschau erstellen
              </button>
            </div>
          </div>
        </Section>

        <Section title="Natürliche Sprache">
          <div className="space-y-3">
            <input
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={nlpText}
              onChange={(e) => setNlpText(e.target.value)}
              placeholder="z.B. 'Verschiebe Sport auf 18 Uhr'"
            />
            <button onClick={handleNlpPlan} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
              Automatisch planen
            </button>
          </div>
        </Section>
      </div>

      {preview && (
        <Section
          title="Vorschau"
          right={
            <div className="flex gap-2">
              <button onClick={() => setPreview(null)} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded">Verwerfen</button>
              <button onClick={handleConfirm} className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded">Bestätigen</button>
            </div>
          }
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Schritte</h4>
              <ul className="space-y-2">
                {preview.steps.map((s, i) => (
                  <li key={i} className="p-3 border rounded">
                    <div className="font-medium text-gray-800">{s.title}</div>
                    <div className="text-xs text-gray-500">Dauer: {s.duration_minutes} Min {s.priority ? `• Priorität ${s.priority}` : ''}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Vorgeschlagene Blöcke</h4>
              <ul className="space-y-2">
                {preview.suggested_blocks.map((b, i) => (
                  <li key={i} className="p-3 border rounded">
                    <div className="font-medium text-gray-800">{b.title}</div>
                    <div className="text-xs text-gray-500">{formatTime(b.start_iso)} – {formatTime(b.end_iso)} • {b.duration_minutes} Min • {b.category || 'Allgemein'}</div>
                  </li>
                ))}
              </ul>
              {preview.conflicts?.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded text-sm">
                  <div className="font-semibold mb-1">Konflikte:</div>
                  <ul className="list-disc ml-5">
                    {preview.conflicts.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      <Section title="Tagesplan">
        {blocks.length === 0 ? (
          <div className="text-gray-500 text-sm">Keine Blöcke für diesen Tag.</div>
        ) : (
          <div className="divide-y">
            {blocks.map((b) => (
              <BlockItem
                key={b._id}
                b={b}
                onExtend={(block, minutes) => adjustBlock(block, 0, minutes)}
                onShift={(block, minutes) => adjustBlock(block, minutes, 0)}
              />
            ))}
          </div>
        )}
      </Section>

      {loading && <div className="text-sm text-gray-500">Bitte warten…</div>}
    </div>
  )
}
