import React, { useState } from 'react';
import { Check, ArrowRight, Brain, Sparkles, X } from 'lucide-react';
import { generateCards } from '../lib/api';

interface WordSelectionScreenProps {
  words: Array<{ text: string, lemma: string, pos: string }>;
  level: string;
  onGenerationSuccess: (deckId: string) => void;
  onCancel: () => void;
}

export const WordSelectionScreen: React.FC<WordSelectionScreenProps> = ({ 
  words, 
  level, 
  onGenerationSuccess,
  onCancel
}) => {
  const [selectedLemmas, setSelectedLemmas] = useState<string[]>(
    words.slice(0, 15).map(w => w.lemma) // Default select top 15
  );
  const [generating, setGenerating] = useState(false);

  const toggleWord = (lemma: string) => {
    setSelectedLemmas(prev => 
      prev.includes(lemma) 
        ? prev.filter(l => l !== lemma) 
        : [...prev, lemma]
    );
  };

  const handleGenerate = async () => {
    if (selectedLemmas.length === 0) return;
    setGenerating(true);
    try {
      const result = await generateCards("test-user-123", selectedLemmas, level);
      onGenerationSuccess(result.deck_id);
    } catch (err) {
      console.error(err);
      alert("Kartlar oluşturulurken bir hata oluştu.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-slate-900">
      <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden">
        {/* Header */}
        <div className="p-8 bg-gradient-to-r from-primary-600 to-primary-500 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-32 h-32 rotate-12" />
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black mb-2">Seçim Zamanı! 🎯</h2>
              <p className="text-primary-50 opacity-90 max-w-md">
                PDF'inden <span className="font-bold underlineDecoration">{words.length}</span> anahtar kelime çıkardık. 
                Çalışmak istediklerini seç, yapay zeka senin seviyene ({level}) uygun zengin kartlar hazırlasın.
              </p>
            </div>
            <button 
              onClick={onCancel}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Word Grid */}
        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
            {words.map((word) => (
              <button
                key={word.lemma}
                onClick={() => toggleWord(word.lemma)}
                className={`group relative p-4 rounded-2xl border-2 transition-all text-left transform active:scale-95 ${
                  selectedLemmas.includes(word.lemma)
                    ? "border-primary-500 bg-primary-50 shadow-md"
                    : "border-slate-100 bg-slate-50 hover:border-primary-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                     word.pos === 'NOUN' ? 'bg-blue-100 text-blue-600' :
                     word.pos === 'VERB' ? 'bg-green-100 text-green-600' :
                     'bg-purple-100 text-purple-600'
                   }`}>
                     {word.pos}
                   </span>
                   {selectedLemmas.includes(word.lemma) && (
                     <Check className="w-4 h-4 text-primary-600" />
                   )}
                </div>
                <div className={`font-bold transition-all ${
                  selectedLemmas.includes(word.lemma) ? "text-primary-900" : "text-slate-600"
                }`}>
                  {word.lemma}
                </div>
              </button>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
            <div className="text-sm font-medium text-slate-500">
              <span className="text-primary-600 font-bold">{selectedLemmas.length}</span> kelime seçildi
            </div>
            <button
              onClick={handleGenerate}
              disabled={selectedLemmas.length === 0 || generating}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl ${
                selectedLemmas.length === 0 || generating
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-primary-600 text-white hover:bg-primary-700 hover:-translate-y-1 active:translate-y-0"
              }`}
            >
              {generating ? (
                <>
                  <Brain className="w-6 h-6 animate-spin" />
                  Zekice Hazırlanıyor...
                </>
              ) : (
                <>
                  Mükemmel Kartlar Oluştur
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Decorative dots */}
      <div className="flex justify-center gap-2 mt-8 opacity-20">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-primary-600" />
        ))}
      </div>
    </div>
  );
};
