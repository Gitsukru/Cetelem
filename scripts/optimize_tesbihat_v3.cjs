#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const originalPath = path.join(__dirname, '../data/tesbihat.backup.js'); // Utiliser la sauvegarde originale
const outputPath = path.join(__dirname, '../data/tesbihat.js');

console.log('📖 Lecture fichier original...');
let content = fs.readFileSync(originalPath, 'utf8');
const originalSize = content.length;

// Le GROS MORCEAU: Tableau Duâ-i İsm-i Âzam (répété 2×)
const duaIsmiAzamTableRegex = /\{ type: 'table', rows: \[\s+\['Yâ Cemîl yâ Allah'[^}]+\]\},/gs;

// Autres longues prières à factoriser
const replacements = [
  // === TABLEAU (LE PLUS GROS!) ===
  ['DUA_ISMI_AZAM_TABLE', duaIsmiAzamTableRegex],
  
  // === TRÈS LONGUES PRIÈRES ===
  ['salatenTuncina', /\{ type: 'prayer', text: 'Allahumme salli alâ Seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed\. Salâten tuncina biha min cemîil ahvâli vel âfât, ve takdilena biha cemîel hâcat, ve tutahhirunâ biha min cemîis seyyiât, ve terfeuna biha indeke âledderecât, ve tubelliğuna biha aksel ğâyat, min cemiil hayrat fil hayati ve bâdel memat, birahmetika yâ erhamerrahimin, bi hurmeti Habibike yâ erhamerrahimin, bi hurmeti cemiil enbiya-i vel evliya-i pîri pîran, pîri âzam ya Erhamerrahimin âmin, ve selâmun âlel murselin velhamdulillahi rabbil âlemin' \}/g],
  
  ['ayetulKursi', /\{ type: 'prayer', text: 'Bismillâhirrahmânirrahîm, Allahu lâ ilâhe illâ huve'l-hayyul kayyûm\. Lâ te'huzuhû sinetun velâ nevm\. Lehu mâ fissemâvâti vemâ fi'l-ard\. Menzellezî yeşfeu indehû illâ biiznih\. Ya'lemu mâ beyne eydîhim vemâ halfehum velâ yuhîtûne bişey'in min ilmihî illâ bimâ şâe, vesia kursiyyuhu's-semâvâti ve'l-ard\. Velâ yeuduhû hıfzuhumâ vehuve'l-âliyyu'l-azîm' \}/g],
  
  ['allahumeSalliLongFinal', /\{ type: 'prayer', text: 'Allahumme salli ve sellim ve bârik alâ seyyidinâ Muhammedin ve alâ âlihî ve ashâbihî biadedi evrakı'l-eşcâr ve emvâci'l-bihâr ve katarâti'l-emtâr, vağfirlenâ verhamnâ veltufbinâ vebi üstâdinâ ve meşâyîhina \(radıyallâhu anhüm\) ve vâlideynâ ve ihvânena vebi talebeti Resâili'n-Nûri's-sadıkîne yâ ilâhenâ bikulli salâtin minhâ şehadeten\.\. eşhedu en lâ ilâhe illallah ve eşhedu enne Muhammeden Resûlullahi Sallallahu Aleyhi Tealâ Vesellem\.' \}/g],
  
  // === MOYENNES ===
  ['laIlaheIllallahVahdehLong', /\{ type: 'prayer', text: 'Lâ ilâhe illallahu vahdehû lâ şerike leh\. Lehul mulku ve lehul hamdu yuhyî ve yumît\. Vehuve hayyullezî lâyemut, biyedihil hayr ve huve alâ kulli şey'in kadîr ve ileyhi'l-mesîr' \}/g],
  ['salliVesellimYaRabbi', /\{ type: 'prayer', text: 'Salli vesellim yâ Rabbi alâ habîbike Muhammedin ve alâ cemîi'l-enbiyâi ve'l evliya-i ve'l murselîn ve alâ âli kullin ve sahbi kullin ecmaîn\. Âmin ve'l-hamdulillâhi Rabbi'l-âlemin\.' \}/g],
  ['innellaheMelaike', /\{ type: 'prayer', text: 'Bismillâhirrahmânirrahîm, İnnellahe ve melâiketehû yusellûne ale'n-nebiy\. Yâ eyyuhellezîne âmenû sallû aleyhi ve sellimû teslîmâ\. Lebbeyk\.' \}/g],
  ['subhanallahiVelhamdulillahi', /\{ type: 'prayer', text: 'Subhânallahi velhamdulillâhi ve lâilâhe illallahu vallahu ekber, ve lâhavle ve lâkuvvete illâ billâhil aliyyil azîm' \}/g],
  
  // === COURTES mais × 5 ===
  ['allahumeSalliKesira1', /\{ type: 'prayer', text: 'Allahumme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed\. Biadedi kulli dâin ve devâin ve bârik ve sellim aleyhi ve aleyhim tesliman kesîrâ\.' \}/g],
  ['allahumeSalliKesira2', /\{ type: 'prayer', text: 'Allahumme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed\. Biadedi kulli dâin ve devâin ve bârik ve sellim aleyhi ve aleyhim tesliman kesîrâ\.\.' \}/g],
  ['allahumeSalliKesira3', /\{ type: 'prayer', text: 'Allahumme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed\. Biadedi kulli dâin ve devâin ve bârik ve sellim aleyhi ve aleyhim tesliman kesirân kesîrâ\.' \}/g],
  ['elfuElfiResulallah', /\{ type: 'prayer', text: 'Elfu elfi salâtin ve elfu elfi selâmin aleyke yâ Resûlallah\.' \}/g],
  ['elfuElfiHabiballah', /\{ type: 'prayer', text: 'Elfu elfi salâtin ve elfu elfi selâmin aleyke yâ Habîballah\.' \}/g],
  ['elfuElfiEmine', /\{ type: 'prayer', text: 'Elfu elfi salâtin ve elfu elfi selâmin aleyke yâ emîne vahyillâh\.' \}/g],
  ['allahummeEntesselam', /\{ type: 'prayer', text: 'Allahumme entesselâmu ve minkesselâm, tebârekte yâ zelcelâli velikram' \}/g],
  ['celleCelaluhu', /\{ type: 'prayer', text: 'Celle celâluhu ve âmme nevâvuhû velâ ilâhe ğâyruh\.' \}/g],
  ['faglemEnnehu', /\{ type: 'repeat', count: 1, text: 'Fağlem ennehû' \}/g],
  ['muhammedurResulullah', /\{ type: 'repeat', count: 1, text: 'Muhammedu'r-resûlullahi sallallâhu teâlâ aleyhi vesellem\.' \}/g],
  
  // === RÉPÉTITIONS ===
  ['estegfirullah5x', /\{ type: 'repeat', count: 5, text: 'Esteğfirullah' \}/g],
  ['subhanellah33x', /\{ type: 'repeat', count: 33, text: 'Subhanellah' \}/g],
  ['elhamdulillah33x', /\{ type: 'repeat', count: 33, text: 'Elhamdulillah' \}/g],
  ['allahuekber33x', /\{ type: 'repeat', count: 33, text: 'Allahuekber' \}/g],
  ['laIlaheIllallah33x', /\{ type: 'repeat', count: 33, text: 'Lâ ilâhe illallah' \}/g],
  
  // === INSTRUCTIONS ===
  ['COMMON_INSTRUCTIONS.ellerYuzeSurulur', /\{ type: 'instruction', text: 'Eller yüze sürülüp indirilir\.' \}/g],
  ['COMMON_INSTRUCTIONS.ayetulKursiOkunur', /\{ type: 'instruction', text: 'ÂYETÜ'L-KÜRSÎ okunur:' \}/g],
  ['COMMON_INSTRUCTIONS.tesbihatSalatOkunur', /\{ type: 'instruction', text: 'Tesbihâttaki sâlât ü selâmlar okunur:' \}/g],
  ['COMMON_INSTRUCTIONS.duaEdilir', /\{ type: 'instruction', text: 'Duâ edilir\.' \}/g],
  ['COMMON_INSTRUCTIONS.duadanSonra', /\{ type: 'instruction', text: 'Duâdan sonraki tesbihâta devam edilir:' \}/g]
];

console.log('🔄 Application des remplacements...');
let totalReplacements = 0;

for (const [name, regex] of replacements) {
  const matches = content.match(regex);
  if (matches) {
    const isInstruction = name.startsWith('COMMON_INSTRUCTIONS');
    const replacement = isInstruction ? name : (name === 'DUA_ISMI_AZAM_TABLE' ? name : `COMMON_PRAYERS.${name}`);
    content = content.replace(regex, replacement);
    totalReplacements += matches.length;
    console.log(`  ✓ ${name} × ${matches.length}`);
  }
}

// Ajouter les constantes
const constants = `
// ============================================
// PRIÈRES COMMUNES - Utilisées dans 2+ temps
// ============================================
const DUA_ISMI_AZAM_TABLE = {
  type: 'table',
  rows: [
    ['Yâ Cemîl yâ Allah', 'Yâ Karîb yâ Allah', 'Yâ Mucîb yâ Allah', 'Yâ Habîb yâ Allah'],
    ['Yâ Raûf yâ Allah', 'Yâ Atûf yâ Allah', 'Yâ Ma\\'ruf yâ Allah', 'Yâ Latîf yâ Allah'],
    ['Yâ Azîm yâ Allah', 'Yâ Hannân yâ Allah', 'Yâ Mennân yâ Allah', 'Yâ Deyyân yâ Allah'],
    ['Yâ Sübhan yâ Allah', 'Yâ Emân yâ Allah', 'Yâ Bürhân yâ Allah', 'Yâ Sultân yâ Allah'],
    ['Yâ Müsteân yâ Allah', 'Yâ Muhsin yâ Allah', 'Yâ Müteâl yâ Allah', 'Yâ Rahmân yâ Allah'],
    ['Yâ Rahîm yâ Allah', 'Yâ Kerîm yâ Allah', 'Yâ Mecîd yâ Allah', 'Yâ Ferd yâ Allah'],
    ['Yâ Vitr yâ Allah', 'Yâ Ehad yâ Allah', 'Yâ Samed yâ Allah', 'Yâ Mahmûd yâ Allah'],
    ['Yâ Sâdıka\\'l-Va\\'di yâ Allah', 'Yâ Aliyy yâ Allah', 'Yâ Ganiyy yâ Allah', 'Yâ Şâfî yâ Allah'],
    ['Yâ Kâfî yâ Allah', 'Yâ Muâfî yâ Allah', 'Yâ Bâkî yâ Allah', 'Yâ Hâdî yâ Allah'],
    ['Yâ Kàdir yâ Allah', 'Yâ Sâtir yâ Allah', 'Yâ Kàhhâr yâ Allah', 'Yâ Cebbâr yâ Allah'],
    ['Yâ Ğaffâr yâ Allah', 'Yâ Fettâh yâ Allah', '', '']
  ]
};

const COMMON_PRAYERS = {
  estegfirullah5x: { type: 'repeat', count: 5, text: 'Esteğfirullah' },
  allahummeEntesselam: { type: 'prayer', text: 'Allahumme entesselâmu ve minkesselâm, tebârekte yâ zelcelâli velikram' },
  salatenTuncina: { type: 'prayer', text: 'Allahumme salli alâ Seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed. Salâten tuncina biha min cemîil ahvâli vel âfât, ve takdilena biha cemîel hâcat, ve tutahhirunâ biha min cemîis seyyiât, ve terfeuna biha indeke âledderecât, ve tubelliğuna biha aksel ğâyat, min cemiil hayrat fil hayati ve bâdel memat, birahmetika yâ erhamerrahimin, bi hurmeti Habibike yâ erhamerrahimin, bi hurmeti cemiil enbiya-i vel evliya-i pîri pîran, pîri âzam ya Erhamerrahimin âmin, ve selâmun âlel murselin velhamdulillahi rabbil âlemin' },
  subhanallahiVelhamdulillahi: { type: 'prayer', text: 'Subhânallahi velhamdulillâhi ve lâilâhe illallahu vallahu ekber, ve lâhavle ve lâkuvvete illâ billâhil aliyyil azîm' },
  ayetulKursi: { type: 'prayer', text: 'Bismillâhirrahmânirrahîm, Allahu lâ ilâhe illâ huve\\'l-hayyul kayyûm. Lâ te\\'huzuhû sinetun velâ nevm. Lehu mâ fissemâvâti vemâ fi\\'l-ard. Menzellezî yeşfeu indehû illâ biiznih. Ya\\'lemu mâ beyne eydîhim vemâ halfehum velâ yuhîtûne bişey\\'in min ilmihî illâ bimâ şâe, vesia kursiyyuhu\\'s-semâvâti ve\\'l-ard. Velâ yeuduhû hıfzuhumâ vehuve\\'l-âliyyu\\'l-azîm' },
  subhanellah33x: { type: 'repeat', count: 33, text: 'Subhanellah' },
  elhamdulillah33x: { type: 'repeat', count: 33, text: 'Elhamdulillah' },
  allahuekber33x: { type: 'repeat', count: 33, text: 'Allahuekber' },
  laIlaheIllallahVahdehLong: { type: 'prayer', text: 'Lâ ilâhe illallahu vahdehû lâ şerike leh. Lehul mulku ve lehul hamdu yuhyî ve yumît. Vehuve hayyullezî lâyemut, biyedihil hayr ve huve alâ kulli şey\\'in kadîr ve ileyhi\\'l-mesîr' },
  faglemEnnehu: { type: 'repeat', count: 1, text: 'Fağlem ennehû' },
  laIlaheIllallah33x: { type: 'repeat', count: 33, text: 'Lâ ilâhe illallah' },
  muhammedurResulullah: { type: 'repeat', count: 1, text: 'Muhammedu\\'r-resûlullahi sallallâhu teâlâ aleyhi vesellem.' },
  innellaheMelaike: { type: 'prayer', text: 'Bismillâhirrahmânirrahîm, İnnellahe ve melâiketehû yusellûne ale\\'n-nebiy. Yâ eyyuhellezîne âmenû sallû aleyhi ve sellimû teslîmâ. Lebbeyk.' },
  allahumeSalliKesira1: { type: 'prayer', text: 'Allahumme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed. Biadedi kulli dâin ve devâin ve bârik ve sellim aleyhi ve aleyhim tesliman kesîrâ.' },
  allahumeSalliKesira2: { type: 'prayer', text: 'Allahumme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed. Biadedi kulli dâin ve devâin ve bârik ve sellim aleyhi ve aleyhim tesliman kesîrâ..' },
  allahumeSalliKesira3: { type: 'prayer', text: 'Allahumme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed. Biadedi kulli dâin ve devâin ve bârik ve sellim aleyhi ve aleyhim tesliman kesirân kesîrâ.' },
  salliVesellimYaRabbi: { type: 'prayer', text: 'Salli vesellim yâ Rabbi alâ habîbike Muhammedin ve alâ cemîi\\'l-enbiyâi ve\\'l evliya-i ve\\'l murselîn ve alâ âli kullin ve sahbi kullin ecmaîn. Âmin ve\\'l-hamdulillâhi Rabbi\\'l-âlemin.' },
  elfuElfiResulallah: { type: 'prayer', text: 'Elfu elfi salâtin ve elfu elfi selâmin aleyke yâ Resûlallah.' },
  elfuElfiHabiballah: { type: 'prayer', text: 'Elfu elfi salâtin ve elfu elfi selâmin aleyke yâ Habîballah.' },
  elfuElfiEmine: { type: 'prayer', text: 'Elfu elfi salâtin ve elfu elfi selâmin aleyke yâ emîne vahyillâh.' },
  allahumeSalliLongFinal: { type: 'prayer', text: 'Allahumme salli ve sellim ve bârik alâ seyyidinâ Muhammedin ve alâ âlihî ve ashâbihî biadedi evrakı\\'l-eşcâr ve emvâci\\'l-bihâr ve katarâti\\'l-emtâr, vağfirlenâ verhamnâ veltufbinâ vebi üstâdinâ ve meşâyîhina (radıyallâhu anhüm) ve vâlideynâ ve ihvânena vebi talebeti Resâili\\'n-Nûri\\'s-sadıkîne yâ ilâhenâ bikulli salâtin minhâ şehadeten.. eşhedu en lâ ilâhe illallah ve eşhedu enne Muhammeden Resûlullahi Sallallahu Aleyhi Tealâ Vesellem.' },
  celleCelaluhu: { type: 'prayer', text: 'Celle celâluhu ve âmme nevâvuhû velâ ilâhe ğâyruh.' }
};

const COMMON_INSTRUCTIONS = {
  ayetulKursiOkunur: { type: 'instruction', text: 'ÂYETÜ\\'L-KÜRSÎ okunur:' },
  tesbihatSalatOkunur: { type: 'instruction', text: 'Tesbihâttaki sâlât ü selâmlar okunur:' },
  duaEdilir: { type: 'instruction', text: 'Duâ edilir.' },
  duadanSonra: { type: 'instruction', text: 'Duâdan sonraki tesbihâta devam edilir:' },
  ellerYuzeSurulur: { type: 'instruction', text: 'Eller yüze sürülüp indirilir.' }
};

`;

const insertPos = content.indexOf('const TESBIHAT_DATA = {');
content = content.substring(0, insertPos) + constants + content.substring(insertPos);

fs.writeFileSync(outputPath, content, 'utf8');

const optimizedSize = content.length;
const savings = originalSize - optimizedSize;
const percent = Math.round((savings / originalSize) * 100);

console.log(`\n✅ Optimisation v3 terminée!`);
console.log(`   Remplacements: ${totalReplacements}`);
console.log(`   Original: ${originalSize} caractères`);
console.log(`   Optimisé: ${optimizedSize} caractères`);
console.log(`   Économie: ${savings} caractères (${percent}%)`);
console.log(`\n📁 ${outputPath}`);
