const STATUSES = ['all', 'live', 'beta', 'alpha', 'discovery', 'deprecated']

export default function FilterBar({ filters, onChange, directorates }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="bg-white border border-gds-mid-grey rounded p-4 flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm font-medium text-gds-dark mb-1">Search</label>
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          className="w-full border-2 border-gds-dark rounded px-3 py-2 text-sm focus:outline-none focus:border-gds-blue"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gds-dark mb-1">Status</label>
        <select
          value={filters.status}
          onChange={e => set('status', e.target.value)}
          className="border-2 border-gds-dark rounded px-3 py-2 text-sm focus:outline-none focus:border-gds-blue bg-white"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All statuses' : capitalize(s)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gds-dark mb-1">Directorate</label>
        <select
          value={filters.directorate}
          onChange={e => set('directorate', e.target.value)}
          className="border-2 border-gds-dark rounded px-3 py-2 text-sm focus:outline-none focus:border-gds-blue bg-white"
        >
          <option value="all">All directorates</option>
          {directorates.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {(filters.search || filters.status !== 'all' || filters.directorate !== 'all') && (
        <button
          onClick={() => onChange({ search: '', status: 'all', directorate: 'all' })}
          className="text-sm text-gds-blue underline hover:text-gds-blue-dark self-end pb-2"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
