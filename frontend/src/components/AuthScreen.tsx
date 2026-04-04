import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase';

interface AuthScreenProps {
  onAuthSuccess: () => Promise<void> | void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        if (name.trim()) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      await onAuthSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Giriş işlemi başarısız oldu.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">LexiCore</h1>
        <p className="text-slate-500 mb-6">
          {isRegister ? 'Hesap oluştur ve öğrenmeye başla.' : 'Devam etmek için giriş yap.'}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {isRegister && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ad Soyad"
              className="w-full rounded-xl border border-slate-200 px-4 py-3"
            />
          )}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            type="email"
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Şifre"
            type="password"
            required
            minLength={6}
            className="w-full rounded-xl border border-slate-200 px-4 py-3"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold disabled:opacity-60"
          >
            {loading ? 'İşleniyor...' : isRegister ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </form>

        <button
          onClick={() => setIsRegister((v) => !v)}
          className="mt-4 text-sm text-primary-700 font-medium"
        >
          {isRegister ? 'Zaten hesabın var mı? Giriş Yap' : 'Hesabın yok mu? Kayıt Ol'}
        </button>
      </div>
    </div>
  );
};
