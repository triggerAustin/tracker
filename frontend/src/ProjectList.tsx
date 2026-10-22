import type { RefObject } from 'react'
import type { Project } from './types'
import { needsAttention, timeShort } from './format'
import { GitTag, edge, input, stageInfo } from './ui'

export default function ProjectList({
  rows,
  selected,
  onSelect,
  query,
  onQuery,
  filter,
  searchRef,
}: {
  rows: Project[]
  selected: string | null
  onSelect: (slug: string) => void
  query: string
  onQuery: (q: string) => void
  filter: string
  searchRef: RefObject<HTMLInputElement | null>
}) {
  return (
    <nav className="flex max-h-48 min-h-0 flex-col border-line md:max-h-none md:border-r">
      <div className="flex gap-2 border-b border-line px-2 py-0.5">
        <span className="text-dim">s</span>
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="search"
          aria-label="Search projects"
          className={input}
        />
        <span className="shrink-0 font-bold text-cyan">{filter === 'attention' ? 'needs attention' : filter}</span>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {rows.map((p, i) => {
          const attn = needsAttention(p)
          const head = i === 0 || attn !== needsAttention(rows[i - 1])
          const on = p.slug === selected
          return (
            <li key={p.slug}>
              {head && (
                <div className={`px-2 pt-1 font-bold ${attn ? 'text-warn' : 'text-ok'}`}>
                  {attn ? 'needs attention' : 'ok'}
                </div>
              )}
              <button
                onClick={() => onSelect(p.slug)}
                aria-current={on}
                className={`flex w-full items-center gap-2 border-l-4 px-2 py-px text-left ${edge[stageInfo[p.stage].tone]} ${
                  on ? 'bg-panel font-bold' : 'hover:bg-panel'
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{p.title}</span>
                {p.git.state === 'clean' ? (
                  <span className="shrink-0 text-ok">✓</span>
                ) : (
                  <GitTag stage={p.stage} state={p.git.state} />
                )}
                <span
                  className={`w-10 shrink-0 text-right tabular-nums ${p.hoursThisWeek > 0 ? 'text-cyan' : 'text-dim'}`}
                >
                  {p.hoursThisWeek.toFixed(1)}h
                </span>
                <span className="w-8 shrink-0 text-right text-dim">{timeShort(p.lastActive)}</span>
              </button>
            </li>
          )
        })}
        {rows.length === 0 && <li className="px-2 py-2 text-dim">no projects match</li>}
      </ul>
    </nav>
  )
}
