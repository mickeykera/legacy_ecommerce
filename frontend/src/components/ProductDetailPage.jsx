import React from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../hooks/useApi.js';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { data, loading, error } = useApi(`/api/products/${id}/`);

  if (loading) return <div className="container"><div className="skeleton-grid" style={{ height: 420 }} /></div>;
  if (error) return <div className="container"><div className="error">{String(error)}</div></div>;
  if (!data) return null;

  const p = data;
  return (
    <div className="container" style={{ paddingTop: '1rem' }}>
      <Link to="/" className="link">← Back</Link>
      <div className="modal" style={{ marginTop: '1rem' }}>
        <div className="modal-body" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'minmax(260px, 420px) 1fr' }}>
          <div>
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '4/3', background: '#f1f5f9', borderRadius: '12px' }} />
            )}
          </div>
          <div>
            <h1 style={{ marginTop: 0 }}>{p.name}</h1>
            {p.category && <div className="chip" style={{ marginBottom: '.5rem' }}>{p.category.name}</div>}
            <p style={{ color: 'var(--text-light)' }}>{p.description || 'No description provided.'}</p>
            <div className="card-bottom" style={{ marginTop: '1rem' }}>
              <span className="price">${Number(p.price).toFixed(2)}</span>
              <button className="btn primary">Add to cart</button>
            </div>
            <div style={{ fontSize: '.85rem', color: 'var(--text-light)', marginTop: '.5rem' }}>Stock: {p.stock_quantity}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
