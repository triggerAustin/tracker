import { useCallback, useEffect, useState } from 'react'
import type { FormEvent, ReactNode, RefObject } from 'react'
import { api } from './api'
import type { ProjectDetail as Detail } from './types'
import { dueLabel, dueTone, timeAgo } from './format'
import { Bar, Chip, GitTag, Pane, SECTION_TONE, input, stageInfo } from './ui'
import type { Section } from './ui'

const none = (t: string) => <p className="text-dim">{t}</p>
const take = <T,>(arr: T[], cap: number, full: boolean) => (full ? arr : arr.slice(0, cap))

// How many items each pane shows before offering /more, scaled to window height
// so the dashboard always fits without scrolling.
function useCaps() {
  const [h, setH] = useState(window.innerHeight)
  useEffect(() => {
    const on = () => setH(window.innerHeight)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  if (h >= 900) return { files: 4, next: 5, goals: 5, milestones: 3, activity: 6, sources: 4 }
  if (h >= 760) return { files: 3, next: 4, goals: 4, milestones: 2, activity: 4, sources: 2 }
  return { files: 2, next: 3, goals: 3, milestones: 2, activity: 4, sources: 2 }
}

export default function ProjectDetail({
  slug,
  goalRef,
  expanded,
  onExpand,
  onBack,
}: {
  slug: string
  goalRef: RefObject<HTMLInputElement | null>
  expanded: Section | null
  onExpand: (s: Section) => void
  onBack: () => void
}) {
  const [d, setD] = useState<Detail | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [text, setText] = useState('')
  const caps = useCaps()

  const load = useCallback(() => {
    api
      .getProject(slug)
      .then((x) => {
        setD(x)
        setErr(null)
      })
      .catch((e: unknown) => setErr(String(e)))
  }, [slug])

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [load])

  async function addGoal(e: FormEvent) {
    e.preventDefault()
    const v = text.trim()
    if (!v) return
    await api.addGoal(slug, v)
    setText('')
    load()
  }

  async function toggle(id: string) {
    await api.toggleGoal(slug, id)
    load()
  }

  if (err) return <p className="p-2 text-bad">couldn’t load project: {err}</p>
  if (!d || d.slug !== slug) return <p className="p-2 text-dim">loading…</p>

  const l = d.leftOff
  const goals = [...d.goals].sort((a, b) => Number(a.done) - Number(b.done))

  const hint = (name: Section, total: number, cap: number) =>
    total > cap && (
      <button onClick={() => onExpand(name)} className="text-dim hover:text-fg">
        +{total - cap} more, /more {name.split(' ')[0]}
      </button>
    )

  // Pane contents. full=false is the dashboard (single lines, capped); full=true is expanded.
  const body = (name: Section, full: boolean): ReactNode => {
    const t = full ? 'break-words' : 'truncate'
    switch (name) {
      case 'left off':
        return l ? (
          <>
            <p className={`font-bold ${t}`}>{l.summary}</p>
            <p className={`text-dim ${t}`}>
              last commit: <span className="text-fg">{l.lastCommit}</span>
            </p>
            {take(l.uncommitted, caps.files, full).map((f) => (
              <div key={f} className={`text-warn ${t}`}>
                ± {f}
              </div>
            ))}
            {!full && hint(name, l.uncommitted.length, caps.files)}
          </>
        ) : (
          none('no activity yet. work in the project folder and this fills in.')
        )
      case 'next up':
        return (
          <>
            {d.next.length === 0 && none('nothing queued. add a checklist to the README.')}
            {take(d.next, caps.next, full).map((i) => (
              <div key={i.id} className="flex gap-2">
                <span className={i.status === 'doing' ? 'font-bold text-ok' : 'text-dim'}>
                  {i.status === 'doing' ? '▶' : '-'}
                </span>
                <span className={`min-w-0 ${t}`}>{i.title}</span>
                <span className="ml-auto shrink-0 text-dim">{i.source}</span>
              </div>
            ))}
            {!full && hint(name, d.next.length, caps.next)}
          </>
        )
      case 'goals':
        return (
          <>
            <form onSubmit={addGoal} className="flex gap-2">
              <span className="text-violet">+</span>
              <input
                ref={goalRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="finish login by friday"
                aria-label="New goal"
                className={input}
              />
            </form>
            {goals.length === 0 && none('no goals. type one and press enter.')}
            {take(goals, caps.goals, full).map((x) => (
              <button
                key={x.id}
                role="checkbox"
                aria-checked={x.done}
                onClick={() => toggle(x.id)}
                className="flex w-full gap-2 text-left hover:bg-panel"
              >
                <span className={x.done ? 'text-ok' : 'text-violet'}>{x.done ? '[x]' : '[ ]'}</span>
                <span className={`min-w-0 ${x.done ? 'text-dim line-through' : ''} ${t}`}>{x.title}</span>
                {!x.done && <span className={`ml-auto shrink-0 ${dueTone(x.due)}`}>{dueLabel(x.due)}</span>}
              </button>
            ))}
            {!full && hint(name, goals.length, caps.goals)}
          </>
        )
      case 'milestones':
        return (
          <>
            {d.milestones.length === 0 && none('none set.')}
            {take(d.milestones, caps.milestones, full).map((m) => (
              <div key={m.id}>
                <p className={t}>{m.title}</p>
                <p>
                  <Bar done={m.done} total={m.total} /> <span className={dueTone(m.due)}>{dueLabel(m.due)}</span>
                </p>
              </div>
            ))}
            {!full && hint(name, d.milestones.length, caps.milestones)}
          </>
        )
      case 'activity': {
        const rows = caps.activity > 4 ? 'md:grid-rows-3' : 'md:grid-rows-2'
        const items = take(d.activity, caps.activity, full).map((a) => (
          <div key={a.id} className="flex gap-3">
            <span className="w-16 shrink-0 whitespace-nowrap text-orange">{timeAgo(a.at)}</span>
            <span className={`min-w-0 ${t}`}>{a.text}</span>
          </div>
        ))
        return (
          <>
            {d.activity.length === 0 && none('no work recorded yet.')}
            {full ? <div>{items}</div> : <div className={`grid gap-x-6 md:grid-flow-col ${rows}`}>{items}</div>}
            {!full && hint(name, d.activity.length, caps.activity)}
          </>
        )
      }
      case 'sources': {
        const items = take(d.sources, caps.sources, full).map((x) => (
          <div key={x.name} className="flex gap-2">
            <span className="w-28 shrink-0 whitespace-nowrap text-dim">{x.name}</span>
            <span className={`min-w-0 ${t}`}>{x.detail}</span>
            <span className="ml-auto shrink-0 whitespace-nowrap text-dim">
              {x.syncedAt ? timeAgo(x.syncedAt) : 'not synced'}
            </span>
          </div>
        ))
        return (
          <>
            {d.sources.length === 0 && none('not linked to a folder or repo.')}
            <div className={full ? '' : 'grid gap-x-6 md:grid-cols-2'}>{items}</div>
            {!full && hint(name, d.sources.length, caps.sources)}
          </>
        )
      }
      case 'readme':
        return d.readme ? (
          <div className="whitespace-pre-wrap">
            {d.readme.split('\n').map((ln, i) => (
              <div key={i} className={ln.startsWith('#') ? 'font-bold text-cyan' : 'text-dim'}>
                {ln || '\u00a0'}
              </div>
            ))}
          </div>
        ) : (
          none('no README in the project folder.')
        )
    }
  }

  if (expanded) {
    return (
      <div className="flex h-full flex-col p-2">
        <p className="mb-2 flex gap-2 text-dim">
          <b className="text-fg">{d.title}</b>
          <span>/ {expanded}</span>
          <button onClick={onBack} className="ml-auto hover:text-fg">
            esc back
          </button>
        </p>
        <Pane title={expanded} tone={SECTION_TONE[expanded]} grow>
          <div className="min-h-0 flex-1 overflow-auto">{body(expanded, true)}</div>
        </Pane>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-auto p-2">
      <div className="shrink-0">
        <header className="mb-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-base font-bold">{d.title}</h1>
            <Chip tone={stageInfo[d.stage].tone}>{d.stage}</Chip>
            <GitTag stage={d.stage} state={d.git.state} />
            {d.git.branch && <span className="text-cyan">{d.git.branch}</span>}
            <span className="text-dim">
              {d.hoursThisWeek.toFixed(1)}h this week, active {timeAgo(d.lastActive)}
            </span>
          </div>
          <p className="truncate text-dim">{d.goal}</p>
        </header>

        <div className="grid gap-x-2 md:grid-cols-2">
          <Pane title="left off" tone="cyan">
            {body('left off', false)}
          </Pane>
          <Pane title="next up" tone="info">
            {body('next up', false)}
          </Pane>
        </div>

        <div className="grid gap-x-2 md:grid-cols-2">
          <Pane title="goals" tone="violet">
            {body('goals', false)}
          </Pane>
          <Pane title="milestones" tone="pink">
            {body('milestones', false)}
          </Pane>
        </div>

        <Pane title="activity" tone="orange">
          {body('activity', false)}
        </Pane>

        <Pane title="sources">{body('sources', false)}</Pane>
      </div>

      <Pane title="readme" grow>
        <div className="min-h-0 flex-1 overflow-auto">{body('readme', false)}</div>
      </Pane>
    </div>
  )
}
