import StatusBadge from './StatusBadge'

const PERSON_FIELDS = [
  { key: 'product_manager', label: 'PM' },
  { key: 'tech_lead', label: 'Tech lead' },
  { key: 'designer', label: 'Designer' },
]

export default function ProductCard({ product, directorateColour, onClick }) {
  const hasAnyPerson = PERSON_FIELDS.some(f => product[f.key])

  return (
    <button
      onClick={() => onClick(product)}
      className="w-full text-left bg-white border border-gds-mid-grey rounded hover:border-gds-blue hover:shadow-md transition-all group"
    >
      <div
        className="h-1 rounded-t"
        style={{ backgroundColor: directorateColour }}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gds-dark text-base group-hover:text-gds-blue leading-tight">
            {product.name}
          </h3>
          <StatusBadge status={product.status} />
        </div>

        <p className="text-gds-grey text-sm leading-relaxed line-clamp-2 mb-3">
          {product.description || <span className="italic">No description yet.</span>}
        </p>

        {hasAnyPerson ? (
          <dl className="space-y-1">
            {PERSON_FIELDS.map(({ key, label }) =>
              product[key] ? (
                <div key={key} className="flex gap-1 text-xs text-gds-grey">
                  <dt className="font-medium text-gds-dark w-16 shrink-0">{label}</dt>
                  <dd>{product[key]}</dd>
                </div>
              ) : null
            )}
          </dl>
        ) : (
          <p className="text-xs text-gds-mid-grey italic">No contacts added yet</p>
        )}

        {product.github_repos?.length > 0 && (
          <div className="mt-3 flex items-center gap-1 text-xs text-gds-grey">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span>{product.github_repos.length} {product.github_repos.length === 1 ? 'repo' : 'repos'}</span>
          </div>
        )}
      </div>
    </button>
  )
}
