export interface User {
  user_id: string;
  username: string;
  email: string;
}

export interface Deck {
  deck_id: string;
  user_id: string;
  source_pdf_name: string;
  created_at: string;
}

export interface Flashcard {
  card_id: string;
  deck_id: string;
  word_en: string;
  word_tr: string;
  context_sentence: string;
  pronunciation: string;
  ease_factor: number;
  interval: number;
  next_review: string;
  created_at: string;
}

export interface AnswerResult {
  similarity: number;
  is_correct: boolean;
  new_ease_factor: number;
  new_interval: number;
  next_review: string;
}

export interface UserStats {
  total_decks: number;
  total_flashcards: number;
  due_for_review: number;
  average_ease_factor: number;
}
