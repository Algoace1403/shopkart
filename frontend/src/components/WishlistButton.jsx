import { useRef, useState } from 'react';

export default function WishlistButton({ product, saved, onChange, disabled, removeOnly = false }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const busy = useRef(false);
  async function toggle() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError('');
    setMessage('');
    try {
      await onChange(product, saved);
      setMessage(saved ? 'Removed from wishlist' : '♥ Added to Wishlist');
    } catch (error) { setError(error.message || 'Unable to save product. Please try again.'); }
    finally { busy.current = false; setPending(false); }
  }
  return <div>
    <button className="button-secondary" type="button" disabled={disabled || pending} onClick={toggle}>
      {pending ? saved ? 'Removing...' : 'Saving...' : saved || removeOnly ? '♥ Remove from Wishlist' : '♡ Add to Wishlist'}
    </button>
    {message && <p role="status">{message}</p>}
    {error && <p className="error" role="alert">{error}</p>}
  </div>;
}
