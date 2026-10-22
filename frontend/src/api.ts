import type { NewProject, Project, ProjectDetail } from './types'

// Set to false once the Rust backend serves /api.
const MOCK = true
export const isMock = MOCK

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()
const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString()

const blank = {
  description: '',
  readme: '',
  leftOff: null,
  next: [],
  activity: [],
  sources: [],
  milestones: [],
  goals: [],
}

const db: ProjectDetail[] = [
  {
    ...blank,
    slug: 'project-tracker',
    title: 'Project Tracker',
    goal: 'One place for the state of every project',
    stage: 'active',
    tags: ['rust', 'react'],
    lastActive: ago(2),
    hoursThisWeek: 11.5,
    git: { state: 'uncommitted', branch: 'main' },
    progress: { done: 4, total: 12 },
    description: 'Local, always-on tracker for all my projects.',
    readme: '# Project Tracker\n\nA local daemon that watches the projects folder and reports where each project stands.',
    leftOff: {
      summary: 'Wiring the scheduler so goal reminders fire on time.',
      branch: 'main',
      lastCommit: 'add goals table',
      uncommitted: ['backend/src/scheduler.rs', 'backend/src/db.rs'],
    },
    next: [
      { id: 'n1', title: 'Fire a desktop notification when a goal is due', source: 'TODO.md', status: 'doing' },
      { id: 'n2', title: 'Add the GitHub connector', source: 'TODO.md', status: 'todo' },
      { id: 'n3', title: 'Back up the SQLite file daily', source: 'TODO.md', status: 'todo' },
    ],
    activity: [
      { id: 'a1', at: ago(2), text: 'Work session, 1h 40m, 6 files changed' },
      { id: 'a2', at: ago(26), text: 'Commit: add goals table' },
      { id: 'a3', at: ago(50), text: 'Work session, 55m, 3 files changed' },
    ],
    sources: [
      { name: 'Local folder', detail: '~/projects/project-tracker', syncedAt: ago(0.1) },
      { name: 'GitHub', detail: 'owner/project-tracker', syncedAt: ago(0.3) },
    ],
    milestones: [{ id: 'm1', title: 'Local tracking works end to end', due: inDays(5), done: 4, total: 6 }],
    goals: [{ id: 'g1', title: 'Finish the scheduler', due: inDays(2), done: false }],
  },
  {
    ...blank,
    slug: 'calculator',
    title: 'Calculator',
    goal: 'A small desktop calculator with history',
    stage: 'planned',
    tags: [],
    lastActive: null,
    hoursThisWeek: 0,
    git: { state: 'not-a-repo' },
    progress: null,
  },
  {
    ...blank,
    slug: 'music-player',
    title: 'Music Player',
    goal: 'Play local files and imported playlists',
    stage: 'paused',
    tags: ['linux'],
    lastActive: ago(24 * 20),
    hoursThisWeek: 0,
    git: { state: 'unpushed', branch: 'main' },
    progress: { done: 7, total: 15 },
  },
]

const toSummary = (d: ProjectDetail): Project => ({
  slug: d.slug,
  title: d.title,
  goal: d.goal,
  stage: d.stage,
  tags: d.tags,
  lastActive: d.lastActive,
  hoursThisWeek: d.hoursThisWeek,
  git: d.git,
  progress: d.progress,
})

export const api = {
  async listProjects(): Promise<Project[]> {
    return MOCK ? db.map(toSummary) : http<Project[]>('/projects')
  },

  async getProject(slug: string): Promise<ProjectDetail> {
    if (!MOCK) return http<ProjectDetail>(`/projects/${slug}`)
    const found = db.find((d) => d.slug === slug)
    if (!found) throw new Error('Project not found')
    return structuredClone(found)
  },

  async createProject(input: NewProject): Promise<Project> {
    if (!MOCK) return http<Project>('/projects', { method: 'POST', body: JSON.stringify(input) })
    const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const created: ProjectDetail = {
      ...blank,
      slug,
      title: input.title,
      goal: input.goal,
      description: input.description,
      stage: 'planned',
      tags: [],
      lastActive: null,
      hoursThisWeek: 0,
      git: { state: 'not-a-repo' },
      progress: null,
    }
    db.unshift(created)
    return toSummary(created)
  },

  // The backend parses the due date from the text, e.g. "finish login by friday".
  async addGoal(slug: string, text: string): Promise<void> {
    if (!MOCK) return http<void>(`/projects/${slug}/goals`, { method: 'POST', body: JSON.stringify({ text }) })
    db.find((d) => d.slug === slug)?.goals.push({ id: String(Date.now()), title: text, due: inDays(3), done: false })
  },

  async toggleGoal(slug: string, id: string): Promise<void> {
    if (!MOCK) return http<void>(`/projects/${slug}/goals/${id}/toggle`, { method: 'POST' })
    const goal = db.find((d) => d.slug === slug)?.goals.find((g) => g.id === id)
    if (goal) goal.done = !goal.done
  },
}
