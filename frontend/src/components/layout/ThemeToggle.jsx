import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme()
  const dark = theme === 'dark'
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
      className={`inline-flex size-10 items-center justify-center rounded-[10px] text-muted transition-colors duration-150 hover:bg-sunk hover:text-ink ${className}`}
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  )
}
