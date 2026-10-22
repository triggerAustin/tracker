import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { api, isMock } from './api'
import type { NewProject, Project } from './types'
import { needsAttention } from './format'
import ProjectList from './ProjectList'
import ProjectDetail from './ProjectDetail'
import NewProjectModal from './NewProjectModal'
import { SECTIONS, btn, stageInfo, text } from './ui'
import type { Section } from './ui'

const filters = ['all', 'attention', 'active', 'new', 'planned', 'paused', 'shipped'] as const
type Filter = (typeof filters)[number]

const Key = ({ k, children }: { k: string; children: string }) => (
  <span>
    <b className="text-fg">{k}</b> {children}
  </span>
)

export default function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Section | null>(null)
  const [cmdText, setCmdText] = useState('')
  const [cmdMsg, setCmdMsg] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const goalRef = useRef<HTMLInputElement>(null)
  const cmdRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(
    () =>
      api
        .listProjects()
        .then((list) => {
          setProjects(list)
          setError(null)
        })
        .catch((e: unknown) => setError(String(e))),
    [],
  )

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 15000)
    return () => clearInterval(t)
  }, [refresh])

  // Projects needing attention come first, then most recently active.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects
      .filter((p) => (filter === 'all' ? true : filter === 'attention' ? needsAttention(p) : p.stage === filter))
      .filter((p) => !q || `${p.title} ${p.goal} ${p.tags.join(' ')}`.toLowerCase().includes(q))
      .sort(
        (a, b) =>
          Number(needsAttention(b)) - Number(needsAttention(a)) ||
          (b.lastActive ?? '').localeCompare(a.lastActive ?? ''),
      )
  }, [projects, query, filter])

  const current = rows.find((p) => p.slug === selected) ?? rows[0] ?? null

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          el.blur()
          if (el === cmdRef.current) {
            setCmdText('')
            setCmdMsg(null)
          }
        }
        return
      }
      if (creating || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') {
        setExpanded(null)
        return
      }
      const i = rows.findIndex((p) => p.slug === current?.slug)
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected(rows[Math.min(rows.length - 1, i + 1)]?.slug ?? null)
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected(rows[Math.max(0, i - 1)]?.slug ?? null)
      } else if (e.key === 'f') setFilter((f) => filters[(filters.indexOf(f) + 1) % filters.length])
      else if (e.key === 'n') {
        e.preventDefault()
        setCreating(true)
      } else if (e.key === 's') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === '/') {
        e.preventDefault()
        setCmdText('/')
        cmdRef.current?.focus()
      } else if (e.key === 'a') {
        e.preventDefault()
        goalRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rows, current, creating])

  function run(e: FormEvent) {
    e.preventDefault()
    const [cmd = '', ...rest] = cmdText.trim().replace(/^\//, '').trim().split(/\s+/)
    const arg = rest.join(' ').toLowerCase()
    if (cmd === '') {
      cmdRef.current?.blur()
      return
    }
    if (cmd === 'back' || cmd === 'b') {
      setExpanded(null)
    } else if (cmd === 'more' || cmd === 'm') {
      const hit = SECTIONS.find((s) => arg !== '' && s.startsWith(arg))
      if (!hit) {
        setCmdMsg(`no section "${arg}". sections: ${SECTIONS.join(', ')}`)
        return
      }
      setExpanded(hit)
    } else {
      setCmdMsg(`unknown command "${cmd}". try /more <section> or /back`)
      return
    }
    setCmdText('')
    setCmdMsg(null)
    cmdRef.current?.blur()
  }

  async function create(input: NewProject) {
    const p = await api.createProject(input)
    setFilter('all')
    setQuery('')
    await refresh()
    setSelected(p.slug)
    setCreating(false)
  }

  const active = projects.filter((p) => p.stage === 'active').length
  const hours = projects.reduce((s, p) => s + p.hoursThisWeek, 0).toFixed(1)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b border-line px-3 py-1">
        <span className="font-bold text-accent">tracker</span>
        <span className="text-dim">
          <b className="text-fg">{projects.length}</b> projects
        </span>
        <span className="text-dim">
          <b className="text-ok">{active}</b> active
        </span>
        <span className="text-dim">
          <b className="text-warn">{projects.filter(needsAttention).length}</b> need attention
        </span>
        <span className="text-dim">
          <b className="text-cyan">{hours}</b>h this week
        </span>
        <button onClick={() => setCreating(true)} className={`${btn} ml-auto`}>
          n new project
        </button>
      </header>

      {error && (
        <p role="alert" className="border-b border-line px-3 py-1 text-bad">
          couldn’t load projects: {error}. is the backend running?
        </p>
      )}

      <main className="grid min-h-0 flex-1 grid-rows-[auto_1fr] md:grid-cols-[minmax(34ch,44ch)_1fr] md:grid-rows-1">
        <ProjectList
          rows={rows}
          selected={current?.slug ?? null}
          onSelect={setSelected}
          query={query}
          onQuery={setQuery}
          filter={filter}
          searchRef={searchRef}
        />
        <section className="min-h-0 min-w-0">
          {current ? (
            <ProjectDetail
              slug={current.slug}
              goalRef={goalRef}
              expanded={expanded}
              onExpand={setExpanded}
              onBack={() => setExpanded(null)}
            />
          ) : (
            <p className="p-3 text-dim">nothing selected. press n to create a project.</p>
          )}
        </section>
      </main>

      <footer className="flex flex-wrap items-center gap-x-4 border-t border-line px-3 py-1 text-dim">
        <form onSubmit={run}>
          <input
            ref={cmdRef}
            value={cmdText}
            onChange={(e) => {
              setCmdText(e.target.value)
              setCmdMsg(null)
            }}
            placeholder="/more <section>"
            aria-label="Command"
            className="w-44 border-b border-line bg-transparent text-fg placeholder:text-dim focus:border-accent focus:outline-none"
          />
        </form>
        {cmdMsg && <span className="text-bad">{cmdMsg}</span>}
        <Key k="j/k">move</Key>
        <Key k="s">search</Key>
        <Key k="/">command</Key>
        <Key k="f">filter</Key>
        <Key k="a">add goal</Key>
        <Key k="n">new</Key>
        <Key k="esc">back</Key>
        <span className="ml-auto flex gap-3">
          {Object.entries(stageInfo).map(([k, v]) => (
            <span key={k} className={text[v.tone]}>
              ▌{k}
            </span>
          ))}
          {isMock && <span className="text-warn">mock data</span>}
        </span>
      </footer>

      {creating && <NewProjectModal onCreate={create} onClose={() => setCreating(false)} />}
    </div>
  )
}
