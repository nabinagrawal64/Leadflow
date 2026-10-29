const chevron = (x) => `M${x} 2 L${x + 8} 12 L${x} 22 H${x + 6} L${x + 14} 12 L${x + 6} 2 Z`

export function LogoMark({ className = 'h-6 w-[34px]' }) {
  return (
    <svg viewBox="0 0 34 24" className={className} aria-hidden>
      <path d={chevron(0)} fill="#2f9bff" />
      <path d={chevron(10)} fill="#7b61f5" />
      <path d={chevron(20)} fill="#12b886" />
    </svg>
  )
}

export default function Logo({ onDark = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-display text-[22px] font-bold leading-none tracking-tight ${onDark ? 'text-white' : 'text-ink'}`}>
        leadflow
      </span>
    </span>
  )
}
