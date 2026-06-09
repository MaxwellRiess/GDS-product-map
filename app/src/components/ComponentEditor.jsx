import { useState } from 'react'
import { TEAM_TYPES, teamType } from '../teamTypes'
import TeamTypeBadge from './TeamTypeBadge'

const STATUSES = ['live', 'beta', 'alpha', 'discovery', 'deprecated']

function newComponent() {
  return {
    id: 'c-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    name: '',
    team_type: 'stream-aligned',
    status: 'discovery',
    description: '',
    product_manager: '',
    tech_lead: '',
    designer: '',
    github_repos: [],
    components: [],
  }
}

// Recursive editor for a product's components and platforms.
export default function ComponentEditor({ value = [], onChange, depth = 0 }) {
  function update(i, patch) {
    onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  }
  function remove(i) {
    onChange(value.filter((_, idx) => idx !== i))
  }
  function add() {
    onChange([...value, newComponent()])
  }

  return (
    <div className={depth > 0 ? 'pl-3 border-l-2 border-gds-light-grey space-y-2' : 'space-y-2'}>
      {value.map((c, i) => (
        <ComponentRow
          key={c.id}
          component={c}
          depth={depth}
          onChange={patch => update(i, patch)}
          onRemove={() => remove(i)}
        />
      ))}
      <button
        type="button"
        onClick={add}
        className="text-sm text-gds-blue hover:underline"
      >
        + Add {depth > 0 ? 'sub-component' : 'component or platform'}
      </button>
    </div>
  )
}

function ComponentRow({ component, depth, onChange, onRemove }) {
  const [open, setOpen] = useState(!component.name)
  const [reposInput, setReposInput] = useState((component.github_repos || []).join(', '))

  function setRepos(text) {
    setReposInput(text)
    onChange({ github_repos: text.split(',').map(s => s.trim()).filter(Boolean) })
  }

  return (
    <div className="border border-gds-light-grey rounded p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="text-gds-grey hover:text-gds-dark shrink-0"
          aria-expanded={open}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <span className="font-medium text-gds-dark text-sm flex-1 truncate">
          {component.name || <span className="text-gds-mid-grey italic">New component</span>}
        </span>
        <TeamTypeBadge value={component.team_type} />
        <button
          type="button"
          onClick={onRemove}
          className="text-gds-grey hover:text-gds-red shrink-0 p-1"
          aria-label="Remove component"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <input
            value={component.name}
            onChange={e => onChange({ name: e.target.value })}
            className="cinput"
            placeholder="Component or platform name"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={component.team_type}
              onChange={e => onChange({ team_type: e.target.value })}
              className="cinput"
            >
              {TEAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={component.status}
              onChange={e => onChange({ status: e.target.value })}
              className="cinput"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          <p className="text-xs text-gds-grey -mt-1">{teamType(component.team_type).description}</p>

          <textarea
            value={component.description}
            onChange={e => onChange({ description: e.target.value })}
            className="cinput min-h-[56px] resize-none"
            placeholder="What does this component do?"
          />

          <div className="grid grid-cols-3 gap-3">
            <input
              value={component.product_manager}
              onChange={e => onChange({ product_manager: e.target.value })}
              className="cinput"
              placeholder="Product manager"
            />
            <input
              value={component.tech_lead}
              onChange={e => onChange({ tech_lead: e.target.value })}
              className="cinput"
              placeholder="Tech lead"
            />
            <input
              value={component.designer}
              onChange={e => onChange({ designer: e.target.value })}
              className="cinput"
              placeholder="Design lead"
            />
          </div>

          <input
            value={reposInput}
            onChange={e => setRepos(e.target.value)}
            className="cinput"
            placeholder="GitHub repos, comma-separated"
          />

          <div>
            <p className="text-xs font-medium text-gds-dark mb-1">Sub-components</p>
            <ComponentEditor
              value={component.components || []}
              onChange={arr => onChange({ components: arr })}
              depth={depth + 1}
            />
          </div>
        </div>
      )}

      <style>{`
        .cinput {
          width: 100%;
          border: 2px solid #b1b4b6;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 13px;
          outline: none;
          background: white;
        }
        .cinput:focus { border-color: #1d70b8; }
      `}</style>
    </div>
  )
}
