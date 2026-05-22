// Placeholder owl mascot — replace src prop with a real SVG illustration later.
// Designed to work on dark backgrounds. Indigo glasses match the app accent color.

interface OwlMascotProps {
  size?: number
  className?: string
  variant?: 'default' | 'reading' | 'thinking'
}

export function OwlMascot({ size = 80, className = '', variant = 'default' }: OwlMascotProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Body */}
      <ellipse cx="40" cy="72" rx="20" ry="16" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />

      {/* Wing lines */}
      <path d="M22 68 Q17 74 20 82" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M58 68 Q63 74 60 82" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Head */}
      <circle cx="40" cy="36" r="26" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />

      {/* Ear tufts */}
      <polygon points="20,16 15,4 26,13" fill="#1e293b" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="60,16 54,13 65,4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round" />

      {/* Eye whites */}
      <circle cx="30" cy="34" r="9.5" fill="#f1f5f9" />
      <circle cx="50" cy="34" r="9.5" fill="#f1f5f9" />

      {/* Glasses frames — round, indigo */}
      <circle cx="30" cy="34" r="9.5" fill="none" stroke="#6366f1" strokeWidth="2" />
      <circle cx="50" cy="34" r="9.5" fill="none" stroke="#6366f1" strokeWidth="2" />
      {/* Bridge */}
      <line x1="39.5" y1="34" x2="40.5" y2="34" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
      {/* Temple arms */}
      <line x1="20.5" y1="31" x2="17" y2="29" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="59.5" y1="31" x2="63" y2="29" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />

      {/* Pupils */}
      <circle cx="30" cy="34" r="4.5" fill="#0f172a" />
      <circle cx="50" cy="34" r="4.5" fill="#0f172a" />
      {/* Eye shine */}
      <circle cx="31.5" cy="32.5" r="1.5" fill="white" />
      <circle cx="51.5" cy="32.5" r="1.5" fill="white" />

      {/* Beak */}
      <polygon points="40,44 36,50 44,50" fill="#f59e0b" />

      {/* Chest feather pattern */}
      <path d="M33 60 Q40 55 47 60" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M35 64 Q40 60 45 64" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* Feet */}
      <g stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round">
        <line x1="33" y1="86" x2="30" y2="88" />
        <line x1="33" y1="86" x2="33" y2="88" />
        <line x1="33" y1="86" x2="36" y2="88" />
        <line x1="47" y1="86" x2="44" y2="88" />
        <line x1="47" y1="86" x2="47" y2="88" />
        <line x1="47" y1="86" x2="50" y2="88" />
      </g>

      {/* Reading variant — tiny book in wing */}
      {variant === 'reading' && (
        <g transform="translate(56, 60)">
          <rect x="0" y="0" width="14" height="18" rx="1.5" fill="#6366f1" stroke="#818cf8" strokeWidth="1" />
          <line x1="7" y1="0" x2="7" y2="18" stroke="#818cf8" strokeWidth="0.8" />
          <line x1="2" y1="5" x2="5.5" y2="5" stroke="#c7d2fe" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="2" y1="8" x2="5.5" y2="8" stroke="#c7d2fe" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="2" y1="11" x2="5.5" y2="11" stroke="#c7d2fe" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      )}

      {/* Thinking variant — small thought dots */}
      {variant === 'thinking' && (
        <g fill="#6366f1">
          <circle cx="66" cy="18" r="1.5" opacity="0.5" />
          <circle cx="70" cy="12" r="2" opacity="0.7" />
          <circle cx="75" cy="6" r="2.5" opacity="0.9" />
        </g>
      )}
    </svg>
  )
}
