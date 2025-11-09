import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import ProductGrid from './components/ProductGrid.jsx';
import AuthModal from './components/AuthModal.jsx';
import ProductDetailPage from './components/ProductDetailPage.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import useAuth from './hooks/useAuth.js';

export default function App() {
  const { user, login, register, logout } = useAuth();
  const [showAuth, setShowAuth] = React.useState(false);

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <Link to="/" className="link" style={{ padding: 0 }}>
            <span className="brand-bold">Legacy</span>Shop
          </Link>
        </div>
        <div className="header-actions">
          <ThemeToggle />
          {user ? (
            <>
              <span className="welcome">Hi, {user.username}</span>
              <button className="btn" onClick={logout}>Logout</button>
            </>
          ) : (
            <button className="btn" onClick={() => setShowAuth(true)}>Sign in</button>
          )}
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<ProductGrid user={user} />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
        </Routes>
      </main>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLogin={login}
          onRegister={register}
        />)
      }

      <footer className="footer">© {new Date().getFullYear()} LegacyShop</footer>
    </div>
  );
}
