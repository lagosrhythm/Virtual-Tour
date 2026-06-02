import { Globe, LogIn } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { adminLogin } from '../../lib/api';
import { useAdminAuth } from './AdminAuthContext';

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY as string ?? '';

async function signInWithEmailPassword(email: string, password: string): Promise<string> {
  if (!FIREBASE_API_KEY) throw new Error('VITE_FIREBASE_API_KEY is not set in .env');

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );

  const data = await res.json() as { idToken?: string; error?: { message: string } };
  if (!res.ok || !data.idToken) {
    throw new Error(data.error?.message ?? 'Login failed');
  }
  return data.idToken;
}

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = await signInWithEmailPassword(email.trim(), password);
      const result = await adminLogin(token);
      login(token, result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-border p-8 space-y-6">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-coral flex items-center justify-center text-white">
            <Globe className="size-[18px]" />
          </div>
          <span className="font-bold text-lg text-dark">Lagos Rhythm</span>
          <span className="ml-auto text-xs font-bold uppercase tracking-widest text-muted-foreground">Admin</span>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal/50 transition-colors"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal/50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-coral font-semibold bg-coral/5 border border-coral/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-coral text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-coral/90 transition-colors disabled:opacity-60"
          >
            <LogIn className="size-4" />
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
