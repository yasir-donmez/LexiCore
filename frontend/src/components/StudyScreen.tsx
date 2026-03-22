import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, CheckCircle, XCircle, Volume2, Info, Loader2, Brain } from 'lucide-react';
import { getDeckFlashcards, answerFlashcard } from '../lib/api';
import type { Flashcard, AnswerResult } from '../types/index';

interface StudyScreenProps {
  deckId: string;
  onBack: () => void;
}

export const StudyScreen: React.FC<StudyScreenProps> = ({ deckId, onBack }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showClue, setShowClue] = useState(false);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const data = await getDeckFlashcards(deckId);
        setCards(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
    // Refresh interval to catch background cards (if any are still generating)
    const interval = setInterval(fetchCards, 5000);
    return () => clearInterval(interval);
  }, [deckId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || result || submitting) return;

    setSubmitting(true);
    try {
      const currentCard = cards[currentIndex];
      const res = await answerFlashcard(currentCard.card_id, answer);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    setResult(null);
    setAnswer('');
    setShowClue(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
          <p className="text-slate-500 font-medium">Zengin içerikli kartlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center p-6">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md border border-slate-100">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
             <Brain className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-2xl font-black mb-4">Henüz Kart Yok</h2>
          <p className="text-slate-500 mb-8">PDF analizinden sonra seçtiğin kelimeler burada görünecek.</p>
          <button 
            onClick={onBack} 
            className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-xl shadow-primary-200"
          >
            PDF Yükle
          </button>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="max-w-3xl mx-auto p-6 text-slate-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-primary-600 transition-colors font-bold group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Ders Listesi
        </button>
        <div className="text-sm font-black text-primary-600 bg-primary-50 px-4 py-1.5 rounded-full border border-primary-100 shadow-sm">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      {/* Card Body */}
      <div className="relative mb-8 group">
        <div className={`bg-white p-8 md:p-14 rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col items-center justify-center transition-all duration-700 min-h-[480px]
          ${result ? (result.is_correct ? 'ring-4 ring-green-100 bg-green-50/20' : 'ring-4 ring-red-100 bg-red-50/20') : 'hover:shadow-primary-100'}`}>
          
          <div className="flex items-center gap-4 mb-3">
             <h2 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 group-hover:scale-105 transition-transform duration-500">{card.word_en}</h2>
             <button title="Dinle" className="p-3 bg-slate-50 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-full transition-all">
                <Volume2 className="w-6 h-6" />
             </button>
          </div>
          
          <div className="flex flex-col items-center mb-10">
            <span className="text-[10px] font-black text-primary-300 uppercase tracking-[0.2em] mb-1">Okunuşu</span>
            <p className="text-primary-400 font-mono text-xl">{card.pronunciation || '...'}</p>
          </div>
          
          <div className="w-full bg-slate-50/80 p-8 rounded-3xl relative border border-slate-100 mb-6 group/context">
            <div className="absolute -top-3 left-8 bg-white px-3 py-1 rounded-full border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">Context</div>
            <p className="text-slate-600 leading-relaxed italic text-xl text-center font-medium">
               "{card.context_sentence}"
            </p>
          </div>

          {/* Clue Section */}
          {!result && card.clue && (
            <div className="w-full flex flex-col items-center mt-2">
              {showClue ? (
                <div className="bg-amber-50 text-amber-700 p-5 rounded-2xl border border-amber-200 animate-in slide-in-from-top-2 shadow-sm max-w-md text-center">
                  <span className="font-black block uppercase text-[10px] tracking-widest mb-1">💡 English Clue</span>
                  <p className="text-sm font-semibold">{card.clue}</p>
                </div>
              ) : (
                <button 
                  onClick={() => setShowClue(true)}
                  className="flex items-center gap-2 text-slate-400 hover:text-amber-600 font-black transition-all text-xs uppercase tracking-widest py-2 px-4 rounded-full hover:bg-amber-50"
                >
                  <Info className="w-4 h-4" /> İpucu Göster
                </button>
              )}
            </div>
          )}

          {/* Result Section */}
          {result && (
            <div className="w-full mt-4 space-y-6 animate-in zoom-in-95 duration-500">
               <div className="flex flex-col items-center">
                  {(() => {
                     let text = 'Yanlış';
                     let color = 'text-red-600';
                     let Icon = XCircle;
                     if (result.similarity >= 0.95) { text = 'Kusursuz!'; color = 'text-green-600'; Icon = CheckCircle; }
                     else if (result.similarity >= 0.85) { text = 'Çok İyi!'; color = 'text-emerald-500'; Icon = CheckCircle; }
                     else if (result.similarity >= 0.75) { text = 'Kısmen Doğru'; color = 'text-amber-500'; Icon = CheckCircle; }
                     
                     return (
                       <div className={`flex flex-col items-center gap-1 font-black text-2xl mb-2 ${color}`}>
                         <div className="flex items-center gap-2">
                           <Icon className="w-7 h-7" />
                           {text}
                         </div>
                         <span className="text-sm font-bold text-slate-500">Benzerlik: %{Math.round(result.similarity * 100)}</span>
                       </div>
                     );
                  })()}
                  <p className="text-3xl font-black text-slate-800 underline decoration-primary-200 underline-offset-8">
                    {card.word_tr}
                  </p>
               </div>

               {/* Rich Content: Synonyms / Antonyms */}
               <div className="grid grid-cols-2 gap-4">
                  {card.synonyms && card.synonyms.length > 0 && (
                    <div className="bg-white/60 p-5 rounded-2xl border border-slate-100 shadow-sm">
                       <span className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Eş Anlamlılar</span>
                       <div className="flex flex-wrap gap-1.5">
                          {card.synonyms.map(s => <span key={s} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-xs font-black">{s}</span>)}
                       </div>
                    </div>
                  )}
                   {card.antonyms && card.antonyms.length > 0 && (
                    <div className="bg-white/60 p-5 rounded-2xl border border-slate-100 shadow-sm">
                       <span className="block text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Zıt Anlamlılar</span>
                       <div className="flex flex-wrap gap-1.5">
                          {card.antonyms.map(a => <span key={a} className="bg-red-50 text-red-700 px-2 py-0.5 rounded-lg text-xs font-black">{a}</span>)}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Answer Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="relative flex-1">
          <input
            autoFocus
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Kelimelerin Türkçesini buraya yaz..."
            className={`w-full px-8 py-5 rounded-[2rem] bg-white shadow-xl focus:ring-4 focus:ring-primary-100 outline-none text-xl font-bold transition-all border-2 ${
              result ? 'border-transparent text-slate-400' : 'border-slate-50'
            }`}
            disabled={!!result || submitting}
          />
          {submitting && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          )}
        </div>
        
        {result ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-slate-800 transition-all shadow-2xl hover:-translate-y-1 active:translate-y-0"
          >
            {currentIndex < cards.length - 1 ? 'Devam Et' : 'Dersi Bitir'}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!answer.trim() || submitting}
            className={`px-10 py-5 bg-primary-600 text-white rounded-[2rem] hover:bg-primary-700 transition-all shadow-2xl shadow-primary-100 active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none`}
          >
            <Send className="w-8 h-8" />
          </button>
        )}
      </form>
    </div>
  );
};
