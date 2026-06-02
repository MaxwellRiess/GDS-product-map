import { useState, useEffect } from 'react'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import DirectorateSection from './components/DirectorateSection'
import ProductModal from './components/ProductModal'
import GitHubAuth from './components/GitHubAuth'
import { commitProductData, fetchSession, logout } from './hooks/useGitHub'

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: 'all', directorate: 'all' })

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [addingTo, setAddingTo] = useState(null) // { directorateId, programmeId }

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
    const { search, status, directorate } = filters
    return {
      ...rawData,
      directorates: rawData.directorates
        .filter(d => directorate === 'all' || d.id === directorate)
        .map(d => ({
          ...d,
          programmes: d.programmes
            .map(p => ({
              ...p,
              products: p.products.filter(prod => {
                const q = search.toLowerCase()
                const matchSearch = !q
                  || prod.name.toLowerCase().includes(q)
                  || prod.description.toLowerCase().includes(q)
                  || prod.product_manager?.toLowerCase().includes(q)
                return matchSearch && (status === 'all' || prod.status === status)
              }),
            }))
            .filter(p => p.products.length > 0 || directorate !== 'all'),
        }))
        .filter(d => d.programmes.some(p => p.products.length > 0)),
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
  // directorate/programme pickers and to detect a move on save.
  function findLocation(productId) {
    for (const d of data.directorates) {
      for (const p of d.programmes) {
        if (p.products.some(prod => prod.id === productId)) {
          return { directorateId: d.id, programmeId: p.id }
        }
      }
    }
    return { directorateId: '', programmeId: '' }
  }

  // Handles add, in-place edit, and moving a product to another
  // directorate/programme in a single pass. The product is replaced where it
  // already sits (preserving order), removed from any other programme it was
  // in, and inserted into the chosen target if it isn't there yet.
  function handleSaveProduct(updatedProduct, directorateId, programmeId) {
    if (!githubUser) { setShowAuth(true); return }

    const newData = {
      ...data,
      directorates: data.directorates.map(d => ({
        ...d,
        programmes: d.programmes.map(p => {
          const isTarget = d.id === directorateId && p.id === programmeId
          const hadProduct = p.products.some(prod => prod.id === updatedProduct.id)

          if (isTarget) {
            return hadProduct
              ? { ...p, products: p.products.map(prod => prod.id === updatedProduct.id ? updatedProduct : prod) }
              : { ...p, products: [...p.products, updatedProduct] }
          }
          // Not the target: drop the product if it was previously here (a move).
          return hadProduct
            ? { ...p, products: p.products.filter(prod => prod.id !== updatedProduct.id) }
            : p
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
          directorates={data.directorates}
        />

        <div className="space-y-10 mt-8">
          {filtered?.directorates.map(d => (
            <DirectorateSection
              key={d.id}
              directorate={d}
              authenticated={authenticated}
              onProductClick={setSelectedProduct}
              onAddProduct={(directorateId, programmeId) =>
                setAddingTo({ directorateId, programmeId })
              }
            />
          ))}

          {filtered?.directorates.length === 0 && (
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
          directorates={data.directorates}
          defaultDirectorateId={findLocation(selectedProduct.id).directorateId}
          defaultProgrammeId={findLocation(selectedProduct.id).programmeId}
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
          directorates={data.directorates}
          defaultDirectorateId={addingTo.directorateId}
          defaultProgrammeId={addingTo.programmeId}
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
