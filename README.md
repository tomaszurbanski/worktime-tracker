# WorkTime Tracker

Aplikacja mobilna do śledzenia czasu pracy — iOS i Android.

## Funkcje

- **Tryb ręczny** — sam klikasz Start i Stop
- **Tryb GPS (auto)** — aplikacja automatycznie wykrywa wejście i wyjście z pracy na podstawie lokalizacji
- **Śledzenie dojazdu** — opcjonalny pomiar czasu dojazdu do pracy
- **Historia sesji** — przegląd wszystkich poprzednich sesji z podziałem na dni
- **Statystyki** — sumaryczny czas pracy per dzień

## Stack technologiczny

| Technologia | Wersja |
|---|---|
| Expo | ~56 |
| React Native | 0.85 |
| TypeScript | ~6.0 |
| React Navigation | v7 |
| expo-location | ^56 |
| AsyncStorage | ^3 |

## Struktura projektu

```
worktime-tracker/
├── src/
│   ├── types/
│   │   └── index.ts          # Typy: WorkSession, AppSettings, TimerState
│   ├── utils/
│   │   ├── storage.ts        # AsyncStorage CRUD
│   │   └── formatters.ts     # Formatowanie czasu i dat
│   ├── hooks/
│   │   ├── useTimer.ts       # Logika timera + zapis sesji
│   │   ├── useLocation.ts    # GPS, geofencing, uprawnienia
│   │   └── useSettings.ts    # Ustawienia aplikacji
│   └── screens/
│       ├── HomeScreen.tsx    # Główny ekran z timerem
│       ├── HistoryScreen.tsx # Historia sesji
│       └── SettingsScreen.tsx # Ustawienia
├── App.tsx                   # Nawigacja (bottom tabs)
├── app.json                  # Konfiguracja Expo (uprawnienia GPS, bundle ID)
└── package.json
```

## Uruchomienie lokalne

```bash
# 1. Klonuj repozytorium
git clone https://github.com/tomaszurbanski/worktime-tracker.git
cd worktime-tracker

# 2. Zainstaluj zależności
npm install

# 3. Uruchom
npm start
```

Następnie:
- **iOS**: Zeskanuj QR kodem w aplikacji **Expo Go** (iPhone)
- **Android**: Zeskanuj QR kodem w aplikacji **Expo Go** (Android)

## Jak używać

### Tryb ręczny
1. Wejdź na zakładkę **Praca**
2. Kliknij **ROZPOCZNIJ** gdy zaczynasz pracę
3. Kliknij **ZATRZYMAJ** gdy kończysz
4. Historia jest dostępna w zakładce **Historia**

### Tryb GPS (auto)
1. Wejdź w **Ustawienia** → **Lokalizacja pracy**
2. Kliknij "Ustaw bieżącą lokalizację" będąc w pracy
3. Przełącz tryb na **GPS (auto)**
4. Aplikacja automatycznie włączy i wyłączy timer gdy wejdziesz/wyjdziesz z pracy

### Śledzenie dojazdu
1. Włącz w **Ustawienia** → **Śledzenie dojazdu**
2. Po uruchomieniu timera pojawi się przycisk **Dojazd do pracy**

## Publikacja w sklepach

### Expo Application Services (EAS)

```bash
# Zainstaluj EAS CLI
npm install -g eas-cli

# Zaloguj się do Expo
eas login

# Konfiguracja
eas build:configure

# Build iOS (wymaga konta Apple Developer — $99/rok)
eas build --platform ios

# Build Android
eas build --platform android

# Wyślij do sklepów
eas submit --platform ios
eas submit --platform android
```

### Wymagania do publikacji

| Platforma | Wymóg |
|---|---|
| iOS App Store | Konto Apple Developer ($99/rok) |
| Google Play | Konto Google Play ($25 jednorazowo) |

## Monetyzacja

Aplikacja to pojedyncza wersja płatna — **bez reklam i bez zakupów wewnątrz aplikacji** (brak AdMob/IAP).

## Uprawnienia

| Uprawnienie | Cel |
|---|---|
| `ACCESS_FINE_LOCATION` | Tryb GPS auto |
| `ACCESS_BACKGROUND_LOCATION` | Geofencing w tle (Android) |
| `NSLocationAlwaysUsageDescription` | Geofencing w tle (iOS) |

## Roadmap

- [ ] Powiadomienia (przypomnienie o starcie/stopie)
- [ ] Eksport CSV / PDF
- [ ] Integracja z Google Calendar
- [ ] Widget na ekran główny
- [ ] Raporty tygodniowe/miesięczne
- [ ] Ciemny motyw

## Licencja

MIT © Tomasz Urbanski
