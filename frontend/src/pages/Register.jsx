import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { api } from '../services/api';

// Register page: controlled inputs keep form values in React state.
export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '' });
  // Track the error message and disable submission while a request is running.
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Update only the field whose name matches the changed input.
  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }
  // Submit without reloading the page, then navigate after the backend succeeds.
  async function handleSubmit(event) {
    // Stop the browser from performing a normal HTML form submission.
    event.preventDefault();
    setError('');
    // Check the lab validation rules before sending the registration request.
    if (Object.values(form).some(value => !value.trim())) return setError('All fields are required');
    if (form.password.length < 6) return setError('Password must contain at least 6 characters');
    setLoading(true);
    try {
      await api('/customers/register', { method: 'POST', body: JSON.stringify(form) });
      navigate('/login');
    } catch (error) {
      setError(error.message);
    } finally {
      // Allow another attempt after either success or failure.
      setLoading(false);
    }
  }
  // Each input reads its state value and updates it through onChange.
  return (
    <AuthLayout>
      <p className="eyebrow">A fresh start</p><h1>Make yourself at home.</h1><p className="intro">Create an account to save your favorites and start shopping.</p>
      <form onSubmit={handleSubmit}>
        <label>Full Name<input name="fullName" autoComplete="name" placeholder="Your full name" value={form.fullName} onChange={handleChange} required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required /></label>
        <label>Password<input name="password" type="password" autoComplete="new-password" placeholder="At least 6 characters" value={form.password} onChange={handleChange} minLength={6} required /></label>
        <label>Phone Number<input name="phone" type="tel" autoComplete="tel" placeholder="Your phone number" value={form.phone} onChange={handleChange} required /></label>
        {/* Show the validation or login error when one exists. */}
        {error && <p className="error" role="alert">{error}</p>}
        <button disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </AuthLayout>
  );
}
