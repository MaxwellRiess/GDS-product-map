import ProductCard from './ProductCard'

export default function GroupSection({ group, onProductClick, onAddProduct, authenticated }) {
  const totalProducts = group.directorates.reduce((sum, dir) => sum + dir.products.length, 0)

  return (
    <section>
      {/* Group header */}
      <div
        className="rounded-t px-5 py-3 flex items-baseline gap-3"
        style={{ backgroundColor: group.colour }}
      >
        <h2 className="text-white font-bold text-lg">{group.name}</h2>
        <span className="text-white/70 text-sm">{group.lead}</span>
        <span className="ml-auto text-white/60 text-xs">{totalProducts} products</span>
      </div>

      <div className="bg-white border border-t-0 rounded-b border-gds-mid-grey px-5 py-5 space-y-8">
        {group.directorates.map(directorate => (
          <div key={directorate.id}>
            {/* Directorate sub-header */}
            <div className="flex items-baseline gap-3 mb-3 pb-2 border-b border-gds-light-grey">
              <h3 className="font-semibold text-gds-dark text-sm uppercase tracking-wide">
                {directorate.name}
              </h3>
              <span className="text-gds-grey text-xs">{directorate.lead}</span>
            </div>

            {/* Product cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {directorate.products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  groupColour={group.colour}
                  onClick={onProductClick}
                />
              ))}

              {/* Add product card — only when authenticated */}
              {authenticated && (
                <button
                  onClick={() => onAddProduct(group.id, directorate.id)}
                  className="border-2 border-dashed border-gds-mid-grey rounded p-4 text-gds-grey text-sm hover:border-gds-blue hover:text-gds-blue transition-colors flex items-center justify-center gap-2 min-h-[100px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add product
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
