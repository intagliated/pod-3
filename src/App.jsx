import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Questions from './pages/Questions.jsx'
import Emails from './pages/Emails.jsx'
import ResponsesPage from './pages/Responses.jsx'
import FormPage from './pages/FormPage.jsx'
import { useDatabase } from './db/DatabaseContext.jsx'

export default function App() {
  const { ready } = useDatabase()

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-sm">Loading database...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/form" element={<FormPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/questions" element={<Questions />} />
        <Route path="/emails" element={<Emails />} />
        <Route path="/responses" element={<ResponsesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
