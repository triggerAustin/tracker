import type { Project } from './types'

export const needsAttention = (p: Project) => p.stage !== 'planned' && p.git.state !== 'clean'

export function timeAgo(iso: string | null): string {
  if (!iso) return 'never'
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function timeShort(iso: string | null): string {
  if (!iso) return '-'
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`
}

const daysUntil = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)

export function dueLabel(iso: string): string {
  const days = daysUntil(iso)
  if (days < 0) return `overdue by ${-days}d`
  if (days === 0) return 'due today'
  if (days === 1) return 'due tomorrow'
  return `due in ${days}d`
}

export const dueTone = (iso: string) => {
  const d = daysUntil(iso)
  return d < 0 ? 'font-bold text-bad' : d <= 1 ? 'text-warn' : 'text-dim'
}
