import { useState } from 'react';
import ProductImage from './ProductImage';
import { useCart } from '../context/useCart';

export default function CartItem({ item }) {
  const { product, quantity } = item;
  const { updateQuantity, removeFromCart, pendingId } = useCart();
  const [error, setError] = useState('');
  const reducedQuantity = Math.min(quantity - 1, Math.floor(product.stock));
  async function change(action) {
    setError('');
    try { await action(); }
    catch (error) { setError(error.message || 'Unable to update cart. Please try again.'); }
  }
  return <article className="cart-item">
    <div className="cart-image"><ProductImage product={product} /></div>
    <div className="cart-item-content">
      <h2>{product.name}</h2><p>₹{product.price.toLocaleString('en-IN')}</p>
      <div className="quantity-controls">
        <button aria-label={`Decrease quantity of ${product.name}`} disabled={!!pendingId || reducedQuantity < 1}
          title={quantity - 1 > product.stock ? `Reduce to available stock (${reducedQuantity})` : 'Decrease quantity by 1'}
          onClick={() => change(() => updateQuantity(product._id, reducedQuantity))}>−</button>
        <span aria-label="Quantity">{quantity}</span>
        <button aria-label={`Increase quantity of ${product.name}`} disabled={!!pendingId || quantity >= product.stock}
          onClick={() => change(() => updateQuantity(product._id, quantity + 1))}>+</button>
      </div>
      {quantity > product.stock && <p className="error">{product.stock < 1 ? 'Out of stock. Remove this item.' : `Only ${product.stock} units available. Reduce to available stock or remove this item.`}</p>}
      <p>Item total: ₹{(product.price * quantity).toLocaleString('en-IN')}</p>
      <button className="button-remove" disabled={!!pendingId} onClick={() => change(() => removeFromCart(product._id))}>Remove</button>
      {pendingId === product._id && <p role="status">Updating...</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  </article>;
}
