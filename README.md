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
