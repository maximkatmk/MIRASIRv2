// Setările launcherului Mira City — modifică aici înainte de build.

export const APP_NAME = 'Mira City';

/** Serverul principal afișat pe ecranul Acasă. */
export const MAIN_SERVER = {name: 'Mira City RP', host: '127.0.0.1', port: 7777};

/** Fișier JSON cu lista fișierelor jocului (vezi README, secțiunea „distribution.json"). */
export const DISTRIBUTION_URL = 'https://example.com/miracity/distribution.json';

/** Fișier JSON cu știri: [{ "id": 1, "title": "...", "text": "...", "date": "2026-10-27" }] */
export const NEWS_URL = 'https://example.com/miracity/news.json';

/** Clientul de joc (APK separat, 64-bit) pe care îl pornește launcherul. */
export const GAME_PACKAGE = 'com.miracity.client';
export const GAME_ACTIVITY = 'com.miracity.client.GameActivity';

export const LINKS = {
  discord: 'https://discord.gg/',
  site: 'https://example.com',
};

/** Câte măsurători de online păstrăm pentru grafic. */
export const HISTORY_SAMPLES = 48;
