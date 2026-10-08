import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { api } from '../services/api';
import { loadRazorpay, openPayment } from '../services/razorpay';

const fields = [
  ['fullName', 'Full name', 'name'], ['phone', 'Phone', 'tel'],
  ['addressLine1', 'Address', 'street-address'], ['city', 'City', 'address-level2'],
  ['state', 'State', 'address-level1'], ['pincode', 'Pincode', 'postal-code']
];

export default function Checkout() {
  const { cartItems, loading, error: cartError, pendingId, subtotal, refreshCart } = useCart();
  const [address, setAddress] = useState(Object.fromEntries(fields.map(([key]) => [key, ''])));
  const [error, setError] = useState('');
  const [stage, setStage] = useState('');
  const [verification, setVerification] = useState(null);
  const busy = useRef(false);
  const navigate = useNavigate();

  async function verify(payload) {
    setStage('Verifying payment…');
    const data = await api('/orders/verify-payment', { method: 'POST', body: JSON.stringify(payload) });
    setVerification(null);
    await refreshCart();
    navigate(`/orders/${data.order._id}`, { replace: true });
  }

  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;
    setError('');
    const shippingAddress = Object.fromEntries(Object.entries(address).map(([key, value]) => [key, value.trim()]));
    if (!verification) {
      if (Object.values(shippingAddress).some(value => !value)) return setError('Please fill in every shipping field.');
      if (!/^\d{10}$/.test(shippingAddress.phone)) return setError('Phone must contain 10 digits.');
      if (!/^\d{6}$/.test(shippingAddress.pincode)) return setError('Pincode must contain 6 digits.');
    }
    busy.current = true;
    try {
      if (verification) return await verify(verification);
      setStage('Preparing payment…');
      await loadRazorpay();
      const data = await api('/orders/create-payment-order', { method: 'POST', body: JSON.stringify({ shippingAddress }) });
      setStage('Complete payment in Razorpay…');
      const response = await openPayment(data, shippingAddress);
      const payload = { shopKartOrderId: data.shopKartOrderId, ...response };
      setVerification(payload);
      await verify(payload);
    } catch (error) {
      if (error.status === 401) navigate('/login', { replace: true });
      else setError(error.message);
    } finally {
      busy.current = false;
      setStage('');
    }
  }

  return <main>
    <header className="page-heading"><div><p className="eyebrow">The final step</p><h1>Checkout</h1><p className="intro">Review your finds and add a delivery address.</p></div><Link to="/cart">Back to Cart</Link></header>
    {loading && !verification ? <p role="status">Loading your cart…</p> : cartError && !verification ? <div role="alert"><p className="error">{cartError}</p><button onClick={refreshCart}>Try Again</button></div> : !cartItems.length && !verification ? <div className="empty-state"><h2>Your cart is empty</h2><Link className="button" to="/products">Browse Products</Link></div> :
      <form className="cart-layout checkout-form" onSubmit={submit} noValidate>
        <section className="shipping-panel"><h2>Shipping Details</h2>
          <fieldset disabled={!!stage || !!verification}>
            {fields.map(([key, label, autoComplete]) => <label key={key}>{label}<input
              name={key} value={address[key]} required maxLength={250} autoComplete={autoComplete}
              type={key === 'phone' ? 'tel' : 'text'} inputMode={['phone', 'pincode'].includes(key) ? 'numeric' : undefined}
              onChange={event => setAddress({ ...address, [key]: event.target.value })} /></label>)}
          </fieldset>
        </section>
        <section className="order-summary"><h2>Order Summary</h2>
          {cartItems.map(({ product, quantity }) => <p key={product._id}>{product.name} × {quantity}<br />₹{(product.price * quantity).toLocaleString('en-IN')}</p>)}
          <p className="summary-total">Total: ₹{subtotal.toLocaleString('en-IN')}</p>
          <p>Test payments only. Final prices and availability are checked before payment.</p>
          {error && <p className="error" role="alert">{error}</p>}
          {verification && <p>Payment details received. Retry verification if confirmation failed; you will not be charged again.</p>}
          <button disabled={!!stage || !!pendingId}>{stage || (verification ? 'Retry Verification' : 'Place Order · Pay with Razorpay')}</button>
          {stage && <p role="status">{stage}</p>}
        </section>
      </form>}
  </main>;
}
