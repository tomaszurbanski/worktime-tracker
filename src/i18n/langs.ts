export interface LangMeta {
  code: string;
  name: string;
  native: string;
  flag: string;
  rtl: boolean;
}

export const LANGUAGES: LangMeta[] = [
  { code: 'pl', name: 'Polish',  native: 'Polski',   flag: '🇵🇱', rtl: false },
  { code: 'en', name: 'English', native: 'English',  flag: '🇬🇧', rtl: false },
  { code: 'de', name: 'German',  native: 'Deutsch',  flag: '🇩🇪', rtl: false },
  { code: 'ru', name: 'Russian', native: 'Русский',  flag: '🇷🇺', rtl: false },
  { code: 'ar', name: 'Arabic',  native: 'العربية',  flag: '🇸🇦', rtl: true  },
  { code: 'tr', name: 'Turkish', native: 'Türkçe',   flag: '🇹🇷', rtl: false },
  { code: 'zh', name: 'Chinese', native: '中文',     flag: '🇨🇳', rtl: false },
];

export const getLang = (code: string): LangMeta =>
  LANGUAGES.find(l => l.code === code) ?? LANGUAGES[0];
