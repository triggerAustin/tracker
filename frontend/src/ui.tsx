import type { ReactNode } from 'react'
import type { GitState, Stage } from './types'

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'cyan' | 'violet' | 'pink' | 'orange' | 'dim'

// Filled chips and left bars mean status. Outlined panes mean sections.
export const text: Record<Tone, string> = {
  ok: 'text-ok', warn: 'text-warn', bad: 'text-bad', info: 'text-info',
  cyan: 'text-cyan', violet: 'text-violet', pink: 'text-pink', orange: 'text-orange', dim: 'text-dim',
}
const fill: Record<Tone, string> = {
  ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', info: 'bg-info',
  cyan: 'bg-cyan', violet: 'bg-violet', pink: 'bg-pink', orange: 'bg-orange', dim: 'bg-dim',
}
export const edge: Record<Tone, string> = {
  ok: 'border-ok', warn: 'border-warn', bad: 'border-bad', info: 'border-info',
  cyan: 'border-cyan', violet: 'border-violet', pink: 'border-pink', orange: 'border-orange', dim: 'border-dim',
}

export const stageInfo: Record<Stage, { tone: Tone }> = {
  active: { tone: 'ok' },
  new: { tone: 'cyan' },
  planned: { tone: 'dim' },
  paused: { tone: 'violet' },
  shipped: { tone: 'info' },
}

const gitInfo: Record<GitState, { tone: Tone; label: string }> = {
  clean: { tone: 'ok', label: 'clean' },
  uncommitted: { tone: 'warn', label: 'dirty' },
  unpushed: { tone: 'warn', label: 'unpushed' },
  'no-remote': { tone: 'warn', label: 'no remote' },
  'not-a-repo': { tone: 'bad', label: 'no repo' },
}

// A planned project has no folder yet, which is expected, not a problem.
export function gitView(stage: Stage, state: GitState): { tone: Tone; label: string } {
  if (stage === 'planned' && state === 'not-a-repo') return { tone: 'dim', label: 'no folder' }
  return gitInfo[state]
}

export const Chip = ({ tone, children }: { tone: Tone; children: ReactNode }) => (
  <span className={`shrink-0 whitespace-nowrap px-1.5 font-bold text-canvas ${fill[tone]}`}>{children}</span>
)

export function GitTag({ stage, state }: { stage: Stage; state: GitState }) {
  const g = gitView(stage, state)
  return g.tone === 'dim' ? <span className="shrink-0 text-dim">{g.label}</span> : <Chip tone={g.tone}>{g.label}</Chip>
}

export function Pane({
  title,
  tone = 'dim',
  grow = false,
  children,
}: {
  title: string
  tone?: Tone
  grow?: boolean
  children: ReactNode
}) {
  return (
    <div className={grow ? 'flex min-h-24 flex-1 flex-col' : 'mb-2'}>
      <fieldset className={`min-w-0 border px-2 pb-1 ${grow ? 'flex min-h-0 flex-1 flex-col' : 'h-full'} ${edge[tone]}`}>
        <legend className={`px-1 font-bold ${text[tone]}`}>{title}</legend>
        {children}
      </fieldset>
    </div>
  )
}

export function Bar({ done, total, width = 10 }: { done: number; total: number; width?: number }) {
  const f = total === 0 ? 0 : Math.round((done / total) * width)
  return (
    <span>
      <span className="text-ok">{'█'.repeat(f)}</span>
      <span className="text-line">{'░'.repeat(width - f)}</span>{' '}
      <span className="text-dim">
        {done}/{total}
      </span>
    </span>
  )
}

export const btn = 'border border-line px-2 hover:bg-fg hover:text-canvas disabled:opacity-50'
export const input =
  'w-full border-b border-line bg-transparent py-0.5 placeholder:text-dim focus:border-accent focus:outline-none'

export const SECTIONS = ['left off', 'next up', 'goals', 'milestones', 'activity', 'sources', 'readme'] as const
export type Section = (typeof SECTIONS)[number]

export const SECTION_TONE: Record<Section, Tone> = {
  'left off': 'cyan',
  'next up': 'info',
  goals: 'violet',
  milestones: 'pink',
  activity: 'orange',
  sources: 'dim',
  readme: 'dim',
}
