import { useState } from 'react'
import StatusBadge from './StatusBadge'
import TeamTypeBadge from './TeamTypeBadge'

// Read-only, progressively disclosed tree of components and platforms.
// Each node starts collapsed; expanding reveals its detail and any children.
export default function ComponentTree({ components, depth = 0 }) {
  if (!components?.length) return null
  return (
    <ul className={depth === 0 ? 'space-y-1.5' : 'space-y-1.5 mt-2 pl-3 border-l-2 border-gds-light-grey'}>
      {components.map(c => (
        <ComponentNode key={c.id} component={c} depth={depth} />
      ))}
    </ul>
  )
}

function ComponentNode({ component, depth }) {
  const hasChildren = component.components?.length > 0
  const hasDetail = Boolean(
    component.description ||
    component.product_manager ||
    component.tech_lead ||
    component.github_repos?.length,
  )
  const expandable = hasChildren || hasDetail
  const [open, setOpen] = useState(false)

  return (
    <li>
      <div className="flex items-center gap-2">
        {expandable ? (
          <button
            onClick={() => setOpen(o => !o)}
            className="text-gds-grey hover:text-gds-dark shrink-0"
            aria-expanded={open}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span className="font-medium text-gds-dark text-sm">{component.name}</span>
        <TeamTypeBadge value={component.team_type} />
        {component.status && <StatusBadge status={component.status} />}
        {hasChildren && (
          <span className="text-xs text-gds-grey">
            {component.components.length} {component.components.length === 1 ? 'sub-component' : 'sub-components'}
          </span>
        )}
      </div>

      {open && (
        <div className="ml-6 mt-1">
          {component.description && (
            <p className="text-sm text-gds-grey">{component.description}</p>
          )}
          {(component.product_manager || component.tech_lead) && (
            <p className="text-xs text-gds-grey mt-1">
              {[
                component.product_manager && `PM: ${component.product_manager}`,
                component.tech_lead && `Tech lead: ${component.tech_lead}`,
              ].filter(Boolean).join('  ·  ')}
            </p>
          )}
          {component.github_repos?.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {component.github_repos.map(repo => (
                <li key={repo}>
                  <a
                    href={`https://github.com/${repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gds-blue text-xs hover:underline font-mono"
                  >
                    {repo}
                  </a>
                </li>
              ))}
            </ul>
          )}
          {hasChildren && <ComponentTree components={component.components} depth={depth + 1} />}
        </div>
      )}
    </li>
  )
}
