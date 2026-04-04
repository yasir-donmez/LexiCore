import axios from 'axios';
import type { Flashcard, AnswerResult, UserStats } from '../types/index';

const API_BASE_URL = 'http://localhost:8000'; // Update this if backend runs elsewhere

const api = axios.create({
  baseURL: API_BASE_URL,
});

let authTokenGetter: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  authTokenGetter = getter;
};

api.interceptors.request.use(async (config) => {
  if (authTokenGetter) {
    const token = await authTokenGetter();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const analyzePdf = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  // Content-Type verme: tarayıcı boundary ile multipart/form-data yazar; elle vermek yükleme bozulur
  const response = await api.post('/analyze', formData);
  return response.data;
};

export const generateCards = async (selectedWords: string[], level: string = "B1") => {
  const response = await api.post(`/generate?level=${level}`, selectedWords);
  return response.data;
};

export const uploadPdf = async (_userId: string, file: File, _level: string = "B1") => {
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

export const getUserStats = async (): Promise<UserStats> => {
  const response = await api.get('/stats/me');
  return response.data;
};

export const getUserDecks = async (): Promise<import('../types/index').Deck[]> => {
  const response = await api.get('/users/me/decks');
  return response.data;
};

export const syncAuthUser = async (): Promise<import('../types/index').User> => {
  const response = await api.post('/auth/sync');
  return response.data;
};

export default api;
