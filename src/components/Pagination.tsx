import { Link } from '@tanstack/react-router'

export default function Pagination({
  page,
  totalPages,
  query,
  ingredient,
}: {
  page: number
  totalPages: number
  query: string
  ingredient: string
}) {
  if (totalPages <= 1) {
    return null
  }

  const search = (nextPage: number) => ({
    page: nextPage,
    ...(query ? { q: query } : {}),
    ...(ingredient ? { ingredient } : {}),
  })

  const linkClass = 'btn btn-secondary px-4 py-2 text-sm'

  return (
    <nav
      className="mt-8 flex items-center justify-center gap-3"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link to="/" search={search(page - 1)} className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span className={`${linkClass} pointer-events-none opacity-50`}>
          ← Previous
        </span>
      )}

      <span className="muted text-sm" aria-current="page">
        Page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link to="/" search={search(page + 1)} className={linkClass}>
          Next →
        </Link>
      ) : (
        <span className={`${linkClass} pointer-events-none opacity-50`}>
          Next →
        </span>
      )}
    </nav>
  )
}
