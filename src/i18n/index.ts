import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

import pl from './translations/pl';
import en from './translations/en';
import de from './translations/de';
import fr from './translations/fr';
import es from './translations/es';
import it from './translations/it';
import pt from './translations/pt';
import ru from './translations/ru';
import uk from './translations/uk';
import ar from './translations/ar';
import tr from './translations/tr';
import zh from './translations/zh';
import hi from './translations/hi';
import id from './translations/id';
import cs from './translations/cs';
import sk from './translations/sk';
import ro from './translations/ro';
import bg from './translations/bg';
import hu from './translations/hu';
import sv from './translations/sv';
import no from './translations/no';
import fi from './translations/fi';

const LANG_KEY = '@worktime_language';

const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'pl';
const supported = ['pl', 'en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'uk', 'ar', 'tr', 'zh', 'hi', 'id', 'cs', 'sk', 'ro', 'bg', 'hu', 'sv', 'no', 'fi'];
const defaultLang = supported.includes(deviceLang) ? deviceLang : 'en';

i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
    de: { translation: de },
    fr: { translation: fr },
    es: { translation: es },
    it: { translation: it },
    pt: { translation: pt },
    ru: { translation: ru },
    uk: { translation: uk },
    ar: { translation: ar },
    tr: { translation: tr },
    zh: { translation: zh },
    hi: { translation: hi },
    id: { translation: id },
    cs: { translation: cs },
    sk: { translation: sk },
    ro: { translation: ro },
    bg: { translation: bg },
    hu: { translation: hu },
    sv: { translation: sv },
    no: { translation: no },
    fi: { translation: fi },
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
