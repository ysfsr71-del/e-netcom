const bestPractices=[
['Türkiye','Blue Trace / Mavi İz','Eğitim & Gençlik','Su okuryazarlığını gençlerin yürüttüğü vatandaş bilimi, saha çalışması, dijital haritalama ve çözüm geliştirme ile birleştiriyor.','https://education-for-climate.ec.europa.eu/education-for-climate-day-2026-group/topic/blue-trace-youth-led-intergenerational-water-action'],
['Türkiye','İklim ve Çevre için Stratejik Ortaklık','Eğitim & Gençlik','Konak, Hamm ve Saluzzo arasında iklim diyaloğu; gençler için çevre bilinçlendirme merkezi, iklim zirvesi, atölye ve eğitimlerle destekleniyor.','https://akillisehirekosistem.csb.gov.tr/DataBank/Detail?dataBankDataTypeMId=3900360030003200&mId=3100390033003700'],
['Türkiye','COP31’e Doğru Sıfır Atık Gençlik Kampı','Eğitim & Gençlik','Gençleri sıfır atık, geri dönüşüm, döngüsel ekonomi, sürdürülebilir yaşam ve iklim değişikliği eğitimleriyle buluşturan uygulama.','https://antalya.csb.gov.tr/haberler/cop31-e-dogru-sifir-atik-temali-genclik-kampi-tamamlandi-305665'],
['Türkiye','EKOSANAT','Eğitim & Gençlik','Sürdürülebilirlik okuryazarlığını sanat, atölye ve farklı öğrenci gruplarının katılımıyla birleştiren eğitim örneği.','https://epale.ec.europa.eu/tr/content/mugla-il-milli-egitim-mudurlugu-egitimde-iyi-ornekler-yarismasinda-kurumumuz-ekosanat'],
['Dünya','Green Trails','Eğitim & Gençlik','Almanya ve Polonya ortaklığında; gençler için çevre eğitimi, şehir görevleri, sanat, açık hava öğrenmesi ve kapsayıcı yeşil becerileri bir araya getiriyor.','https://epale.ec.europa.eu/en/blog/best-practice-example-ka2-project-green-trails'],
['Dünya','Green Reporters','İletişim & Medya','İtalya ve Yunanistan’da gençleri çevre gazeteciliği, akran öğrenmesi, video ve dijital içerik üretimiyle güçlendiren model.','https://epale.ec.europa.eu/en/content/green-reporters-project-training-young-adults-environmental-communication'],
['Dünya','ECF4CLIM','Eğitim & Gençlik','Gençlerin yerel bağlama göre sürdürülebilirlik müdahalelerini birlikte tasarladığı, katılımcı ve uygulamalı bir eğitim yaklaşımı.','https://projects.research-and-innovation.ec.europa.eu/en/strategy/strategy-2020-2024/environment-and-climate/european-green-deal/green-deal-projects-support/green-deal-resources/engaging-youth-build-better-tomorrow'],
['Dünya','GreenComm Best Practices','İletişim & Medya','Çevresel iletişim ve medya okuryazarlığı alanında Avrupa’dan uygulamaları harita ve filtrelerle görünür kılan bir iyi uygulama koleksiyonu.','https://green-comm.com/best-practices/'],
['Dünya','EU Green Tour','İletişim & Medya','Gençleri çevre habercileri olarak yetiştirip araştırma, röportaj, fotoğraf, podcast ve video hikâyesi üretimine yönlendiren dijital medya yaklaşımı.','https://epale.ec.europa.eu/en/content/eu-green-tour-erasmu-project'],
['Türkiye','From Dam Waste to Classroom Tools','Eğitim & Gençlik','Baraj inşaatlarından çıkan atık malzemeleri öğrencilerin kullanışlı sınıf araçlarına dönüştürdüğü; döngüsel ekonomi, yeşil beceriler ve sosyal girişimciliği bir araya getiren okul temelli uygulama.','https://environment.ec.europa.eu/news/dam-waste-classroom-tools-turkish-schools-circular-innovation-2025-04-16_en'],
['Avrupa','Pact2School','Eğitim & Gençlik','Okul ve üniversiteleri Avrupa İklim Paktı elçileri ve ortaklarıyla buluşturarak gençlerin iklim eylemine katılımını; atölye, uygulama ve öğrenci liderliğindeki projelerle destekleyen girişim.','https://climate-pact.europa.eu/get-inspired/pact2school-engaging-young-people-climate-action_en'],
['Avrupa','Climate Garden – Tierra y Libertad','Eğitim & Gençlik','İspanya’da öğrencilerin bitkiler, gölgelendirme ve biyoçeşitlilik unsurlarıyla bir iklim bahçesi tasarladığı, iklim ve doğa öğrenmesini uygulamalı etkinliklerle birleştiren örnek.','https://climate-pact.europa.eu/get-inspired/pact2school-engaging-young-people-climate-action_en'],
['Avrupa','Biocraft Youth Exchange','Eğitim & Gençlik','Gençleri doğal ürünler üretimi gibi yaratıcı ve uygulamalı yöntemlerle sürdürülebilir, çevre dostu yaşam biçimleriyle buluşturan Avrupa iklim topluluğu örneği.','https://climate-pact.europa.eu/articles-and-events/together-action-2026/exhibitors_en'],
['Avrupa','Climate for All','Eğitim & Gençlik','GreenComp sürdürülebilirlik yetkinliklerini eğitim oyunlarına dönüştüren; gençleri oyun, yansıtma ve yerel iklim eylemi üzerinden güçlendiren yenilikçi öğrenme yaklaşımı.','https://climate4all.org/']
];
function renderBestPractices(filter='all'){
 const lang=document.documentElement.dataset.lang||'tr';
 const list=bestPractices.filter(x=>filter==='all'||(filter==='turkiye'&&x[0]==='Türkiye')||(filter==='dunya'&&(x[0]==='Dünya'||x[0]==='Avrupa'))||(filter==='egitim'&&x[2]==='Eğitim & Gençlik')||(filter==='iletisim'&&x[2]==='İletişim & Medya'));
 const practiceI18n={
  'Blue Trace / Mavi İz':{
   en:['Blue Trace / Mavi İz','Education & Youth','It combines water literacy with youth-led citizen science, fieldwork, digital mapping and solution development.'],
   de:['Blue Trace / Mavi İz','Bildung & Jugend','Verbindet Wasserkompetenz mit von Jugendlichen geleiteter Citizen Science, Feldarbeit, digitaler Kartierung und Lösungsentwicklung.']},
  'İklim ve Çevre için Stratejik Ortaklık':{
   en:['Strategic Partnership for Climate and Environment','Education & Youth','Climate dialogue among Konak, Hamm and Saluzzo, supported by an environmental awareness centre, climate summit, workshops and training for young people.'],
   de:['Strategische Partnerschaft für Klima und Umwelt','Bildung & Jugend','Klimadialog zwischen Konak, Hamm und Saluzzo, unterstützt durch ein Umweltbildungszentrum, einen Klimagipfel, Workshops und Bildungsangebote für junge Menschen.']},
  'COP31’e Doğru Sıfır Atık Gençlik Kampı':{
   en:['Zero Waste Youth Camp Towards COP31','Education & Youth','An initiative bringing young people together around zero waste, recycling, circular economy, sustainable living and climate change education.'],
   de:['Zero-Waste-Jugendcamp auf dem Weg zur COP31','Bildung & Jugend','Eine Initiative, die junge Menschen zu den Themen Zero Waste, Recycling, Kreislaufwirtschaft, nachhaltiges Leben und Klimabildung zusammenbringt.']},
  'EKOSANAT':{
   en:['EKOSANAT','Education & Youth','An educational example combining sustainability literacy with art, workshops and participation by different student groups.'],
   de:['EKOSANAT','Bildung & Jugend','Ein Bildungsbeispiel, das Nachhaltigkeitskompetenz mit Kunst, Workshops und der Beteiligung verschiedener Schülergruppen verbindet.']},
  'Green Trails':{
   en:['Green Trails','Education & Youth','A Germany–Poland partnership combining environmental education, city missions, art, outdoor learning and inclusive green skills for young people.'],
   de:['Green Trails','Bildung & Jugend','Eine deutsch-polnische Partnerschaft, die Umweltbildung, Stadtaufgaben, Kunst, Lernen im Freien und inklusive grüne Kompetenzen für junge Menschen verbindet.']},
  'Green Reporters':{
   en:['Green Reporters','Communication & Media','A model empowering young people in Italy and Greece through environmental journalism, peer learning, video and digital content production.'],
   de:['Green Reporters','Kommunikation & Medien','Ein Modell, das junge Menschen in Italien und Griechenland durch Umweltjournalismus, Peer-Learning sowie Video- und digitale Inhaltsproduktion stärkt.']},
  'ECF4CLIM':{
   en:['ECF4CLIM','Education & Youth','A participatory, practice-oriented education approach in which young people co-design sustainability interventions suited to their local context.'],
   de:['ECF4CLIM','Bildung & Jugend','Ein partizipativer, praxisorientierter Bildungsansatz, bei dem junge Menschen Nachhaltigkeitsmaßnahmen für ihren lokalen Kontext gemeinsam gestalten.']},
  'GreenComm Best Practices':{
   en:['GreenComm Best Practices','Communication & Media','A European collection of best practices that makes environmental communication and media literacy practices visible through maps and filters.'],
   de:['GreenComm Best Practices','Kommunikation & Medien','Eine europäische Sammlung guter Praxis, die Anwendungen der Umweltkommunikation und Medienkompetenz mithilfe von Karten und Filtern sichtbar macht.']},
  'EU Green Tour':{
   en:['EU Green Tour','Communication & Media','A digital media approach training young people as environmental reporters and guiding them to produce research, interviews, photography, podcasts and video stories.'],
   de:['EU Green Tour','Kommunikation & Medien','Ein digitaler Medienansatz, der junge Menschen zu Umweltreportern ausbildet und sie zur Produktion von Recherchen, Interviews, Fotos, Podcasts und Videogeschichten anleitet.']},
  'From Dam Waste to Classroom Tools':{
   en:['From Dam Waste to Classroom Tools','Education & Youth','A school-based circular innovation project turning waste materials from dam construction into useful classroom tools while building green skills and social entrepreneurship.'],
   de:['Von Dammabfällen zu Unterrichtsmaterialien','Bildung & Jugend','Ein schulbasiertes Kreislaufprojekt, das Abfallmaterialien aus dem Dammbau in nützliche Unterrichtsmaterialien verwandelt und grüne Kompetenzen sowie soziales Unternehmertum stärkt.']},
  'Pact2School':{
   en:['Pact2School','Education & Youth','An initiative connecting schools and universities with European Climate Pact Ambassadors and Partners to support youth climate action through practical activities and student-led projects.'],
   de:['Pact2School','Bildung & Jugend','Eine Initiative, die Schulen und Hochschulen mit Botschaftern und Partnern des Europäischen Klimapakts verbindet und Jugendklimaschutz durch praktische Aktivitäten und von Schülern geleitete Projekte unterstützt.']},
  'Climate Garden – Tierra y Libertad':{
   en:['Climate Garden – Tierra y Libertad','Education & Youth','A Spanish school project where pupils create a climate garden with plants, shade structures and biodiversity features through hands-on learning about climate and nature.'],
   de:['Klimagarten – Tierra y Libertad','Bildung & Jugend','Ein spanisches Schulprojekt, bei dem Kinder durch praktisches Lernen über Klima und Natur einen Klimagarten mit Pflanzen, Schattenstrukturen und Elementen zur Förderung der Biodiversität gestalten.']},
  'Biocraft Youth Exchange':{
   en:['Biocraft Youth Exchange','Education & Youth','A European Climate Pact community project promoting sustainable, eco-friendly lifestyles through creative, hands-on practices such as crafting natural products.'],
   de:['Biocraft Youth Exchange','Bildung & Jugend','Ein Projekt der Europäischen Klimapakt-Community, das nachhaltige und umweltfreundliche Lebensweisen durch kreative, praktische Aktivitäten wie die Herstellung natürlicher Produkte fördert.']},
  'Climate for All':{
   en:['Climate for All','Education & Youth','An innovative learning approach that turns GreenComp sustainability competences into educational games and empowers young people through play, reflection and local climate action.'],
   de:['Climate for All','Bildung & Jugend','Ein innovativer Lernansatz, der GreenComp-Nachhaltigkeitskompetenzen in Bildungsspiele überträgt und junge Menschen durch Spielen, Reflexion und lokales Klimahandeln stärkt.']}
 };
 const countryMap={Türkiye:lang==='en'?'Türkiye':lang==='de'?'Türkei':'Türkiye',Dünya:lang==='en'?'World':lang==='de'?'Welt':'Dünya',Avrupa:lang==='en'?'Europe':lang==='de'?'Europa':'Avrupa'};
 document.getElementById('bestGrid').innerHTML=list.map(x=>{
   const tr=[x[1],x[2],x[3]];
   const i=practiceI18n[x[1]];
   const translated=lang==='tr'?tr:(i?.[lang]||tr);
   const title=translated[0],cat=translated[1],desc=translated[2];
   const source=lang==='en'?'Source / explore the practice ↗':lang==='de'?'Quelle / Praxis ansehen ↗':'Kaynak / uygulamayı incele ↗';
   return `<article class="best-card"><div class="best-cover"><span>${esc(title)}</span></div><div class="best-body"><span class="tag">${esc(countryMap[x[0]])} · ${esc(cat)}</span><h3>${esc(title)}</h3><p>${esc(desc)}</p><a class="source" href="${x[4]}" target="_blank" rel="noopener">${source}</a></div></article>`;
 }).join('');
}
const bestSection=document.getElementById('iyi-uygulamalar')||document.querySelector('#best-practices')||document.querySelector('.best-practices');
if('IntersectionObserver' in window && bestSection){
  const bestObs=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){renderBestPractices();bestObs.disconnect();}},{rootMargin:'500px 0px'});bestObs.observe(bestSection);
}else{setTimeout(()=>renderBestPractices(),700);}
document.querySelectorAll('.best-filter').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.best-filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderBestPractices(b.dataset.best)}));
const youtubePlaylists=[
['İnteraktif Eğitim ve Farkındalık Videoları','24 içerik','https://www.youtube.com/@e-NeTCoMProje/playlists','1','🎓'],
['Hashtag Kampanyaları','2 içerik','https://www.youtube.com/playlist?list=PLzoT3-KDh6lbt_LVZOZvhzQzqi7M8-X87','2','📣'],
['İklim Krizi ve Medya','4 içerik','https://www.youtube.com/playlist?list=PLzoT3-KDh6la_OmIwYLeMprieHXd1rFk4','3','🌍'],
['Çevresel Yurttaşlık','6 içerik','https://www.youtube.com/playlist?list=PLzoT3-KDh6lZvVTAH3ldSpNnBh3GxzqDW','4','🌱'],
];
const youtubePlaylistI18n={
 'İnteraktif Eğitim ve Farkındalık Videoları':{en:'Interactive Education & Awareness Videos',de:'Interaktive Bildungs- und Sensibilisierungsvideos'},
 'Hashtag Kampanyaları':{en:'Hashtag Campaigns',de:'Hashtag-Kampagnen'},
 'İklim Krizi ve Medya':{en:'Climate Crisis & Media',de:'Klimakrise & Medien'},
 'Çevresel Yurttaşlık':{en:'Environmental Citizenship',de:'Umweltbürgerschaft'}
};
function renderYouTubePlaylists(lang=document.documentElement.dataset.lang||'tr'){
 const box=document.getElementById('ytPlaylists');if(!box)return;
 const tag=lang==='en'?'YOUTUBE PLAYLIST':lang==='de'?'YOUTUBE-PLAYLIST':'YOUTUBE OYNATMA LİSTESİ';
 const open=lang==='en'?'Open playlist ↗':lang==='de'?'Playlist öffnen ↗':'Oynatma listesini aç ↗';
 box.innerHTML=youtubePlaylists.map(x=>{
  const title=lang==='tr'?x[0]:(youtubePlaylistI18n[x[0]]?.[lang]||x[0]);
  const count=lang==='en'?x[1].replace('içerik','items'):lang==='de'?x[1].replace('içerik','Inhalte'):x[1];
  return `<a class="yt-playlist yt-feature" href="${x[2]}" target="_blank" rel="noopener"><div class="yt-playlist-cover"><div class="playlist-cover-art cover-${x[3]}"><span class="cover-kicker">e-NetCoM · MEDIA</span><span class="cover-mark" aria-hidden="true"></span><span class="cover-title">${esc(title)}</span></div><span class="yt-count">${esc(count)}</span></div><div class="yt-playlist-body"><span class="tag">${tag}</span><h3>${esc(title)}</h3><span class="arrow">${open}</span></div></a>`
 }).join('');
}
renderYouTubePlaylists();
const provinceCoords={"Adana":[37.000428,35.321976],"Adıyaman":[37.766915,38.276659],"Afyonkarahisar":[38.763855,30.540263],"Ağrı":[39.720392,43.047472],"Amasya":[40.650169,35.835634],"Ankara":[39.923429,32.853034],"Antalya":[36.884564,30.703937],"Artvin":[41.183241,41.818072],"Aydın":[37.856965,27.84102],"Balıkesir":[39.649055,27.881532],"Bilecik":[40.150013,29.982694],"Bingöl":[38.884619,40.49661],"Bitlis":[38.403863,42.1084291],"Bolu":[40.740494,31.611391],"Burdur":[37.72728,30.289255],"Bursa":[40.182873,29.066893],"Çanakkale":[40.154999,26.413484],"Çankırı":[40.601832,33.613503],"Çorum":[40.551113,34.956041],"Denizli":[37.7756,29.08826],"Diyarbakır":[37.914951,40.228397],"Edirne":[41.68163,26.56077],"Elazığ":[38.680686,39.226581],"Erzincan":[39.750226,39.01634],"Erzurum":[39.900255,41.271463],"Eskişehir":[39.77688,30.519916],"Gaziantep":[37.065862,37.384706],"Giresun":[40.912475,38.390985],"Gümüşhane":[40.440676,39.508158],"Hakkari":[37.583222,43.733628],"Hatay":[36.200512,36.166941],"Isparta":[37.764473,30.55533],"Mersin":[36.536123,33.792291],"İstanbul":[41.002703,28.987013],"İzmir":[38.421318,27.125037],"Kars":[40.606003,43.100884],"Kastamonu":[41.388401,33.782246],"Kayseri":[38.734804,35.48014],"Kırıkkale":[39.847822,33.513056],"Kırşehir":[39.142044,34.171205],"Kocaeli":[40.855371,29.890639],"Konya":[37.864012,32.479499],"Kütahya":[39.416568,29.983354],"Malatya":[38.35458,38.312656],"Manisa":[38.621162,27.428638],"Kahramanmaraş":[38.61848,27.430698],"Mardin":[37.320755,40.726267],"Muğla":[37.215702,28.362725],"Muş":[38.743641,41.50512],"Nevşehir":[38.626527,34.711939],"Niğde":[37.966125,34.682756],"Ordu":[40.984563,37.878696],"Rize":[41.021355,40.523655],"Sakarya":[40.776642,30.405985],"Samsun":[41.291738,36.331684],"Siirt":[37.933096,41.949182],"Sinop":[42.022263,35.152027],"Sivas":[39.747322,37.020389],"Tekirdağ":[40.984563,27.517902],"Tokat":[40.316708,36.550775],"Trabzon":[40.999593,39.716846],"Tunceli":[39.105421,39.545777],"Şanlıurfa":[37.155939,38.795368],"Uşak":[38.681222,29.407945],"Van":[38.48907,43.402759],"Yozgat":[39.819876,34.811871],"Zonguldak":[41.455336,31.799532],"Aksaray":[38.365349,34.036914],"Bayburt":[40.255425,40.224526],"Karaman":[37.174543,33.229128],"Kırklareli":[41.733661,27.216027],"Batman":[37.880273,41.137567],"Şırnak":[37.518985,42.460587],"Bartın":[41.641233,32.343038],"Ardahan":[41.111175,42.702802],"Iğdır":[39.918689,44.066059],"Yalova":[40.65069,29.26478],"Karabük":[41.203456,32.622425],"Kilis":[36.718522,37.120374],"Osmaniye":[37.069697,36.252085],"Düzce":[40.843165,31.156342]};
const provinces=Object.keys(provinceCoords);
const metroCities=new Set(['Adana','Ankara','Antalya','Balıkesir','Bursa','Denizli','Diyarbakır','Erzurum','Eskişehir','Gaziantep','Hatay','İstanbul','İzmir','Kahramanmaraş','Kayseri','Kocaeli','Konya','Manisa','Mardin','Mersin','Muğla','Ordu','Sakarya','Samsun','Şanlıurfa','Tekirdağ','Trabzon','Van']);
const trainingData=[['31 Ocak 2026','Sakarya','Yüz yüze','TÜGVA Sakarya İl Temsilciliği',37],['14 Şubat 2026','İstanbul','Yüz yüze','TÜGVA Genel Merkezi',35],['7 Mart 2026','Ankara','Yüz yüze','TÜGVA Ankara İl Temsilciliği',35],['3 Nisan 2026','Konya','Yüz yüze','Konya Büyükşehir Belediyesi Sosyal İnovasyon Merkezi',45],['9 Nisan 2026','Aydın','Yüz yüze','Aydın Adnan Menderes Üniversitesi İletişim Fakültesi',104],['15 Nisan 2026','Kahramanmaraş','Yüz yüze','Çukurova Elektrik Anadolu Lisesi',35],['22 Nisan 2026','Şanlıurfa','Yüz yüze','CEASE Şanlıurfa Anadolu İmam Hatip Lisesi',78],['24 Nisan 2026','Gaziantep','Yüz yüze','Vehbi Dinçerler Science High School',90],['6 Mayıs 2026','Muğla','Yüz yüze','Jurgutreis Anadolu High School',72],['8 Mayıs 2026','Denizli','Yüz yüze','İbrahim Cinkaya Social Science High School',32],['13 Mayıs 2026','Adana','Yüz yüze','Seyhan Rotary Anadolu High School',35],['15 Mayıs 2026','Mersin','Yüz yüze','Korukent Anadolu High School',120],['20 Mayıs 2026','Samsun','Yüz yüze','Aziz Atık Science High School',53],['22 Mayıs 2026','Ordu','Yüz yüze','Ordu Science High School',54],['17 Haziran 2026','Manisa','Yüz yüze','Gediz Anadolu High School',70],['19 Haziran 2026','İzmir','Yüz yüze','Aziz Atık High School',30],['28 Mart 2026','Uşak','Çevrimiçi','Dijital Eğitim',36],['4 Nisan 2026','Isparta','Çevrimiçi','Dijital Eğitim',26],['11 Nisan 2026','Burdur','Çevrimiçi','Dijital Eğitim',33],['18 Nisan 2026','Afyonkarahisar','Çevrimiçi','Dijital Eğitim',37],['2 Mayıs 2026','Kütahya','Çevrimiçi','Dijital Eğitim',24],['9 Mayıs 2026','Bilecik','Çevrimiçi','Dijital Eğitim',37],['23 Mayıs 2026','Karaman','Çevrimiçi','Dijital Eğitim',93],['11 Temmuz 2026','Tunceli','Çevrimiçi','Dijital Eğitim',51]];
// İleride eklenecek sempozyum, konferans, ortak buluşması vb. faaliyetler burada tutulur.
// Format: [tarih, il, faaliyet türü, yöntem, başlık, kurum, katılımcı sayısı, durum]
const additionalActivities=[];

function updateComputedStats(lang){
  const all=activitiesForStats();
  const completed=all.filter(x=>x.status==='completed');
  const face=completed.filter(x=>x.mode==='Yüz yüze');
  const online=completed.filter(x=>x.mode==='Çevrimiçi');
  const totalParticipants=completed.reduce((n,x)=>n+Number(x.participants||0),0);
  const faceParticipants=face.reduce((n,x)=>n+Number(x.participants||0),0);
  const provinceCount=new Set(completed.map(x=>x.city)).size;
  const faceProvinceCount=new Set(face.map(x=>x.city)).size;
  const onlineProvinceCount=new Set(online.map(x=>x.city)).size;
  const fmt=n=>Number(n).toLocaleString('tr-TR');
  const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val;};
  set('heroTrainingCount',completed.length);
  set('heroParticipantCount',fmt(totalParticipants));
  set('impactFaceParticipants',fmt(faceParticipants));
  set('impactTotalParticipants',fmt(totalParticipants));
  set('impactProvinceCount',lang==='en'?provinceCount+' provinces':lang==='de'?provinceCount+' Provinzen':provinceCount+' ilde');
  set('impactNoticeParticipants',lang==='en'?fmt(totalParticipants)+' participants':lang==='de'?fmt(totalParticipants)+' Teilnehmende':fmt(totalParticipants)+' katılımcı');
  const summary=document.getElementById('impactSummaryText');
  if(summary){
    summary.textContent=lang==='en'
      ? `The current activity list includes ${face.length} face-to-face and ${online.length} online training records. Participant numbers in these records total ${fmt(totalParticipants)}.`
      : lang==='de'
      ? `Die aktuelle Aktivitätsliste umfasst ${face.length} Präsenz- und ${online.length} Online-Schulungen. Die Zahl der Teilnehmenden in diesen Einträgen beträgt insgesamt ${fmt(totalParticipants)}.`
      : `Güncel faaliyet listesinde ${face.length} yüz yüze ve ${online.length} çevrimiçi eğitim kaydı yer alıyor. Bu kayıtlardaki katılımcı sayıları toplam ${fmt(totalParticipants)} kişiye ulaşıyor.`;
  }
  const legendFace=document.querySelector('[data-hero="legend-face"]');
  const legendOnline=document.querySelector('[data-hero="legend-online"]');
  if(legendFace) legendFace.textContent=lang==='en'?`Face-to-face training (${faceProvinceCount} provinces)`:lang==='de'?`Präsenzschulung (${faceProvinceCount} Provinzen)`:`Yüz yüze eğitim (${faceProvinceCount} il)`;
  if(legendOnline) legendOnline.textContent=lang==='en'?`Online training (${onlineProvinceCount} provinces)`:lang==='de'?`Online-Schulung (${onlineProvinceCount} Provinzen)`:`Çevrimiçi eğitim (${onlineProvinceCount} il)`;
  const mf=document.getElementById('mapFaceCount'); if(mf)mf.textContent=face.length;
  const mo=document.getElementById('mapOnlineCount'); if(mo)mo.textContent=online.length;
  const mp=document.getElementById('mapParticipantCount'); if(mp)mp.textContent=fmt(totalParticipants);
}
function activitiesForStats(){
  const trainings=trainingData.map(x=>({city:x[1],mode:x[2],participants:x[4],status:'completed'}));
  const extras=additionalActivities.map(x=>({city:x[1],mode:x[3],participants:Number(x[6]||0),status:x[7]||'planned'}));
  return [...trainings,...extras];
}

function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function trainingFor(city){return trainingData.filter(x=>x[1]===city)}
function extraFor(city){return additionalActivities.filter(x=>x[1]===city)}
function activitiesFor(city){
 const trainings=trainingFor(city).map(x=>({date:x[0],city:x[1],type:'Akran Destekli Eğitim Programı',mode:x[2],title:'Akran Destekli Eğitim Programı',org:x[3],participants:x[4],status:'completed'}));
 const extras=extraFor(city).map(x=>({date:x[0],city:x[1],type:x[2],mode:x[3],title:x[4],org:x[5],participants:Number(x[6]||0),status:x[7]||'planned'}));
 return [...trainings,...extras];
}
function completedActivities(city){return activitiesFor(city).filter(x=>x.status==='completed')}
function modelFor(city){const a=completedActivities(city);return a.length?a[0].mode:(metroCities.has(city)?'Yüz yüze':'Çevrimiçi')}
function mapSvg(){return document.querySelector('#turkeyMapMount svg')}
const codeToCity={}; provinces.forEach((c,i)=>codeToCity['TR'+String(i+1).padStart(2,'0')]=c);
function gallerySlug(city){return city.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
let selectedCity=null;
function mapLabels(lang){return ({
 tr:{selected:'SEÇİLİ İL',clickCity:'Bir ile tıklayın',clickCityDesc:'Haritadaki bir ile tıklayarak faaliyet bilgilerini, fotoğrafları ve program akışını görüntüleyin.',network:'İl ağı',face:'Yüz yüze eğitim',online:'Çevrimiçi eğitim',participants:'Toplam katılımcı',all:'Tümü',faceFilter:'Yüz yüze',onlineFilter:'Çevrimiçi',done:'Gerçekleşen',search:'İl ara…',faceShort:'Yüz yüze',onlineShort:'Çevrimiçi',none:'Henüz gerçekleşen kayıt yok',click:'İle tıklayın · detay paneli açılır',noActivity:'Bu il için henüz doğrulanmış gerçekleşen faaliyet kaydı bulunmuyor.',networkTag:'81 İL AĞI',training:'Akran Destekli Eğitim Programı',person:'kişi',location:'Yer',photo:'📸 Sahadan Kareler',poster:'📋 Program Akışı',completed:'Gerçekleşen',planned:'Planlanan',activity:'Faaliyet'},
 en:{selected:'SELECTED PROVINCE',clickCity:'Select a province',clickCityDesc:'Click a province on the map to view activity information, field photos and programme details.',network:'Province network',face:'Face-to-face training',online:'Online training',participants:'Total participants',all:'All',faceFilter:'Face-to-face',onlineFilter:'Online',done:'Completed',search:'Search province…',faceShort:'Face-to-face',onlineShort:'Online',none:'No completed record yet',click:'Click a province · details open here',noActivity:'There is no verified completed activity record for this province yet.',networkTag:'81-PROVINCE NETWORK',training:'Peer-Supported Education Programme',person:'participants',location:'Location',photo:'📸 Field Photos',poster:'📋 Programme',completed:'Completed',planned:'Planned',activity:'Activity'},
 de:{selected:'AUSGEWÄHLTE PROVINZ',clickCity:'Provinz auswählen',clickCityDesc:'Klicken Sie auf eine Provinz, um Aktivitäten, Fotos vor Ort und Programminformationen anzuzeigen.',network:'Provinznetzwerk',face:'Präsenzschulung',online:'Online-Schulung',participants:'Teilnehmende insgesamt',all:'Alle',faceFilter:'Präsenz',onlineFilter:'Online',done:'Durchgeführt',search:'Provinz suchen…',faceShort:'Präsenz',onlineShort:'Online',none:'Noch kein abgeschlossener Eintrag',click:'Provinz anklicken · Details werden hier geöffnet',noActivity:'Für diese Provinz liegt noch kein verifizierter abgeschlossener Aktivitätseintrag vor.',networkTag:'NETZWERK IN 81 PROVINZEN',training:'Peer-gestütztes Bildungsprogramm',person:'Teilnehmende',location:'Ort',photo:'📸 Fotos vor Ort',poster:'📋 Programmablauf',completed:'Durchgeführt',planned:'Geplant',activity:'Aktivität'}
 })[lang]||mapLabels('tr')}
function updateMapLabels(lang){
 const L=mapLabels(lang);
 document.querySelectorAll('[data-map-label]').forEach(el=>{const k=el.dataset.mapLabel;if(L[k])el.textContent=L[k];});
 const search=document.getElementById('citySearch');if(search)search.placeholder=L.search;
 const fc=document.getElementById('mapFaceCount');if(fc)fc.textContent=trainingData.filter(x=>x[2]==='Yüz yüze').length;
 const oc=document.getElementById('mapOnlineCount');if(oc)oc.textContent=trainingData.filter(x=>x[2]==='Çevrimiçi').length;
 const pc=document.getElementById('mapParticipantCount');if(pc)pc.textContent=trainingData.reduce((n,x)=>n+Number(x[4]||0),0).toLocaleString('tr-TR');
 document.querySelectorAll('.city-btn').forEach(b=>{const c=b.dataset.city;b.textContent=c+(completedActivities(c).length?' • '+(lang==='de'?'Aktivität':lang==='en'?'activity':'faaliyet'):'' )});
}
function cityInfo(city){
 selectedCity=city;
 const L=mapLabels(document.documentElement.dataset.lang||'tr');
 const a=activitiesFor(city), completed=completedActivities(city);
 document.getElementById('cityTitle').textContent=city;
 if(a.length){
   const items=a.map(x=>{const isPeerTraining=x.type==='Akran Destekli Eğitim Programı';const displayType=isPeerTraining?L.training:x.type;const displayTitle=isPeerTraining?L.training:x.title;return `<div class="map-activity-card"><div class="pill-row"><span class="tag">${esc(displayType)}</span><span class="tag">${esc(x.mode)}</span><span class="tag">${x.status==='completed'?esc(L.completed):esc(L.planned)}</span></div><div class="info-row"><span>${esc(x.date)}</span><b>${x.participants?esc(String(x.participants))+' '+esc(L.person):'—'}</b></div><div class="info-row"><span>${esc(L.activity)}</span><b>${esc(displayTitle)}</b></div><div class="info-row"><span>${esc(L.location)}</span><b>${esc(x.org)}</b></div></div>`}).join('');
   document.getElementById('cityInfo').innerHTML=`<div class="pill-row"><span class="tag">${completed.length} ${L.activity.toLocaleLowerCase(document.documentElement.lang==='tr'?'tr-TR':document.documentElement.lang)}</span><span class="tag">${a.length-completed.length} ${esc(L.planned.toLocaleLowerCase(document.documentElement.lang==='tr'?'tr-TR':document.documentElement.lang))}</span></div>${items}<div class="map-event-links"><a class="btn primary map-photo-link" href="/gallery.html?city=${encodeURIComponent(city)}">${L.photo}</a><a class="btn ghost map-poster-link" href="/gallery.html?city=${encodeURIComponent(city)}&view=poster">${L.poster}</a></div>`;
 }else{
   document.getElementById('cityInfo').innerHTML=`<span class="tag">${esc(L.networkTag)}</span><p class="prose" style="font-size:13px">${esc(L.noActivity)}</p><div class="notice">${esc(L.activity)}: ${esc(L.planned)}</div>`;
 }
 const svg=mapSvg();if(svg)[...svg.querySelectorAll('[id^="TR"]')].forEach(x=>x.classList.toggle('selected',x.dataset.city===city));
 document.querySelectorAll('.city-btn').forEach(x=>x.classList.toggle('selected',x.dataset.city===city));
}
function pathStatus(city){const a=completedActivities(city);return a.length?(a[0].mode==='Yüz yüze'?'face':a[0].mode==='Çevrimiçi'?'online':'none'):'none'}
async function buildMap(){const mount=document.getElementById('turkeyMapMount');if(!mount)return;try{const txt=await fetch('/turkey.svg?'+Date.now()).then(r=>{if(!r.ok)throw new Error('map');return r.text()});mount.innerHTML=txt;const svg=mount.querySelector('svg');if(!svg)throw new Error('svg');svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.setAttribute('role','img');svg.setAttribute('aria-label','Türkiye 81 il eğitim ağı');let matched=0;Object.entries(codeToCity).forEach(([code,city])=>{const el=svg.querySelector('#'+code);if(!el)return;matched++;el.dataset.city=city;el.classList.add(pathStatus(city));el.addEventListener('click',()=>cityInfo(city));el.addEventListener('mouseenter',()=>{const tip=document.getElementById('mapTip');tip.textContent=city;tip.style.display='block'});el.addEventListener('mouseleave',()=>{document.getElementById('mapTip').style.display='none'});});document.getElementById('mapFallback').style.display=matched<75?'flex':'none';applyMapFilter(document.querySelector('.filter[data-filter].active')?.dataset.filter||'all');}catch(e){console.error(e);document.getElementById('mapFallback').style.display='flex'}}
function applyMapFilter(f){const svg=mapSvg();if(!svg)return;[...svg.querySelectorAll('[id^="TR"]')].forEach(p=>{const c=p.dataset.city;if(!c)return;const a=completedActivities(c);let show=true;if(f==='face')show=a.some(x=>x.mode==='Yüz yüze');if(f==='online')show=a.some(x=>x.mode==='Çevrimiçi');if(f==='done')show=a.length>0;p.style.opacity=show?'1':'.24';p.style.pointerEvents=show?'auto':'none';});}
function buildCityList(){const box=document.getElementById('cityList');const lang=document.documentElement.dataset.lang||'tr';const suffix=lang==='de'?'Aktivität':lang==='en'?'activity':'faaliyet';box.innerHTML=provinces.map(c=>`<button class="city-btn" data-city="${esc(c)}">${esc(c)}${completedActivities(c).length?' • '+completedActivities(c).length+' '+suffix:''}</button>`).join('');box.querySelectorAll('.city-btn').forEach(b=>b.addEventListener('click',()=>cityInfo(b.dataset.city)))}
document.querySelectorAll('.filter[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');applyMapFilter(b.dataset.filter)}));
document.getElementById('citySearch').addEventListener('input',e=>{const q=e.target.value.toLocaleLowerCase('tr-TR');document.querySelectorAll('.city-btn').forEach(b=>b.style.display=b.dataset.city.toLocaleLowerCase('tr-TR').includes(q)?'block':'none')});
const provinceSection=document.getElementById('iller');
const initProvinceMap=()=>{buildMap();buildCityList();updateMapLabels(document.documentElement.dataset.lang||localStorage.getItem('enetcom_lang')||'tr');};
if('IntersectionObserver' in window && provinceSection){const mapObs=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){initProvinceMap();mapObs.disconnect();}},{rootMargin:'700px 0px'});mapObs.observe(provinceSection);}else{setTimeout(initProvinceMap,900);}
document.querySelectorAll('[data-modal]').forEach(el=>el.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();const kind=el.getAttribute('data-modal');if(kind)openModal(kind)}));
function openModal(kind){const c=document.getElementById('modalContent');const data={about:['Proje Hakkında',`Çevresel sürdürülebilirlik ve iklim değişikliği ile mücadele küresel ölçekte acil bir konu. e-NetCoM, ulus ötesi işbirliği ve deneyim paylaşımını; örgütlü eğitim arzını, bireysel kapasiteyi ve yerel dinamikleri güçlendiren bir yaklaşımla ele alıyor.<br><br>Proje; çevresel sürdürülebilirlik ve iklim değişikliğiyle mücadelede kilit rol oynayabilecek insan kaynağını geliştirmeyi, ilgili tarafları sürece dahil etmeyi, bireysel ve yerel boyutları öne çıkarmayı, kültürlerarası etkiyi anlamayı ve sosyal sürdürülebilirliği güçlendirmeyi amaçlıyor.`],goals:['Proje Hedefleri',`<ul><li>İnsan kaynağı potansiyelini geliştirmek.</li><li>İlgili tarafların ve kurumların kapasitesini desteklemek.</li><li>Çevre ve iklim değişikliğinin bireysel ve yerel boyutlarını öne çıkarmak.</li><li>Farklı kültür ve toplumlarda sürdürülebilir eğitim etkisini anlamak.</li><li>Sürdürülebilirliğin sosyal boyutunu güçlendirerek daha adil ve eşit bir topluma katkı sağlamak.</li></ul>`],consortium:['Konsorsiyum',`<div class="cards">${[['RTÜK','Sözleşme Kurumu','Türkiye · Ankara'],['Erciyes Üniversitesi','Ortak Kurum','Türkiye · Kayseri'],['Universität Wien','Ortak Kurum','Avusturya · Viyana'],['Türkiye Gençlik Vakfı','Ortak Kurum','Türkiye · İstanbul'],['SNSPA','Ortak Kurum','Romanya · Bükreş']].map(x=>`<div class="card"><span class="tag">${x[1]}</span><h3>${x[0]}</h3><p>${x[2]}</p></div>`).join('')}</div>`],management:['Proje Yönetimi',`Proje akış ve izleme planı, çalışma paketleri ve koordinasyon süreçleri bu platformda ayrı bir merkez olarak tutulur.<br><br><b>WP2</b> · Dijital öğrenme araçları, etkileşimli eğitim/farkındalık videoları, 1 Dakikada serisi ve e-Merkez.<br><b>WP3</b> · Doğanın Enerjileri akran eğitimcisi gelişim ve akran destekli eğitim programı.<br><b>WP4</b> · Çevresel sürdürülebilirlik bilim, iletişim ve medya ağı, çalıştaylar, yaygınlaştırma ve politika yapıcı ağları.`],scope:['Proje Kapsamı',`Proje dönemi <b>1 Aralık 2024 – 30 Kasım 2027</b>.<br><br><b>Haziran 2026 dönem raporu</b>, 30 Mayıs 2026 itibarıyla gerçekleşen uygulamaları ve sonuçları esas alıyor.<br><br>Koordinatör: RTÜK. Ortaklar: Erciyes Üniversitesi, Universität Wien, Türkiye Gençlik Vakfı ve SNSPA.`],learning:['Çevresel Genç Liderliği için Çoklu Öğrenme Tasarımları',`Kısa filmler, 1 Dakikada Çevre ve Sürdürülebilirlik yeni medya serisi ve öğrenme materyallerini çoklu öğrenme yaklaşımında bir araya getirir.`],peer:['Doğanın Enerjileri – Akran Eğitim Programı',`Sürdürülebilirlik ve yeşil beceriler alanında akran eğitimcilerinin gelişimini ve akran destekli eğitimi hedefleyen WP3 çalışmasıdır.<br><br><b>Hedef grup:</b> 15–25 yaş gençler.`],networkActivity:['Çevresel Sürdürülebilirlik Bilim, İletişim ve Medya Ağı',`Bilim, iletişim ve medya çalışmalarını; konferans, bildiri, çalıştay, yaygınlaştırma ve ortak üretim faaliyetlerini bir araya getiren WP4 çalışma alanıdır.`],workareas:['Yürütülen çalışma alanları',`Kısa filmler, e-Merkez, e-NetCoM Network, eğitim programları ve hashtag kampanyaları projenin başlıca çalışma alanlarıdır.`],allactivities:['Tüm Faaliyetler',activities.map(a=>`<div class="card" style="margin:12px 0"><span class="tag">${esc(a[1])}</span><h3>${esc(a[0])}</h3><p>${esc(a[2])}</p></div>`).join('')]};const x=data[kind]||data.about;c.innerHTML=`<h2>${x[0]}</h2><div class="prose">${x[1]}</div>`;document.getElementById('modal').classList.add('open')}
function closeModal(){document.getElementById('modal').classList.remove('open')}document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});


async function workshop(btn,type){const area=btn.parentElement.querySelector('textarea'),prompt=area.value.trim()||'e-NetCoM için çevresel sürdürülebilirlik';const out=document.getElementById('workout');out.innerHTML='<div class="workout">Atölye içeriği hazırlıyor…</div>';try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:`${type} hazırla. Konu: ${prompt}. e-NetCoM projesinin amacı ve çevresel sürdürülebilirlik bağlamıyla uyumlu, yayınlanabilir ve somut bir çıktı üret.`,history:[]})});const d=await r.json();out.innerHTML=`<div class="workout"><b>ATÖLYE ÇIKTISI · ${esc(type.toUpperCase())}</b><br><br>${esc(d.reply||'Çıktı üretilemedi.')}</div>`}catch(e){out.innerHTML='<div class="workout">Astra şu anda çevrimdışı. Lütfen birkaç saniye sonra tekrar deneyin.</div>'}}

(function(){
  const I={
    tr:{
      project:"Proje", activities:"Faaliyetler", media:"Medya", more:"Daha Fazla", workshop:"✦ Atölye",
      brand:"DOĞANIN ENERJİLERİ BİZİMLE",
      projectItems:["Proje Merkezi","Projenin Hikâyesi","Projenin Sahadaki İzi","Proje Çıktıları"],
      activityItems:["Çalışma Paketleri (WP2-WP3-WP4)","Türkiye'den Avrupa'ya uzanan çalışmalar.","Türkiye'de 81 İl","Uluslararası Buluşmalar"],
      moreItems:["Network","Akademi","İyi Uygulamalar","Ortaklar","Haberler","İletişim"],
      instagram:"Instagram", x:"X", youtube:"YouTube", mobileMenu:"Menü", mobileMore:"Daha Fazla", mobileProject:"Proje"
    },
    en:{
      project:"Project", activities:"Activities", media:"Media", more:"More", workshop:"✦ Workshop",
      brand:"NATURE'S ENERGY WITH US",
      projectItems:["Project Hub","The Project Story","The Project's Footprint","Project Outputs"],
      activityItems:["Work Packages (WP2-WP3-WP4)","From Türkiye to Europe.","81 Provinces in Türkiye","International Gatherings"],
      moreItems:["Network","Academy","Best Practices","Partners","News","Contact"],
      instagram:"Instagram", x:"X", youtube:"YouTube", mobileMenu:"Menu", mobileMore:"More", mobileProject:"Project"
    },
    de:{
      project:"Projekt", activities:"Aktivitäten", media:"Medien", more:"Mehr", workshop:"✦ Werkstatt",
      brand:"DIE ENERGIE DER NATUR MIT UNS",
      projectItems:["Projektzentrum","Die Projektgeschichte","Die Wirkung des Projekts vor Ort","Projektergebnisse"],
      activityItems:["Arbeitspakete (WP2-WP3-WP4)","Von der Türkei nach Europa.","81 Provinzen in der Türkei","Internationale Begegnungen"],
      moreItems:["Netzwerk","Akademie","Gute Praxisbeispiele","Partner","Nachrichten","Kontakt"],
      instagram:"Instagram", x:"X", youtube:"YouTube", mobileMenu:"Menü", mobileMore:"Mehr", mobileProject:"Projekt"
    }
  };
  function setText(el,text){if(el)el.textContent=text;}
  function updateHeader(lang){
    const L=I[lang]||I.tr;
    const nav=document.querySelector('.main-links');
    if(nav){
      const sums=nav.querySelectorAll('details>summary');
      setText(sums[0],L.project); setText(sums[1],L.activities); setText(sums[2],L.more);
      nav.querySelectorAll('.nav-project-dropdown a').forEach((a,i)=>setText(a,L.projectItems[i]));
      nav.querySelectorAll('.nav-activities-dropdown a').forEach((a,i)=>setText(a,L.activityItems[i]));
      nav.querySelectorAll('.nav-more .nav-dropdown a').forEach((a,i)=>setText(a,L.moreItems[i]));
      setText([...nav.children].find(el=>el.matches('a[href="#medya"]')),L.media);
      setText(nav.querySelector('.nav-workshop'),L.workshop);
    }
    setText(document.querySelector('.brand-wordmark small'),L.brand);
    document.querySelectorAll('.social-header .social-header-link span').forEach(span=>{
      const parent=span.closest('.social-header-link');
      if(parent?.classList.contains('instagram'))setText(span,L.instagram);
      else if(parent?.classList.contains('x'))setText(span,L.x);
      else if(parent?.classList.contains('youtube'))setText(span,L.youtube);
    });
    document.querySelectorAll('[data-mobile-label="menu"]').forEach(el=>setText(el,L.mobileMenu));
    document.querySelectorAll('[data-mobile-label="more"]').forEach(el=>setText(el,L.mobileMore));
    document.querySelectorAll('[data-mobile-label="project"]').forEach(el=>setText(el,L.mobileProject));
    const mobile=document.querySelector('.mobile-nav-links');
    if(mobile){
      const groups=mobile.querySelectorAll('.mobile-nav-group-label');
      setText(groups[0],L.mobileProject); setText(groups[1],L.mobileMore);
      const subs=mobile.querySelectorAll('a.mobile-sub');
      subs.forEach((a,i)=>setText(a,i<4?L.projectItems[i]:L.moreItems[i-4]));
      mobile.querySelectorAll(':scope > a:not(.mobile-sub):not(.mobile-workshop)').forEach(a=>{
        if(a.getAttribute('href')==='#faaliyetler')setText(a,L.activities);
        if(a.getAttribute('href')==='#medya')setText(a,L.media);
      });
      setText(mobile.querySelector('.mobile-workshop'),L.workshop);
    }
  }
  window.updateHeaderI18n=updateHeader;
  function refresh(){updateHeader((document.documentElement.lang||document.documentElement.dataset.lang||'tr').slice(0,2));}
  window.addEventListener('load',refresh);
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-lang-switch]');
    if(b)setTimeout(()=>updateHeader(b.dataset.langSwitch||'tr'),0);
  },true);
})();

(function(){
  const panel=document.getElementById('mobileNav');
  const openBtn=document.getElementById('mobileNavOpen');
  const closeBtn=document.getElementById('mobileNavClose');
  if(!panel||!openBtn||!closeBtn)return;
  const close=()=>{panel.classList.remove('open');panel.setAttribute('aria-hidden','true');document.body.style.overflow='';};
  const open=()=>{panel.classList.add('open');panel.setAttribute('aria-hidden','false');};
  openBtn.addEventListener('click',open);
  closeBtn.addEventListener('click',close);
  panel.addEventListener('click',e=>{if(e.target===panel)close();});
  panel.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
})();

/* V14 · Daha Fazla menüsü: içerik seçilince otomatik kapanır */
document.addEventListener('click', function(e){
  const clickedInsideMore = e.target.closest('.nav-more .nav-dropdown a');
  if(!clickedInsideMore) return;
  const more = clickedInsideMore.closest('.nav-more');
  if(more) more.removeAttribute('open');
}, true);

/* Klavye ile seçim yapıldığında da menüyü kapat */
document.addEventListener('keydown', function(e){
  if(e.key !== 'Enter' && e.key !== ' ') return;
  const focused = document.activeElement;
  if(!focused || !focused.matches('.nav-more .nav-dropdown a')) return;
  setTimeout(function(){
    const more = focused.closest('.nav-more');
    if(more) more.removeAttribute('open');
  }, 0);
}, true);

(function(){
  const hero = document.querySelector('.hero-v17');
  const bg = document.querySelector('.hero-v18-image');
  if(!hero || !bg) return;
  let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
  hero.addEventListener('pointermove', e=>{
    const r = hero.getBoundingClientRect();
    tx = ((e.clientX-r.left)/r.width-.5)*10;
    ty = ((e.clientY-r.top)/r.height-.5)*6;
    if(!raf){
      raf=requestAnimationFrame(()=>{
        cx += (tx-cx)*.08; cy += (ty-cy)*.08;
        bg.style.setProperty('--px', cx.toFixed(2)+'px');
        bg.style.setProperty('--py', cy.toFixed(2)+'px');
        bg.style.transform='scale(1.065) translate3d('+cx+'px,'+cy+'px,0)';
        raf=0;
      });
    }
  });
  hero.addEventListener('pointerleave',()=>{
    tx=0; ty=0;
  });
})();

(function(){
  const labels = {
    tr:"Türkiye'de 81 İl",
    en:"81 Provinces in Türkiye",
    de:"81 Provinzen in der Türkei"
  };
  function updateFooterProvinceLabel(lang){
    const a = document.querySelector('footer a[href="#iller"]');
    if(a) a.textContent = labels[lang] || labels.tr;
  }
  window.addEventListener('load', function(){
    const oldApply = window.apply;
    if(typeof oldApply === 'function'){
      window.apply = function(lang){
        const r = oldApply.apply(this, arguments);
        updateFooterProvinceLabel(lang || 'tr');
        return r;
      };
    }
    updateFooterProvinceLabel((document.documentElement.lang || 'tr').slice(0,2));
  });
})();

(function(){
  function closeMenus(){
    document.querySelectorAll('.nav-project,.nav-more,.nav-activities').forEach(function(d){
      d.removeAttribute('open');
    });
  }
  function toggle(details){
    const open=details.hasAttribute('open');
    closeMenus();
    if(!open)details.setAttribute('open','');
  }
  function scrollToId(id){
    closeMenus();
    const target=document.getElementById(id);
    if(target){
      requestAnimationFrame(function(){
        target.scrollIntoView({behavior:'smooth',block:'start'});
      });
    }
  }
  document.addEventListener('click',function(e){
    const projectSummary=e.target.closest('.nav-project>summary');
    if(projectSummary){
      e.preventDefault(); e.stopPropagation();
      const d=projectSummary.parentElement;
      const open=d.hasAttribute('open');
      closeMenus();
      if(!open)d.setAttribute('open','');
      return;
    }
    const projectLink=e.target.closest('.nav-project .nav-dropdown a');
    if(projectLink){
      e.preventDefault(); e.stopPropagation();
      closeMenus();
      const id=(projectLink.getAttribute('href')||'').slice(1);
      const target=document.getElementById(id);
      if(target) requestAnimationFrame(function(){target.scrollIntoView({behavior:'smooth',block:'start'});});
      return;
    }
    const a=e.target.closest('.nav-activities-dropdown a');
    if(a){
      e.preventDefault(); e.stopPropagation();
      scrollToId((a.getAttribute('href')||'').slice(1));
      return;
    }
    const activitySummary=e.target.closest('.nav-activities>summary');
    if(activitySummary){
      e.preventDefault(); e.stopPropagation();
      toggle(activitySummary.parentElement);
      return;
    }
    const moreSummary=e.target.closest('.nav-more>summary');
    if(moreSummary){
      e.preventDefault(); e.stopPropagation();
      toggle(moreSummary.parentElement);
      return;
    }
    if(e.target.closest('.nav-more .nav-dropdown a')){
      closeMenus();
      return;
    }
    if(e.target.closest('.main-links a,.nav-tools a,.nav-workshop') ||
       !e.target.closest('.nav-more,.nav-activities')){
      closeMenus();
    }
  },true);
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape')closeMenus();
  });
})();

(function(){
  const labels={
    tr:["Çalışma Paketleri (WP2-WP3-WP4)","Türkiye'den Avrupa'ya uzanan çalışmalar.","Türkiye'de 81 İl","Uluslararası Buluşmalar"],
    en:["Work Packages (WP2-WP3-WP4)","From Türkiye to Europe.","81 Provinces in Türkiye","International Gatherings"],
    de:["Arbeitspakete (WP2-WP3-WP4)","Von der Türkei nach Europa.","81 Provinzen in der Türkei","Internationale Begegnungen"]
  };
  function update(lang){
    const vals=labels[lang]||labels.tr;
    document.querySelectorAll('.nav-activities-dropdown a').forEach((el,i)=>{
      if(vals[i])el.textContent=vals[i];
    });
  }
  window.addEventListener('load',function(){
    const oldApply=window.apply;
    if(typeof oldApply==='function'){
      window.apply=function(lang){
        const r=oldApply.apply(this,arguments);
        update(lang||'tr');
        return r;
      };
    }
    update((document.documentElement.lang||'tr').slice(0,2));
  });
})();

(function(){
  'use strict';
  const root=document.documentElement;
  const fab=document.getElementById('a11yFab');
  const panel=document.getElementById('a11yPanel');
  const close=document.getElementById('a11yClose');
  const reset=document.getElementById('a11yReset');
  const skip=document.getElementById('a11ySkip');
  if(!fab||!panel)return;
  const keys=['large','contrast','links','motion','cursor','readable','focus'];
  const cls={large:'a11y-large',contrast:'a11y-contrast',links:'a11y-links',motion:'a11y-reduce-motion',cursor:'a11y-big-cursor',readable:'a11y-readable',focus:'a11y-focus'};
  const tr={
    tr:{title:'Erişilebilirlik',sub:'e-NetCoM\'u daha erişilebilir kullanın.',label:'Görsel ayarlar',large:'Büyük yazı',contrast:'Yüksek kontrast',links:'Bağlantıları vurgula',motion:'Hareketleri azalt',cursor:'Büyük imleç',readable:'Okuma kolaylığı',focus:'Klavye odağını güçlendir',off:'Kapalı',on:'Açık',keyboard:'Klavye ve ekran okuyucu',keyboardText:'Tab ile bağlantı ve düğmeler arasında ilerleyin, Enter ile seçin, Esc ile açık paneli kapatın. Sayfa semantik HTML ve görünür odak göstergeleriyle kullanılabilir.',reset:'Ayarları sıfırla',open:'Erişilebilirlik araçlarını aç',close:'Kapat',skip:'Ana içeriğe geç'},
    en:{title:'Accessibility',sub:'Make e-NetCoM easier to use.',label:'Visual settings',large:'Larger text',contrast:'High contrast',links:'Highlight links',motion:'Reduce motion',cursor:'Large cursor',readable:'Reading comfort',focus:'Stronger keyboard focus',off:'Off',on:'On',keyboard:'Keyboard and screen reader',keyboardText:'Use Tab to move between links and buttons, Enter to select, and Esc to close the open panel. The page uses semantic HTML and visible focus indicators.',reset:'Reset settings',open:'Open accessibility tools',close:'Close',skip:'Skip to main content'},
    de:{title:'Barrierefreiheit',sub:'e-NetCoM einfacher zugänglich nutzen.',label:'Visuelle Einstellungen',large:'Größere Schrift',contrast:'Hoher Kontrast',links:'Links hervorheben',motion:'Bewegungen reduzieren',cursor:'Großer Cursor',readable:'Lesefreundlichkeit',focus:'Tastaturfokus verstärken',off:'Aus',on:'Ein',keyboard:'Tastatur und Screenreader',keyboardText:'Mit Tab zwischen Links und Schaltflächen wechseln, mit Enter auswählen und mit Esc das geöffnete Panel schließen. Die Seite verwendet semantisches HTML und sichtbare Fokusmarkierungen.',reset:'Einstellungen zurücksetzen',open:'Barrierefreiheitswerkzeuge öffnen',close:'Schließen',skip:'Zum Hauptinhalt springen'}
  };
  let lang=(document.documentElement.lang||'tr').slice(0,2); if(!tr[lang])lang='tr';
  function load(){try{return JSON.parse(localStorage.getItem('enetcom_a11y')||'{}')}catch(e){return {}}}
  function save(state){try{localStorage.setItem('enetcom_a11y',JSON.stringify(state))}catch(e){}}
  let state=Object.assign({},load());
  function apply(){
    keys.forEach(k=>root.classList.toggle(cls[k],!!state[k]));
    const size=state.large?'1.15':'1'; root.style.setProperty('--a11y-size',size);
    document.querySelectorAll('[data-a11y]').forEach(b=>{const k=b.dataset.a11y; b.setAttribute('aria-pressed',String(!!state[k])); const st=b.querySelector('[data-state-for]'); if(st)st.textContent=state[k]?(tr[lang]?.on||'On'):(tr[lang]?.off||'Off')});
    save(state);
  }
  function updateText(l){
    lang=tr[l]?l:'tr'; const t=tr[lang];
    document.getElementById('a11yTitle').textContent=t.title;document.getElementById('a11ySubtitle').textContent=t.sub;document.getElementById('a11yVisualLabel').textContent=t.label;
    document.getElementById('a11yKeyboardTitle').textContent=t.keyboard;document.getElementById('a11yKeyboardText').textContent=t.keyboardText;document.getElementById('a11yReset').textContent=t.reset;
    fab.setAttribute('aria-label',t.open);fab.title=t.title;close.setAttribute('aria-label',t.close);skip.textContent=t.skip;
    document.querySelectorAll('[data-i18n]').forEach(el=>{const key=el.dataset.i18n;if(t[key])el.textContent=t[key]});apply();
  }
  function openPanel(){panel.classList.add('is-open');panel.setAttribute('aria-hidden','false');fab.setAttribute('aria-expanded','true');close.focus()}
  function closePanel(){panel.classList.remove('is-open');panel.setAttribute('aria-hidden','true');fab.setAttribute('aria-expanded','false');fab.focus()}
  fab.addEventListener('click',()=>panel.classList.contains('is-open')?closePanel():openPanel());
  close.addEventListener('click',closePanel);
  document.addEventListener('click',e=>{if(panel.classList.contains('is-open')&&!panel.contains(e.target)&&e.target!==fab)closePanel()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('is-open')){e.preventDefault();closePanel()}});
  document.querySelectorAll('[data-a11y]').forEach(btn=>btn.addEventListener('click',()=>{const k=btn.dataset.a11y;state[k]=!state[k];apply();}));
  reset.addEventListener('click',()=>{state={};apply();});
  window.addEventListener('storage',()=>{state=load();apply()});
  // Integrate with the site's existing TR/EN/DE language switcher without replacing it.
  function hookApply(){const old=window.apply;if(typeof old==='function'&&!old.__a11yWrapped){const wrapped=function(l){const r=old.apply(this,arguments);updateText((l||document.documentElement.lang||'tr').slice(0,2));return r};wrapped.__a11yWrapped=true;window.apply=wrapped;}}
  window.addEventListener('load',()=>{hookApply();updateText((document.documentElement.lang||'tr').slice(0,2));});
  setTimeout(hookApply,500);
  apply();
})();

(function(){
  const labels={
    tr:{section:'PROJE ÇIKTILARI',title:'Dijital Aktivizm ve Farkındalık Tasarımları',lead:'WP2 kapsamında hazırlanan dijital çevre aktivizmi ve farkındalık materyallerini keşfedin.',tag:'WP2 · DİJİTAL AKTİVİZM',desc:'Hashtag kampanyaları, kısa film fikirleri ve Green Challenge içerikleri.',copy:'Belgedeki kampanya temalarını, çok dilli hashtagleri ve eylem çağrılarını tek bir dijital alanda kullanın.',pdf:"PDF'yi aç ↗",kit:'Dijital kiti keşfet →',nav:'Proje Çıktıları'},
    en:{section:'PROJECT OUTPUTS',title:'Digital Activism and Awareness Designs',lead:'Explore the digital environmental activism and awareness materials prepared under WP2.',tag:'WP2 · DIGITAL ACTIVISM',desc:'Hashtag campaigns, short-film ideas and Green Challenge content.',copy:'Use the campaign themes, multilingual hashtags and calls to action from the document in one digital space.',pdf:'Open PDF ↗',kit:'Explore the digital kit →',nav:'Project Outputs'},
    de:{section:'PROJEKTERGEBNISSE',title:'Digitale Aktivismus- und Sensibilisierungsdesigns',lead:'Entdecken Sie die im Rahmen von WP2 erstellten Materialien für digitalen Umweltaktivismus und Sensibilisierung.',tag:'WP2 · DIGITALER AKTIVISMUS',desc:'Hashtag-Kampagnen, Kurzfilmideen und Green-Challenge-Inhalte.',copy:'Nutzen Sie Kampagnenthemen, mehrsprachige Hashtags und Handlungsaufrufe des Dokuments an einem digitalen Ort.',pdf:'PDF öffnen ↗',kit:'Digitales Kit entdecken →',nav:'Projektergebnisse'}
  };
  function update(l){const t=labels[l]||labels.tr;const root=document.getElementById('ciktilar');if(!root)return;const q=(sel)=>root.querySelector(sel);if(q('.eyebrow'))q('.eyebrow').textContent=t.section;if(q('h2'))q('h2').textContent=t.title;if(q('.section-lead'))q('.section-lead').textContent=t.lead;if(q('.tag'))q('.tag').textContent=t.tag;if(q('h3'))q('h3').textContent=t.desc;if(q('p'))q('p').textContent=t.copy;const btns=root.querySelectorAll('.output-actions .btn');if(btns[0])btns[0].textContent=t.pdf;if(btns[1])btns[1].textContent=t.kit;document.querySelectorAll('a[href="#ciktilar"]').forEach(a=>{if(a.textContent.trim()==='Proje Çıktıları'||a.textContent.trim()==='Project Outputs'||a.textContent.trim()==='Projektergebnisse')a.textContent=t.nav})}
  function hook(){const old=window.apply;if(typeof old==='function'&&!old.__v67Outputs){const wrapped=function(l){const r=old.apply(this,arguments);update((l||document.documentElement.lang||'tr').slice(0,2));return r};wrapped.__v67Outputs=true;window.apply=wrapped;}update((document.documentElement.lang||'tr').slice(0,2));}
  window.addEventListener('load',hook);setTimeout(hook,700);
})();

document.addEventListener("click",function(e){
  const link=e.target.closest("[data-clear-wp]");
  if(link) clearActivityWP();
});


document.addEventListener("click",function(e){
  const card=e.target.closest("a.wp-card-link[href]");
  if(!card)return;
  try{
    const url=new URL(card.getAttribute("href"),window.location.href);
    const wp=url.searchParams.get("wp");
    if(["WP2","WP3","WP4"].includes(wp)){
      rememberActivityWP(wp);
    }
  }catch(err){}
});

(function(){
  'use strict';
  const modal=document.getElementById('wp3AkranModal');
  const close=document.getElementById('wp3AkranClose');
  const viewer=document.getElementById('wp3ImageViewer');
  const viewerImg=document.getElementById('wp3ViewerImage');
  const viewerCaption=document.getElementById('wp3ViewerCaption');
  const viewerClose=document.getElementById('wp3ImageClose');
  const viewerPrev=document.getElementById('wp3ImagePrev');
  const viewerNext=document.getElementById('wp3ImageNext');
  if(!modal)return;

  const futurePhotos=[{src:'./assets/site-images/568c9e78e1f947e9.webp',title:'10 Ocak 2026 · Eğitimden Kareler 1'},{src:'./assets/site-images/62a30fbc7e77d5d4.webp',title:'10 Ocak 2026 · Eğitimden Kareler 2'}];

  function openModal(e){
    if(e)e.preventDefault();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
    if(close)close.focus();
  }
  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    if(!viewer.classList.contains('open'))document.body.style.overflow='';
  }

  let viewerItems=[];
  let viewerIndex=0;
  function collectViewerItems(group){
    return Array.from(document.querySelectorAll('[data-wp3-view-image][data-wp3-group="'+group+'"]'));
  }
  function renderViewer(){
    if(!viewerItems.length)return;
    const item=viewerItems[viewerIndex];
    viewerImg.src=item.currentSrc||item.src;
    viewerImg.alt=item.alt||'Büyütülmüş görsel';
    if(viewerCaption)viewerCaption.textContent=activityCaption(item.alt||'',window.__enetcomActivityLang||document.documentElement.dataset.lang||'tr');
    const single=viewerItems.length<2;
    if(viewerPrev)viewerPrev.style.display=single?'none':'grid';
    if(viewerNext)viewerNext.style.display=single?'none':'grid';
  }
  function openImage(img){
    const group=img.getAttribute('data-wp3-group')||'gallery';
    viewerItems=collectViewerItems(group);
    viewerIndex=Math.max(0,viewerItems.indexOf(img));
    if(!viewerItems.length){viewerItems=[img];viewerIndex=0;}
    renderViewer();
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function changeViewer(delta){
    if(!viewer.classList.contains('open')||viewerItems.length<2)return;
    viewerIndex=(viewerIndex+delta+viewerItems.length)%viewerItems.length;
    renderViewer();
  }
  function closeImage(){
    viewer.classList.remove('open');
    viewer.setAttribute('aria-hidden','true');
    viewerImg.src='';
    viewerItems=[];
    if(viewerCaption)viewerCaption.textContent='';
    if(!modal.classList.contains('open'))document.body.style.overflow='';
  }

  document.addEventListener('click',function(e){
    const open=e.target.closest('[data-open-wp3-akran]');
    if(open){openModal(e);return;}
    const img=e.target.closest('[data-wp3-view-image]');
    if(img){openImage(img);return;}
    if(e.target===modal)closeModal();
    if(e.target===viewer)closeImage();
  });
  if(close)close.addEventListener('click',closeModal);
  if(viewerClose)viewerClose.addEventListener('click',closeImage);
  if(viewerPrev)viewerPrev.addEventListener('click',function(e){e.stopPropagation();changeViewer(-1);});
  if(viewerNext)viewerNext.addEventListener('click',function(e){e.stopPropagation();changeViewer(1);});
  document.addEventListener('keydown',function(e){
    if(viewer.classList.contains('open')){
      if(e.key==='Escape'){closeImage();return;}
      if(e.key==='ArrowLeft'){e.preventDefault();changeViewer(-1);return;}
      if(e.key==='ArrowRight'){e.preventDefault();changeViewer(1);return;}
    }else if(modal.classList.contains('open') && e.key==='Escape'){
      closeModal();
    }
  });

  // Keep the gallery extensible without changing the card layout.
  const gallery=document.getElementById('wp3Gallery');
  if(gallery && futurePhotos.length){
    futurePhotos.forEach(function(item){
      const wrap=document.createElement('div');
      wrap.className='wp3-gallery-item';
      wrap.innerHTML='<img src="'+item.src+'" alt="İstanbul · Akran Eğiticisi Gelişim Programı" data-wp3-view-image data-wp3-group="gallery" loading="lazy"><span class="wp3-gallery-caption" data-caption-raw="İstanbul · Akran Eğiticisi Gelişim Programı"><strong>İstanbul · Akran Eğiticisi Gelişim Programı</strong></span>';
      gallery.appendChild(wrap);
    });
  }
})();

(function(){
  const modal=document.getElementById('wp2ZirveModal');
  const closeBtn=document.getElementById('wp2ZirveClose');
  const viewer=document.getElementById('wp2Viewer');
  const viewerImg=document.getElementById('wp2ViewerImage');
  const viewerCaption=document.getElementById('wp2ViewerCaption');
  const viewerCounter=document.getElementById('wp2ViewerCounter');
  const prev=document.getElementById('wp2ViewerPrev');
  const next=document.getElementById('wp2ViewerNext');
  const viewerClose=document.getElementById('wp2ViewerClose');
  if(!modal||!viewer)return;

  const groups={
    program:[
      {src:"./assets/site-images/ab0cc1e85d880073.webp",caption:"16–17 Nisan 2025 · Çevresel Sürdürülebilirlik Zirvesi · Program Akışı"},
      {src:"./assets/site-images/1f0f96a6bd350f40.webp",caption:"26 Mart 2026 · Gençlik, İklim Değişikliği ve Medya Zirvesi · Program Akışı"}
    ],
    april:[
      {src:"./assets/site-images/a6d2bd10ba406d43.webp",caption:"İzmir · Çevresel Sürdürülebilirlik Zirvesi"},
      {src:"./assets/site-images/fd1d06ea0d4c35b4.webp",caption:"İzmir · Çevresel Sürdürülebilirlik Zirvesi"}
    ],
    march:[
      {src:"./assets/site-images/176126ef50136efa.webp",caption:"İzmir · Gençlik, İklim Değişikliği ve Medya Zirvesi"},
      {src:"./assets/site-images/11ac511cb78200a8.webp",caption:"İzmir · Gençlik, İklim Değişikliği ve Medya Zirvesi"}
    ]
  };

  let currentGroup='program', currentIndex=0;

  function openModal(e){
    if(e)e.preventDefault();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }
  function closeModal(){
    viewer.classList.remove('open');
    viewer.setAttribute('aria-hidden','true');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
  }
  function showViewer(group,index){
    currentGroup=group;
    const list=groups[group]||[];
    currentIndex=(index+list.length)%list.length;
    const item=list[currentIndex];
    viewerImg.src=item.src;
    viewerImg.alt=item.caption;
    viewerCaption.textContent=activityCaption(item.caption,window.__enetcomActivityLang||document.documentElement.dataset.lang||'tr');
    viewerCounter.textContent=(currentIndex+1)+' / '+list.length;
    const single=list.length<2;
    prev.style.display=single?'none':'grid';
    next.style.display=single?'none':'grid';
    viewer.classList.add('open');
    viewer.setAttribute('aria-hidden','false');
  }
  function changeViewer(step){
    const list=groups[currentGroup]||[];
    if(list.length<2)return;
    currentIndex=(currentIndex+step+list.length)%list.length;
    const item=list[currentIndex];
    viewerImg.src=item.src;
    viewerImg.alt=item.caption;
    viewerCaption.textContent=activityCaption(item.caption,window.__enetcomActivityLang||document.documentElement.dataset.lang||'tr');
    viewerCounter.textContent=(currentIndex+1)+' / '+list.length;
  }
  document.addEventListener('click',function(e){
    const card=e.target.closest('[data-open-wp2-summit]');
    if(card){openModal(e);return;}
    const item=e.target.closest('[data-wp2-view]');
    if(item){
      e.preventDefault();
      showViewer(item.dataset.wp2Group,Number(item.dataset.wp2Index||0));
    }
  });
  closeBtn.addEventListener('click',closeModal);
  viewerClose.addEventListener('click',function(e){e.stopPropagation();viewer.classList.remove('open');viewer.setAttribute('aria-hidden','true');});
  prev.addEventListener('click',function(e){e.stopPropagation();changeViewer(-1);});
  next.addEventListener('click',function(e){e.stopPropagation();changeViewer(1);});
  modal.addEventListener('click',function(e){if(e.target===modal)closeModal();});
  viewer.addEventListener('click',function(e){if(e.target===viewer){viewer.classList.remove('open');viewer.setAttribute('aria-hidden','true');}});
  document.addEventListener('keydown',function(e){
    if(!viewer.classList.contains('open')){
      if(modal.classList.contains('open')&&e.key==='Escape')closeModal();
      return;
    }
    if(e.key==='Escape'){viewer.classList.remove('open');viewer.setAttribute('aria-hidden','true');}
    if(e.key==='ArrowLeft'){e.preventDefault();changeViewer(-1);}
    if(e.key==='ArrowRight'){e.preventDefault();changeViewer(1);}
  });
})();

(function(){
  const rows=[
    {date:{tr:'17 Nisan 2025',en:'17 April 2025',de:'17. April 2025'},tr:'Çevresel Sürdürülebilirlik Zirvesi',en:'Environmental Sustainability Summit',de:'Gipfel für ökologische Nachhaltigkeit',url:'assets/network-pdfs/01_Cevresel_Surdurulebilirlik_Zirvesi_17_Nisan_2025.pdf'},
    {date:{tr:'26–29 Ağustos 2025',en:'26–29 August 2025',de:'26.–29. August 2025'},tr:'5. Uluslararası Eğitim Teknolojileri ve Çevrimiçi Öğrenme Konferansı',en:'5th International Conference on Educational Technology and Online Learning',de:'5. Internationale Konferenz für Bildungstechnologie und Online-Lernen',url:'assets/network-pdfs/02_ICETOL_2025.pdf'},
    {date:{tr:'13–17 Ekim 2025',en:'13–17 October 2025',de:'13.–17. Oktober 2025'},tr:'6. Ulusal Eğitimde Dönüşüm Forumu',en:'6th National Forum on Transformation in Education',de:'6. Nationales Forum für Transformation in der Bildung',url:'assets/network-pdfs/03_UEDFOR_6_2025.pdf'},
    {date:{tr:'5–7 Kasım 2025',en:'5–7 November 2025',de:'5.–7. November 2025'},tr:'13. Ulusal Katı Atık Yönetimi Kongresi',en:'13th National Solid Waste Management Congress',de:'13. Nationaler Kongress für Siedlungsabfallmanagement',url:'assets/network-pdfs/04_UKAY_2025.pdf'},
    {date:{tr:'26–29 Kasım 2025',en:'26–29 November 2025',de:'26.–29. November 2025'},tr:'Uluslararası Eğitim Kongresi',en:'International Education Congress',de:'Internationaler Bildungskongress',url:'assets/network-pdfs/05_International_Education_Congress_2025.pdf'},
    {date:{tr:'23–29 Aralık 2025',en:'23–29 December 2025',de:'23.–29. Dezember 2025'},tr:'Ege 14. Uluslararası Sosyal Bilimler Kongresi',en:'14th Aegean International Congress of Social Sciences',de:'14. Internationaler Kongress für Sozialwissenschaften der Ägäis',url:'assets/network-pdfs/06_Ege_14_Uluslararasi_Sosyal_Bilimler_Kongresi_2025.pdf'},
    {date:{tr:'13–15 Mart 2026',en:'13–15 March 2026',de:'13.–15. März 2026'},tr:'Çukurova Uluslararası Temel ve Uygulamalı Bilimler Kongresi',en:'Çukurova International Congress of Basic and Applied Sciences',de:'Internationaler Kongress für Grundlagen- und Angewandte Wissenschaften Çukurova',url:'assets/network-pdfs/07_Cukurova_Uluslararasi_Temel_ve_Uygulamali_Bilimler_Kongresi_2026.pdf'},
    {date:{tr:'26 Mart 2026',en:'26 March 2026',de:'26. März 2026'},tr:'Kültürel Bilişim, İletişim ve Medya Çalışmaları Konferansı – Gençlik, İklim Değişikliği ve Medya Zirvesi – Dijital Aktivizmin Yeni Dili',en:'Conference on Cultural Informatics, Communication and Media Studies – Youth, Climate Change and Media Summit – The New Language of Digital Activism',de:'Konferenz für Kulturinformatik, Kommunikation und Medien – Gipfel Jugend, Klimawandel und Medien – Die neue Sprache des digitalen Aktivismus',url:'assets/network-pdfs/08_26_Mart_2026_Genclik_Iklim_Medya_Zirvesi.pdf'},
    {date:{tr:'12–14 Haziran 2026',en:'12–14 June 2026',de:'12.–14. Juni 2026'},tr:'15. Uluslararası Sosyal Bilimler Konferansı',en:'15th International Conference of Social Sciences',de:'15. Internationale Konferenz für Sozialwissenschaften',url:'assets/network-pdfs/09_15_Uluslararasi_Sosyal_Bilimler_Konferansi_2026.pdf'}
  ];
  const labels={tr:{date:'Tarih',event:'Etkinlik Adı',file:'Dosya',pdf:'PDF'},en:{date:'Date',event:'Event Name',file:'File',pdf:'PDF'},de:{date:'Datum',event:'Veranstaltungsname',file:'Datei',pdf:'PDF'}};
  function lang(){return (document.documentElement.dataset.lang||document.documentElement.lang||'tr').slice(0,2)}
  function render(){
    const table=document.getElementById('networkEventsTable'); if(!table)return;
    const l=labels[lang()]||labels.tr;
    table.querySelector('[data-network-head="date"]').textContent=l.date;
    table.querySelector('[data-network-head="event"]').textContent=l.event;
    table.querySelector('[data-network-head="file"]').textContent=l.file;
    table.querySelector('tbody').innerHTML=rows.map(r=>{const lcode=lang(); const d=(typeof r.date==='object'?(r.date[lcode]||r.date.tr):r.date); return `<tr><td>${d}</td><td>${r[lang()]||r.tr}</td><td><a href="${r.url}" target="_blank" rel="noopener" class="network-pdf-link">${l.pdf} ↗</a></td></tr>`;}).join('');
  }
  window.renderNetworkEventsTable=render;
  document.addEventListener('click',function(e){
    const b=e.target.closest('[data-lang-switch]');
    if(b)setTimeout(render,30);
  });
  const obs=new MutationObserver(function(){render()});
  obs.observe(document.documentElement,{attributes:true,attributeFilter:['data-lang','lang']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
})();

(function(){
  const DB_URL = './assets/database/database.json';
  const PAGE_SIZE = 3;

  const ui = {
    tr:{
      eyebrow:'E-NETCOM VERİTABANI',
      title:'Çevre ve sürdürülebilirlik e-Merkezi.',
      lead:'2.449 kaynaktan oluşan yerel arşivde araştırma, makale, rapor ve diğer içerikleri arayın; tür, konu ve dile göre filtreleyin.',

      search:'Başlık, yazar veya açıklamada ara...',
      type:'Tüm içerik türleri',
      topic:'Tüm konular',
      lang:'Tüm diller',
      loading:'Veritabanı yükleniyor...',
      result:'sonuç',
      results:'sonuç',
      empty:'Aramanızla eşleşen kayıt bulunamadı.',
      detail:'Detayları görüntüle',
      source:'Kaynağa git ↗',
      author:'Yazar',
      year:'Yıl',
      contentType:'İçerik türü',
      topicLabel:'Konu',
      language:'Dil',
      noData:'Açıklama bulunmuyor.',
      original:'Orijinal kaynağı aç ↗',

      stats:{type:'İçerik Türü',topic:'Konu',lang:'Dil'},
      close:'Kapat'
    },
    en:{
      eyebrow:'E-NETCOM DATABASE',
      title:'Environmental and sustainability e-Centre.',
      lead:'Search the local archive of 2,449 resources and filter research, articles, reports and other content by type, topic and language.',

      search:'Search title, author or description...',
      type:'All content types',
      topic:'All topics',
      lang:'All languages',
      loading:'Loading database...',
      result:'result',
      results:'results',
      empty:'No records match your search.',
      detail:'View details',
      source:'Open source ↗',
      author:'Author',
      year:'Year',
      contentType:'Content type',
      topicLabel:'Topic',
      language:'Language',
      noData:'No description available.',
      original:'Open original source ↗',

      stats:{type:'Content Type',topic:'Topic',lang:'Language'},
      close:'Close'
    },
    de:{
      eyebrow:'E-NETCOM DATENBANK',
      title:'e-Zentrum für Umwelt und Nachhaltigkeit.',
      lead:'Durchsuchen Sie das lokale Archiv mit 2.449 Ressourcen und filtern Sie Forschung, Artikel, Berichte und weitere Inhalte nach Typ, Thema und Sprache.',

      search:'Titel, Autor oder Beschreibung durchsuchen...',
      type:'Alle Inhaltstypen',
      topic:'Alle Themen',
      lang:'Alle Sprachen',
      loading:'Datenbank wird geladen...',
      result:'Ergebnis',
      results:'Ergebnisse',
      empty:'Keine passenden Einträge gefunden.',
      detail:'Details anzeigen',
      source:'Quelle öffnen ↗',
      author:'Autor',
      year:'Jahr',
      contentType:'Inhaltstyp',
      topicLabel:'Thema',
      language:'Sprache',
      noData:'Keine Beschreibung verfügbar.',
      original:'Originalquelle öffnen ↗',

      stats:{type:'Inhaltstyp',topic:'Thema',lang:'Sprache'},
      close:'Schließen'
    }
  };

  let database = [];
  let filtered = [];
  let currentPage = 1;
  let currentLang = 'tr';

  const $ = id => document.getElementById(id);
  const search = $('localDbSearch');
  const type = $('localDbType');
  const topic = $('localDbTopic');
  const language = $('localDbLang');
  const results = $('localDbResults');
  const pagination = $('localDbPagination');
  const count = $('localDbCount');
  const modal = $('localDbModal');
  const modalContent = $('localDbModalContent');
  const modalClose = $('localDbModalClose');

  function getLang(){
    const l=(document.documentElement.dataset.lang || document.documentElement.lang || 'tr').slice(0,2);
    return ui[l] ? l : 'tr';
  }

  function esc(v){
    return String(v==null?'':v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function text(v){ return v==null ? '' : String(v).trim(); }

  function unique(key){
    return [...new Set(database.map(x=>text(x[key])).filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b,currentLang==='tr'?'tr':currentLang));
  }

  function fillSelect(el, values, placeholder){
    el.innerHTML='';
    const first=document.createElement('option');
    first.value='';
    first.textContent=placeholder;
    el.appendChild(first);
    values.forEach(v=>{
      const o=document.createElement('option');
      o.value=v; o.textContent=v; el.appendChild(o);
    });
  }

  function countBy(key){
    const counts={};
    database.forEach(item=>{
      const value=text(item[key]);
      if(value) counts[value]=(counts[value]||0)+1;
    });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]));
  }

  function renderOverview(){
    const t=ui[currentLang];
    const rows=[
      ['localDbOverviewType',t.stats.type,'content_type'],
      ['localDbOverviewTopic',t.stats.topic,'topic'],
      ['localDbOverviewLang',t.stats.lang,'lang']
    ];
    rows.forEach(([id,label,key])=>{
      const row=$(id); if(!row)return;
      row.querySelector('strong').textContent=label+':';
      const values=row.querySelector('.local-db-overview-values');
      const entries=countBy(key);
      values.innerHTML=entries.map((entry,i)=>
        `<span>${esc(entry[0])} <b>(${entry[1].toLocaleString(currentLang==='tr'?'tr-TR':undefined)})</b></span>`
      ).join('<span class="stat-sep">•</span>');
    });
  }

  function applyUi(){
    currentLang=getLang();
    const t=ui[currentLang];

    $('localDbEyebrow').textContent=t.eyebrow;
    $('localDbTitle').textContent=t.title;
    $('localDbLead').textContent=t.lead;
    $('localDbSearch').placeholder=t.search;
    modalClose.setAttribute('aria-label',t.close);

    const oldType=type.value, oldTopic=topic.value, oldLang=language.value;
    fillSelect(type,unique('content_type'),t.type);
    fillSelect(topic,unique('topic'),t.topic);
    fillSelect(language,unique('lang'),t.lang);
    if([...type.options].some(o=>o.value===oldType)) type.value=oldType;
    if([...topic.options].some(o=>o.value===oldTopic)) topic.value=oldTopic;
    if([...language.options].some(o=>o.value===oldLang)) language.value=oldLang;

    renderOverview();
    render();
  }

  function render(){
    const t=ui[currentLang];
    const q=text(search.value).toLocaleLowerCase(currentLang==='tr'?'tr-TR':undefined);
    const selectedType=type.value, selectedTopic=topic.value, selectedLang=language.value;

    filtered=database.filter(item=>{
      const hay=[
        item.title,item.author,item.description,item.year,
        item.content_type,item.topic,item.lang
      ].map(text).join(' ').toLocaleLowerCase(currentLang==='tr'?'tr-TR':undefined);

      return (!q || hay.includes(q))
        && (!selectedType || text(item.content_type)===selectedType)
        && (!selectedTopic || text(item.topic)===selectedTopic)
        && (!selectedLang || text(item.lang)===selectedLang);
    });

    const pages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
    if(currentPage>pages) currentPage=pages;

    count.textContent=filtered.length.toLocaleString(currentLang==='tr'?'tr-TR':undefined)+' '+(filtered.length===1?t.result:t.results);

    const start=(currentPage-1)*PAGE_SIZE;
    const items=filtered.slice(start,start+PAGE_SIZE);

    if(!items.length){
      results.innerHTML='<div class="local-db-empty">'+esc(t.empty)+'</div>';
      pagination.innerHTML='';
      return;
    }

    results.innerHTML=items.map((item,i)=>{
      const index=start+i;
      const desc=text(item.description);
      return `
        <article class="local-db-item">
          <div class="local-db-tags">
            ${item.content_type?`<span class="local-db-tag">${esc(item.content_type)}</span>`:''}
            ${item.topic?`<span class="local-db-tag">${esc(item.topic)}</span>`:''}
            ${item.lang?`<span class="local-db-tag">${esc(item.lang)}</span>`:''}
            ${item.year?`<span class="local-db-tag">${esc(item.year)}</span>`:''}
          </div>
          <h3>${esc(item.title || 'Untitled')}</h3>
          ${item.author?`<div class="local-db-author">${esc(item.author)}</div>`:''}
          ${desc?`<p class="local-db-desc">${esc(desc.slice(0,300))}${desc.length>300?'…':''}</p>`:''}
          <div class="local-db-actions">
            <button class="local-db-detail-btn" type="button" data-local-db-detail="${index}">${esc(t.detail)}</button>
            ${item.url?`<a class="local-db-source" href="${esc(item.url)}" target="_blank" rel="noopener">${esc(t.source)}</a>`:''}
          </div>
        </article>
      `;
    }).join('');

    results.querySelectorAll('[data-local-db-detail]').forEach(btn=>{
      btn.addEventListener('click',()=>openDetail(Number(btn.dataset.localDbDetail)));
    });

    renderPagination(pages);
  }

  function renderPagination(pages){
    pagination.innerHTML='';
    if(pages<=1) return;

    const make=(label,page,active=false,disabled=false)=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='local-db-page'+(active?' active':'');
      b.textContent=label;
      b.disabled=disabled;
      b.addEventListener('click',()=>{
        currentPage=page; render();
        $('veritabani').scrollIntoView({behavior:'smooth',block:'start'});
      });
      return b;
    };

    pagination.appendChild(make('‹',Math.max(1,currentPage-1),false,currentPage===1));

    let start=Math.max(1,currentPage-2);
    let end=Math.min(pages,start+4);
    if(end-start<4) start=Math.max(1,end-4);

    for(let p=start;p<=end;p++) pagination.appendChild(make(String(p),p,p===currentPage));

    pagination.appendChild(make('›',Math.min(pages,currentPage+1),false,currentPage===pages));
  }

  function openDetail(index){
    const item=filtered[index];
    if(!item) return;
    const t=ui[currentLang];

    modalContent.innerHTML=`
      <div class="local-db-tags">
        ${item.content_type?`<span class="local-db-tag">${esc(item.content_type)}</span>`:''}
        ${item.topic?`<span class="local-db-tag">${esc(item.topic)}</span>`:''}
        ${item.lang?`<span class="local-db-tag">${esc(item.lang)}</span>`:''}
      </div>
      <h2>${esc(item.title || 'Untitled')}</h2>
      <div class="local-db-detail-grid">
        <div class="local-db-detail-cell"><small>${esc(t.author)}</small><b>${esc(item.author || '—')}</b></div>
        <div class="local-db-detail-cell"><small>${esc(t.year)}</small><b>${esc(item.year || '—')}</b></div>
        <div class="local-db-detail-cell"><small>${esc(t.contentType)}</small><b>${esc(item.content_type || '—')}</b></div>
        <div class="local-db-detail-cell"><small>${esc(t.topicLabel)}</small><b>${esc(item.topic || '—')}</b></div>
        <div class="local-db-detail-cell"><small>${esc(t.language)}</small><b>${esc(item.lang || '—')}</b></div>
      </div>
      <div class="local-db-full-desc">${esc(item.description || t.noData)}</div>
      ${item.url?`<a class="local-db-source-btn" href="${esc(item.url)}" target="_blank" rel="noopener">${esc(t.original)}</a>`:''}
    `;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
  }

  function close(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
  }

  modalClose.addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal) close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape') close();});

  [search,type,topic,language].forEach(el=>{
    el.addEventListener('input',()=>{currentPage=1;render();});
    el.addEventListener('change',()=>{currentPage=1;render();});
  });

  let dbLoaded=false;
  let dbLoading=false;
  function loadDatabase(){
    if(dbLoaded||dbLoading)return;
    dbLoading=true;
    fetch(DB_URL,{cache:'default'})
      .then(r=>{
        if(!r.ok) throw new Error('database.json HTTP '+r.status);
        return r.json();
      })
      .then(data=>{
        database=Array.isArray(data) ? data : (Array.isArray(data.items)?data.items:[]);
        dbLoaded=true;
        applyUi();
      })
      .catch(err=>{
        console.error('e-NetCoM local database:',err);
        const t=ui[getLang()];
        count.textContent='—';
        results.innerHTML='<div class="local-db-empty">'+esc(t.loading)+'<br><small>'+esc('database.json could not be loaded.')+'</small></div>';
      })
      .finally(()=>{dbLoading=false;});
  }
  const dbSection=document.getElementById('veritabani');
  if('IntersectionObserver' in window && dbSection){
    const dbObs=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){loadDatabase();dbObs.disconnect();}},{rootMargin:'900px 0px'});
    dbObs.observe(dbSection);
  }else{setTimeout(loadDatabase,1200);}
  document.querySelectorAll('a[href="#veritabani"]').forEach(a=>a.addEventListener('click',()=>setTimeout(loadDatabase,50)));

  // Existing site language switchers update html[data-lang]; keep the database UI synchronized.
  const observer=new MutationObserver(()=>{
    const next=getLang();
    if(next!==currentLang){currentLang=next;if(dbLoaded) applyUi();else applyUi();}
  });
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-lang','lang']});
})();
