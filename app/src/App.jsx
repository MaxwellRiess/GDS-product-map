import { useState, useEffect } from 'react'
import Header from './components/Header'
import FilterBar from './components/FilterBar'
import DirectorateSection from './components/DirectorateSection'
import ProductModal from './components/ProductModal'
import GitHubAuth from './components/GitHubAuth'
import { commitProductData, validateToken } from './hooks/useGitHub'

const REPO = 'MaxwellRiess/GDS-product-map'

export default function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: 'all', directorate: 'all' })

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [addingTo, setAddingTo] = useState(null) // { directorateId, programmeId }

  const [showAuth, setShowAuth] = useState(false)
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('gds_gh_token') || '')
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
    if (!githubToken) { setGithubUser(null); return }
    validateToken(githubToken).then(setGithubUser).catch(() => {
      setGithubToken('')
      localStorage.removeItem('gds_gh_token')
    })
  }, [githubToken])

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
      await commitProductData(githubToken, REPO, newData)
      setData(newData)
      successCallback?.()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleSaveProduct(updatedProduct, directorateId, programmeId) {
    if (!githubToken) { setShowAuth(true); return }

    let newData
    if (directorateId && programmeId) {
      // New product
      newData = {
        ...data,
        directorates: data.directorates.map(d =>
          d.id !== directorateId ? d : {
            ...d,
            programmes: d.programmes.map(p =>
              p.id !== programmeId ? p : {
                ...p,
                products: [...p.products, updatedProduct],
              }
            ),
          }
        ),
      }
    } else {
      // Update existing
      newData = {
        ...data,
        directorates: data.directorates.map(d => ({
          ...d,
          programmes: d.programmes.map(p => ({
            ...p,
            products: p.products.map(prod =>
              prod.id === updatedProduct.id ? updatedProduct : prod
            ),
          })),
        })),
      }
    }

    persist(newData, () => {
      setSelectedProduct(null)
      setAddingTo(null)
    })
  }

  function handleAuth(token) {
    setGithubToken(token)
    localStorage.setItem('gds_gh_token', token)
    setShowAuth(false)
  }

  function handleSignOut() {
    setGithubToken('')
    setGithubUser(null)
    localStorage.removeItem('gds_gh_token')
  }

  const filtered = applyFilters(data)
  const authenticated = !!githubToken

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
