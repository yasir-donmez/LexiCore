import { useEffect, useRef, useState } from 'react';
import { signOut, updateProfile, type User } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Camera,
  Loader2,
  LogOut,
  Pencil,
  Mail,
  Target,
  Sparkles,
  Save,
} from 'lucide-react';
import { firebaseAuth, firebaseStorage } from '../lib/firebase';
import { getBio, getDailyGoal, getPrefLevel, setBio, setDailyGoal, setPrefLevel } from '../lib/profilePrefs';

interface ProfileScreenProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const GOALS = ['5', '10', '15', '20', '30'] as const;

export function ProfileScreen({ user, onUserUpdated }: ProfileScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(user.displayName ?? '');
  const [savingName, setSavingName] = useState(false);

  const [level, setLevel] = useState(() => getPrefLevel());
  const [dailyGoal, setDailyGoalState] = useState(() => getDailyGoal());
  const [bio, setBioState] = useState(() => getBio());
  const [bioDirty, setBioDirty] = useState(false);

  useEffect(() => {
    setNameDraft(user.displayName ?? '');
  }, [user.displayName, user.uid]);

  const photoUrl = user.photoURL;
  const initials =
    (user.displayName?.trim()?.[0] ?? user.email?.[0] ?? '?').toUpperCase();

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('Dosya en fazla 4 MB olabilir.');
      return;
    }

    const authUser = firebaseAuth.currentUser;
    if (!authUser) return;

    setUploading(true);
    try {
      const ext = file.type === 'image/png' ? 'png' : 'jpg';
      const storageRef = ref(firebaseStorage, `profiles/${authUser.uid}/avatar.${ext}`);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      await updateProfile(authUser, { photoURL: url });
      await authUser.reload();
      const refreshed = firebaseAuth.currentUser;
      if (refreshed) onUserUpdated(refreshed);
    } catch (err) {
      console.error(err);
      alert(
        'Fotoğraf yüklenemedi. Firebase Console’da Storage’ı açtığınızdan ve güvenlik kurallarının yazmaya izin verdiğinden emin olun.'
      );
    } finally {
      setUploading(false);
    }
  };

  const saveDisplayName = async () => {
    const authUser = firebaseAuth.currentUser;
    if (!authUser) return;
    setSavingName(true);
    try {
      await updateProfile(authUser, { displayName: nameDraft.trim() || undefined });
      await authUser.reload();
      const refreshed = firebaseAuth.currentUser;
      if (refreshed) onUserUpdated(refreshed);
      setEditingName(false);
    } catch (err) {
      console.error(err);
      alert('İsim güncellenemedi.');
    } finally {
      setSavingName(false);
    }
  };

  const saveBio = () => {
    setBio(bio);
    setBioDirty(false);
  };

  const pickLevel = (lvl: string) => {
    setLevel(lvl);
    setPrefLevel(lvl);
  };

  const pickGoal = (g: string) => {
    setDailyGoalState(g);
    setDailyGoal(g);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Sol: kimlik */}
        <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/80 shadow-lg shadow-slate-200/50 p-6 md:p-8 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <button
              type="button"
              onClick={handlePickPhoto}
              disabled={uploading}
              className="group relative w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-gradient-to-tr from-primary-500 to-sky-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
              title="Profil fotoğrafı"
            >
              {photoUrl ? (
                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-3xl font-black text-white">
                  {initials}
                </span>
              )}
              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading ? (
                  <Loader2 className="w-9 h-9 text-white animate-spin" />
                ) : (
                  <Camera className="w-9 h-9 text-white" />
                )}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {editingName ? (
            <div className="w-full space-y-3">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Ad Soyad"
                className="w-full text-center rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 font-medium"
              />
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(user.displayName ?? '');
                    setEditingName(false);
                  }}
                  className="text-sm px-3 py-1.5 text-slate-500"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={savingName}
                  onClick={saveDisplayName}
                  className="text-sm px-4 py-1.5 rounded-lg bg-primary-600 text-white disabled:opacity-50"
                >
                  {savingName ? '...' : 'Kaydet'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-slate-900 truncate max-w-[14rem]">
                {user.displayName || 'Adını ekle'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setNameDraft(user.displayName ?? '');
                  setEditingName(true);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 shrink-0"
                title="Düzenle"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mt-2">
            <Mail className="w-4 h-4 shrink-0" />
            <span className="break-all">{user.email}</span>
          </div>

          <button
            type="button"
            onClick={handlePickPhoto}
            disabled={uploading}
            className="mt-5 text-sm font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            Fotoğraf yükle / değiştir
          </button>
        </div>

        {/* Sağ: tercihler */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-3xl bg-white/90 border border-slate-100 shadow-md p-6 md:p-7">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-primary-50 text-primary-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Öğrenme tercihleri</h3>
                <p className="text-xs text-slate-500">PDF analizi ve kart üretiminde kullanılır</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">İngilizce seviyen</p>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => pickLevel(lvl)}
                  className={`min-w-[2.75rem] py-2 px-3 rounded-xl text-sm font-bold transition-all ${
                    level === lvl
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/90 border border-slate-100 shadow-md p-6 md:p-7">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Günlük hedef</h3>
                <p className="text-xs text-slate-500">Günde kaç kelimeyi çalışmak istediğin</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => pickGoal(g)}
                  className={`py-2 px-4 rounded-xl text-sm font-bold transition-all ${
                    dailyGoal === g
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {g} kelime
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/90 border border-slate-100 shadow-md p-6 md:p-7">
            <h3 className="font-bold text-slate-900 mb-1">Kısa not</h3>
            <p className="text-xs text-slate-500 mb-3">Kendine hatırlatma, hedef cümlesi veya ilgi alanların</p>
            <textarea
              value={bio}
              onChange={(e) => {
                setBioState(e.target.value);
                setBioDirty(true);
              }}
              rows={4}
              placeholder="Örn: Bu hafta akademik kelimeler, IELTS hazırlığı..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-100 focus:border-primary-300 outline-none resize-y min-h-[100px]"
            />
            <div className="flex justify-end mt-3">
              <button
                type="button"
                disabled={!bioDirty}
                onClick={saveBio}
                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut(firebaseAuth)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-red-700 bg-red-50 border border-red-100 hover:bg-red-100/80 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
}
