import React from 'react';
import ProductCard from './ProductCard.jsx';
import ProductDetailModal from './ProductDetailModal.jsx';
import ProductForm from './ProductForm.jsx';
import useApi from '../hooks/useApi.js';
import SkeletonCard from './SkeletonCard.jsx';

export default function ProductGrid({ user }) {
  const [query, setQuery] = React.useState('');
  const [filters, setFilters] = React.useState({ category: '', min: '', max: '' });
  const [page, setPage] = React.useState(1);
  const [showCreate, setShowCreate] = React.useState(false);
  const [activeProduct, setActiveProduct] = React.useState(null);

  const params = new URLSearchParams();
  if (query) params.set('search', query);
  if (filters.category) params.set('category__id', filters.category);
  if (filters.min) params.set('price__gte', filters.min);
  if (filters.max) params.set('price__lte', filters.max);
  if (page) params.set('page', page);

  const { data, loading, error, refetch } = useApi(`/api/products/?${params.toString()}`);
  const { data: cats } = useApi('/api/products/categories/');

  const results = data?.results ?? [];

  return (
    <div className="container">
      <section className="toolbar">
        <input
          className="input"
          placeholder="Search products"
          value={query}
          onChange={(e) => { setPage(1); setQuery(e.target.value); }}
        />
        <div className="filters">
          <select
            className="select"
            value={filters.category}
            onChange={(e) => { setPage(1); setFilters({ ...filters, category: e.target.value }); }}
          >
            <option value="">All categories</option>
            {(cats || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="input" type="number" min="0" step="0.01" placeholder="Min $"
            value={filters.min} onChange={(e) => setFilters({ ...filters, min: e.target.value })} />
          <input className="input" type="number" min="0" step="0.01" placeholder="Max $"
            value={filters.max} onChange={(e) => setFilters({ ...filters, max: e.target.value })} />
          {user && (
            <button className="btn primary" onClick={() => setShowCreate(true)}>Add product</button>
          )}
        </div>
      </section>

      {error && <div className="error">{String(error)}</div>}
      {loading && (
        <div className="grid" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && (
        <>
          {results.length === 0 ? (
            <div className="empty">No products yet.</div>
          ) : (
            <div className="grid">
              {results.map(p => (
                <ProductCard key={p.id} product={p} onClick={(prod) => setActiveProduct(prod)} />
              ))}
            </div>
          )}

          <div className="pagination">
            <button className="btn" disabled={!data?.previous} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
            <span>Page {page}</span>
            <button className="btn" disabled={!data?.next} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </>
      )}

      {showCreate && (
        <ProductForm onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); refetch(); }} />
      )}
      {activeProduct && (
        <ProductDetailModal product={activeProduct} onClose={() => setActiveProduct(null)} />
      )}
    </div>
  );
}
