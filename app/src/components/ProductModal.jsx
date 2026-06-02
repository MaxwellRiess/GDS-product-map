import { useState, useEffect } from 'react'
import StatusBadge from './StatusBadge'

const STATUSES = ['live', 'beta', 'alpha', 'discovery', 'deprecated']

const EMPTY_PRODUCT = {
  id: '',
  name: '',
  description: '',
  status: 'discovery',
  url: '',
  github_repos: [],
  product_manager: '',
  tech_lead: '',
  designer: '',
  notes: '',
}

export default function ProductModal({
  product,
  isNew,
  directorates,
  defaultDirectorateId,
  defaultProgrammeId,
  onClose,
  onSave,
  saving,
  error,
  authenticated,
}) {
  const [editing, setEditing] = useState(isNew)
  const [form, setForm] = useState(product || EMPTY_PRODUCT)
  const [reposInput, setReposInput] = useState((product?.github_repos || []).join(', '))
  const [targetDirectorate, setTargetDirectorate] = useState(defaultDirectorateId || '')
  const [targetProgramme, setTargetProgramme] = useState(defaultProgrammeId || '')

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSave() {
    const repos = reposInput.split(',').map(s => s.trim()).filter(Boolean)
    const id = isNew
      ? (form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now())
      : form.id
    const updated = { ...form, id, github_repos: repos }
    onSave(updated, targetDirectorate, targetProgramme)
  }

  const programmes = directorates?.find(d => d.id === targetDirectorate)?.programmes || []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gds-light-grey px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-gds-dark text-lg">
            {isNew ? 'Add a product' : (editing ? 'Edit product' : form.name)}
          </h2>
          <div className="flex items-center gap-2">
            {!isNew && authenticated && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-gds-blue text-white text-sm font-medium px-3 py-1.5 rounded hover:bg-gds-blue-dark transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gds-grey hover:text-gds-dark p-1"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {editing ? (
            <>
              {/* Directorate/programme placement (new products and moves) */}
              {directorates && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Directorate">
                    <select
                      value={targetDirectorate}
                      onChange={e => { setTargetDirectorate(e.target.value); setTargetProgramme('') }}
                      className="input"
                    >
                      <option value="">Select...</option>
                      {directorates.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Programme">
                    <select
                      value={targetProgramme}
                      onChange={e => setTargetProgramme(e.target.value)}
                      className="input"
                      disabled={!targetDirectorate}
                    >
                      <option value="">Select...</option>
                      {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </Field>
                </div>
              )}

              <Field label="Product name">
                <input value={form.name} onChange={e => set('name', e.target.value)} className="input" placeholder="e.g. GOV.UK Notify" />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  className="input min-h-[80px] resize-none"
                  placeholder="What does this product do?"
                />
              </Field>

              <Field label="Status">
                <select value={form.status} onChange={e => set('status', e.target.value)} className="input">
                  {STATUSES.map(s => <option key={s} value={s}>{capitalize(s)}</option>)}
                </select>
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Product manager">
                  <input value={form.product_manager} onChange={e => set('product_manager', e.target.value)} className="input" placeholder="Full name" />
                </Field>
                <Field label="Tech lead">
                  <input value={form.tech_lead} onChange={e => set('tech_lead', e.target.value)} className="input" placeholder="Full name" />
                </Field>
                <Field label="Designer">
                  <input value={form.designer} onChange={e => set('designer', e.target.value)} className="input" placeholder="Full name" />
                </Field>
              </div>

              <Field label="Product URL">
                <input value={form.url} onChange={e => set('url', e.target.value)} className="input" placeholder="https://..." />
              </Field>

              <Field label="GitHub repos" hint="Comma-separated, e.g. alphagov/notify-api, alphagov/notify-admin">
                <input value={reposInput} onChange={e => setReposInput(e.target.value)} className="input" placeholder="alphagov/repo-name" />
              </Field>

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  className="input min-h-[60px] resize-none"
                  placeholder="Anything else useful..."
                />
              </Field>

              {error && (
                <div className="bg-gds-red-light text-gds-red text-sm px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name || !targetDirectorate || !targetProgramme}
                  className="bg-gds-green text-white font-medium px-5 py-2 rounded hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                {!isNew && (
                  <button
                    onClick={() => {
                      setForm(product)
                      setReposInput((product?.github_repos || []).join(', '))
                      setTargetDirectorate(defaultDirectorateId || '')
                      setTargetProgramme(defaultProgrammeId || '')
                      setEditing(false)
                    }}
                    className="text-gds-grey hover:text-gds-dark text-sm underline"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <p className="text-xs text-gds-grey">
                Saving commits directly to the GitHub repo. Changes go live after the site rebuilds (usually under 2 minutes).
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <StatusBadge status={form.status} />
                {form.url && (
                  <a
                    href={form.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gds-blue text-sm hover:underline"
                  >
                    {form.url} ↗
                  </a>
                )}
              </div>

              <p className="text-gds-grey leading-relaxed">
                {form.description || <span className="italic">No description yet.</span>}
              </p>

              <dl className="grid grid-cols-3 gap-4">
                {[
                  { key: 'product_manager', label: 'Product manager' },
                  { key: 'tech_lead', label: 'Tech lead' },
                  { key: 'designer', label: 'Designer' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <dt className="text-xs font-semibold text-gds-grey uppercase tracking-wide mb-0.5">{label}</dt>
                    <dd className="text-gds-dark text-sm">{form[key] || <span className="text-gds-mid-grey italic">Not set</span>}</dd>
                  </div>
                ))}
              </dl>

              {form.github_repos?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gds-grey uppercase tracking-wide mb-2">GitHub repos</h4>
                  <ul className="space-y-1">
                    {form.github_repos.map(repo => (
                      <li key={repo}>
                        <a
                          href={`https://github.com/${repo}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gds-blue text-sm hover:underline font-mono"
                        >
                          {repo}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {form.notes && (
                <div>
                  <h4 className="text-xs font-semibold text-gds-grey uppercase tracking-wide mb-1">Notes</h4>
                  <p className="text-gds-grey text-sm">{form.notes}</p>
                </div>
              )}

              {!authenticated && (
                <p className="text-xs text-gds-grey italic border-t border-gds-light-grey pt-4">
                  Sign in with your GitHub account to edit this product.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          border: 2px solid #0b0c0c;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 14px;
          outline: none;
          background: white;
        }
        .input:focus {
          border-color: #1d70b8;
          box-shadow: 0 0 0 3px rgba(29, 112, 184, 0.15);
        }
      `}</style>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gds-dark mb-1">{label}</label>
      {hint && <p className="text-xs text-gds-grey mb-1">{hint}</p>}
      {children}
    </div>
  )
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
