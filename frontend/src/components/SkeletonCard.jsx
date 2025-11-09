import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="card" aria-hidden="true">
      <div className="card-img shimmer" />
      <div className="card-body">
        <div className="shimmer bar" style={{ width: '70%', height: '14px' }} />
        <div className="shimmer bar" style={{ width: '50%', height: '10px', marginTop: '8px' }} />
        <div className="card-bottom" style={{ marginTop: '12px' }}>
          <div className="shimmer bar" style={{ width: '60px', height: '16px' }} />
          <div className="shimmer bar" style={{ width: '80px', height: '28px', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  );
}
