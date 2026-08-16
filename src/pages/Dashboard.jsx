import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListChecks, Mail, FileText, ArrowRight, ExternalLink, Copy, Check } from 'lucide-react'
import { useDatabase } from '../db/DatabaseContext.jsx'

export default function Dashboard() {
  const { query } = useDatabase()
  const [stats, setStats] = useState({ questions: 0, emails: 0, responses: 0, sent: 0 })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const q = await query('SELECT COUNT(*) as count FROM questions')
      const e = await query('SELECT COUNT(*) as count FROM emails')
      const r = await query('SELECT COUNT(*) as count FROM responses')
      const s = await query("SELECT COUNT(*) as count FROM emails WHERE sent = true")
      setStats({
        questions: q.rows[0]?.count || 0,
        emails: e.rows[0]?.count || 0,
        responses: r.rows[0]?.count || 0,
        sent: s.rows[0]?.count || 0,
      })
    }
    load()
  }, [query])

  const formUrl = `${window.location.origin}/form`

  const copyLink = () => {
    navigator.clipboard.writeText(formUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cards = [
    {
      label: 'Questions',
      value: stats.questions,
      icon: ListChecks,
      to: '/questions',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Email Recipients',
      value: stats.emails,
      icon: Mail,
      to: '/emails',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Responses',
      value: stats.responses,
      icon: FileText,
      to: '/responses',
      color: 'bg-emerald-50 text-emerald-600',
    },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Dashboard</h1>
        <p className="text-slate-500 text-sm">Overview of your survey form automation</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              to={card.to}
              className="card p-5 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </Link>
          )
        })}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Public Form Link</h2>
        <p className="text-sm text-slate-500 mb-4">
          Share this link with respondents. Anyone who opens it can fill out your form.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 font-mono truncate">
            {formUrl}
          </div>
          <button onClick={copyLink} className="btn-secondary">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <a href="/form" target="_blank" rel="noreferrer" className="btn-primary">
            <ExternalLink className="w-4 h-4" />
            Open
          </a>
        </div>
      </div>

      {stats.questions === 0 && (
        <div className="mt-6 card p-6 border-blue-200 bg-blue-50/50">
          <h3 className="font-semibold text-slate-900 mb-1">Get started</h3>
          <p className="text-sm text-slate-600 mb-3">
            You haven't added any questions yet. Add questions to build your form, then add emails and share the form link.
          </p>
          <Link to="/questions" className="btn-primary">
            <ListChecks className="w-4 h-4" />
            Add Questions
          </Link>
        </div>
      )}
    </div>
  )
}
