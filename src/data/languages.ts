export const supportedLanguages = [
  { code: 'en', name: 'Engleză', flag: '🇬🇧', speechCode: 'en-GB' },
  { code: 'ro', name: 'Română', flag: '🇷🇴', speechCode: 'ro-RO' },
  { code: 'fr', name: 'Franceză', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'de', name: 'Germană', flag: '🇩🇪', speechCode: 'de-DE' },
  { code: 'es', name: 'Spaniolă', flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'it', name: 'Italiană', flag: '🇮🇹', speechCode: 'it-IT' },
  { code: 'pt', name: 'Portugheză', flag: '🇵🇹', speechCode: 'pt-PT' },
  { code: 'ru', name: 'Rusă', flag: '🇷🇺', speechCode: 'ru-RU' },
  { code: 'zh', name: 'Chineză', flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'ja', name: 'Japoneză', flag: '🇯🇵', speechCode: 'ja-JP' },
  { code: 'ko', name: 'Coreeană', flag: '🇰🇷', speechCode: 'ko-KR' },
  { code: 'ar', name: 'Arabă', flag: '🇸🇦', speechCode: 'ar-SA' },
  { code: 'nl', name: 'Olandeză', flag: '🇳🇱', speechCode: 'nl-NL' },
  { code: 'pl', name: 'Poloneză', flag: '🇵🇱', speechCode: 'pl-PL' },
  { code: 'tr', name: 'Turcă', flag: '🇹🇷', speechCode: 'tr-TR' },
  { code: 'uk', name: 'Ucraineană', flag: '🇺🇦', speechCode: 'uk-UA' },
  { code: 'hu', name: 'Maghiară', flag: '🇭🇺', speechCode: 'hu-HU' },
  { code: 'cs', name: 'Cehă', flag: '🇨🇿', speechCode: 'cs-CZ' },
  { code: 'sv', name: 'Suedeză', flag: '🇸🇪', speechCode: 'sv-SE' },
  { code: 'el', name: 'Greacă', flag: '🇬🇷', speechCode: 'el-GR' },
];

export const getLanguageByCode = (code: string) => {
  return supportedLanguages.find((lang) => lang.code === code) || supportedLanguages[0];
};

export const getSpeechCode = (langCode: string): string => {
  const lang = getLanguageByCode(langCode);
  return lang.speechCode;
};
