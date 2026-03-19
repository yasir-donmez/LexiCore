import { useState } from 'react';
import { UploadScreen } from './components/UploadScreen';
import { StudyScreen } from './components/StudyScreen';
import { StatsScreen } from './components/StatsScreen';
import { LayoutGrid, GraduationCap, BarChart3, Languages } from 'lucide-react';

type View = 'upload' | 'study' | 'stats';

function App() {
  const [view, setView] = useState<View>('upload');
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);

  const handleUploadSuccess = (deckId: string) => {
    setActiveDeckId(deckId);
    setView('study');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-24 border-r border-slate-200 flex flex-col items-center py-8 gap-10 bg-white">
        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
          <Languages className="w-7 h-7 text-white" />
        </div>

        <nav className="flex flex-col gap-6">
          <button
            onClick={() => setView('upload')}
            className={`p-4 rounded-2xl transition-all ${view === 'upload' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutGrid className="w-6 h-6" />
          </button>
          <button
            onClick={() => setView('study')}
            disabled={!activeDeckId}
            className={`p-4 rounded-2xl transition-all ${view === 'study' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-600'} 
              ${!activeDeckId ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <GraduationCap className="w-6 h-6" />
          </button>
          <button
            onClick={() => setView('stats')}
            className={`p-4 rounded-2xl transition-all ${view === 'stats' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <BarChart3 className="w-6 h-6" />
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        <header className="px-10 py-6 flex justify-between items-center bg-white/50 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800">LexiCore</h2>
            <p className="text-sm text-slate-500">
              {view === 'upload' && 'Yeni PDF Analizi'}
              {view === 'study' && 'Kelime Çalışması'}
              {view === 'stats' && 'Öğrenme İstatistikleri'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">Yasir Dönmez</p>
              <p className="text-xs text-slate-500">B2 Advanced</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-primary-300 border-2 border-white shadow-md"></div>
          </div>
        </header>

        <section className="p-10">
          {view === 'upload' && <UploadScreen onUploadSuccess={handleUploadSuccess} />}
          {view === 'study' && activeDeckId && <StudyScreen deckId={activeDeckId} onBack={() => setView('upload')} />}
          {view === 'stats' && <StatsScreen />}
        </section>
      </main>
    </div>
  );
}

export default App;
