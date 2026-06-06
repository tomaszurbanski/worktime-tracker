export interface LangMeta {
  code: string;
  name: string;
  native: string;
  flag: string;
  rtl: boolean;
}

export const LANGUAGES: LangMeta[] = [
  { code: 'pl', name: 'Polish',      native: 'Polski',      flag: '🇵🇱', rtl: false },
  { code: 'en', name: 'English',     native: 'English',     flag: '🇬🇧', rtl: false },
  { code: 'de', name: 'German',      native: 'Deutsch',     flag: '🇩🇪', rtl: false },
  { code: 'fr', name: 'French',      native: 'Français',    flag: '🇫🇷', rtl: false },
  { code: 'es', name: 'Spanish',     native: 'Español',     flag: '🇪🇸', rtl: false },
  { code: 'it', name: 'Italian',     native: 'Italiano',    flag: '🇮🇹', rtl: false },
  { code: 'pt', name: 'Portuguese',  native: 'Português',   flag: '🇵🇹', rtl: false },
  { code: 'ru', name: 'Russian',     native: 'Русский',     flag: '🇷🇺', rtl: false },
  { code: 'uk', name: 'Ukrainian',   native: 'Українська',  flag: '🇺🇦', rtl: false },
  { code: 'ar', name: 'Arabic',      native: 'العربية',     flag: '🇸🇦', rtl: true  },
  { code: 'tr', name: 'Turkish',     native: 'Türkçe',      flag: '🇹🇷', rtl: false },
  { code: 'zh', name: 'Chinese',     native: '中文',        flag: '🇨🇳', rtl: false },
  { code: 'hi', name: 'Hindi',       native: 'हिन्दी',       flag: '🇮🇳', rtl: false },
  { code: 'id', name: 'Indonesian',  native: 'Indonesia',   flag: '🇮🇩', rtl: false },
  { code: 'cs', name: 'Czech',       native: 'Čeština',     flag: '🇨🇿', rtl: false },
  { code: 'sk', name: 'Slovak',      native: 'Slovenčina',  flag: '🇸🇰', rtl: false },
  { code: 'ro', name: 'Romanian',    native: 'Română',      flag: '🇷🇴', rtl: false },
  { code: 'bg', name: 'Bulgarian',   native: 'Български',   flag: '🇧🇬', rtl: false },
  { code: 'hu', name: 'Hungarian',   native: 'Magyar',      flag: '🇭🇺', rtl: false },
  { code: 'sv', name: 'Swedish',     native: 'Svenska',     flag: '🇸🇪', rtl: false },
  { code: 'no', name: 'Norwegian',   native: 'Norsk',       flag: '🇳🇴', rtl: false },
  { code: 'fi', name: 'Finnish',     native: 'Suomi',       flag: '🇫🇮', rtl: false },
];

export const getLang = (code: string): LangMeta =>
  LANGUAGES.find(l => l.code === code) ?? LANGUAGES[0];
