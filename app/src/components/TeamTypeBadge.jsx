import { teamType } from '../teamTypes'

export default function TeamTypeBadge({ value }) {
  const t = teamType(value)
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: t.colour, color: t.text }}
      title={t.description}
    >
      {t.label}
    </span>
  )
}
