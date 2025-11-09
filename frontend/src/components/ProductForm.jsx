import React from 'react';
import useApi from '../hooks/useApi.js';
import useAuth from '../hooks/useAuth.js';

export default function ProductForm({ onClose, onSaved }) {
  const [form, setForm] = React.useState({ name: '', price: '', stock_quantity: '', category_id: '', description: '', image_url: '' });
  const [saving, setSaving] = React.useState(false);
  const { token } = useAuth();
  const { data: categories } = useApi('/api/products/categories/');

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const resp = await fetch('/api/products/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          stock_quantity: Number(form.stock_quantity || 0),
          description: form.description,
          category_id: form.category_id || undefined,
          image_url: form.image_url || undefined
        })
      });
      if (!resp.ok) throw new Error(`Failed (${resp.status})`);
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Error saving product');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal" onSubmit={submit}>
        <div className="modal-header">
          <h2>Create product</h2>
          <button type="button" className="icon-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body form-grid">
          <label>Name<input required className="input" value={form.name} onChange={e => update('name', e.target.value)} /></label>
          <label>Price<input required className="input" type="number" step="0.01" value={form.price} onChange={e => update('price', e.target.value)} /></label>
          <label>Stock<input className="input" type="number" value={form.stock_quantity} onChange={e => update('stock_quantity', e.target.value)} /></label>
          <label>Category<select className="select" value={form.category_id} onChange={e => update('category_id', e.target.value)}>
            <option value="">None</option>
            {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
          <label>Image URL<input className="input" value={form.image_url} onChange={e => update('image_url', e.target.value)} /></label>
          <label className="full">Description<textarea className="textarea" value={form.description} onChange={e => update('description', e.target.value)} /></label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button disabled={saving} className="btn primary" type="submit">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
