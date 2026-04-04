import { useEffect, useState } from 'react';
import { UploadScreen } from './components/UploadScreen';
import { StudyScreen } from './components/StudyScreen';
import { DeckListScreen } from './components/DeckListScreen';
import { StatsScreen } from './components/StatsScreen';
import { AuthScreen } from './components/AuthScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { LayoutGrid, GraduationCap, BarChart3, Languages, UserCircle } from 'lucide-react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { firebaseAuth } from './lib/firebase';
import { setAuthTokenGetter, syncAuthUser } from './lib/api';

type View = 'upload' | 'decklist' | 'study' | 'stats' | 'profile';

function App() {
  const [view, setView] = useState<View>('upload');
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setAuthTokenGetter(async () => {
      const user = firebaseAuth.currentUser;
      if (!user) return null;
      return user.getIdToken();
    });

    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          await syncAuthUser();
        } catch (e) {
          console.error('Backend sync hatası (backend çalışıyor mu?):', e);
        }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUploadSuccess = (deckId: string) => {
    setActiveDeckId(deckId);
    setView('study');
  };

  const handleSelectDeckFromList = (deckId: string) => {
    setActiveDeckId(deckId);
    setView('study');
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Yükleniyor...</div>;
  }

  if (!firebaseUser) {
    return <AuthScreen onAuthSuccess={async () => { await syncAuthUser(); }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-slate-200 flex flex-col items-stretch py-6 bg-white min-h-screen">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
            <Languages className="w-7 h-7 text-white" />
          </div>
        </div>

        <nav className="flex flex-col gap-4 w-full px-4 flex-1">
          <button
            onClick={() => setView('profile')}
            className={`flex items-center justify-center p-4 rounded-2xl transition-all ${view === 'profile' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="Hesabım"
          >
            <UserCircle className="w-6 h-6" />
          </button>
          <button
            onClick={() => setView('upload')}
            className={`flex items-center justify-center p-4 rounded-2xl transition-all ${view === 'upload' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="PDF analizi"
          >
            <LayoutGrid className="w-6 h-6" />
          </button>
          <button
            onClick={() => setView('decklist')}
            className={`flex items-center justify-center p-4 rounded-2xl transition-all ${(view === 'decklist' || view === 'study') ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="Derslerim"
          >
            <GraduationCap className="w-6 h-6" />
          </button>
          <button
            onClick={() => setView('stats')}
            className={`flex items-center justify-center p-4 rounded-2xl transition-all ${view === 'stats' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
            title="İstatistikler"
          >
            <BarChart3 className="w-6 h-6" />
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        <header className="px-10 py-6 flex items-center bg-white/50 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">LexiCore</h2>
            <p className="text-sm text-slate-500">
              {view === 'upload' && 'Yeni PDF Analizi'}
              {view === 'decklist' && 'Derslerim'}
              {view === 'study' && 'Kelime Çalışması'}
              {view === 'stats' && 'Öğrenme İstatistikleri'}
              {view === 'profile' && 'Hesabım'}
            </p>
          </div>
        </header>

        <section className="p-10">
          {view === 'upload' && <UploadScreen onUploadSuccess={handleUploadSuccess} />}
          {view === 'decklist' && <DeckListScreen onSelectDeck={handleSelectDeckFromList} />}
          {view === 'study' && activeDeckId && <StudyScreen deckId={activeDeckId} onBack={() => setView('decklist')} />}
          {view === 'stats' && <StatsScreen onSelectDeck={handleSelectDeckFromList} />}
          {view === 'profile' && (
            <ProfileScreen user={firebaseUser} onUserUpdated={setFirebaseUser} />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
