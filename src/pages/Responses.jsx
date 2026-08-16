import { useEffect, useState, useCallback } from 'react'
import { FileText, Trash2, Inbox } from 'lucide-react'
import { useDatabase } from '../db/DatabaseContext.jsx'

export default function Responses() {
  const { query, exec } = useDatabase()
  const [responses, setResponses] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { rows: qRows } = await query('SELECT * FROM questions ORDER BY position ASC, created_at ASC')
    setQuestions(qRows)
    const { rows: rRows } = await query('SELECT * FROM responses ORDER BY submitted_at DESC')
    setResponses(rRows)
    setLoading(false)
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  const parseAnswers = (r) => {
    if (!r.answers) return {}
    if (typeof r.answers === 'string') {
      try {
        return JSON.parse(r.answers)
      } catch {
        return {}
      }
    }
    return r.answers
  }

  const parseOptions = (q) => {
    if (!q.options) return []
    if (Array.isArray(q.options)) return q.options
    try {
      const p = JSON.parse(q.options)
      return Array.isArray(p) ? p : []
    } catch {
      return []
    }
  }

  const getAnswerDisplay = (q, answer) => {
    if (answer === undefined || answer === null || answer === '') return '—'
    if (q.type === 'checkbox' && Array.isArray(answer)) return answer.join(', ')
    return String(answer)
  }

  const handleDelete = async (id) => {
    await exec('DELETE FROM responses WHERE id = $1', [id])
    setSelected(null)
    load()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (loading) {
    return <p className="text-slate-400 text-sm">Loading...</p>
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Responses</h1>
        <p className="text-slate-500 text-sm">
          {responses.length} response{responses.length !== 1 ? 's' : ''} collected from your form
        </p>
      </div>

      {responses.length === 0 ? (
        <div className="card p-12 text-center">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No responses yet. Share your form link to start collecting responses.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {responses.map((r, i) => {
            const answers = parseAnswers(r)
            const isSelected = selected === r.id
            return (
              <div key={r.id} className="card overflow-hidden">
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setSelected(isSelected ? null : r.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Response #{responses.length - i}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.email || 'Anonymous'} · {formatDate(r.submitted_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {Object.keys(answers).length} answer{Object.keys(answers).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="border-t border-slate-100">
                    <div className="px-5 py-4 space-y-4">
                      {questions.map((q, qi) => {
                        const answer = answers[q.id] ?? answers[qi] ?? answers[q.text]
                        return (
                          <div key={q.id} className="flex gap-4">
                            <div className="w-1/3">
                              <p className="text-xs font-medium text-slate-400">Q{qi + 1}</p>
                              <p className="text-sm text-slate-700">{q.text}</p>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-slate-900">
                                {getAnswerDisplay(q, answer)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="btn-danger text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Response
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
