# Mira City — launcher SA-MP (React Native, arm64)

Launcher scris de la zero. Funcții: monitorizare server (online, ping, listă jucători, grafic online),
servere proprii (ip:port), știri cu cache offline, descărcare/verificare fișiere (md5) cu reluare la eroare,
setări (nume, grafică, FPS, mărime interfață), verificare arm64 și a clientului instalat.

## Configurare
Editează `src/config.ts`: server principal, `DISTRIBUTION_URL`, `NEWS_URL`, `GAME_PACKAGE`/`GAME_ACTIVITY`, linkuri.
Exemple de JSON în `server-examples/`. Dacă schimbi `GAME_PACKAGE`, schimbă-l și în `android/app/src/main/AndroidManifest.xml` (`<queries>`).

## Rulare
Necesită Node 18+, JDK 17 și Android SDK.
    npm install
    npm run android        # debug pe telefon
    npm run apk            # APK release (android/app/build/outputs/apk/release)
Pentru Google Play creează o cheie proprie de semnare (acum folosește cea de debug).

## Clientul de joc
Launcherul pornește un client separat (APK 64-bit) cu extras Intent: nickname, host, port, graphics, fpsLimit, hudScale, gamePath.
Clientul NU este inclus: trebuie să ai unul legal și compatibil. Fișierele jocului ajung în `gamePath`
(folderul extern al aplicației); pe Android 11+ un alt APK nu le poate citi direct, deci clientul primește calea
sau le descarcă el însuși.

## Teste
    npm run typecheck
    npm run test:query     # server SA-MP fals + parser de query
