import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { useDatabase } from '../db/DatabaseContext.jsx'

const QUESTION_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'scale', label: 'Linear Scale (1-5)' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
]

const TYPES_WITH_OPTIONS = ['multiple_choice', 'checkbox', 'dropdown']

export default function Questions() {
  const { query, exec } = useDatabase()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    text: '',
    type: 'text',
    options: '',
    required: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    const { rows } = await query('SELECT * FROM questions ORDER BY position ASC, created_at ASC')
    setQuestions(rows)
    setLoading(false)
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setForm({ text: '', type: 'text', options: '', required: true })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.text.trim()) return

    const optionsArr = TYPES_WITH_OPTIONS.includes(form.type) && form.options.trim()
      ? form.options.split(',').map((o) => o.trim()).filter(Boolean)
      : []

    if (editingId) {
      await exec(
        'UPDATE questions SET text = $1, type = $2, options = $3, required = $4 WHERE id = $5',
        [form.text.trim(), form.type, JSON.stringify(optionsArr), form.required, editingId]
      )
    } else {
      const maxPos = questions.length > 0 ? Math.max(...questions.map((q) => q.position || 0)) : 0
      await exec(
        'INSERT INTO questions (text, type, options, required, position) VALUES ($1, $2, $3, $4, $5)',
        [form.text.trim(), form.type, JSON.stringify(optionsArr), form.required, maxPos + 1]
      )
    }
    resetForm()
    load()
  }

  const handleEdit = (q) => {
    setEditingId(q.id)
    setForm({
      text: q.text,
      type: q.type,
      options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options).join(', ') : q.options.join(', ')) : '',
      required: q.required,
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    await exec('DELETE FROM questions WHERE id = $1', [id])
    load()
  }

  const moveQuestion = async (index, direction) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= questions.length) return
    const a = questions[index]
    const b = questions[newIndex]
    await exec('UPDATE questions SET position = $1 WHERE id = $2', [b.position, a.id])
    await exec('UPDATE questions SET position = $1 WHERE id = $2', [a.position, b.id])
    load()
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

  const typeLabel = (type) => QUESTION_TYPES.find((t) => t.value === type)?.label || type

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Questions</h1>
          <p className="text-slate-500 text-sm">Build your form by adding questions</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {editingId ? 'Edit Question' : 'New Question'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Question Text</label>
              <input
                type="text"
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="e.g. What is your name?"
                className="input"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Question Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {TYPES_WITH_OPTIONS.includes(form.type) && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Options (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.options}
                  onChange={(e) => setForm({ ...form, options: e.target.value })}
                  placeholder="Option 1, Option 2, Option 3"
                  className="input"
                />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.required}
                onChange={(e) => setForm({ ...form, required: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-700">Required question</span>
            </label>
          </div>
          <div className="flex gap-2 mt-5">
            <button type="submit" className="btn-primary">
              {editingId ? 'Save Changes' : 'Add Question'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : questions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 text-sm mb-4">No questions yet. Add your first question to get started.</p>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, index) => {
            const opts = parseOptions(q)
            return (
              <div key={q.id} className="card p-4 flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    onClick={() => moveQuestion(index, -1)}
                    disabled={index === 0}
                    className="text-slate-300 hover:text-slate-600 disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <GripVertical className="w-4 h-4 text-slate-200" />
                  <button
                    onClick={() => moveQuestion(index, 1)}
                    disabled={index === questions.length - 1}
                    className="text-slate-300 hover:text-slate-600 disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-slate-400">Q{index + 1}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {typeLabel(q.type)}
                    </span>
                    {q.required && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">Required</span>
                    )}
                  </div>
                  <p className="text-slate-900 font-medium mb-1">{q.text}</p>
                  {opts.length > 0 && (
                    <p className="text-sm text-slate-500">
                      Options: {opts.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(q)} className="btn-secondary px-3 py-1.5 text-xs">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="btn-danger px-3 py-1.5 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
