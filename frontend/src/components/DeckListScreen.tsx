import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Play, Pencil, Check, X, Loader2,
  GraduationCap, CalendarDays, Layers, ChevronRight, Sparkles
} from 'lucide-react';
import { getUserDecks, getDeckFlashcards } from '../lib/api';
import type { Deck } from '../types/index';

interface DeckListScreenProps {
  onSelectDeck: (deckId: string) => void;
}

interface DeckWithCount extends Deck {
  cardCount?: number;
  customName?: string;
}

const CUSTOM_NAMES_KEY = 'lexicore_deck_names';

function loadCustomNames(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_NAMES_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCustomName(deckId: string, name: string) {
  const names = loadCustomNames();
  names[deckId] = name;
  localStorage.setItem(CUSTOM_NAMES_KEY, JSON.stringify(names));
}

export const DeckListScreen: React.FC<DeckListScreenProps> = ({ onSelectDeck }) => {
  const [decks, setDecks] = useState<DeckWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [customNames, setCustomNames] = useState<Record<string, string>>(loadCustomNames());
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const raw = await getUserDecks();
        const sorted = raw.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Kart sayılarını paralel çek
        const withCounts: DeckWithCount[] = await Promise.all(
          sorted.map(async (deck) => {
            try {
              const cards = await getDeckFlashcards(deck.deck_id);
              return { ...deck, cardCount: cards.length };
            } catch {
              return { ...deck, cardCount: 0 };
            }
          })
        );
        setDecks(withCounts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDecks();
  }, []);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const startEdit = (deck: DeckWithCount) => {
    setEditingId(deck.deck_id);
    setEditValue(customNames[deck.deck_id] || deck.source_pdf_name);
  };

  const confirmEdit = (deckId: string) => {
    const trimmed = editValue.trim();
    if (trimmed) {
      saveCustomName(deckId, trimmed);
      setCustomNames((prev) => ({ ...prev, [deckId]: trimmed }));
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const getDeckName = (deck: DeckWithCount) =>
    customNames[deck.deck_id] || deck.source_pdf_name;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
          <p className="text-slate-500 font-medium">Desteler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">Derslerim</h1>
          </div>
          <p className="text-slate-400 text-sm ml-[52px]">
            {decks.length > 0
              ? `${decks.length} deste • Çalışmak istediğin desteyi seç`
              : 'Henüz hiç deste oluşturmadın'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-2xl border border-primary-100 text-sm font-bold">
          <Layers className="w-4 h-4" />
          {decks.reduce((sum, d) => sum + (d.cardCount ?? 0), 0)} kelime
        </div>
      </div>

      {/* Deck Grid */}
      {decks.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-12 h-12 text-slate-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-700 mb-3">Henüz Deste Yok</h2>
          <p className="text-slate-400 max-w-sm mx-auto">
            PDF yükleyerek kelime kartları oluştur, ardından burada görünecekler.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {decks.map((deck, idx) => {
            const isEditing = editingId === deck.deck_id;
            const name = getDeckName(deck);
            const hues = ['from-blue-500 to-indigo-600', 'from-violet-500 to-purple-600',
              'from-teal-500 to-emerald-600', 'from-rose-500 to-pink-600',
              'from-amber-500 to-orange-500', 'from-cyan-500 to-sky-600'];
            const gradient = hues[idx % hues.length];

            return (
              <div
                key={deck.deck_id}
                className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden"
              >
                {/* Color stripe top */}
                <div className={`h-2 bg-gradient-to-r ${gradient}`} />

                <div className="p-6">
                  {/* Deck Name Row */}
                  <div className="flex items-start justify-between mb-4 gap-2">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          ref={editInputRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmEdit(deck.deck_id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="flex-1 px-3 py-2 rounded-xl border-2 border-primary-400 focus:outline-none font-bold text-slate-800 text-sm bg-primary-50"
                        />
                        <button
                          onClick={() => confirmEdit(deck.deck_id)}
                          className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <h2 className="font-black text-slate-800 text-lg leading-snug truncate flex-1">
                          {name}
                        </h2>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(deck); }}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-primary-500 hover:bg-primary-50 transition-all opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                          title="İsmi düzenle"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                      <strong className="text-slate-600 font-bold">{deck.cardCount ?? '—'}</strong> kart
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {new Date(deck.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Action button */}
                  <button
                    onClick={() => onSelectDeck(deck.deck_id)}
                    className={`w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r ${gradient} text-white rounded-2xl font-bold text-sm
                      hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-md group/btn`}
                  >
                    <span className="flex items-center gap-2">
                      <Play className="w-4 h-4 fill-white" />
                      Çalışmaya Başla
                    </span>
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
