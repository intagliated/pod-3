import { useEffect, useState } from 'react'
import { ClipboardList, CheckCircle2, AlertCircle } from 'lucide-react'
import { useDatabase } from '../db/DatabaseContext.jsx'

export default function FormPage() {
  const { query, exec } = useDatabase()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    async function load() {
      const { rows } = await query('SELECT * FROM questions ORDER BY position ASC, created_at ASC')
      setQuestions(rows)
      setLoading(false)
    }
    load()
  }, [query])

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

  const setAnswer = (id, value) => {
    setAnswers({ ...answers, [id]: value })
  }

  const toggleCheckbox = (id, option) => {
    const current = answers[id] || []
    const arr = Array.isArray(current) ? current : [current]
    if (arr.includes(option)) {
      setAnswer(id, arr.filter((o) => o !== option))
    } else {
      setAnswer(id, [...arr, option])
    }
  }

  const validate = () => {
    for (const q of questions) {
      if (!q.required) continue
      const answer = answers[q.id]
      if (answer === undefined || answer === null || answer === '' ||
          (Array.isArray(answer) && answer.length === 0)) {
        return `Please answer: ${q.text}`
      }
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      const answersMap = {}
      questions.forEach((q) => {
        if (answers[q.id] !== undefined) {
          answersMap[q.id] = answers[q.id]
        }
      })

      await exec(
        'INSERT INTO responses (email, answers) VALUES ($1, $2)',
        [email.trim() || null, JSON.stringify(answersMap)]
      )

      setSubmitted(true)
    } catch (err) {
      setError('Failed to submit form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-sm">Loading form...</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="max-w-md w-full card p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Thank you!</h2>
          <p className="text-slate-500 text-sm">Your response has been recorded successfully.</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
        <div className="max-w-md w-full card p-8 text-center">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">No questions yet</h2>
          <p className="text-slate-500 text-sm">This form hasn't been set up yet. Please check back later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Survey Form</h1>
          <p className="text-slate-500 text-sm">Please take a moment to fill out this form</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Your Email <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="input"
            />
          </div>

          {questions.map((q, i) => {
            const opts = parseOptions(q)
            return (
              <div key={q.id}>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  <span className="text-slate-400 mr-1">{i + 1}.</span>
                  {q.text}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {q.type === 'text' && (
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="input"
                  />
                )}

                {q.type === 'paragraph' && (
                  <textarea
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    rows={3}
                    className="input"
                  />
                )}

                {q.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {opts.map((opt) => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswer(q.id, opt)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'checkbox' && (
                  <div className="space-y-2">
                    {opts.map((opt) => {
                      const arr = Array.isArray(answers[q.id]) ? answers[q.id] : []
                      return (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={arr.includes(opt)}
                            onChange={() => toggleCheckbox(q.id, opt)}
                            className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-slate-700">{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {q.type === 'dropdown' && (
                  <select
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="input"
                  >
                    <option value="">Select an option...</option>
                    {opts.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {q.type === 'scale' && (
                  <div className="flex items-center justify-between px-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} className="flex flex-col items-center cursor-pointer">
                        <span className="text-xs text-slate-500 mb-1">{n}</span>
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={n}
                          checked={answers[q.id] === String(n) || answers[q.id] === n}
                          onChange={() => setAnswer(q.id, n)}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'date' && (
                  <input
                    type="date"
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="input"
                  />
                )}

                {q.type === 'time' && (
                  <input
                    type="time"
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    className="input"
                  />
                )}
              </div>
            )
          })}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full justify-center py-3"
            >
              {submitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
