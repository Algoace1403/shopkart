import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Icon from './Icon';
import { useCart } from '../context/useCart';

// Shared navigation for the home and product pages.
export default function Navbar({ wishlistCount }) {
  const { totalItems, loading, error: cartError } = useCart();
  // Display a message if the logout request fails.
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // Ask the backend to clear its HttpOnly cookie, then return to Login.
  async function logout() {
    try {
      await api('/customers/logout', { method: 'POST' });
      navigate('/login', { replace: true });
    } catch (error) {
      // If the session has already expired, the visitor can return to Login directly.
      if (error.status === 401) navigate('/login', { replace: true });
      else setError('Unable to log out. Please try again.');
    }
  }
  return (
    <>
      <nav aria-label="Main navigation">
        <Link to="/home" className="brand" aria-label="ShopKart home"><span className="brand-mark"><Icon /></span>ShopKart<span className="brand-dot">.</span></Link>
        <div className="nav-links">
        <NavLink to="/home">Home</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/wishlist"><Icon name="heart" size={17} />Wishlist ({wishlistCount ?? '…'})</NavLink>
        <NavLink to="/cart"><Icon size={17} />Cart ({loading || cartError ? '…' : totalItems})</NavLink>
        <NavLink to="/orders">My Orders</NavLink>
        </div>
        <button className="button-quiet logout" onClick={logout}>Logout</button>
      </nav>
      {error && <p className="error" role="alert">{error}</p>}
    </>
  );
}
