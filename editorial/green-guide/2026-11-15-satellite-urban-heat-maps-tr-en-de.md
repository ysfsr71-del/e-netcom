# Green Guide editorial package — 2026-11-15
Status: DRAFT — NOT PUBLISHED. Do not index or add cards until source, translation, design and live QA pass.
Topic: Reading satellite urban heat maps without confusing land surface temperature with air temperature.
Suggested slugs: /rehber/uydu-isi-haritalari-nasil-okunur/ | /en/guide/read-satellite-urban-heat-maps/ | /de/ratgeber/satelliten-hitzekarten-verstehen/
Originality: targeted repository searches for “surface temperature satellite heat map” and “ısı adası uydu yüzey sıcaklığı” returned no results on 2026-11-15; complete semantic/card duplicate audit pending.

## TR — Uydu ısı haritaları nasıl okunur?
Bir şehir haritasında kırmızı görünen bir mahalle, mutlaka hava sıcaklığının aynı ölçüde yüksek olduğu anlamına gelmez. Uydu temelli ısı haritaları çoğu zaman çatılar, asfalt, toprak ve bitki örtüsü gibi yüzeylerden yayılan termal ışınımı kullanarak **kara yüzey sıcaklığını** tahmin eder. Hava sıcaklığı ise genellikle belirli koşullarda, yerden yaklaşık iki metre yüksekte ölçülen başka bir büyüklüktür. İki veri birbiriyle ilişkili olabilir; aynı sayı veya aynı ölçüm değildir.

**Önce lejantı okuyun.** Renkler °C mi, sıcaklık farkı mı, yoksa sınıflandırılmış bir endeks mi gösteriyor? Haritanın ölçüm tarihini, saatini, çözünürlüğünü ve bulut maskesini kontrol edin. Öğle vakti çekilmiş bir görüntüyü gece sıcaklığı veya bir haftalık sıcak hava dalgasının tamamı gibi sunmayın.

**Yüzey ile insan maruziyetini ayırın.** Gölge, rüzgâr, nem, bina geometrisi ve kişinin açık havada ne kadar kaldığı, hissedilen ısı riskini etkiler. Yüksek yüzey sıcaklığı dikkat çekici bir işarettir; tek başına sağlık riski puanı değildir.

**Haritayı çapraz doğrulayın.** Aynı günün meteoroloji istasyonu ölçümlerini ve resmî sıcak hava uyarılarını karşılaştırın. Ağaç örtüsü, geçirimsiz yüzeyler ve yeşil alanlar gibi yerel etkenleri inceleyin. Farklı tarihlerden ve farklı renk ölçeklerinden üretilmiş iki görseli doğrudan karşılaştırmayın.

**Paylaşmadan önce dört soru:** (1) Hangi sıcaklık türü? (2) Hangi tarih ve saat? (3) Hangi veri kaynağı ve çözünürlük? (4) Hangi belirsizlikler? Başlığı ve görsel açıklamasını bu yanıtlarla yazın. Okul etkinliği: Aynı bölgeye ait iki haritanın lejantını ve tarihini karşılaştırıp yanıltıcı bir sosyal medya başlığını düzeltin.

## EN — How to read satellite urban heat maps
A neighbourhood coloured red on a city map is not necessarily experiencing the same numerical **air temperature**. Satellite thermal observations often estimate **land surface temperature**: the temperature of surfaces such as roofs, asphalt, soil and vegetation. Air temperature, typically measured under specified conditions near two metres above the ground, is a different quantity. The two may be related but are not interchangeable.

**Read the legend first.** Does the scale show degrees Celsius, an anomaly or a category? Check acquisition date and time, spatial resolution, cloud screening and data-processing notes. A midday image cannot by itself describe nighttime exposure or an entire heatwave.

**Separate surface heat from personal exposure.** Shade, wind, humidity, urban geometry and time spent outdoors affect heat exposure. Hot surfaces are a useful clue, not a stand-alone health-risk score.

**Cross-check the claim.** Compare relevant weather-station observations and official heat warnings; consider tree canopy, impermeable ground and local green space. Avoid direct comparisons between images with different dates or colour scales.

**Before sharing, ask:** What temperature variable is mapped? When was it observed? What are the source and resolution? What uncertainty remains? Classroom exercise: compare legends and timestamps on two maps of the same area, then rewrite a misleading social-media caption.

## DE — Satelliten-Hitzekarten richtig verstehen
Eine rot markierte Stadtfläche bedeutet nicht automatisch, dass dort die **Lufttemperatur** denselben Zahlenwert erreicht. Thermische Satellitendaten werden häufig zur Abschätzung der **Landoberflächentemperatur** genutzt, etwa von Dächern, Asphalt, Böden und Vegetation. Die Lufttemperatur, die unter festgelegten Bedingungen üblicherweise in ungefähr zwei Metern Höhe gemessen wird, ist eine andere Messgröße. Beide können zusammenhängen, sind aber nicht austauschbar.

**Zuerst die Legende prüfen.** Zeigt die Skala Grad Celsius, eine Abweichung oder Klassen? Prüfen Sie Datum, Uhrzeit, räumliche Auflösung, Wolkenfilter und Verarbeitungshinweise. Eine Aufnahme am Mittag beschreibt weder automatisch die nächtliche Belastung noch eine ganze Hitzewelle.

**Oberflächenwärme und persönliche Belastung unterscheiden.** Schatten, Wind, Luftfeuchtigkeit, Bebauung und Aufenthaltsdauer beeinflussen die Hitzebelastung. Heiße Oberflächen sind ein Hinweis, aber keine vollständige Gesundheitsrisikobewertung.

**Aussagen gegenprüfen.** Vergleichen Sie passende Wetterstationsdaten und amtliche Hitzewarnungen. Berücksichtigen Sie Baumkronen, versiegelte Flächen und Grünräume. Karten mit unterschiedlichen Aufnahmezeiten oder Farbskalen dürfen nicht unkritisch direkt verglichen werden.

**Vor dem Teilen vier Fragen:** Welche Temperaturgröße? Welcher Zeitpunkt? Welche Datenquelle und Auflösung? Welche Unsicherheit? Schulübung: Zwei Karten derselben Gegend anhand von Legende und Zeitstempel vergleichen und eine irreführende Bildunterschrift korrigieren.

## Sources for publication fact-check (verify exact pages and licensing)
- NASA Earth Observatory — Urban Heat Islands: https://earthobservatory.nasa.gov/features/UrbanHeat
- USGS Landsat Collection 2 Surface Temperature: https://www.usgs.gov/landsat-missions/landsat-collection-2-surface-temperature
- European Environment Agency, urban heat island resources: https://www.eea.europa.eu/
- World Meteorological Organization, heat and urban climate: https://wmo.int/
- Turkish State Meteorological Service: https://www.mgm.gov.tr/

## Publication checklist
- Verify source claims and exact link targets; review translations by language.
- Produce an original licensed SVG diagram contrasting land-surface and near-surface air temperature, with localized alt text.
- Prepare 3 HTML pages with title, localized description, OG/Twitter, canonical, reciprocal existing hreflang, Article JSON-LD and internal links.
- Check all three slugs against full repository, existing cards and sitemap; assign chronological card numbers.
- Deploy through Render and verify HTTP 200, indexability and visible content at all three public URLs. Do not claim publication until all checks pass.
