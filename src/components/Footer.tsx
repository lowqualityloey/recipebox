import { Link } from '@tanstack/react-router'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer mt-20 px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="m-0 text-sm">
          © {year} RecipeBox — share the recipes you love.
        </p>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" className="nav-link">
            Recipes
          </Link>
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
        </nav>
      </div>
    </footer>
  )
}
