import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

import { CartContext } from './useCart';

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const busy = useRef(false);
  const requestVersion = useRef(0);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const loadCart = useCallback(async (signal, background = false) => {
    const version = ++requestVersion.current;
    if (!background) setLoading(true);
    setError('');
    try {
      const data = await api('/cart', { signal });
      if (version === requestVersion.current) setCartItems(data.cart);
    } catch (error) {
      if (signal?.aborted) return;
      if (version !== requestVersion.current) return;
      if (error.status === 401) navigate('/login', { replace: true });
      else setError('Unable to load your cart.');
    } finally {
      if (!signal?.aborted && version === requestVersion.current) setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // A pending mutation will return the latest populated cart itself.
    if (busy.current) return;
    const controller = new AbortController();
    // Keep this single shared copy current when opening a different shop page.
    // oxlint-disable-next-line react/set-state-in-effect
    loadCart(controller.signal);
    return () => controller.abort();
  }, [loadCart, pathname]);

  function refreshCart() {
    if (busy.current) return;
    setLoading(true);
    setError('');
    return loadCart();
  }

  async function mutate(method, productId, quantity) {
    if (busy.current) throw new Error('A cart update is already in progress. Please try again.');
    busy.current = true;
    const version = ++requestVersion.current;
    setPendingId(productId);
    try {
      const data = await api(`/cart/${productId}`, {
        method, ...(quantity !== undefined && { body: JSON.stringify({ quantity }) })
      });
      if (version === requestVersion.current) {
        setCartItems(data.cart);
        setError('');
      }
    } catch (error) {
      if (error.status === 401) navigate('/login', { replace: true });
      // Reconcile changed stock, removed products or edits from another session.
      else if ([400, 404, 409].includes(error.status)) await loadCart(undefined, true);
      throw error;
    } finally {
      busy.current = false;
      setPendingId(null);
      setLoading(false);
    }
  }

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  return <CartContext.Provider value={{
    cartItems, loading, error, pendingId, totalItems, subtotal, refreshCart,
    addToCart: id => mutate('POST', id),
    removeFromCart: id => mutate('DELETE', id),
    updateQuantity: (id, quantity) => mutate('PATCH', id, quantity)
  }}>{children}</CartContext.Provider>;
}
