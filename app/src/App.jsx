import { useState, useEffect } from 'react'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import GroupSection from './components/GroupSection'
import ProductModal from './components/ProductModal'
import GitHubAuth from './components/GitHubAuth'
import { commitProductData, fetchSession, logout } from './hooks/useGitHub'

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: 'all', group: 'all' })

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [addingTo, setAddingTo] = useState(null) // { groupId, directorateId }

  const [showAuth, setShowAuth] = useState(false)
  const [githubUser, setGithubUser] = useState(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}products.json`)
      .then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setFetchError(e.message); setLoading(false) })
  }, [])

  useEffect(() => {
    fetchSession().then(setGithubUser).catch(() => setGithubUser(null))
  }, [])

  function applyFilters(rawData) {
    if (!rawData) return null
    const { search, status, group } = filters
    return {
      ...rawData,
      groups: rawData.groups
        .filter(g => group === 'all' || g.id === group)
        .map(g => ({
          ...g,
          directorates: g.directorates
            .map(dir => ({
              ...dir,
              products: dir.products.filter(prod => {
                const q = search.toLowerCase()
                const matchSearch = !q
                  || prod.name.toLowerCase().includes(q)
                  || prod.description.toLowerCase().includes(q)
                  || prod.product_manager?.toLowerCase().includes(q)
                return matchSearch && (status === 'all' || prod.status === status)
              }),
            }))
            .filter(dir => dir.products.length > 0 || group !== 'all'),
        }))
        .filter(g => g.directorates.some(dir => dir.products.length > 0)),
    }
  }

  async function persist(newData, successCallback) {
    setSaving(true)
    setSaveError(null)
    try {
      await commitProductData(newData)
      setData(newData)
      successCallback?.()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Where does a given product currently live? Used to pre-select the
  // group/directorate pickers and to detect a move on save.
  function findLocation(productId) {
    for (const g of data.groups) {
      for (const dir of g.directorates) {
        if (dir.products.some(prod => prod.id === productId)) {
          return { groupId: g.id, directorateId: dir.id }
        }
      }
    }
    return { groupId: '', directorateId: '' }
  }

  // Handles add, in-place edit, and moving a product to another
  // group/directorate in a single pass. The product is replaced where it
  // already sits (preserving order), removed from any other directorate it was
  // in, and inserted into the chosen target if it isn't there yet.
  function handleSaveProduct(updatedProduct, groupId, directorateId) {
    if (!githubUser) { setShowAuth(true); return }

    const newData = {
      ...data,
      groups: data.groups.map(g => ({
        ...g,
        directorates: g.directorates.map(dir => {
          const isTarget = g.id === groupId && dir.id === directorateId
          const hadProduct = dir.products.some(prod => prod.id === updatedProduct.id)

          if (isTarget) {
            return hadProduct
              ? { ...dir, products: dir.products.map(prod => prod.id === updatedProduct.id ? updatedProduct : prod) }
              : { ...dir, products: [...dir.products, updatedProduct] }
          }
          // Not the target: drop the product if it was previously here (a move).
          return hadProduct
            ? { ...dir, products: dir.products.filter(prod => prod.id !== updatedProduct.id) }
            : dir
        }),
      })),
    }

    persist(newData, () => {
      setSelectedProduct(null)
      setAddingTo(null)
    })
  }

  function handleAuth(user) {
    setGithubUser(user)
    setShowAuth(false)
  }

  function handleSignOut() {
    logout().finally(() => setGithubUser(null))
  }

  const filtered = applyFilters(data)
  const authenticated = !!githubUser

  if (loading) {
    return (
      <div className="min-h-screen bg-gds-light-grey flex items-center justify-center">
        <p className="text-gds-grey">Loading product map...</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gds-light-grey flex items-center justify-center">
        <p className="text-gds-red">Could not load product data: {fetchError}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gds-light-grey">
      <Header
        authenticated={authenticated}
        githubUser={githubUser}
        onAuthClick={() => setShowAuth(true)}
        onSignOut={handleSignOut}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          groups={data.groups}
        />

        <div className="space-y-10 mt-8">
          {filtered?.groups.map(g => (
            <GroupSection
              key={g.id}
              group={g}
              authenticated={authenticated}
              onProductClick={setSelectedProduct}
              onAddProduct={(groupId, directorateId) =>
                setAddingTo({ groupId, directorateId })
              }
            />
          ))}

          {filtered?.groups.length === 0 && (
            <div className="text-center py-20 text-gds-grey">
              No products match your filters.
            </div>
          )}
        </div>

        <footer className="mt-16 pt-8 border-t border-gds-mid-grey text-xs text-gds-grey text-center">
          GDS Product Map · Internal use only · Last data update: {data?.meta?.last_updated}
        </footer>
      </main>

      {/* Product detail/edit modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isNew={false}
          groups={data.groups}
          defaultGroupId={findLocation(selectedProduct.id).groupId}
          defaultDirectorateId={findLocation(selectedProduct.id).directorateId}
          authenticated={authenticated}
          onClose={() => setSelectedProduct(null)}
          onSave={handleSaveProduct}
          saving={saving}
          error={saveError}
        />
      )}

      {/* Add new product modal */}
      {addingTo && (
        <ProductModal
          product={null}
          isNew
          groups={data.groups}
          defaultGroupId={addingTo.groupId}
          defaultDirectorateId={addingTo.directorateId}
          authenticated={authenticated}
          onClose={() => setAddingTo(null)}
          onSave={handleSaveProduct}
          saving={saving}
          error={saveError}
        />
      )}

      {/* GitHub auth modal */}
      {showAuth && (
        <GitHubAuth
          onAuth={handleAuth}
          onClose={() => setShowAuth(false)}
        />
      )}
    </div>
  )
}
