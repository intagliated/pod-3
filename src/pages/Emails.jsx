import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Mail, Check, Upload } from 'lucide-react'
import { useDatabase } from '../db/DatabaseContext.jsx'

export default function Emails() {
  const { query, exec } = useDatabase()
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { rows } = await query('SELECT * FROM emails ORDER BY created_at DESC')
    setEmails(rows)
    setLoading(false)
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleAdd = async (e) => {
    e.preventDefault()
    setError('')
    const email = newEmail.trim().toLowerCase()
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }
    try {
      await exec('INSERT INTO emails (email) VALUES ($1) ON CONFLICT (email) DO NOTHING', [email])
      setNewEmail('')
      load()
    } catch (err) {
      setError('Failed to add email')
    }
  }

  const handleBulkAdd = async () => {
    setError('')
    const lines = bulkText
      .split(/[\n,]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
    const valid = lines.filter(isValidEmail)
    const invalid = lines.filter((l) => !isValidEmail(l))

    if (valid.length === 0) {
      setError('No valid email addresses found')
      return
    }

    for (const email of valid) {
      try {
        await exec('INSERT INTO emails (email) VALUES ($1) ON CONFLICT (email) DO NOTHING', [email])
      } catch {
        // ignore duplicates
      }
    }

    setBulkText('')
    setShowBulk(false)
    load()

    if (invalid.length > 0) {
      setError(`${invalid.length} invalid email(s) were skipped`)
    }
  }

  const handleDelete = async (id) => {
    await exec('DELETE FROM emails WHERE id = $1', [id])
    load()
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Email Recipients</h1>
          <p className="text-slate-500 text-sm">Manage the email addresses to send your form to</p>
        </div>
        <button onClick={() => setShowBulk(!showBulk)} className="btn-secondary">
          <Upload className="w-4 h-4" />
          Bulk Add
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleAdd} className="card p-4 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="email@example.com"
            className="input"
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </form>

      {showBulk && (
        <div className="card p-4 mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Paste emails (one per line or comma-separated)
          </label>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'email1@example.com\nemail2@example.com\nemail3@example.com'}
            rows={6}
            className="input font-mono text-sm"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handleBulkAdd} className="btn-primary">
              Add All
            </button>
            <button onClick={() => setShowBulk(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : emails.length === 0 ? (
        <div className="card p-12 text-center">
          <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No email addresses yet. Add recipients above.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <p className="text-sm font-medium text-slate-700">
              {emails.length} recipient{emails.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {emails.map((e) => (
              <div key={e.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-sm text-slate-900">{e.email}</span>
                  {e.sent && (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                      <Check className="w-3 h-3" />
                      Sent
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
