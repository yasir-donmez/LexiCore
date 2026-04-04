 AI KOD EDİTÖRÜ İÇİN UYGULAMA PLANI: LEXICORE FRONTEND (REACT/NEXT.JS)
GÖREV: Sen kıdemli bir Frontend Geliştiricisisin. "LexiCore" projesi için, halihazırda FastAPI ile yazılmış olan asenkron backend mimarisine bağlanacak modern, sade ve kullanıcı dostu bir React (Next.js veya Vite) + Tailwind CSS web arayüzü yazacaksın.
1. GENEL MİMARİ VE TİP GÜVENLİĞİ
Backend tarafında Pydantic kullanılarak oluşturulmuş aşağıdaki JSON veri yapılarını (TypeScript Interface olarak) frontend tarafında tanımla
:
Flashcard: card_id, deck_id, word_en, word_tr, context_sentence, pronunciation, ease_factor, interval
.
Deck: deck_id, user_id, source_pdf_name
.
2. EKRANLAR VE API ENTEGRASYONU
Adım A: PDF Yükleme Ekranı (Upload Screen)
Görsel: Ortada modern bir sürükle-bırak (drag & drop) dosya yükleme alanı olsun.
İşlem: Kullanıcı PDF yüklediğinde, POST /upload uç noktasına multipart/form-data olarak istek at
.
Mekanizma: Backend'de Vercel timeout'u önlemek için "BackgroundTasks" çalıştığından
, API'den anında {"status": "processing", "deck_id": "..."} dönecektir. Ekranda "PDF'iniz yapay zeka tarafından arka planda işleniyor..." şeklinde şık bir loading/spinner (yükleniyor) animasyonu göster ve ardından kullanıcıyı Deste (Deck) ekranına yönlendir.
Adım B: Deste ve Çalışma Ekranı (Deck & Study Screen)
İşlem: GET /decks/{deck_id} uç noktasına istek atarak arka planda oluşan flashcard'ları (kelime kartlarını) listele
.
Görsel: Ekranda klasik bir Flashcard (ön/arka yüz) tasarımı oluştur. Kartın ön yüzünde word_en (İngilizce kelime) ve Gemini tarafından üretilmiş context_sentence (bağlamsal cümle) ile pronunciation (telaffuz) yer alsın
.
Kullanıcı Etkileşimi: Kullanıcının Türkçe anlamı (tahminini) girebileceği bir input alanı (text field) ekle.
Adım C: Adaptif Test ve Geri Bildirim Mekanizması
İşlem: Kullanıcı cevabını yazdığında POST /cards/{card_id}/answer uç noktasına user_answer parametresi ile istek at
.
Geri Bildirim: Backend'deki difflib algoritması 0.85 benzerlik oranını baz alarak doğruluk hesaplar
. Gelen yanıta göre ekranda anlık (toast notification veya renk değişimi ile) görsel bildirim ver:
Başarılıysa yeşil renk tonları ("Tebrikler, doğru!").
Başarısızsa kırmızı renk tonları ve doğrusunun gösterimi (word_tr)
.
Adım D: Gelişim Raporu Ekranı (Stats & Dashboard)
İşlem: GET /stats/{user_id} uç noktasından kullanıcının tüm destelerini ve kart skorlarını çek
.
Görsel: Recharts veya Chart.js gibi bir kütüphane kullanarak, backend'deki Matplotlib mantığına uygun bir biçimde
 kullanıcının doğru/yanlış oranlarını (öğrenme eğrisini) gösteren basit grafikler çiz.
Kurallar: API çağrıları için modern fetch API veya axios kullan. Tüm asenkron işlemlerde try-catch blokları ile hata yönetimini (error handling) sağla ve kullanıcıya "Sunucuya bağlanılamadı" gibi dostane mesajlar ver.