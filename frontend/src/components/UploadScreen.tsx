import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2 } from 'lucide-react';
import { analyzePdf } from '../lib/api';
import { WordSelectionScreen } from './WordSelectionScreen';

interface UploadScreenProps {
  onUploadSuccess: (deckId: string) => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedWords, setExtractedWords] = useState<any[] | null>(null);

  const [dragActive, setDragActive] = useState(false);
  const [level, setLevel] = useState("B1"); // Default level

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Lütfen sadece PDF dosyası yükleyin.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzePdf(file);
      setExtractedWords(result.words);
    } catch (err: any) {
      setError('PDF analiz edilemedi. Lütfen tekrar deneyin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-slate-900">
      <div className="max-w-xl w-full bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 animate-bounce-slow">
          <Upload className="w-10 h-10 text-primary-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">LexiCore'a Hoş Geldiniz</h1>
        <p className="text-slate-500 mb-8">
          İngilizce makalenizi veya ders notunuzu yükleyin, yapay zeka sizin için akıllı kelime kartları oluştursun.
        </p>

        <label 
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`w-full border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center
          ${dragActive ? 'border-primary-600 bg-primary-100 scale-105' : file ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400'}`}>
          <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
          {file ? (
            <>
              <FileText className="w-12 h-12 text-primary-600 mb-2" />
              <span className="font-medium text-primary-900">{file.name}</span>
              <span className="text-sm text-primary-600 mt-1">Dosya seçildi. Değiştirmek için tıklayın.</span>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-400 mb-2" />
              <span className="text-slate-500">PDF dosyasını buraya sürükleyin veya <span className="text-primary-600 font-medium">seçin</span></span>
            </>
          )}
        </label>

        {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}

        <div className="w-full mb-8 mt-8 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-4">İngilizce Seviyeniz</label>
          <div className="grid grid-cols-3 gap-3">
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevel(lvl)}
                className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all transform active:scale-95 ${
                  level === lvl 
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-200" 
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-3 italic text-center">
            *Seviyenize göre kelime seçimi ve cümle zorluğu otomatik ayarlanacaktır.
          </p>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all transform active:scale-95 ${
            !file || loading
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-200"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analiz Ediliyor...
            </span>
          ) : (
            "Kartlarımı Oluştur"
          )}
        </button>

        <div className="mt-8 flex items-center justify-center gap-6 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Advanced NLP
          </div>
          <div className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Gemini 2.5
          </div>
          <div className="flex items-center gap-1.5 grayscale hover:grayscale-0 transition-all">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Anki-Logic
          </div>
        </div>
      </div>
    </div>
  );
};
