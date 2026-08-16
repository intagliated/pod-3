import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { PGlite } from '@electric-sql/pglite'

const DatabaseContext = createContext(null)

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  options TEXT,
  required BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ DEFAULT now()
);
`

export function DatabaseProvider({ children }) {
  const [db, setDb] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    async function init() {
      const instance = new PGlite('idb://formflow-db')
      await instance.exec(SCHEMA_SQL)
      if (mounted) {
        setDb(instance)
        setReady(true)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  const query = useCallback(async (sql, params = []) => {
    if (!db) return { rows: [] }
    const result = await db.query(sql, params)
    return { rows: result.rows || [] }
  }, [db])

  const exec = useCallback(async (sql, params = []) => {
    if (!db) return
    await db.query(sql, params)
  }, [db])

  return (
    <DatabaseContext.Provider value={{ db, ready, query, exec }}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  const ctx = useContext(DatabaseContext)
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider')
  return ctx
}
