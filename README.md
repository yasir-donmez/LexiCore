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
  - `db_service.py`: Firebase Firestore entegrasyonu ile verileri kalıcı olarak saklar (geliştirme için Mock DB desteği de mevcuttur).
- **`models/`**: Pydantic ile tanımlanmış veri şemaları (Flashcard, Deck, User).

### 2. Frontend İskeleti (`/frontend` klasörü)
React 19, Vite ve Tailwind CSS v4 kullanılarak modern bir arayüz tasarlanmıştır:
- **`App.tsx`**: Uygulamanın ana kabuğu. Sol tarafta şık bir navigasyon menüsü (Sidebar), sağ tarafta da içeriğin değiştiği ana ekran bulunur.
- **Ekranlar (`/components`)**:
  - `AuthScreen`: Firebase Authentication tabanlı kullanıcı giriş ve kayıt ekranı.
  - `DeckListScreen`: Kullanıcıların oluşturdukları desteleri (öğrenme setlerini) görüntülediği, yönettiği ve çalışmaya başladığı ana panel.
  - `UploadScreen`: Sürükle-bırak destekli PDF yükleme alanı.
  - `WordSelectionScreen`: PDF analizinden sonra kullanıcıya kelimeleri seçme veya otomatik üretme şansı sunan çift modlu (dual-mode) kelime seçim alanı.
  - `StudyScreen`: Kelimelerin ön ve arka yüzleriyle gösterildiği klasik interaktif Flashcard öğrenme alanı.
  - `StatsScreen`: Öğrenme analizleri, başarı oranları (Kusursuz, Gelişen, Zorlanılan) ve istatistiklerin sergilendiği alan.

---

## ⚡ Şu An Proje Neyi Ne Kadar Yapabiliyor? (Mevcut Durum)

1. **Gelişmiş PDF Analizi ve Kelime Seçimi:**
   - Kullanıcı bir PDF yüklediğinde sistem kelimeleri analiz eder. Kullanıcı isterse "Tümünü Otomatik Üret" diyerek işlemi AI'a bırakabilir (arka plan işlemesi), isterse "Kelimeleri Ben Seçeceğim" diyerek yalnızca öğrenmek istediği kelimeleri seçebilir (Dual-Mode).
2. **Yapay Zeka Destekli İçerik Üretimi (Batch Processing):**
   - Seçilen kelimeler Gemini AI tarafından toplu olarak (batch) işlenir. Akıllı bağlam cümleleri, eşanlamlılar, zıt anlamlılar, ipuçları ve telaffuz rehberleriyle zengin flashcard'lar haline getirilir.
3. **Akıllı Değerlendirme ve Aralıklı Tekrar (SRS):**
   - Öğrenci kartla çalışırken bir kelime tahmini girdiğinde, backend kelimedeki ufak harf hatalarını esnek bir şekilde tolere eden `difflib` algoritması ile çalışır ve kartın tekrar edilme sıklığını otomatik hesaplar.
4. **Firebase Kimlik Doğrulama & Firestore Veritabanı:**
   - Kullanıcılar güvenli bir şekilde hesap oluşturup giriş yapabilirler. Her kullanıcının desteleri (decks) ve flashcard ilerlemeleri kendisine özel olarak ayrılır ve Firestore'da kalıcı olarak saklanır.
5. **Modern Arayüz ve Deste Yönetimi:**
   - Tailwind CSS destekli modern arayüz ile kullanıcılar destelerini listeleyebilir, çalışma istatistiklerini grafikler eşliğinde detaylıca görüntüleyebilir ve akıcı bir deneyim yaşarlar.

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

Temel iskeleti ve kritik modülleri (Auth, Veritabanı, AI) başarıyla entegre ettik. Bundan sonra platformu daha da güçlendirmek için çalışabileceğiniz bazı açık noktalar:

- [x] **Gerçek Veritabanı Geçişi:** Firebase/Firestore bağlantısı sağlandı.
- [x] **Kullanıcı Girişi (Auth):** Firebase Auth ile güvenli kullanıcı girişi entegre edildi.
- [x] **Çift Modlu Kart Üretimi:** Kullanıcıya PDF'den kelime seçme imkanı eklendi.
- [ ] **Kapsamlı Hata Yönetimi (Error Handling):** Frontend'de yaşanabilecek olası ağ hataları veya API timeout senaryoları için React tarafında `react-toastify` veya benzeri bildirimler eklenebilir.
- [ ] **Sesli Telaffuz (Text-to-Speech):** Frontend tarafında Web Speech API kullanılarak kartların üzerindeki kelimelerin sesli okunuşu eklenebilir.
- [ ] **Üretim Ortamına Dağıtım (Deployment):** Backend'i Render veya Railway'e, Frontend'i ise Vercel'e yükleyerek canlıya alın.

Kolay gelsin! 💻✨
