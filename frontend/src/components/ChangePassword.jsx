import { useState } from 'react';
import { api } from '../services/api';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setError('');
    setMessage('');
    if (newPassword.length < 6) return setError('Use at least 6 characters for your new password.');
    if (newPassword !== confirmation) return setError('New passwords do not match.');
    setPending(true);
    try {
      await api('/customers/change-password', {
        method: 'PATCH', body: JSON.stringify({ oldPassword, newPassword })
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmation('');
      setMessage('Password changed successfully. Use your new password the next time you log in.');
    } catch (error) {
      setError(error.status === 401 ? 'Your current password is incorrect or your session has expired. Check your password or log in again.' : error.message);
    } finally {
      setPending(false);
    }
  }

  return <details className="password-settings">
    <summary>Change password</summary>
    <form onSubmit={submit}>
      <label>Current password<input type="password" autoComplete="current-password" value={oldPassword} onChange={event => setOldPassword(event.target.value)} required disabled={pending} /></label>
      <label>New password<input type="password" autoComplete="new-password" minLength={6} value={newPassword} onChange={event => setNewPassword(event.target.value)} required disabled={pending} /></label>
      <label>Confirm new password<input type="password" autoComplete="new-password" minLength={6} value={confirmation} onChange={event => setConfirmation(event.target.value)} required disabled={pending} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button disabled={pending}>{pending ? 'Updating password...' : 'Update password'}</button>
    </form>
  </details>;
}
