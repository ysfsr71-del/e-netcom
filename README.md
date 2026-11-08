# e-NetCoM – Doğanın Enerjileri | Güncel Dijital Platform

Bu sürüm, sitedeki güncel eğitim kayıtları esas alınarak güncellenmiştir. Eğitim verilerinin güncel kesiti 3 Ekim 2026 tarihli Kırklareli çevrimiçi eğitimini de kapsamaktadır.

## Güncel göstergeler
- Yüz yüze eğitim: 18 eğitim / 18 il
- Çevrimiçi eğitim: 11 eğitim / 13 il
- Güncel toplam: 29 gerçekleşen eğitim / 31 il / 1.514 katılımcı
- 11 Temmuz 2026: Tunceli çevrimiçi eğitim, 51 katılımcı
- 3 Ekim 2026: Kırklareli çevrimiçi eğitim, 23 katılımcı
- 1 Dakikada serisi: 10 içerik / 11.077 görüntülenme (rapor)
- İnteraktif Eğitim ve Farkındalık Videoları: 24 içerik / 21.696 görüntülenme (rapor)
- İnformatif Kamu Spotları: 2 içerik / proje YouTube'da 6.251 görüntülenme (rapor)
- e-NetCoM Database: 2.449 yerli ve yabancı kaynak (rapor)

## Çalıştırma
1. Klasörü açın.
2. Astra kullanılacaksa `.env.example` dosyasını `.env` olarak kopyalayın ve API anahtarını ekleyin.
3. `KUR_SITE.bat` dosyasına çift tıklayın.
4. Tarayıcıdan `http://localhost:3000` adresini açın.

Site, gerçek Türkiye il haritasını ve 81 il listesini kullanır. Harita üzerindeki gerçekleşen il işaretleri eğitim kayıtlarını açar.

- 17 Ekim 2026: Bartın–Zonguldak ortak çevrimiçi eğitim, 48 katılımcı (tek etkinlik)
- 21 Ekim 2026: Bursa, Şükrü Şankaya Anadolu Lisesi, yüz yüze eğitim, 100 katılımcı

- 23 Ekim 2026: Balıkesir, Muharrem Hasbi Anadolu Lisesi, yüz yüze eğitim, 30 katılımcı. Afiş ve fotoğraflar: `public/balikesir/`.

- 24 Ekim 2026: Gümüşhane ve Şırnak ortak çevrimiçi eğitim, tek etkinlik, 51 katılımcı (12.00–14.00).

## Sürüm notları — 26 Ekim 2026

### Projenin hikâyesi ve güncel gelişmeler
- Ana sayfadaki **Projenin hikâyesi** bölümü fotoğraflı hikâye alanı, 2025 başlangıç / 2026 uygulama ve gelişim / gelecek kalıcı etki aşamalarını gösteren zaman çizelgesi ve üç gelişme kartıyla yeniden tasarlandı.
- Başlık hiyerarşisi, tipografi, renk geçişleri, ikonlar, kart aralıkları ve mobil görünüm düzenlendi.
- **Güncel gelişmeler** kartlarının konuya uygun fotoğrafları, onaylanan görsel referansından kırpılarak sitenin kendi dosyalarına WebP biçiminde eklendi: `public/assets/story-erasmus.webp`, `public/assets/story-training.webp`, `public/assets/story-research.webp`. Harici Unsplash görsel bağlantılarının yerini bu yerel dosyalar aldı.
- Eğitim kartındaki görsel, kadın eğitimci gösteren önceki tasarım yerine erkek eğitimcinin katılımcılara hitap ettiği görselle değiştirildi.
- Üç kartın bağlantıları korundu: **Projeyi keşfet** → `#proje`, **Faaliyetleri incele** → `#faaliyetler`, **Yayınları keşfet** → `#network`. Son bağlantı için ilgili bölüme kaydırma davranışı güçlendirildi.
- Kartların tarih bilgileri içeriklerine uygun tutuldu; 2025 tarihli bildiri sırf görsel sıralama için 2026 olarak değiştirilmedi.
- Değişiklikler öncesinde GitHub üzerinde geri dönüş amaçlı yedek dallar oluşturuldu; son görsel güncellemesi öncesi yedek: `backup-before-exact-card-images-20261026`.


## 27 Ekim 2026 — Kayseri yüz yüze eğitimi
- Kayseri Fen Lisesi'nde 14.00–16.00 saatlerinde 90 katılımcıyla tamamlandı.
- Görseller ve program afişi `public/kayseri/` klasöründe; galeri bu klasörü otomatik okur.
- Ana sayfa eğitim verilerine Kayseri eklendi. Güncel toplam: **30 eğitim, 32 il, 1.604 katılımcı** (19 yüz yüze, 11 çevrimiçi eğitim).


## 31 Ekim 2026 — Beş il ortak çevrimiçi eğitim
- Bingöl, Çankırı, Edirne, Muş ve Sivas illerini kapsayan 12.00–14.00 saatleri arasında **tek çevrimiçi oturum**, **194 katılımcı**.
- İl haritasında 5 il, eğitim ve katılımcı toplamında 1 oturum ve 194 kişi sayılır.
- Güncel toplam: **31 eğitim, 37 il, 1.798 katılımcı**; 19 yüz yüze (1.145), 12 çevrimiçi (653).

## 4 Kasım 2026 — Diyarbakır yüz yüze eğitimi
- Diyarbakır Ali Emiri Anadolu Lisesi, 13.30–15.30, 91 katılımcı.
- Güncel toplam: 32 eğitim, 38 il, 1.889 katılımcı; 20 yüz yüze ve 12 çevrimiçi eğitim.

## 6 Kasım 2026 — Mardin yüz yüze eğitimi
- Prof. Dr. Necmettin Erbakan Anadolu Lisesi, 13.30–15.30, 47 katılımcı.
- Güncel toplam: 33 eğitim, 39 il, 1.936 katılımcı; 21 yüz yüze ve 12 çevrimiçi eğitim.
- Galeri: public/mardin/afis.PNG ve mardin01–03.jpeg.

## 7 Kasım 2026 — 31 Ekim ortak eğitim katılımcı düzeltmesi
- Bingöl 47, Çankırı 13, Edirne 36, Muş 38, Sivas 44; toplam 178 katılımcı, tek çevrimiçi oturum.
- 6 Kasım Mardin dahil güncel toplam: 33 eğitim, 39 il, 1.920 katılımcı; yüz yüze 1.283, çevrimiçi 637.
- Önceki 194 sayısı 16 kişi fazla olduğundan tarihsel sürüm notları eski durumu gösterir.

## 7 Kasım 2026 — Altı il tek çevrimiçi eğitim
- Ağrı 38, Hakkari 49, Osmaniye 27, Rize 27, Siirt 23, Sinop 38; toplam **202 kişi**, **tek oturum**.
- 7 Kasım itibarıyla: **34 eğitim**, **45 il**, **2.122 katılımcı**. Yüz yüze 21 eğitim / 1.283 kişi; çevrimiçi 13 eğitim / 839 kişi / 24 il.
- Afiş ve görseller `public/{agri,hakkari,osmaniye,rize,siirt,sinop}/` klasörlerindedir.
