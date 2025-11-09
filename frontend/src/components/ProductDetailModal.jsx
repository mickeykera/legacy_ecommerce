import React from 'react';

export default function ProductDetailModal({ product, onClose }) {
  if (!product) return null;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: '760px' }}>
        <div className="modal-header">
          <h2>{product.name}</h2>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'minmax(260px, 320px) 1fr' }}>
          <div>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '4/3', background: '#f1f5f9', borderRadius: '12px' }} />
            )}
          </div>
          <div className="detail-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {product.category && <div className="chip" style={{ alignSelf: 'flex-start' }}>{product.category.name}</div>}
            <p style={{ margin: 0, lineHeight: 1.5 }}>{product.description || 'No description provided.'}</p>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-alt)' }}>${Number(product.price).toFixed(2)}</div>
            <div style={{ fontSize: '.85rem', color: 'var(--text-light)' }}>Stock: {product.stock_quantity}</div>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button className="btn primary">Add to cart</button>
              <button className="btn">Wishlist</button>
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
