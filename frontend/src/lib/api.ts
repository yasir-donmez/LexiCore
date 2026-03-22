import axios from 'axios';
import type { Flashcard, AnswerResult, UserStats } from '../types/index';

const API_BASE_URL = 'http://localhost:8000'; // Update this if backend runs elsewhere

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const analyzePdf = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/analyze', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const generateCards = async (userId: string, selectedWords: string[], level: string = "B1") => {
  const response = await api.post(`/generate?user_id=${userId}&level=${level}`, selectedWords);
  return response.data;
};

export const uploadPdf = async (userId: string, file: File, level: string = "B1") => {
  return analyzePdf(file); // Redirect to analyze
};

export const getDeckFlashcards = async (deckId: string): Promise<Flashcard[]> => {
  const response = await api.get(`/decks/${deckId}`);
  return response.data;
};

export const answerFlashcard = async (cardId: string, userAnswer: string): Promise<AnswerResult> => {
  const response = await api.post(`/cards/${cardId}/answer?user_answer=${userAnswer}`);
  return response.data;
};

export const getUserStats = async (userId: string): Promise<UserStats> => {
  const response = await api.get(`/stats/${userId}`);
  return response.data;
};

export const getUserDecks = async (userId: string): Promise<import('../types/index').Deck[]> => {
  const response = await api.get(`/users/${userId}/decks`);
  return response.data;
};

export default api;
