# 🚀 LexiCore: AI Destekli Yabancı Dil Öğrenme Platformu

Bu proje, PDF belgelerinden otomatik olarak İngilizce kelimeleri çıkarıp, yapay zeka (Gemini 2.5 Flash) ile zenginleştirerek etkileşimli kelime kartlarına (Flashcard) dönüştüren modern bir web uygulamasıdır. 

Şu anda projenin **temel iskeleti (skeleton)** ve ana özellikleri çalışır durumdadır. Bu doküman, projeyi devralacak ekibin sistemin güncel durumunu, mimarisini ve bundan sonraki adımları anlaması için hazırlanmıştır.

---

## 🏗️ Proje Mimarisi (İskelet)

Proje iki ana bileşenden oluşmaktadır: **FastAPI** (Backend) ve **React/Vite** (Frontend).

### 1. Backend İskeleti (`/app` klasörü)
Backend Python ile yazılmış olup mikro servis mantığıyla modüler hale getirilmiştir:
- **`main.py`**: Tüm API uç noktalarının (endpoints) tanımlandığı ana dosya.
- **`services/`**:
  - `pdf_service.py`: Yüklenen PDF'i parçalara (chunk) ayırır ve metinleri çıkarır.
  - `nlp_service.py`: spaCy kullanarak metindeki en önemli kelimeleri (isim, fiil, sıfat) filtreler.
  - `ai_service.py`: Gemini 2.5 API'sine bağlanıp kelimelerin Türkçe çevirisini, bağlam cümlesini ve okunuşunu üretir.
  - `scoring_service.py`: Kullanıcının girdiği çeviri tahminini `difflib` algoritması ile (%85 benzerlik eşiği) orjinaliyle karşılaştırır ve aralıklı tekrar (SRS) için bir sonraki çalışma tarihini hesaplar.
  - `db_service.py`: Şu anda geliştirme aşamasında **Mock DB (Geçici Bellek)** olarak çalışmaktadır.
- **`models/`**: Pydantic ile tanımlanmış veri şemaları (Flashcard, Deck, User).

### 2. Frontend İskeleti (`/frontend` klasörü)
React 19, Vite ve Tailwind CSS v4 kullanılarak modern bir arayüz tasarlanmıştır:
- **`App.tsx`**: Uygulamanın ana kabuğu. Sol tarafta şık bir navigasyon menüsü (Sidebar), sağ tarafta da içeriğin değiştiği ana ekran bulunur.
- **Ekranlar (`/components`)**:
  - `UploadScreen`: Sürükle-bırak destekli PDF yükleme alanı.
  - `StudyScreen`: Kelimelerin ön ve arka yüzleriyle gösterildiği klasik interaktif Flashcard öğrenme alanı.
  - `StatsScreen`: Öğrenme analizleri, başarı oranları (Kusursuz, Gelişen, Zorlanılan) ve istatistiklerin sergilendiği kısım.

---

## ⚡ Şu An Proje Neyi Ne Kadar Yapabiliyor? (Mevcut Durum)

1. **PDF Gönderme & Arka Plan İşleme:**
   - Kullanıcı bir PDF yüklediğinde, arayüz beklemeden (timeout yemeden) bir "işleniyor" durumuna geçer. Backend FastAPI `BackgroundTasks` kullanarak PDF okuma ve Gemini AI'a istek atma işlemlerini arka planda halleder.
2. **Yapay Zeka Destekli İçerik Üretimi:**
   - PDF'teki kelimeler başarıyla analiz ediliyor, Gemini tarafından akıllı cümleler, eşanlamlılar ve telaffuz rehberleriyle (Flashcard) kaydediliyor.
3. **Akıllı Değerlendirme & Puanlama:**
   - Öğrenci kartla çalışırken bir kelime tahmini girdiğinde, backend kelimedeki ufak harf hatalarını vs. tolere eden bir mantıkla çalışıyor ve kartın tekrar edilme sıklığını (SRS algoritması) otomatik güncelliyor.
4. **Navigasyon ve UI:**
   - Ekranlar arası geçişler (Upload -> Study -> Stats) state üzerinden sorunsuz çalışıyor. Tasarım modern ve temiz.

---

## 🚀 Geliştirme Ortamını Kurulumu (Local Setup)

Projeyi kendi bilgisayarınızda ayağa kaldırmak için aşağıdaki adımları izleyin:

### Backend Kurulumu
1. Python 3.10+ yüklü olduğundan emin olun.
2. Sanal ortam (venv) oluşturun ve aktif edin:
   ```bash
   python -m venv venv
   # Windows için: venv\Scripts\activate
   # Mac/Linux için: source venv/bin/activate
   ```
3. Gerekli kütüphaneleri yükleyin ve NLP modelini indirin:
   ```bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```
4. `.env` dosyası oluşturun ve Gemini API anahtarınızı girin:
   ```env
   GEMINI_API_KEY=senin_api_anahtarin_buraya
   ```
5. Sunucuyu başlatın:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

### Frontend Kurulumu
1. Node.js yüklü olduğundan emin olun.
2. Frontend klasörüne girip paketleri yükleyin:
   ```bash
   cd frontend
   npm install
   ```
3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

---

## 🎯 Ekibe Notlar / Bundan Sonraki Adımlar (To-Do List)

Sevgili ekip, iskeleti bu noktaya kadar kurdum. Modüler bir yapısı olduğu için üstüne ekleme yapmak çok kolay olacaktır. Devraldığınızda yapmanız gereken öncelikli işler:

- [ ] **Gerçek Veritabanı Geçişi:** `app/services/db_service.py` şu an bellekte (Mock) veri tutuyor. Bunu projeye uygun olarak Firebase/Firestore ile bağlayın.
- [ ] **Kullanıcı Girişi (Auth):** Sistemde şu an `user_id` sabit/mock olarak gidiyor. JWT veya Firebase Auth eklenerek gerçek kullanıcı sistemi kurulmalı.
- [ ] **Hata Yönetimi (Error Handling):** Frontend'de yaşanabilecek ağ hataları veya API çökmeleri için React tarafında güzel Toast mesajları (bildirimler) veya Error Boundary'ler ekleyin.
- [ ] **Gelişmiş Grafikler:** `StatsScreen` içerisindeki veriler backend'den başarıyla geliyor, buradaki verileri süslemek için `Recharts` kütüphanesini daha aktif kullanarak tasarımını zenginleştirebilirsiniz.

Kolay gelsin! 💻✨
