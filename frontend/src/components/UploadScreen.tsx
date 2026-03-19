import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { uploadPdf } from '../lib/api';

interface UploadScreenProps {
  onUploadSuccess: (deckId: string) => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await uploadPdf('test-user-123', file); // Hardcoded user for demo
      onUploadSuccess(result.deck_id);
    } catch (err) {
      setError('PDF yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-xl w-full glass rounded-3xl p-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 floating">
          <Upload className="w-10 h-10 text-primary-600" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">LexiCore'a Hoş Geldiniz</h1>
        <p className="text-slate-500 mb-8">
          İngilizce makalenizi veya ders notunuzu yükleyin, yapay zeka sizin için akıllı kelime kartları oluştursun.
        </p>

        <label className={`w-full border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center
          ${file ? 'border-primary-500 bg-primary-50' : 'border-slate-300 hover:border-primary-400'}`}>
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

        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`mt-8 w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2
            ${!file || loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-200'}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              İşleniyor...
            </>
          ) : (
            'Analizi Başlat'
          )}
        </button>

        <div className="mt-8 flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> spaCy NLP
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Gemini AI
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" /> Spaced Repetition
          </div>
        </div>
      </div>
    </div>
  );
};
