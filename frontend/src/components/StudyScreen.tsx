import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, CheckCircle, XCircle, Volume2, Info, Loader2 } from 'lucide-react';
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
    // Refresh interval to catch background cards
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
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onBack(); // Done for now
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
          <p className="text-slate-500">Kelimeler getiriliyor...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center p-6">
        <div className="glass p-10 rounded-3xl max-w-md">
          <h2 className="text-2xl font-bold mb-4">Kartlar Hazırlanıyor</h2>
          <p className="text-slate-500 mb-6">Yapay zeka PDF'i analiz ediyor. Lütfen birkaç saniye bekleyin...</p>
          <button onClick={onBack} className="text-primary-600 font-medium">Ana Sayfaya Dön</button>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-primary-600 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Geri Dön
      </button>

      <div className="relative mb-12">
        <div className={`glass p-12 rounded-[40px] text-center transition-all duration-500 h-96 flex flex-col items-center justify-center
          ${result ? (result.is_correct ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50') : ''}`}>
          
          <div className="absolute top-6 left-6 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">
            {currentIndex + 1} / {cards.length}
          </div>

          <div className="flex items-center gap-3 mb-2">
             <h2 className="text-5xl font-extrabold text-slate-900">{card.word_en}</h2>
             <button title="Play pronunciation" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <Volume2 className="w-6 h-6 text-slate-400" />
             </button>
          </div>
          
          <p className="text-slate-400 italic mb-8 font-serif text-lg">[{card.pronunciation}]</p>
          
          <div className="bg-white/50 p-6 rounded-2xl max-w-lg relative">
            <Info className="absolute -top-3 -left-3 w-6 h-6 text-primary-400 bg-white rounded-full p-1" />
            <p className="text-slate-600 leading-relaxed italic text-lg truncate-3-lines">
               "{card.context_sentence}"
            </p>
          </div>

          {result && (
            <div className={`mt-8 flex flex-col items-center animate-in zoom-in-95 duration-300`}>
              <div className={`flex items-center gap-2 font-bold text-xl mb-1 ${result.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                {result.is_correct ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                {result.is_correct ? 'Harika!' : 'Neredeyse...'}
              </div>
              <p className="text-slate-700 font-medium text-lg">Türkçesi: <span className="underline decoration-primary-300 underline-offset-4">{card.word_tr}</span></p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          autoFocus
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Türkçe karşılığını yazın..."
          className="flex-1 px-6 py-4 rounded-2xl glass focus:ring-2 focus:ring-primary-500 outline-none text-lg transition-all"
          disabled={!!result || submitting}
        />
        {result ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            {currentIndex < cards.length - 1 ? 'Sıradaki Kelime' : 'Bitir'}
          </button>
        ) : (
          <button
            type="submit"
            disabled={!answer.trim() || submitting}
            className="p-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 transition-all shadow-lg active:scale-95 disabled:bg-slate-300"
          >
            <Send className="w-6 h-6" />
          </button>
        )}
      </form>
    </div>
  );
};

