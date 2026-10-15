import type { ReactNode } from 'react'

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <h2 className="section-title m-0 text-lg text-[var(--sea-ink)]">
        {title}
      </h2>
      {description ? (
        <p className="muted m-0 max-w-md text-sm">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
