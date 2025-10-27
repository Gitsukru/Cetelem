/**
 * TESBIHAT DATA
 * Structure complète des tesbihat pour les 5 namaz quotidiens
 * Format: turkish / arabic (séparés)
 */


// ============================================
// PRIÈRES COMMUNES - Utilisées dans 2+ temps
// ============================================
const COMMON_PRAYERS = {
  estegfirullah5x: { type: 'repeat', count: 5, text: 'Esteğfirullah' },
  allahummeEntesselam: { type: 'prayer', text: 'Allahumme entesselâmu ve minkesselâm, tebârekte yâ zelcelâli velikram' },
  salatenTuncina: { type: 'prayer', text: 'Allahumme salli alâ Seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed. Salâten tuncina biha min cemîil ahvâli vel âfât, ve takdilena biha cemîel hâcat, ve tutahhirunâ biha min cemîis seyyiât, ve terfeuna biha indeke âledderecât, ve tubelliğuna biha aksel ğâyat, min cemiil hayrat fil hayati ve bâdel memat, birahmetika yâ erhamerrahimin, bi hurmeti Habibike yâ erhamerrahimin, bi hurmeti cemiil enbiya-i vel evliya-i pîri pîran, pîri âzam ya Erhamerrahimin âmin, ve selâmun âlel murselin velhamdulillahi rabbil âlemin' },
  subhanallahiVelhamdulillahi: { type: 'prayer', text: 'Subhânallahi velhamdulillâhi ve lâilâhe illallahu vallahu ekber, ve lâhavle ve lâkuvvete illâ billâhil aliyyil azîm' },
  ayetulKursi: { type: 'prayer', text: 'Bismillâhirrahmânirrahîm, Allahu lâ ilâhe illâ huve\'l-hayyul kayyûm. Lâ te\'huzuhû sinetun velâ nevm. Lehu mâ fissemâvâti vemâ fi\'l-ard. Menzellezî yeşfeu indehû illâ biiznih. Ya\'lemu mâ beyne eydîhim vemâ halfehum velâ yuhîtûne bişey\'in min ilmihî illâ bimâ şâe, vesia kursiyyuhu\'s-semâvâti ve\'l-ard. Velâ yeuduhû hıfzuhumâ vehuve\'l-âliyyu\'l-azîm' },
  subhanellah33x: { type: 'repeat', count: 33, text: 'Subhanellah' },
  elhamdulillah33x: { type: 'repeat', count: 33, text: 'Elhamdulillah' },
  allahuekber33x: { type: 'repeat', count: 33, text: 'Allahuekber' },
  laIlaheIllallahVahdehLong: { type: 'prayer', text: 'Lâ ilâhe illallahu vahdehû lâ şerike leh. Lehul mulku ve lehul hamdu yuhyî ve yumît. Vehuve hayyullezî lâyemut, biyedihil hayr ve huve alâ kulli şey\'in kadîr ve ileyhi\'l-mesîr' },
  faglemEnnehu: { type: 'repeat', count: 1, text: 'Fağlem ennehû' },
  laIlaheIllallah33x: { type: 'repeat', count: 33, text: 'Lâ ilâhe illallah' },
  muhammedurResulullah: { type: 'repeat', count: 1, text: 'Muhammedu\'r-resûlullahi sallallâhu teâlâ aleyhi vesellem.' },
  innellaheMelaike: { type: 'prayer', text: 'Bismillâhirrahmânirrahîm, İnnellahe ve melâiketehû yusellûne ale\'n-nebiy. Yâ eyyuhellezîne âmenû sallû aleyhi ve sellimû teslîmâ. Lebbeyk.' },
  allahumeSalliKesira1: { type: 'prayer', text: 'Allahumme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed. Biadedi kulli dâin ve devâin ve bârik ve sellim aleyhi ve aleyhim tesliman kesîrâ.' },
  allahumeSalliKesira2: { type: 'prayer', text: 'Allahumme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed. Biadedi kulli dâin ve devâin ve bârik ve sellim aleyhi ve aleyhim tesliman kesîrâ..' },
  allahumeSalliKesira3: { type: 'prayer', text: 'Allahumme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed. Biadedi kulli dâin ve devâin ve bârik ve sellim aleyhi ve aleyhim tesliman kesirân kesîrâ.' },
  salliVesellimYaRabbi: { type: 'prayer', text: 'Salli vesellim yâ Rabbi alâ habîbike Muhammedin ve alâ cemîi\'l-enbiyâi ve\'l evliya-i ve\'l murselîn ve alâ âli kullin ve sahbi kullin ecmaîn. Âmin ve\'l-hamdulillâhi Rabbi\'l-âlemin.' },
  elfuElfiResulallah: { type: 'prayer', text: 'Elfu elfi salâtin ve elfu elfi selâmin aleyke yâ Resûlallah.' },
  elfuElfiHabiballah: { type: 'prayer', text: 'Elfu elfi salâtin ve elfu elfi selâmin aleyke yâ Habîballah.' },
  elfuElfiEmine: { type: 'prayer', text: 'Elfu elfi salâtin ve elfu elfi selâmin aleyke yâ emîne vahyillâh.' },
  allahumeSalliLongFinal: { type: 'prayer', text: 'Allahumme salli ve sellim ve bârik alâ seyyidinâ Muhammedin ve alâ âlihî ve ashâbihî biadedi evrakı\'l-eşcâr ve emvâci\'l-bihâr ve katarâti\'l-emtâr, vağfirlenâ verhamnâ veltufbinâ vebi üstâdinâ ve meşâyîhina (radıyallâhu anhüm) ve vâlideynâ ve ihvânena vebi talebeti Resâili\'n-Nûri\'s-sadıkîne yâ ilâhenâ bikulli salâtin minhâ şehadeten.. eşhedu en lâ ilâhe illallah ve eşhedu enne Muhammeden Resûlullahi Sallallahu Aleyhi Tealâ Vesellem.' },
  celleCelaluhu: { type: 'prayer', text: 'Celle celâluhu ve âmme nevâvuhû velâ ilâhe ğâyruh.' }
};

const COMMON_INSTRUCTIONS = {
  ayetulKursiOkunur: { type: 'instruction', text: 'ÂYETÜ\'L-KÜRSÎ okunur:' },
  tesbihatSalatOkunur: { type: 'instruction', text: 'Tesbihâttaki sâlât ü selâmlar okunur:' },
  duaEdilir: { type: 'instruction', text: 'Duâ edilir.' },
  duadanSonra: { type: 'instruction', text: 'Duâdan sonraki tesbihâta devam edilir:' },
  ellerYuzeSurulur: { type: 'instruction', text: 'Eller yüze sürülüp indirilir.' },
  avucIciYukariCevrilir: { type: 'instruction', text: 'Avuç içi yukarı çevrilerek devam edilir.' },
  ellerYuzeSurulur2: { type: 'instruction', text: 'Eller yüze sürülür.' },
  duaTercumanOkunur: { type: 'instruction', text: 'DUÂ-İ TERCÜMÂN-I İSM-İ ÂZAM okunur:' },
  avuclarYukariKaldirilir: { type: 'instruction', text: 'Avuçlar yukarı gelecek şekilde eller kaldırılır:' },
  avucIcleriAsagiyaCevrilir: { type: 'instruction', text: 'Avuç içleri aşağıya çevrilir.' },
  avuclarTekrarYukariCevrilir: { type: 'instruction', text: 'Avuçlar tekrar yukarı çevrilir.' }
};

// ============================================
// SECTIONS COMMUNES
// ============================================

// Duâ-i İsm-i Âzam (6 sections) - Utilisées dans: ÖĞLE, AKŞAM, YATSI
const DUA_ISMI_AZAM_SECTIONS = [
  {
    title: 'Duâ-i İsm-i Âzam (1/6)',
    items: [
      { type: 'instruction', text: 'DUÂ-İ İSM-İ ÂZAM okunur:' },
      { type: 'prayer', text: 'Bismillâhirrahmânirrahîm' },
      { type: 'prayer', text: 'Yâ Cemîl yâ Allah' },
      { type: 'prayer', text: 'Yâ Karîb yâ Allah' },
      { type: 'prayer', text: 'Yâ Mucîb yâ Allah' },
      { type: 'prayer', text: 'Yâ Habîb yâ Allah' },
      { type: 'prayer', text: 'Yâ Raûf yâ Allah' },
      { type: 'prayer', text: 'Yâ Atûf yâ Allah' },
      { type: 'prayer', text: 'Yâ Ma\'ruf yâ Allah' }
    ]
  },
  {
    title: 'Duâ-i İsm-i Âzam (2/6)',
    items: [
      { type: 'prayer', text: 'Yâ Latîf yâ Allah' },
      { type: 'prayer', text: 'Yâ Azîm yâ Allah' },
      { type: 'prayer', text: 'Yâ Hannân yâ Allah' },
      { type: 'prayer', text: 'Yâ Mennân yâ Allah' },
      { type: 'prayer', text: 'Yâ Deyyân yâ Allah' },
      { type: 'prayer', text: 'Yâ Sübhan yâ Allah' },
      { type: 'prayer', text: 'Yâ Emân yâ Allah' }
    ]
  },
  {
    title: 'Duâ-i İsm-i Âzam (3/6)',
    items: [
      { type: 'prayer', text: 'Yâ Bürhân yâ Allah' },
      { type: 'prayer', text: 'Yâ Sultân yâ Allah' },
      { type: 'prayer', text: 'Yâ Müsteân yâ Allah' },
      { type: 'prayer', text: 'Yâ Muhsin yâ Allah' },
      { type: 'prayer', text: 'Yâ Müteâl yâ Allah' },
      { type: 'prayer', text: 'Yâ Rahmân yâ Allah' },
      { type: 'prayer', text: 'Yâ Rahîm yâ Allah' }
    ]
  },
  {
    title: 'Duâ-i İsm-i Âzam (4/6)',
    items: [
      { type: 'prayer', text: 'Yâ Kerîm yâ Allah' },
      { type: 'prayer', text: 'Yâ Mecîd yâ Allah' },
      { type: 'prayer', text: 'Yâ Ferd yâ Allah' },
      { type: 'prayer', text: 'Yâ Vitr yâ Allah' },
      { type: 'prayer', text: 'Yâ Ehad yâ Allah' },
      { type: 'prayer', text: 'Yâ Samed yâ Allah' },
      { type: 'prayer', text: 'Yâ Mahmûd yâ Allah' }
    ]
  },
  {
    title: 'Duâ-i İsm-i Âzam (5/6)',
    items: [
      { type: 'prayer', text: 'Yâ Sâdıka\'l-Va\'di yâ Allah' },
      { type: 'prayer', text: 'Yâ Aliyy yâ Allah' },
      { type: 'prayer', text: 'Yâ Ganiyy yâ Allah' },
      { type: 'prayer', text: 'Yâ Şâfî yâ Allah' },
      { type: 'prayer', text: 'Yâ Kâfî yâ Allah' },
      { type: 'prayer', text: 'Yâ Muâfî yâ Allah' },
      { type: 'prayer', text: 'Yâ Bâkî yâ Allah' }
    ]
  },
  {
    title: 'Duâ-i İsm-i Âzam (6/6)',
    items: [
      { type: 'prayer', text: 'Yâ Hâdî yâ Allah' },
      { type: 'prayer', text: 'Yâ Kàdir yâ Allah' },
      { type: 'prayer', text: 'Yâ Sâtir yâ Allah' },
      { type: 'prayer', text: 'Yâ Kàhhâr yâ Allah' },
      { type: 'prayer', text: 'Yâ Cebbâr yâ Allah' },
      { type: 'prayer', text: 'Yâ Ğaffâr yâ Allah' },
      { type: 'prayer', text: 'Yâ Fettâh yâ Allah' },
      COMMON_PRAYERS.celleCelaluhu
    ]
  }
];

// Son Duâ - Utilisée dans: ÖĞLE, AKŞAM, YATSI
const SON_DUA_SECTION = {
  title: 'Son Duâ',
  items: [
    { type: 'instruction', text: 'Avuçlar yukarı gelecek şekilde eller açılır:' },
    { type: 'prayer', text: 'Yâ Rabbe\'s-semâvâti Ve\'l-ardı, yâ ze\'l-Celâli ve\'l-İkrâm. Nes\'eluke bihakkı hâzihi\'l-esmâi kullehâ entusalli-ye alâ seyyidinâ Muhammedin ve alâ âli Muhammed, verham Muhammeden kemâ salleyte ve sellemte ve bârekte ve rahimte ve terehamte alâ İbrâhîme ve alâ âli İbrâhîme fi\'l âlemîn, Rabbenâ inneke hamîdüm mecîd, birahmetike yâ erhamerrâhimîn, ve\'l-hamdülillâhi Rabb\'l-alemîn.' }
  ]
};

// Haşir Sûresi (20-24) - Utilisée dans: SABAH, AKŞAM
const HASIR_SURESI_SECTION = {
  title: 'Haşir Sûresi (20-24)',
  items: [
    { type: 'instruction', text: 'Haşir Sûresi\'nin 20-24. Âyetleri (Lâ Yestevî) okunur:' },
    { type: 'prayer', text: 'Bismillâhirrahmânirrahîm, Lâ yestevî eshâbu\'n-nâri ve eshâbu\'l-Cenneh. Eshâbu\'l-Cenneti humu\'l-fâizûn. Lev enzelnâ hâze\'l-Kur\'âne alâ cebelilleraeytehû hâşian muteseddian min haşyetillah. Ve tilke\'l-emsâlu nadribuhâ linnâsi leallehum yetefekkerûn. Huvallâhullezi lâ ilâhe illâ hû. Âlimu\'l-ğaybi veş-şehâdeh. Huver-rahmânur-rahîm. Huvallâhullezî lâ ilâhe illâ hû. El-melikul-kuddûsus-selâmul-mu\'minul-muheyminul-azîzul-cebbârul-mutekebbir. Subhânellâhi ammâ yuşrikûn. Huvallâhul-hâlikul-bâriul-musavviru lehul-esmâ-ul husnâ. Yusebbihu lehü mâ fis-semâvâti vel-ard. Ve hüvel-\'azîzul-hakîm.' }
  ]
};

// Tesbihata Devam - Utilisée dans: İKİNDİ, AKŞAM, YATSI
const TESBIHATA_DEVAM_SECTION = {
  title: 'Tesbihata Devam',
  items: [
    COMMON_PRAYERS.subhanallahiVelhamdulillahi,
    COMMON_INSTRUCTIONS.ayetulKursiOkunur,
    COMMON_PRAYERS.ayetulKursi,
    COMMON_PRAYERS.subhanellah33x,
    COMMON_PRAYERS.elhamdulillah33x,
    COMMON_PRAYERS.allahuekber33x
  ]
};

// Son Duâ (SABAH/İKİNDİ) - Utilisée dans: SABAH, İKİNDİ
const SON_DUA_SABAH_IKINDI_SECTION = {
  title: 'Son Duâ',
  items: [
    COMMON_INSTRUCTIONS.avuclarYukariKaldirilir,
    { type: 'prayer', text: 'Subhâneke âhiyyen şerâhiyyen teâleyte lâ ilâhe illâ ente ecirnâ ve ecir üstâzenâ ve meşâyîhena (radıyallâhu anhüm) ve vâlideynâ ve ihvânenâ ve ehavâtenâ ve talebete Resâili\'n-Nûri ve rufekâenâ ve akrebâena ahbâbene\'l-mu\'mînine\'l-muhlisîne mine\'n-nâr.' },
    COMMON_INSTRUCTIONS.avucIcleriAsagiyaCevrilir,
    { type: 'prayer', text: 'Ve min kulli nâri vahfeznâ min şerri\'n-nefsi ve\'ş-şeytân ve min şerri\'l-cinni ve\'l-insân ve min şerri\'l-bid\'ati ve\'d-dalâlâti ve\'l-ilhâdi ve\'t-tuğyân.' },
    COMMON_INSTRUCTIONS.avuclarTekrarYukariCevrilir,
    { type: 'prayer', text: 'Biafvike yâ Mucîr, bifadlike yâ Gaffâr, birahmetike yâ Erhame\'r-râhimîn.' },
    { type: 'prayer', text: 'Allahumme edhılne\'l-Cennete meâal ebrâr, bişefâati nebiyyike\'l-muhtâr ve âlihi-l ethâr, ve eshâbihi-l ahyâr, ve sellim mâdâme-l leylu vennehâr, Âmin, ve selâmun ale-l murselîn, ve-l hamdu lillâhi Rabbi\'l-Âlemîn.' }
  ]
};

const TESBIHAT_DATA = {
  // =============================================
  // VERSION TURQUE
  // =============================================
  turkish: {
    sabah: {
      id: 'sabah',
      title: 'SABAH NAMAZI Tesbihati',
      color: '#667eea',
      sections: [
        {
          title: 'Başlangıç',
          items: [
            { type: 'instruction', text: 'Sabahın farzı kılınıp selâm verildikten sonra:' },
            COMMON_PRAYERS.estegfirullah5x,
            COMMON_PRAYERS.allahummeEntesselam,
            COMMON_PRAYERS.salatenTuncina,
            COMMON_INSTRUCTIONS.ellerYuzeSurulur
          ]
        },
        {
          title: 'Cümle-i Tevhid',
          items: [
            { type: 'repeat', count: 1, text: 'Allahumme innâ nukaddimu ileyke beyne yedey kulli nefesin ve lemhetin ve lehzetin ve tarfetin yetrifu bihâ ehlu\'s-semâvâti ve ehlu\'l-aradî-ne şehâdeten: Eşhedu enlâilahe illellah, ve eşhedu enne muhammeden abduhu ve resuluhu.' },
            { type: 'instruction', text: 'Cümle-i Tevhid söylenir:' },
            { type: 'repeat', count: 9, text: 'Lâ ilâhe illallahu vahdehû lâ şerike leh. Lehul mulku ve lehul hamdu yuhyî ve yumît. Vehuve hayyullezî lâyemut, biyedihil hayr ve huve alâ kulli şey\'in kadîr.' },
            { type: 'instruction', text: '10. defada şu eklenir:' },
            { type: 'prayer', text: 've ileyhi\'l-mesîr' }
          ]
        },
        {
          title: 'İstiâze Duâları (1/3)',
          items: [
            { type: 'instruction', text: 'Eller avuç içi yere bakar şekilde kaldırılır.' },
            { type: 'repeat', count: 7, text: 'Allahumme ecirnâ mine\'n-nâr.', note: 'Bu satır 3, 5 veya 7 defa' },
            { type: 'prayer', text: 'Allahumme ecirnâ min kulli nâr.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min fitneti\'d-dînîyyeti ve\'d-dünyeviye.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min fitneti âhiri\'z-zaman.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min fitneti\'l-Mesîhi\'d-Deccâli ve\'s-Sufyan.' },
            { type: 'prayer', text: 'Allahumme ecirnâ mine\'d-dalâlâti ve\'l-bidiyyâti ve\'l-beliyyât.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min şerri\'n-nefsi\'l-emmâreh.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min şurûri\'n-nufûsi\'l-emmârâti\'l-firavniyyeh.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min şerri\'n-nisâ.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min belâi\'n-nisâ.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min fitneti\'n-nisâ.' }
          ]
        },
        {
          title: 'İstiâze Duâları (2/3)',
          items: [
            { type: 'prayer', text: 'Allahumme ecirnâ min azâbi\'l-kabr.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min azâbi yevmi\'l-kıyâmeh.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min azâbi Cehennem.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min azâbi kahrik.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min nâri kahrik.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min azâbi\'l-kabri ve\'n-nîrân.' },
            { type: 'prayer', text: 'Allahumme ecirnâ mine\'r-riyâi ve\'s-sum\'ati ve\'l-ucubi ve\'l-fahr.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min tecâvuzi\'l-mulhidîn.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min şerri\'l-munâfıkîn.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min fitneti\'l-fâsıkîn.' }
          ]
        },
        {
          title: 'İstiâze Duâları (3/3)',
          items: [
            { type: 'prayer', text: 'Allahumme ecirnâ ve ecir vâlideynâ ve talebete Resâili\'n-Nûri\'s-sâdıkîne fi hidmeti\'l-Kur\'âni ve\'l-îmân. Ve ahbâbene\'l-mu\'minîne\'l-muhlisîne ve akribâenâ ve ecdâdenâ mine\'n-nâr.' },
            COMMON_INSTRUCTIONS.avucIciYukariCevrilir,
            { type: 'prayer', text: 'Biafvike yâ Mucîr, bifadlike yâ Ğaffâr. Bi rahmetike yâ erhemerrahimin.' },
            { type: 'prayer', text: 'Allahumme edhilne\'l-Cennete meâl ebrâr.' },
            { type: 'prayer', text: 'Allahumme\'d-hilne\'l-Cennete meâl ebrâr.' },
            { type: 'prayer', text: 'Allahumme edhilnâ ve edhil üstâzenâ ve meşâyîhine (radıyallâhu anhüm) ve vâlideynâ ve talebete Resâili\'n-Nûri\'s-sadıkîne ve ihvânena ve ehavâtenâ ve akribâenâ ve ecdâdenâ ve ahbâbene\'l-mu\'minîne\'l-muhlisîne fî hidmeti\'l-îmâni ve\'l-Kur\'ân. El-Cennete meal ebrâr, bişefâat-i Nebiyyi-ke\'l-Muhtâr ve âlihi\'l-ethâr ve eshâbihi\'l-ehyâr ve sellim mâdâme\'l-leylu ve\'n-nehâr. Âmin, ve selamun alel murselin velhamdu lillâhi Rabbi\'l-Âlemîn.' },
            COMMON_INSTRUCTIONS.ellerYuzeSurulur2
          ]
        },
        {
          title: 'Âyetü\'l-Kürsî ve Tesbih',
          items: [
            COMMON_PRAYERS.subhanallahiVelhamdulillahi,
            COMMON_INSTRUCTIONS.ayetulKursiOkunur,
            COMMON_PRAYERS.ayetulKursi,
            COMMON_PRAYERS.subhanellah33x,
            COMMON_PRAYERS.elhamdulillah33x,
            COMMON_PRAYERS.allahuekber33x
          ]
        },
        {
          title: 'Tevhid ve Duâ Devamı',
          items: [
            COMMON_PRAYERS.laIlaheIllallahVahdehLong,
            COMMON_INSTRUCTIONS.duaEdilir,
            COMMON_INSTRUCTIONS.duadanSonra,
            COMMON_PRAYERS.faglemEnnehu,
            COMMON_PRAYERS.laIlaheIllallah33x,
            COMMON_PRAYERS.muhammedurResulullah,
            { type: 'repeat', count: 10, text: 'Lâilâhe illallahu elmeliku\'l-hakku\'l-mubîn, Muhammedu\'r-resûlullahi sâdıku\'l-va\'dil emîn.' }
          ]
        },
        {
          title: 'Sâlât ü Selâm (1/2)',
          items: [
            COMMON_INSTRUCTIONS.tesbihatSalatOkunur,
            COMMON_PRAYERS.innellaheMelaike,
            COMMON_PRAYERS.allahumeSalliKesira1,
            COMMON_PRAYERS.allahumeSalliKesira2,
            COMMON_PRAYERS.allahumeSalliKesira3
          ]
        },
        {
          title: 'Sâlât ü Selâm (2/2)',
          items: [
            COMMON_PRAYERS.salliVesellimYaRabbi,
            COMMON_PRAYERS.elfuElfiResulallah,
            COMMON_PRAYERS.elfuElfiHabiballah,
            COMMON_PRAYERS.elfuElfiEmine,
            COMMON_PRAYERS.allahumeSalliLongFinal
          ]
        },
        {
          title: 'Duâ-i Tercümân (1/4)',
          items: [
            COMMON_INSTRUCTIONS.duaTercumanOkunur,
            { type: 'prayer', text: 'Bismillâhirrahmânirrahîm' },
            { type: 'prayer', text: 'Subhâneke yâ Allah teâleyte yâ Rahmân ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Rahîm teâleyte yâ Kerîm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Hamîd teâleyte yâ Hakîm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Mecîd teâleyte yâ Melîk ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Kuddûs teâleyte yâ Selâm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Mu\'min teâleyte yâ Muheymin ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Azîz teâleyte yâ Cebbâr ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Mutekebbîr teâleyte yâ Hâlık ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Evvel teâleyte yâ Âhir ecirnâ mine\'n-nâr biafvike yâ Rahmân.' }
          ]
        },
        {
          title: 'Duâ-i Tercümân (2/4)',
          items: [
            { type: 'prayer', text: 'Subhâneke yâ Zâhir teâleyte yâ Bâtın ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Bâri teâleyte yâ Musavvir ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Tevvâb teâleyte yâ Vehhâb ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Bâis teâleyte yâ Vâris ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Kadîm teâleyte yâ Mukîm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Ferd teâleyte yâ Vitr ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Nûr teâleyte yâ Settâr ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Celîl teâleyte yâ Cemîl ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Kâhir teâleyte yâ Kâdir ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Melîk teâleyte yâ Muktedir ecirnâ mine\'n-nâr biafvike yâ Rahmân.' }
          ]
        },
        {
          title: 'Duâ-i Tercümân (3/4)',
          items: [
            { type: 'prayer', text: 'Subhâneke yâ Alîm teâleyte yâ Allâm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Azîm teâleyte yâ Ğafûr ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Halîm teâleyte yâ Vedûd ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Şehîd teâleyte yâ Şâhid ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Kebîr teâleyte yâ Muteâl ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Nûr teâleyte yâ Latıf ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Semi\' teâleyte yâ Kefîl ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Karîb teâleyte yâ Basîr ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Hak teâleyte yâ Mubîn ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Raûf teâleyte yâ Rahîm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' }
          ]
        },
        {
          title: 'Duâ-i Tercümân (4/4)',
          items: [
            { type: 'prayer', text: 'Subhâneke yâ Tâhir teâleyte yâ Mutahhir ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Mucemmil teâleyte yâ Mufaddıl ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Muzhir teâleyte yâ Mun\'im ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Deyyân teâleyte yâ Sultân ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Hannân teâleyte yâ Mennân ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Ehad teâleyte yâ Samed ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Hayy teâleyte yâ Kayyûm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Adl teâleyte yâ Hakem ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Ferd teâleyte yâ Kuddûs ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            COMMON_PRAYERS.celleCelaluhu
          ]
        },
        { ...SON_DUA_SABAH_IKINDI_SECTION, title: 'Son Duâ ve Haşir' },
        HASIR_SURESI_SECTION,
        {
          title: 'Esmâ-ul Husnâ (1/2)',
          items: [
            { type: 'instruction', text: 'ESMÂ-UL HUSNÂ okunarak namaz bitirilir:' },
            { type: 'prayer', text: 'Bismillâhirrahmânirrahîm, Huvellahullezî lâ ilâhe illâ hû;' },
            { type: 'prayer', text: 'Er-Rahmanü, Er-Rahîmü, El-Melikü, El-Kuddûsü, Celle Celâluhu' },
            { type: 'prayer', text: 'Es-Selâmu, El-Mu\'minü, El-Muheyminü, El-Azîzü, El-Cebbâru, El-Mütekebbîru, Celle Celâluhu' },
            { type: 'prayer', text: 'El-Hâliku, El-Bâri\'u, El-Musavviru, El-Ğaffâru, El-Kahhâru, El-Vehhâbu, Celle Celâluhu' },
            { type: 'prayer', text: 'Er-Rezzâku, El-Fettahu, El-Alîmu, El-Kâbizu, El-Bâsidu, El-Hâfidu, Celle Celâluhu' },
            { type: 'prayer', text: 'Er-Râfi\'u, El-Mu\'izzü, El-Müzillü, Es-Semi\'ü, El-Basîru, El-Hakemu, Celle Celâluhu' },
            { type: 'prayer', text: 'El-Adlü, El-Latîfu, El-Habîru, El-Halîmu, El-Azîmu, El-ğafûru, Celle Celâluhu' },
            { type: 'prayer', text: 'Eş-Şekûru, El-Alîyyu, El-Kebîru, El-Hafîzu, El-Mukîtu, El-Hasîbu, Celle Celâluhu' },
            { type: 'prayer', text: 'El-Celîlu, El-Kerîmu, Er-Rakîbu, El-Mucîbu, El vâsi\'u, El-Hakîmu, Celle Celâluhu' }
          ]
        },
        {
          title: 'Esmâ-ul Husnâ (2/2)',
          items: [
            { type: 'prayer', text: 'El-Vedûdü, El-Mecîdü, El-Bâ\'isü, Eş-Şehîdü, El-Hakku, El-Vekîlu, Celle Celâluhu' },
            { type: 'prayer', text: 'El-Kaviyyu, El-Metînu, El-Veliyyu, El-Hamîdu, El-Muhsî, El-Mubdiu, Celle Celâluhu' },
            { type: 'prayer', text: 'El-Mu\'idü, El-Muhyî, El-Mumîtu, El-Hayyu, El-Kayyumu, El-Vâcidu, Celle Celâluhu' },
            { type: 'prayer', text: 'El-Mâcidu, El-Vâhidu, El-Ehadü, Es-Samedü, El-Kâdirü, El-Muktediru, Celle Celâluhu' },
            { type: 'prayer', text: 'El-Mukaddimu, El-Muehhiru, El-Evvelu, El-Ahiru, Ez-zâhiru, El-Bâtinu, Celle Celâluhu' },
            { type: 'prayer', text: 'El-Vâli, El-Muteâli, El-Berru, Et-Tevvabu, El-muntekımu, El-A\'fuvvu, Celle Celâluhu' },
            { type: 'prayer', text: 'Er-Ra\'ufu, Malikül Mülki Zülcelâli Velikram, El-Muksidu, El-Câmiu, Celle Celâluhu' },
            { type: 'prayer', text: 'El-Ğâniyyu, El-Muğnî, El-Mâniu, Ez-Zaârru, En-nâfi\'u, En-Nûru, Celle Celâluhu' },
            { type: 'prayer', text: 'El-Hâdi, El-Bedi\'u, El-Bâkî, El-Vârisü, Er-Reşîdü, Es-Sebûru, Celle Celâluhu ve Amme Nevâlühû ve Lâ İlâhe Ğayrüh.' }
          ]
        }
      ]
    },

    // ÖĞLE NAMAZI (je vais le faire plus court pour économiser de l'espace, structure similaire)
    ogle: {
      id: 'ogle',
      title: 'ÖĞLEN NAMAZI Tesbihati',
      color: '#764ba2',
      sections: [
        {
          title: 'Başlangıç',
          items: [
            { type: 'instruction', text: 'Öğlenin farzı kılınıp selâm verildikten sonra:' },
            COMMON_PRAYERS.estegfirullah5x,
            COMMON_PRAYERS.allahummeEntesselam,
            COMMON_PRAYERS.salatenTuncina,
            COMMON_INSTRUCTIONS.ellerYuzeSurulur,
            { type: 'instruction', text: 'Öğlenin son sünneti kılındıktan sonra tesbih yapılır.' }
          ]
        },
        {
          title: 'Âyetü\'l-Kürsî ve Tesbih',
          items: [
            COMMON_PRAYERS.subhanallahiVelhamdulillahi,
            COMMON_INSTRUCTIONS.ayetulKursiOkunur,
            COMMON_PRAYERS.ayetulKursi,
            COMMON_PRAYERS.subhanellah33x,
            COMMON_PRAYERS.elhamdulillah33x,
            COMMON_PRAYERS.allahuekber33x,
            { type: 'prayer', text: 'Lâ ilâhe illallahu vahdehû lâ şerike leh. Lehul mulku ve lehul hamdu yuhyî ve yumît. Vehuve hayyullezî lâyemut, biyedihil hayr ve huve alâ kulli şey\'in kadîr ve ileyhi\'l-mesîr' }
          ]
        },
        {
          title: 'Tesbih Devamı',
          items: [
            COMMON_PRAYERS.faglemEnnehu,
            COMMON_PRAYERS.laIlaheIllallah33x,
            { type: 'repeat', count: 1, text: 'Muhammedu\'r-resûlullahi sallallâhu teâlâ aleyhi vesellem.' }
          ]
        },
        {
          title: 'Sâlât ü Selâm (1/2)',
          items: [
            COMMON_INSTRUCTIONS.tesbihatSalatOkunur,
            COMMON_PRAYERS.innellaheMelaike,
            COMMON_PRAYERS.allahumeSalliKesira1,
            COMMON_PRAYERS.allahumeSalliKesira2,
            COMMON_PRAYERS.allahumeSalliKesira3,
            COMMON_PRAYERS.salliVesellimYaRabbi
          ]
        },
        {
          title: 'Sâlât ü Selâm (2/2)',
          items: [
            COMMON_PRAYERS.elfuElfiResulallah,
            COMMON_PRAYERS.elfuElfiHabiballah,
            COMMON_PRAYERS.elfuElfiEmine,
            COMMON_PRAYERS.allahumeSalliLongFinal
          ]
        },
        // === 6 sections de Duâ-i İsm-i Âzam (réutilisées depuis DUA_ISMI_AZAM_SECTIONS) ===
        ...DUA_ISMI_AZAM_SECTIONS,
        SON_DUA_SECTION,
        {
          title: 'Fetih Sûresi (27-29)',
          items: [
            { type: 'instruction', text: 'Fetih Sûresi\'nin 27-29. Âyetleri (Lakad Sadakallâhü) okunarak namaz bitirilir:' },
            { type: 'prayer', text: 'Bismillâhirrahmânirrahîm, Lekad sadakallahu resûlehu\'r-ruyâ bilhakk letedhulunne\'l-mescide\'l-harâme inşâallâhu âminîne muhallikîne ruûsekum ve mukessırîne lâtehafûn feâlime mâ lem ta\'lemû fecaâle min dûni zâlike fethan karîba. Huvellezî ersele resûlehu bilhudâ ve dînil hakkı liyuzhirahu aleddîni kullih ve kefâ billâhi şehîdâ. Muhammedu\'r-resûlullah vellezîne meahû eşiddâü âlel kuffâri ruhamâu beynehum terâhum rukkeân succeden yebteğûne fadlen minallahi verıdvânâ. Sîmâhüm fî vucûhihim min eseri\'s-sucud zalike meseluhum fittevrâti ve meseluhum fi\'l-incîl kezer\'in ahrace şat\'ehû feâzerehu festağleze festevâ alâ sûkihî yu\'cibuzzurrâe liyeğîze bihimu\'l-kuffâr. Veadallâhullezîne âmenû ve amilu\'s-sâlihâti minhum mağfiraten ve ecran azîmâ.' }
          ]
        }
      ]
    },

    // İKİNDİ, AKŞAM, YATSI - Structure similaire, je vais créer une version abrégée
    // pour que le fichier ne soit pas trop long. On peut les compléter après.

    ikindi: {
      id: 'ikindi',
      title: 'İKİNDİ NAMAZI Tesbihati',
      color: '#f59e0b',
      sections: [
        {
          title: 'Başlangıç',
          items: [
            { type: 'instruction', text: 'İkindinin farzını kılınıp selâm verildikten sonra:' },
            COMMON_PRAYERS.estegfirullah5x,
            COMMON_PRAYERS.allahummeEntesselam,
            COMMON_PRAYERS.salatenTuncina,
            COMMON_INSTRUCTIONS.ellerYuzeSurulur
          ]
        },
        TESBIHATA_DEVAM_SECTION,
        {
          title: 'Tevhid ve Duâ',
          items: [
            COMMON_PRAYERS.laIlaheIllallahVahdehLong,
            COMMON_INSTRUCTIONS.duaEdilir,
            COMMON_INSTRUCTIONS.duadanSonra,
            COMMON_PRAYERS.faglemEnnehu,
            COMMON_PRAYERS.laIlaheIllallah33x,
            { type: 'repeat', count: 1, text: 'Muhammedu\'r-resûlullahi sallallâhu teâlâ aleyhi vesellem.' }
          ]
        },
        {
          title: 'Sâlât ü Selâm (1/2)',
          items: [
            COMMON_INSTRUCTIONS.tesbihatSalatOkunur,
            COMMON_PRAYERS.innellaheMelaike,
            COMMON_PRAYERS.allahumeSalliKesira1,
            COMMON_PRAYERS.allahumeSalliKesira2,
            COMMON_PRAYERS.allahumeSalliKesira3,
            COMMON_PRAYERS.salliVesellimYaRabbi
          ]
        },
        {
          title: 'Sâlât ü Selâm (2/2)',
          items: [
            COMMON_PRAYERS.elfuElfiResulallah,
            COMMON_PRAYERS.elfuElfiHabiballah,
            COMMON_PRAYERS.elfuElfiEmine,
            COMMON_PRAYERS.allahumeSalliLongFinal
          ]
        },
        {
          title: 'Duâ-i Tercümân (1/7)',
          items: [
            COMMON_INSTRUCTIONS.duaTercumanOkunur,
            { type: 'prayer', text: 'Bismillâhirrahmânirrahîm' },
            { type: 'prayer', text: 'Subhâneke yâ Allah teâleyte yâ Rahmân ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Rahîm teâleyte yâ Kerîm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Hamîd teâleyte yâ Hakîm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Mecîd teâleyte yâ Melîk ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Kuddûs teâleyte yâ Selâm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' }
          ]
        },
        {
          title: 'Duâ-i Tercümân (2/7)',
          items: [
            { type: 'prayer', text: 'Subhâneke yâ Mu\'min teâleyte yâ Muheymin ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Azîz teâleyte yâ Cebbâr ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Mutekebbîr teâleyte yâ Hâlık ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Evvel teâleyte yâ Âhir ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Zâhir teâleyte yâ Bâtın ecirnâ mine\'n-nâr biafvike yâ Rahmân.' }
          ]
        },
        {
          title: 'Duâ-i Tercümân (3/7)',
          items: [
            { type: 'prayer', text: 'Subhâneke yâ Bâri teâleyte yâ Musavvir ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Tevvâb teâleyte yâ Vehhâb ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Bâis teâleyte yâ Vâris ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Kadîm teâleyte yâ Mukîm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Ferd teâleyte yâ Vitr ecirnâ mine\'n-nâr biafvike yâ Rahmân.' }
          ]
        },
        {
          title: 'Duâ-i Tercümân (4/7)',
          items: [
            { type: 'prayer', text: 'Subhâneke yâ Nûr teâleyte yâ Settâr ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Celîl teâleyte yâ Cemîl ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Kâhir teâleyte yâ Kâdir ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Melîk teâleyte yâ Muktedir ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Alîm teâleyte yâ Allâm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' }
          ]
        },
        {
          title: 'Duâ-i Tercümân (5/7)',
          items: [
            { type: 'prayer', text: 'Subhâneke yâ Azîm teâleyte yâ Ğafûr ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Halîm teâleyte yâ Vedûd ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Şehîd teâleyte yâ Şâhid ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Kebîr teâleyte yâ Muteâl ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Nûr teâleyte yâ Latıf ecirnâ mine\'n-nâr biafvike yâ Rahmân.' }
          ]
        },
        {
          title: 'Duâ-i Tercümân (6/7)',
          items: [
            { type: 'prayer', text: 'Subhâneke yâ Semi\' teâleyte yâ Kefîl ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Karîb teâleyte yâ Basîr ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Hak teâleyte yâ Mubîn ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Raûf teâleyte yâ Rahîm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Tâhir teâleyte yâ Mutahhir ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Mucemmil teâleyte yâ Mufaddıl ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Muzhir teâleyte yâ Mun\'im ecirnâ mine\'n-nâr biafvike yâ Rahmân.' }
          ]
        },
        {
          title: 'Duâ-i Tercümân (7/7)',
          items: [
            { type: 'prayer', text: 'Subhâneke yâ Deyyân teâleyte yâ Sultân ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Hannân teâleyte yâ Mennân ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Ehad teâleyte yâ Samed ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Hayy teâleyte yâ Kayyûm ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Adl teâleyte yâ Hakem ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            { type: 'prayer', text: 'Subhâneke yâ Ferd teâleyte yâ Kuddûs ecirnâ mine\'n-nâr biafvike yâ Rahmân.' },
            COMMON_PRAYERS.celleCelaluhu
          ]
        },
        SON_DUA_SABAH_IKINDI_SECTION,
        {
          title: 'Nebe Sûresi (78)',
          items: [
            { type: 'instruction', text: 'Nebe Suresi okunarak namaz bitirilir:' },
            {
              type: 'verses',
              verses: [
                { number: 1, text: 'Amme yetesaelune.' },
                { number: 2, text: 'Aninnebeil\'azıymi.' },
                { number: 3, text: 'Elleziy hum fiyhi muhtelifune.' },
                { number: 4, text: 'Kella seya\'lemune.' },
                { number: 5, text: 'Sümme kella seya\'lemune.' },
                { number: 6, text: 'Elem nec\'alil\'arda mihaden.' },
                { number: 7, text: 'Velcibale evtaden.' },
                { number: 8, text: 'Ve halaknakum ezvacen.' },
                { number: 9, text: 'Ve ce\'alna nevmekum subaten.' },
                { number: 10, text: 'Ve ce\'alnelleyle libasen.' },
                { number: 11, text: 'Ve ce\'alnennehare me\'aşen.' },
                { number: 12, text: 'Ve beneyna fevkakum seb\'an şidaden.' },
                { number: 13, text: 'Ve ce\'alna siracen vehhacen.' },
                { number: 14, text: 'Ve enzelna minelmu\'sırati maen seccacen.' },
                { number: 15, text: 'Linuhrice bihi habben ve nebaten.' },
                { number: 16, text: 'Ve cennatin elfafen.' },
                { number: 17, text: 'İnne yevmelfasli kane miykaten.' },
                { number: 18, text: 'Yevme yunfehu fiyssuri fete\'tune efvacen.' },
                { number: 19, text: 'Ve futihatissemau fekanet ebvaben.' },
                { number: 20, text: 'Ve suyyiretilcibalu fekanet seraben.' }
              ]
            },
            {
              type: 'verses',
              verses: [
                { number: 21, text: 'İnne cehenneme kanet mirsaden' },
                { number: 22, text: 'Littağıyne meaben.' },
                { number: 23, text: 'Labisiyne fiyha ahkaben.' },
                { number: 24, text: 'La yezukune fiyha berden ve la şeraben.' },
                { number: 25, text: 'İlla hamiymen ve ğassakan.' },
                { number: 26, text: 'Cezaen vifakan.' },
                { number: 27, text: 'İnnehum kanu la yercune hısaben.' },
                { number: 28, text: 'Ve kezzebu biayatina kizzaben.' },
                { number: 29, text: 'Ve kulle şey\'in ahsaynahü kitaben.' },
                { number: 30, text: 'Fezuku felen neziydekum illa \'azaben.' },
                { number: 31, text: 'İnne lilmuttekıyne mefazen.' },
                { number: 32, text: 'Hadaika ve a\'naben.' },
                { number: 33, text: 'Ve keva\'ıbe etraben.' },
                { number: 34, text: 'Ve ke\'sen dihakan.' },
                { number: 35, text: 'La yesme\'une fiyha lağven ve la kizzaben.' },
                { number: 36, text: 'Cezaen min rabbike \'ataen hısaben.' },
                { number: 37, text: 'Rabbissemavati vel\'ardı ve ma beynehumerrahmani la yemlikune minhu hıtaben.' },
                { number: 38, text: 'Yevme yekumurruhu velmelaiketu saffen la yetekellemune illa men ezine lehurrahmanu ve kale savaben.' },
                { number: 39, text: 'Zalikelyevmulhakku femen şaettehaze ila rabbihi meaben.' },
                { number: 40, text: 'İnna enzernakum \'azaben kariyben yevme yenzurulmer\'u ma kaddemet yedahu ve yekululkafiru ya leyteniy kuntu turaben.' }
              ]
            }
          ]
        }
      ]
    },

    aksam: {
      id: 'aksam',
      title: 'AKŞAM NAMAZI Tesbihati',
      color: '#10b981',
      sections: [
        {
          title: 'Başlangıç',
          items: [
            { type: 'instruction', text: 'Akşamın farzı kılınıp selâm verildikten sonra:' },
            COMMON_PRAYERS.estegfirullah5x,
            COMMON_PRAYERS.allahummeEntesselam,
            COMMON_PRAYERS.salatenTuncina,
            COMMON_INSTRUCTIONS.ellerYuzeSurulur,
            { type: 'instruction', text: 'Sünneti kıldıktan sonra,' }
          ]
        },
        {
          title: 'Cümle-i Tevhid',
          items: [
            { type: 'instruction', text: 'Cümle-i Tevhid söylenir: 10 defa' },
            { type: 'repeat', count: 9, text: 'Lâ ilâhe illallahu vahdehû lâ şerike leh. Lehul mulku ve lehul hamdu yuhyî ve yumît. Vehuve hayyullezî lâyemut, biyedihil hayr ve huve alâ kulli şey\'in kadîr.' },
            { type: 'instruction', text: 'Onuncuda eklenir:' },
            { type: 'prayer', text: 've ileyhi\'l-mesîr' }
          ]
        },
        {
          title: 'İstiâze Duâları (1/3)',
          items: [
            { type: 'instruction', text: 'İstiâze duâları okunur (Eller avuç içi yere bakar şekilde kaldırılır.)' },
            { type: 'repeat', count: 7, text: 'Allahumme ecirnâ mine\'n-nâr.', note: 'Bu satır 3, 5 veya 7 defa, diğerleri birer defa' },
            { type: 'prayer', text: 'Allahumme ecirnâ min kulli nâr.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min fitneti\'d-dînîyyeti ve\'d-dünyeviye.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min fitneti âhiri\'z-zaman.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min fitneti\'l-Mesîhi\'d-Deccâli ve\'s-Sufyan.' },
            { type: 'prayer', text: 'Allahumme ecirnâ mine\'d-dalâlâti ve\'l-bidiyyâti ve\'l-beliyyât.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min şerri\'n-nefsi\'l-emmâreh.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min şurûri\'n-nufûsi\'l-emmârâti\'l-firavniyyeh.' }
          ]
        },
        {
          title: 'İstiâze Duâları (2/3)',
          items: [
            { type: 'prayer', text: 'Allahumme ecirnâ min şerri\'n-nisâ.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min belâi\'n-nisâ.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min fitneti\'n-nisâ.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min azâbi\'l-kabr.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min azâbi yevmi\'l-kıyâmeh.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min azâbi Cehennem.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min azâbi kahrik.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min nâri kahrik.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min azâbi\'l-kabri ve\'n-nîrân.' }
          ]
        },
        {
          title: 'İstiâze Duâları (3/3)',
          items: [
            { type: 'prayer', text: 'Allahumme ecirnâ mine\'r-riyâi ve\'s-sum\'ati ve\'l-ucubi ve\'l-fahr.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min tecâvuzi\'l-mulhidîn.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min şerri\'l-munâfıkîn.' },
            { type: 'prayer', text: 'Allahumme ecirnâ min fitneti\'l-fâsıkîn.' },
            { type: 'prayer', text: 'Allahumme ecirnâ ve ecir vâlideynâ ve talebete Resâili\'n-Nûri\'s-sâdıkîne fi hidmeti\'l-Kur\'âni ve\'l-îmân. Ve ahbâbene\'l-mu\'minîne\'l-muhlisîne ve akribâenâ ve ecdâdenâ mine\'n-nâr.' },
            COMMON_INSTRUCTIONS.avucIciYukariCevrilir,
            { type: 'prayer', text: 'Biafvike yâ Mucîr, bifadlike yâ Ğaffâr. Bi rahmetike yâ erhemerrahimin.' },
            { type: 'prayer', text: 'Allahumme edhilne\'l-Cennete meâl ebrâr.' },
            { type: 'prayer', text: 'Allahumme\'d-hilne\'l-Cennete meâl ebrâr.' }
          ]
        },
        {
          title: 'Cennet Duâsı',
          items: [
            { type: 'prayer', text: 'Allahumme edhilnâ ve edhil üstâzenâ ve meşâyîhine (radıyallâhu anhüm) ve vâlideynâ ve talebete Resâili\'n-Nûri\'s-sadıkîne ve ihvânena ve ehavâtenâ ve akribâenâ ve ecdâdenâ ve ahbâbene\'l-mu\'minîne\'l-muhlisîne fî hidmeti\'l-îmâni ve\'l-Kur\'ân. El-Cennete meal ebrâr, bişefâat-i Nebiyyi-ke\'l-Muhtâr ve âlihi\'l-ethâr ve eshâbihi\'l-ehyâr ve sellim mâdâme\'l-leylu ve\'n-nehâr. Âmin, ve selamun alel murselin velhamdu lillâhi Rabbi\'l-Âlemîn.' },
            COMMON_INSTRUCTIONS.ellerYuzeSurulur2
          ]
        },
        TESBIHATA_DEVAM_SECTION,
        {
          title: 'Tevhid ve Tesbih',
          items: [
            COMMON_PRAYERS.laIlaheIllallahVahdehLong,
            COMMON_INSTRUCTIONS.duaEdilir,
            COMMON_INSTRUCTIONS.duadanSonra,
            COMMON_PRAYERS.faglemEnnehu,
            COMMON_PRAYERS.laIlaheIllallah33x,
            COMMON_PRAYERS.muhammedurResulullah,
            { type: 'repeat', count: 33, text: 'Lâ İlâhe illa ente subhaneke inni küntü minezzalimin.' }
          ]
        },
        {
          title: 'Sâlât ü Selâm (1/2)',
          items: [
            COMMON_INSTRUCTIONS.tesbihatSalatOkunur,
            COMMON_PRAYERS.innellaheMelaike,
            COMMON_PRAYERS.allahumeSalliKesira1,
            COMMON_PRAYERS.allahumeSalliKesira2,
            COMMON_PRAYERS.allahumeSalliKesira3,
            COMMON_PRAYERS.salliVesellimYaRabbi
          ]
        },
        {
          title: 'Sâlât ü Selâm (2/2)',
          items: [
            COMMON_PRAYERS.elfuElfiResulallah,
            COMMON_PRAYERS.elfuElfiHabiballah,
            COMMON_PRAYERS.elfuElfiEmine,
            COMMON_PRAYERS.allahumeSalliLongFinal
          ]
        },
        // === 6 sections de Duâ-i İsm-i Âzam (réutilisées depuis DUA_ISMI_AZAM_SECTIONS) ===
        ...DUA_ISMI_AZAM_SECTIONS,
        SON_DUA_SECTION,
        {
          title: 'Haşir Sûresi (20-24)',
          items: [
            { type: 'instruction', text: 'Haşir Sûresi\'nin 20-24. Âyetleri (Lâ Yestevî) okunur.' },
            { type: 'prayer', text: 'Bismillâhirrahmânirrahîm, Lâ yestevî eshâbu\'n-nâri ve eshâbu\'l-Cenneh. Eshâbu\'l-Cenneti humu\'l-fâizûn. Lev enzelnâ hâze\'l-Kur\'âne alâ cebelilleraeytehû hâşian muteseddian min haşyetillah. Ve tilke\'l-emsâlu nadribuhâ linnâsi leallehum yetefekkerûn. Huvallâhullezi lâ ilâhe illâ hû. Âlimu\'l-ğaybi veş-şehâdeh. Huver-rahmânur-rahîm. Huvallâhullezî lâ ilâhe illâ hû. El-melikul-kuddûsus-selâmul-mu\'minul-muheyminul-azîzul-cebbârul-mutekebbir. Subhânellâhi ammâ yuşrikûn. Huvallâhul-hâlikul-bâriul-musavviru lehul-esmâ-ul husnâ. Yusebbihu lehü mâ fis-semâvâti vel-ard. Ve hüvel-\'azîzul-hakîm.' }
          ]
        }
      ]
    },

    yatsi: {
      id: 'yatsi',
      title: 'YATSI NAMAZI Tesbihati',
      color: '#3b82f6',
      sections: [
        {
          title: 'Başlangıç',
          items: [
            { type: 'instruction', text: 'Yatsının farzı kılınıp selâm verildikten sonra:' },
            COMMON_PRAYERS.estegfirullah5x,
            COMMON_PRAYERS.allahummeEntesselam,
            COMMON_PRAYERS.salatenTuncina,
            COMMON_INSTRUCTIONS.ellerYuzeSurulur,
            { type: 'instruction', text: 'Vitir namazını kılındıktan sonra,' }
          ]
        },
        TESBIHATA_DEVAM_SECTION,
        {
          title: 'Tevhid ve Duâ',
          items: [
            COMMON_PRAYERS.laIlaheIllallahVahdehLong,
            COMMON_INSTRUCTIONS.duaEdilir,
            COMMON_INSTRUCTIONS.duadanSonra,
            COMMON_PRAYERS.faglemEnnehu,
            COMMON_PRAYERS.laIlaheIllallah33x,
            { type: 'repeat', count: 1, text: 'Muhammedu\'r-resûlullahi sallallâhu teâlâ aleyhi vesellem.' }
          ]
        },
        {
          title: 'Sâlât ü Selâm (1/2)',
          items: [
            COMMON_INSTRUCTIONS.tesbihatSalatOkunur,
            COMMON_PRAYERS.innellaheMelaike,
            COMMON_PRAYERS.allahumeSalliKesira1,
            COMMON_PRAYERS.allahumeSalliKesira2,
            COMMON_PRAYERS.allahumeSalliKesira3,
            COMMON_PRAYERS.salliVesellimYaRabbi
          ]
        },
        {
          title: 'Sâlât ü Selâm (2/2)',
          items: [
            COMMON_PRAYERS.elfuElfiResulallah,
            COMMON_PRAYERS.elfuElfiHabiballah,
            COMMON_PRAYERS.elfuElfiEmine,
            COMMON_PRAYERS.allahumeSalliLongFinal
          ]
        },
        // === 6 sections de Duâ-i İsm-i Âzam (réutilisées depuis DUA_ISMI_AZAM_SECTIONS) ===
        ...DUA_ISMI_AZAM_SECTIONS,
        SON_DUA_SECTION,
        {
          title: 'Bakara Sûresi (285-286)',
          items: [
            { type: 'instruction', text: 'Bakara Sûresi\'nin 285-286. Âyetleri (Âmenerresûlü) okunarak namaz bitirilir.' },
            { type: 'prayer', text: 'Bismillâhirrahmânirrahîm, Âmene\'r-resûlu bimâ unzile ileyhi mir rabbihî ve\'l-mu\'minûn. Kullun âmene billâhi ve melâiketihî ve kütubihî ve rusulih. Lâ nuferriku beyne ehâdin mir rusulih. Ve kàlû semi\'na ve ata\'nâ ğufrâneke rabbenâ ve ileyke\'l-mesîr. Lâ yukellifullâhu nefsen illâ vüs\'ahâ. Lehâ mâ kesebet ve aleyhâ mektesebet. Rabbenâ lâ tuâhiznâ in nesînâ ev ahta\'nâ. Rabbenâ velâ tehmil aleynâ isren kema hameltehu âlellezîne min kablinâ. Rabbenâ velâ tuhammilnâ mâ lâ tâkete lenâ bih. Va\'fu annâ, vağfirlenâ, verhamnâ ente mevlânâ fensurnâ âlel kavmil kâfirîn.' }
          ]
        }
      ]
    }
  },

  // =============================================
  // VERSION ARABE (à compléter plus tard)
  // =============================================
  arabic: {
    // Sera ajouté quand l'utilisateur fournira les textes arabes
  }
};
