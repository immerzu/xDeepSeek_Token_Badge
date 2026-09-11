# Installation — xDeepSeek Token Badge

Diese Anleitung ist für **Endnutzer** gedacht, die das Skript zum ersten Mal installieren.

---

## Voraussetzungen

- Ein Browser: Chrome, Firefox, Edge, Safari, Brave oder Opera
- Tampermonkey-Erweiterung (oder eine kompatible Alternative wie Violentmonkey)
- Ein DeepSeek-Konto

---

## Schritt 1 — Tampermonkey installieren

Falls noch nicht vorhanden:

- **Chrome / Edge / Brave / Opera:** [Tampermonkey im Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox:** [Tampermonkey für Firefox](https://addons.mozilla.org/de/firefox/addon/tampermonkey/)
- **Safari:** [Tampermonkey für Safari](https://apps.apple.com/de/app/tampermonkey/id1482490089)

Nach der Installation erscheint oben rechts im Browser ein kleines Tampermonkey-Icon (👻).

---

## Schritt 2 — Das Skript installieren

**Über GreasyFork (empfohlen):**

1. Öffne die Skript-Seite auf GreasyFork
2. Klicke auf den grünen Button **„Install this script"**
3. Tampermonkey zeigt eine Bestätigungsseite mit dem Code
4. Klicke oben links auf **„Installieren"**

**Manuell (ohne GreasyFork):**

1. Klicke auf das Tampermonkey-Icon → **Dashboard**
2. Wechsle zum Tab **„+"** (neues Skript anlegen)
3. Öffne die Datei `xdeepseek-token-badge.user.js` aus diesem Paket in einem Texteditor
4. Kopiere den kompletten Inhalt
5. Füge ihn in den Tampermonkey-Editor ein (alten Platzhalter überschreiben)
6. Speichern mit `Strg+S`

---

## Schritt 3 — Skript aktivieren

1. Tampermonkey-Icon anklicken
2. Der Eintrag `xDeepSeek Token Badge` muss mit einem **grünen Schalter** markiert sein (aktiv)
3. Falls nicht: Auf den Schalter klicken

---

## Schritt 4 — Testen

1. Öffne `https://chat.deepseek.com` in einem neuen Tab
2. Drücke **`F5`**, um die Seite neu zu laden
3. Warte 1–2 Sekunden
4. Unten rechts im Fenster erscheint das Badge:
   - Zuerst `📊 --` (noch keine Daten)
   - Nach dem ersten History-Load: `📊 406K / 891K  (46 %)` o. ä. (dreistellig gerundet)

---

## Fehlerbehebung

### Badge zeigt dauerhaft `--`

- **Ursache:** DeepSeek speichert die Chat-History im Browser (IndexedDB). Ist dieser Cache warm,
  liefert der Server nur noch die *Änderungen* statt der vollen History — der Tokenstand fehlt dann
  in der Antwort.
- **Das Skript löst das selbst:** Es lädt die History in diesem Fall automatisch ohne Cache-Parameter
  nach und zeigt den aktuellen Wert. Kurzzeitig erscheint der letzte bekannte Wert mit `~` davor.
- **Wenn trotzdem `--` steht:** `F5` drücken und einen anderen Chat anklicken. Bleibt es leer, mit
  `F12` die Konsole öffnen und prüfen, ob `[TokenBadge]`-Meldungen erscheinen; im
  Tampermonkey-Dashboard auf die neueste Version aktualisieren (ab **v1.0.3** behoben).

### Badge erscheint gar nicht

1. Tampermonkey-Dashboard öffnen
2. Prüfen, ob `xDeepSeek Token Badge` in der Liste steht
3. Falls nicht: Skript ist nicht installiert → Schritt 2 wiederholen
4. Falls ja, aber grün ist aus: Schalter aktivieren, dann `F5` im Chat

### Badge ist im Weg / soll woanders stehen

- **Ziehen** mit der linken Maustaste verschiebt das Badge an jede Stelle; die Position bleibt
  (auch nach `F5`) gespeichert.
- **Doppelklick** auf das Badge setzt es zurück in die Standardecke unten rechts.
- Komplett ausblenden: in der Konsole (`F12`) `document.getElementById('deepseek-token-badge').remove()` —
  nach `F5` kommt es zurück; dauerhaft nur durch Deaktivieren des Skripts im Tampermonkey-Dashboard.

### Badge bleibt auf einem alten Wert stehen

- Ab **v1.0.5** lädt das Skript den Wert nach jeder Antwort automatisch nach. Bleibt die Zahl trotzdem
  stehen, einmal `F5` drücken (dann wird die History neu geladen) und das Skript in Tampermonkey auf
  die neueste Version aktualisieren.

---

## Deinstallation

1. Tampermonkey-Icon → **Dashboard**
2. Eintrag `xDeepSeek Token Badge` finden
3. Auf das **Mülleimer-Symbol** klicken
4. Bestätigen

Nach dem nächsten `F5` im DeepSeek-Chat ist das Badge weg.

---

## Datenschutz-Hinweis

Das Skript verarbeitet alle Daten lokal im Browser. Es sendet keine Informationen an Server, keine Telemetrie, kein Tracking. Es liest ausschließlich die API-Antworten, die dein Browser ohnehin empfängt.
