import { useState } from 'react';
import { useCart } from '../context/useCart';

export default function AddToCartButton({ product }) {
  const { addToCart, cartItems, pendingId, loading } = useCart();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const item = cartItems.find(item => item.product._id === product._id);
  const quantity = item?.quantity || 0;
  const stock = item?.product.stock ?? product.stock;
  async function add() {
    setError('');
    setMessage('');
    try { await addToCart(product._id); setMessage('Added to cart'); }
    catch (error) { setError(error.message || 'Unable to add product. Please try again.'); }
  }
  return <div>
    <button type="button" disabled={loading || !!pendingId || stock <= quantity} onClick={add}>
      {pendingId === product._id ? 'Adding...' : stock === 0 ? 'Out of stock' : stock <= quantity ? 'Stock limit reached' : quantity ? 'Add Another' : 'Add to Cart'}
    </button>
    {message && <p role="status">{message}</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </div>;
}
