import React from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product, onClick }) {
  return (
    <article className="card" role="button" tabIndex={0} onClick={() => onClick?.(product)} onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(product); }}>
      {product.image_url ? (
        <img className="card-img" src={product.image_url} alt={product.name} />
      ) : (
        <div className="card-img placeholder" aria-hidden="true" />
      )}
      <div className="card-body">
  <h3 className="card-title"><Link className="link" style={{ padding: 0 }} to={`/product/${product.id}`} onClick={(e) => e.stopPropagation()}>{product.name}</Link></h3>
        {product.category && (
          <div className="chip">{product.category.name}</div>
        )}
        <p className="card-desc">{product.description || '—'}</p>
        <div className="card-bottom">
          <span className="price">${Number(product.price).toFixed(2)}</span>
          <button className="btn" onClick={(e) => { e.stopPropagation(); /* cart add placeholder */ }}>Add to cart</button>
        </div>
      </div>
    </article>
  );
}
