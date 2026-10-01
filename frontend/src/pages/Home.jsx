import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import ChangePassword from '../components/ChangePassword';
import { api } from '../services/api';

// Protected home page: ask the backend who owns the current login cookie.
export default function Home() {
  // null means the profile has not loaded yet.
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // Fetch the profile when this page opens.
  useEffect(() => {
    // Ignore a response if the user has already left this page.
    let active = true;
    api('/customers/me').then(data => {
      if (active) setCustomer(data);
    }).catch(error => {
      if (!active) return;
      // An absent or invalid login cookie sends the visitor back to Login.
      if (error.status === 401) navigate('/login', { replace: true });
      else setError('Unable to load your profile.');
    });
    return () => { active = false; };
  }, [navigate]);
  // Display a message while loading or when the server cannot return a profile.
  if (error) return <main><p className="error" role="alert">{error}</p></main>;
  if (!customer) return <main><p role="status">Loading profile...</p></main>;
  // Show customer details only after authentication succeeds.
  return (
    <>
      <main>
        <section className="home-hero">
          <div><p className="eyebrow">Your everyday, thoughtfully chosen</p><h1>Welcome, {customer.fullName}!</h1><p>Something useful. Something you love.<br />Discover your next favorite at ShopKart.</p><Link className="button" to="/products">Browse Products <Icon name="arrow" size={18} /></Link></div>
          <div className="hero-art" aria-hidden="true"><span className="hero-orbit" /><Icon size={116} /><span className="hero-caption">Good finds.<br />Great everyday.</span></div>
        </section>
        <div className="home-grid">
          <section className="profile-panel"><p className="eyebrow">A space of your own</p><h2>Your account</h2><dl><div><dt>Name</dt><dd>{customer.fullName}</dd></div><div><dt>Email</dt><dd>{customer.email}</dd></div><div><dt>Phone</dt><dd>{customer.phone}</dd></div></dl><ChangePassword /></section>
          <Link className="feature-link" to="/wishlist"><span className="feature-icon"><Icon name="heart" size={26} /></span><h2>Saved for later</h2><p>All the things that caught your eye, in one place.</p><span className="text-action">Open Wishlist <Icon name="arrow" size={18} /></span></Link>
          <Link className="feature-link" to="/cart"><span className="feature-icon"><Icon size={26} /></span><h2>Ready when you are</h2><p>Review your picks and make room for something new.</p><span className="text-action">View Cart <Icon name="arrow" size={18} /></span></Link>
        </div>
      </main>
    </>
  );
}
