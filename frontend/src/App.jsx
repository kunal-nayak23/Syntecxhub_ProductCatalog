import { useEffect, useRef, useState } from 'react';
import api from './api.js';

const BLANK = { name: '', description: '', price: '', category: '', brand: '', quantity: '' };
const msgOf = (err) => err.response?.data?.message || 'Something went wrong. Please try again.';

/* ──────────────────────────────── Auth ─────────────────────────────────── */
function Auth({ onSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/auth/${isSignup ? 'signup' : 'login'}`, form);
      onSuccess(data);
    } catch (err) {
      setError(msgOf(err));
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => { setIsSignup((v) => !v); setError(''); };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">PRODUCT CATALOG</p>
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">Manage inventory with a secure, simple dashboard.</p>
        <form onSubmit={submit}>
          {isSignup && (
            <label>
              Name
              <input required minLength={2} value={form.name} onChange={field('name')} placeholder="Your full name" />
            </label>
          )}
          <label>
            Email
            <input required type="email" value={form.email} onChange={field('email')} placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input required type="password" minLength={6} value={form.password} onChange={field('password')} placeholder="Min. 6 characters" />
          </label>
          {error && <p className="alert error">{error}</p>}
          <button disabled={loading}>{loading ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}</button>
        </form>
        <button className="link" onClick={toggle}>
          {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </section>
    </main>
  );
}

/* ────────────────────────────── Product Form ───────────────────────────── */
function ProductForm({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product || BLANK);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const field = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, price: Number(form.price), quantity: Number(form.quantity) };
      const result = product
        ? await api.put(`/products/${product._id}`, payload)
        : await api.post('/products', payload);
      onSaved(result.data.product);
    } catch (err) {
      setError(msgOf(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal">
        <div className="modal-head">
          <h2>{product ? 'Edit product' : 'Add product'}</h2>
          <button className="icon" onClick={onClose} type="button" aria-label="Close">×</button>
        </div>
        <form className="product-form" onSubmit={submit}>
          <label>
            Name
            <input required minLength={2} value={form.name} onChange={field('name')} placeholder="Product name" />
          </label>
          <label>
            Category
            <input required minLength={2} value={form.category} onChange={field('category')} placeholder="e.g. Electronics" />
          </label>
          <label>
            Brand
            <input required minLength={2} value={form.brand} onChange={field('brand')} placeholder="Brand name" />
          </label>
          <label>
            Price ($)
            <input required type="number" min={0} step={0.01} value={form.price} onChange={field('price')} placeholder="0.00" />
          </label>
          <label>
            Quantity
            <input required type="number" min={0} step={1} value={form.quantity} onChange={field('quantity')} placeholder="0" />
          </label>
          <label className="wide">
            Description
            <textarea required minLength={5} value={form.description} onChange={field('description')} placeholder="Short product description…" />
          </label>
          {error && <p className="alert error wide">{error}</p>}
          <div className="actions wide">
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

/* ─────────────────────────────── Dashboard ─────────────────────────────── */
function Dashboard({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ search: '', category: '' });
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 0, totalProducts: 0, limit: 8 });
  const [modal, setModal] = useState(null); // null | BLANK | product-object
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const noticeTimer = useRef(null);

  const showNotice = (msg) => {
    setNotice(msg);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(''), 4000);
  };

  const load = async () => {
    try {
      setError('');
      const { data } = await api.get('/products', {
        params: { search: filters.search || undefined, category: filters.category || undefined, page, limit: 8 },
      });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError(msgOf(err));
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await api.get('/products/stats');
      setStats(data.stats);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  useEffect(() => { load(); }, [page, filters.search, filters.category]); // eslint-disable-line
  useEffect(() => { loadStats(); }, []); // eslint-disable-line

  const saved = (product) => {
    setModal(null);
    showNotice(`"${product.name}" saved successfully.`);
    load();
    loadStats();
  };

  const remove = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${product._id}`);
      showNotice(`"${product.name}" deleted.`);
      if (products.length === 1 && page > 1) setPage((p) => p - 1);
      else { load(); loadStats(); }
    } catch (err) {
      setError(msgOf(err));
    }
  };

  const setFilter = (key) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: e.target.value }));
  };

  return (
    <main className="app">
      <header>
        <div>
          <p className="eyebrow">PRODUCT CATALOG</p>
          <h1>Inventory dashboard</h1>
          <p className="muted">Hello, <strong>{user.name}</strong>. Keep your catalog organised and current.</p>
        </div>
        <div className="header-actions">
          <button id="btn-add-product" onClick={() => setModal(BLANK)}>+ Add product</button>
          <button className="secondary" onClick={onLogout}>Log out</button>
        </div>
      </header>

      {error && <p className="alert error" role="alert">{error}</p>}
      {notice && <p className="alert success" role="status">{notice}</p>}

      {/* ── Stats ── */}
      <section className="stats" aria-label="Inventory statistics">
        {stats ? (
          <>
            <article>
              <span>Total products</span>
              <strong>{stats.overview.totalProducts}</strong>
            </article>
            <article>
              <span>Inventory units</span>
              <strong>{stats.overview.totalInventoryQuantity}</strong>
            </article>
            <article>
              <span>Average price</span>
              <strong>${stats.overview.averageProductPrice?.toFixed(2) ?? '0.00'}</strong>
            </article>
            <article>
              <span>Categories</span>
              <strong>{stats.byCategory.length}</strong>
            </article>
          </>
        ) : (
          <>
            {[0, 1, 2, 3].map((i) => (
              <article key={i} className="skeleton">
                <span>&nbsp;</span>
                <strong>&nbsp;</strong>
              </article>
            ))}
          </>
        )}
      </section>

      {/* ── Product table ── */}
      <section className="catalog">
        <div className="catalog-head">
          <h2>Products</h2>
          <div className="filters">
            <input
              id="search-input"
              placeholder="Search by name or description"
              value={filters.search}
              onChange={setFilter('search')}
              aria-label="Search products"
            />
            <input
              id="category-filter"
              placeholder="Filter by category"
              value={filters.category}
              onChange={setFilter('category')}
              aria-label="Filter by category"
            />
          </div>
        </div>

        {products.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <strong>{p.name}</strong>
                      <small>{p.description}</small>
                    </td>
                    <td><span className="tag">{p.category}</span></td>
                    <td>{p.brand}</td>
                    <td>${p.price.toFixed(2)}</td>
                    <td>
                      <span className={p.quantity === 0 ? 'tag out-of-stock' : 'tag in-stock'}>
                        {p.quantity}
                      </span>
                    </td>
                    <td>
                      <button
                        className="small secondary"
                        onClick={() => setModal(p)}
                        aria-label={`Edit ${p.name}`}
                      >
                        Edit
                      </button>
                      <button
                        className="small danger"
                        onClick={() => remove(p)}
                        aria-label={`Delete ${p.name}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            {filters.search || filters.category
              ? 'No products match these filters.'
              : 'No products yet. Click "+ Add product" to get started.'}
          </div>
        )}

        <div className="pagination">
          <span>
            {pagination.totalProducts} product{pagination.totalProducts !== 1 ? 's' : ''} found
          </span>
          <div>
            <button
              className="secondary small"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Previous
            </button>
            <span>Page {pagination.currentPage} of {pagination.totalPages || 1}</span>
            <button
              className="secondary small"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      </section>

      {/* ── Category insights ── */}
      {stats?.byCategory?.length > 0 && (
        <section className="categories">
          <h2>Category insights</h2>
          <div className="category-grid">
            {stats.byCategory.map((item) => (
              <article key={item.category}>
                <h3>{item.category}</h3>
                <p>{item.productCount} product{item.productCount !== 1 ? 's' : ''} · {item.inventoryQuantity} units</p>
                <p>Avg price: <strong>${item.averagePrice.toFixed(2)}</strong></p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── Modal ── */}
      {modal !== null && (
        <ProductForm
          product={modal._id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={saved}
        />
      )}
    </main>
  );
}

/* ───────────────────────────── Root App ────────────────────────────────── */
export default function App() {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem('catalog_token');
    const user = localStorage.getItem('catalog_user');
    return token && user ? { token, user: JSON.parse(user) } : null;
  });

  // Auto-logout on 401 (expired token)
  useEffect(() => {
    const id = api.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err.response?.status === 401) logout();
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, []); // eslint-disable-line

  const login = (data) => {
    localStorage.setItem('catalog_token', data.token);
    localStorage.setItem('catalog_user', JSON.stringify(data.user));
    setSession({ token: data.token, user: data.user });
  };

  const logout = () => {
    localStorage.removeItem('catalog_token');
    localStorage.removeItem('catalog_user');
    setSession(null);
  };

  return session ? <Dashboard user={session.user} onLogout={logout} /> : <Auth onSuccess={login} />;
}
