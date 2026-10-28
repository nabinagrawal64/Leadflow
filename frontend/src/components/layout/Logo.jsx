export default function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#2563EB" />
        <path d="M9 9h4v11h9v3H9z" fill="#fff" />
        <circle cx="22" cy="11" r="2.5" fill="#34D399" />
      </svg>
      <span className={`font-display text-lg font-semibold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        LeadFlow
      </span>
    </div>
  )
}
