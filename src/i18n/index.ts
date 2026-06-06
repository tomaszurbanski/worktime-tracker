import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import pl from './translations/pl';
import en from './translations/en';
import de from './translations/de';
import ru from './translations/ru';
import ar from './translations/ar';
import tr from './translations/tr';
import zh from './translations/zh';

const LANG_KEY = '@worktime_language';

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'pl';
const supported = ['pl', 'en', 'de', 'ru', 'ar', 'tr', 'zh'];
const defaultLang = supported.includes(deviceLang) ? deviceLang : 'en';

i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
    de: { translation: de },
    ru: { translation: ru },
    ar: { translation: ar },
    tr: { translation: tr },
    zh: { translation: zh },
  },
  lng: defaultLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export const loadSavedLanguage = async (): Promise<void> => {
  const saved = await AsyncStorage.getItem(LANG_KEY);
  if (saved && supported.includes(saved)) {
    await i18n.changeLanguage(saved);
    I18nManager.forceRTL(saved === 'ar');
  }
};

export const saveLanguage = async (code: string): Promise<void> => {
  await AsyncStorage.setItem(LANG_KEY, code);
  await i18n.changeLanguage(code);
  I18nManager.forceRTL(code === 'ar');
};

export default i18n;
