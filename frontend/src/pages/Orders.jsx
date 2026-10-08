import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';

function OrderCard({ order, details }) {
  const steps = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  const address = order.shippingAddress;
  return <article className="order-card">
    <h2>Order #{order._id}</h2>
    <p>{new Date(order.createdAt).toLocaleString('en-IN')}</p>
    <p className={`order-status ${order.paymentStatus === 'PAID' ? 'paid' : ''}`}>{order.status.replaceAll('_', ' ')} · Payment {order.paymentStatus}</p>
    {order.items.map(item => <div className="order-line" key={item.product}>
      <span>{item.name} × {item.quantity}</span><span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
    </div>)}
    <p className="summary-total">Total: ₹{order.totalAmount.toLocaleString('en-IN')}</p>
    {details ? <>
      {order.paymentStatus === 'PAID' && <ol className="order-progress" aria-label="Order progress">{steps.map((step, index) => <li key={step} className={index <= steps.indexOf(order.status) ? 'complete' : ''} aria-current={step === order.status ? 'step' : undefined}>{step}</li>)}</ol>}
      <h3>Shipping Details</h3><p>{address.fullName}<br />{address.addressLine1}<br />{address.city}, {address.state} — {address.pincode}<br />{address.phone}</p>
      {order.razorpayPaymentId && <p>Payment ID: {order.razorpayPaymentId}</p>}
    </> : <Link to={`/orders/${order._id}`}>View Details →</Link>}
  </article>;
}

export default function Orders() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api(id ? `/orders/${id}` : '/orders', { signal: controller.signal })
      .then(data => setResult({ id, data }))
      .catch(error => {
        if (controller.signal.aborted) return;
        if (error.status === 401) navigate('/login', { replace: true });
        else setResult({ id, error: error.message || 'Unable to load orders.' });
      });
    return () => controller.abort();
  }, [id, navigate, attempt]);
  const data = result && result.id === id ? result.data : null;
  const error = result && result.id === id ? result.error : null;
  return <main>
    <header className="page-heading"><div><p className="eyebrow">Your ShopKart journey</p><h1>{id ? (data?.order.paymentStatus === 'PAID' ? 'Order Placed Successfully' : 'Order Details') : 'My Orders'}</h1></div><Link to="/products" className="button button-secondary">Continue Shopping →</Link></header>
    {error ? <div role="alert"><p className="error">{error}</p><button onClick={() => { setResult(null); setAttempt(attempt + 1); }}>Try Again</button></div> : !data ? <p role="status">Loading orders…</p> : id ? <><OrderCard order={data.order} details /><Link to="/orders">View My Orders</Link></> : data.orders.length ? <div className="orders-list">{data.orders.map(order => <OrderCard key={order._id} order={order} />)}</div> : <div className="empty-state"><h2>You have not placed any orders yet.</h2><Link className="button" to="/products">Start Shopping</Link></div>}
  </main>;
}
