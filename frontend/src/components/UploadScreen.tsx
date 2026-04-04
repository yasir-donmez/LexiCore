import React, { useEffect, useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, Keyboard, Plus, X, Sparkles, Brain } from 'lucide-react';
import { analyzePdf, generateCards } from '../lib/api';
import { getPrefLevel, setPrefLevel } from '../lib/profilePrefs';
import { WordSelectionScreen } from './WordSelectionScreen';

interface UploadScreenProps {
  onUploadSuccess: (deckId: string) => void;
}

type Mode = 'choose' | 'pdf' | 'manual';

/* ─────────────────────────────────────────────
   Level Selector – ortak alt bileşen
───────────────────────────────────────────── */
const LevelSelector: React.FC<{
  level: string;
  onChange: (lvl: string) => void;
}> = ({ level, onChange }) => (
  <div className="w-full p-5 bg-slate-50/60 rounded-2xl border border-slate-100">
    <label className="block text-sm font-semibold text-slate-700 mb-3">İngilizce Seviyeniz</label>
    <div className="grid grid-cols-6 gap-2">
      {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
        <button
          key={lvl}
          type="button"
          onClick={() => onChange(lvl)}
          className={`py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
            level === lvl
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-200'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          {lvl}
        </button>
      ))}
    </div>
    <p className="text-[10px] text-slate-400 mt-2 italic text-center">
      *Seviyenize göre cümle zorluğu ve kelime seçimi ayarlanır.
    </p>
  </div>
);

/* ─────────────────────────────────────────────
   Ana bileşen
───────────────────────────────────────────── */
export const UploadScreen: React.FC<UploadScreenProps> = ({ onUploadSuccess }) => {
  const [mode, setMode] = useState<Mode>('choose');
  const [level, setLevel] = useState(() => getPrefLevel());

  // PDF modu
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [extractedWords, setExtractedWords] = useState<{ text: string; lemma: string; pos: string }[] | null>(null);

  // Manuel mod
  const [wordInput, setWordInput] = useState('');
  const [wordList, setWordList] = useState<string[]>([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sync = () => setLevel(getPrefLevel());
    window.addEventListener('lexicore-prefs-changed', sync);
    return () => window.removeEventListener('lexicore-prefs-changed', sync);
  }, []);

  const handleLevelChange = (lvl: string) => {
    setLevel(lvl);
    setPrefLevel(lvl);
  };

  /* ── PDF handlers ── */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped?.type === 'application/pdf') { setFile(dropped); setPdfError(null); }
    else setPdfError('Lütfen sadece PDF dosyası yükleyin.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPdfError(null); }
  };

  const handlePdfUpload = async () => {
    if (!file) return;
    setPdfLoading(true); setPdfError(null);
    try {
      const result = await analyzePdf(file);
      const words = result.words ?? [];
      if (words.length === 0) {
        setPdfError('PDF\'ten metin çıkarılamadı. Metin seçilebilir bir PDF deneyin.');
        return;
      }
      setExtractedWords(words);
    } catch (err: unknown) {
      const ax = err as { code?: string; message?: string; response?: { data?: { detail?: string | unknown } } };
      if (ax.code === 'ERR_NETWORK' || ax.message?.includes('Network Error')) {
        setPdfError('Sunucuya bağlanılamadı. Backend\'i başlatın: `python -m uvicorn app.main:app --reload`');
      } else {
        const detail = ax.response?.data?.detail;
        const msg = typeof detail === 'string' ? detail
          : Array.isArray(detail) ? (detail as { msg?: string }[]).map(d => d.msg).filter(Boolean).join(' ')
          : null;
        setPdfError(msg || 'PDF analiz edilemedi. Tekrar deneyin.');
      }
    } finally {
      setPdfLoading(false);
    }
  };

  /* ── Manuel handlers ── */
  const addWord = () => {
    const w = wordInput.trim().toLowerCase();
    if (!w) return;
    if (wordList.includes(w)) { setManualError('Bu kelime zaten listede.'); return; }
    if (wordList.length >= 50) { setManualError('En fazla 50 kelime ekleyebilirsin.'); return; }
    setWordList(prev => [...prev, w]);
    setWordInput('');
    setManualError(null);
    wordInputRef.current?.focus();
  };

  const removeWord = (w: string) => setWordList(prev => prev.filter(x => x !== w));

  const handleManualGenerate = async () => {
    if (wordList.length === 0) return;
    setManualLoading(true); setManualError(null);
    try {
      const result = await generateCards(wordList, level);
      onUploadSuccess(result.deck_id);
    } catch (err: unknown) {
      const ax = err as { code?: string; response?: { data?: { detail?: unknown } } };
      const detail = ax.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : 'Kartlar oluşturulurken bir hata oluştu.';
      setManualError(msg);
    } finally {
      setManualLoading(false);
    }
  };

  /* ── WordSelection ekranı (PDF sonrası) ── */
  if (extractedWords) {
    return (
      <WordSelectionScreen
        words={extractedWords}
        level={level}
        onGenerationSuccess={onUploadSuccess}
        onCancel={() => setExtractedWords(null)}
      />
    );
  }

  /* ══════════════════════════════════════════
     MOD SEÇİM EKRANI
  ══════════════════════════════════════════ */
  if (mode === 'choose') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-slate-900">
        <div className="max-w-2xl w-full">
          {/* Başlık */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-200 mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Nasıl Başlamak İstersin?</h1>
            <p className="text-slate-400 text-sm">Kart oluşturmak için bir yöntem seç</p>
          </div>

          {/* İki seçenek yan yana */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* PDF Seçeneği */}
            <button
              onClick={() => setMode('pdf')}
              className="group relative bg-white rounded-[2rem] border-2 border-slate-100 hover:border-primary-300 shadow-sm hover:shadow-xl hover:shadow-primary-100/50 p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 bg-blue-50 group-hover:bg-blue-100 rounded-2xl flex items-center justify-center mb-5 transition-colors">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">PDF'ten Oluştur</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                İngilizce makale veya ders notunu yükle, yapay zeka anahtar kelimeleri otomatik çıkarsın ve kartları hazırlasın.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {['NLP Analizi', 'Otomatik Seçim', 'Gemini AI'].map(t => (
                  <span key={t} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">{t}</span>
                ))}
              </div>
            </button>

            {/* Manuel Seçeneği */}
            <button
              onClick={() => setMode('manual')}
              className="group relative bg-white rounded-[2rem] border-2 border-slate-100 hover:border-violet-300 shadow-sm hover:shadow-xl hover:shadow-violet-100/50 p-8 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-t-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 bg-violet-50 group-hover:bg-violet-100 rounded-2xl flex items-center justify-center mb-5 transition-colors">
                <Keyboard className="w-8 h-8 text-violet-600" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">Manuel Giriş</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                İngilizce kelimelerini tek tek kendin gir. Yapay zeka her kelime için kart, örnek cümle ve ipucu hazırlasın.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {['Tam Kontrol', 'Hızlı Giriş', 'Gemini AI'].map(t => (
                  <span key={t} className="text-[10px] font-bold bg-violet-50 text-violet-600 px-2.5 py-1 rounded-full border border-violet-100">{t}</span>
                ))}
              </div>
            </button>
          </div>

          {/* Alt rozet */}
          <div className="mt-10 flex items-center justify-center gap-6 text-[10px] text-slate-400">
            {[['Advanced NLP', 'text-green-500'], ['Gemini 2.5', 'text-blue-500'], ['Anki-Logic', 'text-purple-500']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${color}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     PDF MODU
  ══════════════════════════════════════════ */
  if (mode === 'pdf') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-slate-900">
        <div className="max-w-xl w-full bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-10 flex flex-col items-center text-center">
          {/* Geri */}
          <button
            onClick={() => setMode('choose')}
            className="self-start text-sm text-slate-400 hover:text-primary-600 font-bold mb-6 flex items-center gap-1 transition-colors"
          >
            ← Geri Dön
          </button>

          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black mb-2">PDF'ten Kart Oluştur</h1>
          <p className="text-slate-400 text-sm mb-8">İngilizce PDF yükle, yapay zeka anahtar kelimeleri seçsin.</p>

          {/* Drag & Drop */}
          <label
            onDragEnter={handleDrag} onDragLeave={handleDrag}
            onDragOver={handleDrag} onDrop={handleDrop}
            className={`w-full border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center ${
              dragActive ? 'border-primary-600 bg-primary-100 scale-105'
              : file ? 'border-primary-500 bg-primary-50'
              : 'border-slate-300 hover:border-primary-400'
            }`}
          >
            <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
            {file ? (
              <>
                <FileText className="w-12 h-12 text-primary-600 mb-2" />
                <span className="font-bold text-primary-900">{file.name}</span>
                <span className="text-sm text-primary-500 mt-1">Değiştirmek için tıklayın.</span>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-slate-400 mb-2" />
                <span className="text-slate-500">PDF dosyasını buraya sürükleyin veya <span className="text-primary-600 font-bold">seçin</span></span>
              </>
            )}
          </label>

          {pdfError && <p className="text-red-500 mt-4 text-sm font-medium">{pdfError}</p>}

          <div className="w-full mt-6 mb-6">
            <LevelSelector level={level} onChange={handleLevelChange} />
          </div>

          <button
            onClick={handlePdfUpload}
            disabled={!file || pdfLoading}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-95 ${
              !file || pdfLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-200'
            }`}
          >
            {pdfLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analiz Ediliyor...
              </span>
            ) : 'Kartlarımı Oluştur'}
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     MANUEL MOD
  ══════════════════════════════════════════ */
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-slate-900">
      <div className="max-w-xl w-full bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-10">
        {/* Geri */}
        <button
          onClick={() => { setMode('choose'); setWordList([]); setWordInput(''); setManualError(null); }}
          className="text-sm text-slate-400 hover:text-primary-600 font-bold mb-6 flex items-center gap-1 transition-colors"
        >
          ← Geri Dön
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center">
            <Keyboard className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Manuel Kart Oluştur</h1>
            <p className="text-slate-400 text-xs">Kelimelerini yaz, yapay zeka kartları hazırlasın.</p>
          </div>
        </div>

        <div className="mt-6 mb-4">
          <LevelSelector level={level} onChange={handleLevelChange} />
        </div>

        {/* Kelime Giriş Alanı */}
        <div className="flex gap-2 mb-4">
          <input
            ref={wordInputRef}
            type="text"
            value={wordInput}
            onChange={(e) => { setWordInput(e.target.value); setManualError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addWord(); } }}
            placeholder="İngilizce kelime girin... (Enter)"
            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none font-medium text-sm transition-all"
          />
          <button
            onClick={addWord}
            disabled={!wordInput.trim()}
            className="px-4 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-95 shadow-md shadow-violet-200"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {manualError && (
          <p className="text-red-500 text-sm font-medium mb-3">{manualError}</p>
        )}

        {/* Kelime Listesi */}
        {wordList.length > 0 ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Kelime Listesi
              </span>
              <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                {wordList.length} / 50
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
              {wordList.map((w) => (
                <span
                  key={w}
                  className="flex items-center gap-1.5 bg-violet-50 text-violet-800 border border-violet-200 px-3 py-1.5 rounded-xl text-sm font-bold group"
                >
                  {w}
                  <button
                    onClick={() => removeWord(w)}
                    className="text-violet-300 hover:text-red-500 transition-colors ml-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6 py-8 flex flex-col items-center text-slate-300 border-2 border-dashed border-slate-100 rounded-2xl">
            <Keyboard className="w-10 h-10 mb-2" />
            <span className="text-sm">Henüz kelime eklenmedi</span>
          </div>
        )}

        {/* Oluştur Butonu */}
        <button
          onClick={handleManualGenerate}
          disabled={wordList.length === 0 || manualLoading}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${
            wordList.length === 0 || manualLoading
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-xl shadow-violet-200'
          }`}
        >
          {manualLoading ? (
            <>
              <Brain className="w-6 h-6 animate-spin" />
              Kartlar Hazırlanıyor...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {wordList.length > 0 ? `${wordList.length} Kelime için Kart Oluştur` : 'Kelime Ekle'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
