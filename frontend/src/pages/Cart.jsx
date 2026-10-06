import { Link } from 'react-router-dom';
import { useCart } from '../context/useCart';
import CartItem from '../components/CartItem';

export default function Cart() {
  const { cartItems, loading, error, refreshCart, totalItems, subtotal } = useCart();
  return <main>
    <header className="page-heading"><div><p className="eyebrow">Your next good finds</p><h1>My Cart</h1><p className="intro">A little closer to yours.</p></div><Link className="button button-secondary" to="/products">Continue Shopping →</Link></header>
    {loading ? <div className="loading-state" role="status"><span className="spinner" />Loading your cart...</div> : error ? <div role="alert">
      <p className="error">{error}</p><button onClick={refreshCart}>Try Again</button>
    </div> : cartItems.length === 0 ? <div className="empty-state">
      <h2>Your cart is empty 🛒</h2><p>Looks like you haven't added anything yet.</p>
      <Link className="button" to="/products">Browse Products</Link>
    </div> : <div className="cart-layout">
      <div className="cart-items">{cartItems.map(item => <CartItem key={item.product._id} item={item} />)}</div>
      <section className="order-summary">
        <h2>Order Summary</h2><p>Items: {totalItems}</p>
        <p className="summary-total">Subtotal: ₹{subtotal.toLocaleString('en-IN')}</p>
        <Link className="button" to="/checkout">Proceed to Checkout</Link>
      </section>
    </div>}
  </main>;
}
