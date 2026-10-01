import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { api } from '../services/api';

// Login page: controlled inputs keep form values in React state.
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Track the error message and disable submission while a request is running.
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Submit without reloading the page, then navigate after the backend succeeds.
  async function handleSubmit(event) {
    // Stop the browser from performing a normal HTML form submission.
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/customers/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      navigate('/home');
    } catch {
      setError('Invalid Credentials');
    } finally {
      // Allow another attempt after either success or failure.
      setLoading(false);
    }
  }
  // Each input reads its state value and updates it through onChange.
  return (
    <AuthLayout>
      <p className="eyebrow">Your ShopKart account</p><h1>Welcome back.</h1><p className="intro">Log in to pick up where you left off.</p>
      <form onSubmit={handleSubmit}>
        <label>Email<input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
        {/* Show the validation or login error when one exists. */}
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      <p>New customer? <Link to="/register">Create Account</Link></p>
    </AuthLayout>
  );
}
