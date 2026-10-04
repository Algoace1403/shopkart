import { useCallback, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { api } from '../services/api';

// Wishlist uses ordinary parent state and props, without a global state library.
export default function ShopLayout() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const version = useRef(0);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const loadWishlist = useCallback(async (signal) => {
    const current = ++version.current;
    setLoading(true);
    setError('');
    try {
      const data = await api('/wishlist', { signal });
      if (current === version.current) setWishlist(data.wishlist);
    } catch (error) {
      if (signal?.aborted) return;
      if (current !== version.current) return;
      if (error.status === 401) navigate('/login', { replace: true });
      else setError('Unable to load wishlist.');
    } finally {
      if (!signal?.aborted && current === version.current) setLoading(false);
    }
  }, [navigate]);
  useEffect(() => {
    const controller = new AbortController();
    // Refresh backend product details and membership when navigating between pages.
    // oxlint-disable-next-line react/set-state-in-effect
    loadWishlist(controller.signal);
    return () => controller.abort();
  }, [loadWishlist, pathname]);

  function refreshWishlist() {
    setLoading(true);
    setError('');
    return loadWishlist();
  }

  async function changeWishlist(product, remove) {
    try {
      await api(`/wishlist/${product._id}`, { method: remove ? 'DELETE' : 'POST' });
      // Fetch populated products so both the page and count reflect server data.
      await loadWishlist();
    } catch (error) {
      if (error.status === 401) navigate('/login', { replace: true });
      if (error.status === 409 || error.status === 404) await refreshWishlist();
      throw error;
    }
  }
  return <>
    <Navbar wishlistCount={loading || error ? null : wishlist.length} />
    <Outlet context={{ wishlist, loading, error, refreshWishlist, changeWishlist }} />
  </>;
}
