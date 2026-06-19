import { Save } from 'lucide-react';
import { useState } from 'react';
import { hostUpdateProfile, type HostData } from '../../lib/api';
import { useHostAuth } from './HostAuthContext';

export default function HostProfile() {
  const { passcode, host, login } = useHostAuth();
  const [bio, setBio] = useState(host?.bio || '');
  const [profileImage, setProfileImage] = useState(host?.profileImage || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSave() {
    if (!passcode || !host) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await hostUpdateProfile(passcode, { bio, profileImage });
      const updatedHost: HostData = { ...host, bio, profileImage };
      login(passcode, updatedHost);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-dark">My Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your public host profile.</p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Name</label>
            <input
              type="text"
              value={host?.name || ''}
              disabled
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-muted text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
            <input
              type="email"
              value={host?.email || ''}
              disabled
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-muted text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone</label>
            <input
              type="tel"
              value={host?.phone || ''}
              disabled
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-muted text-muted-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Experience</label>
            <input
              type="text"
              value={host?.experience || ''}
              disabled
              className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-muted text-muted-foreground"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal/50 transition-colors resize-none"
            placeholder="Tell viewers about yourself..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Profile Image URL</label>
          <input
            type="url"
            value={profileImage}
            onChange={(e) => setProfileImage(e.target.value)}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal/50 transition-colors"
            placeholder="https://example.com/photo.jpg"
          />
        </div>

        {message && (
          <p className="text-xs text-teal font-semibold bg-teal/5 border border-teal/20 rounded-lg px-3 py-2">
            {message}
          </p>
        )}
        {error && (
          <p className="text-xs text-coral font-semibold bg-coral/5 border border-coral/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="bg-teal text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 hover:bg-teal/90 transition-colors disabled:opacity-60"
        >
          <Save className="size-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
