export type Stage = 'planned' | 'new' | 'active' | 'paused' | 'shipped'
export type GitState = 'clean' | 'uncommitted' | 'unpushed' | 'no-remote' | 'not-a-repo'

export interface Project {
  slug: string
  title: string
  goal: string
  stage: Stage
  tags: string[]
  lastActive: string | null
  hoursThisWeek: number
  git: { state: GitState; branch?: string }
  progress: { done: number; total: number } | null
}

export interface Goal {
  id: string
  title: string
  due: string
  done: boolean
}

export interface Milestone {
  id: string
  title: string
  due: string
  done: number
  total: number
}

export interface Item {
  id: string
  title: string
  source: string
  status: 'doing' | 'todo'
}

export interface ActivityEvent {
  id: string
  at: string
  text: string
}

export interface Source {
  name: string
  detail: string
  syncedAt: string | null
}

export interface ProjectDetail extends Project {
  description: string
  readme: string
  leftOff: {
    summary: string
    branch: string
    lastCommit: string
    uncommitted: string[]
  } | null
  next: Item[]
  activity: ActivityEvent[]
  sources: Source[]
  milestones: Milestone[]
  goals: Goal[]
}

export interface NewProject {
  title: string
  goal: string
  description: string
}
