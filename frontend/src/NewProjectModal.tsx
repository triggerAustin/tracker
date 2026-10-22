import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { NewProject } from './types'
import { btn, input } from './ui'

export default function NewProjectModal({
  onCreate,
  onClose,
}: {
  onCreate: (p: NewProject) => Promise<void>
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    setError(null)
    try {
      await onCreate({ title: title.trim(), goal: goal.trim(), description: description.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  const field = 'grid grid-cols-[12ch_1fr] items-center gap-2'

  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="New project"
        className="w-full max-w-xl space-y-3 border border-accent bg-canvas p-4"
      >
        <h2 className="font-bold text-accent">new project</h2>
        <label className={field}>
          <span className="text-dim">name</span>
          <input autoFocus required value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
        </label>
        <label className={field}>
          <span className="text-dim">goal</span>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="what does done look like?"
            className={input}
          />
        </label>
        <label className={field}>
          <span className="text-dim">description</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={input} />
        </label>
        {error && <p role="alert" className="text-bad">couldn’t create the project: {error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btn}>
            cancel
          </button>
          <button type="submit" disabled={busy} className={btn}>
            create project
          </button>
        </div>
      </form>
    </div>
  )
}
