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

### Tooltip / Detailanzeige

- **Maus über das Badge** → eigenes Fenster mit exaktem Wert, Kontextgrenze und Nachlade-Status.
- Es bleibt **auch beim Drücken von Tasten** stehen (z. B. `Windows + Shift + S` für einen Screenshot).
  Ausgeblendet wird es, sobald du die Maus **bewegst** oder das Badge verlässt.
- **Klick** auf das Badge **fixiert** die Anzeige: dann bleibt sie auch bei Mausbewegung stehen
  (ideal für Screenshots). Erneuter Klick oder `Escape` löst die Fixierung.
- **Ziehen** verschiebt das Badge und löst dabei eine Fixierung.

### Geteilte Chats (`chat.deepseek.com/share/…`)

- Auch dort zeigt das Badge den Füllstand — allerdings den **Stand zum Zeitpunkt des Teilens**
  (der geteilte Verlauf ist statisch). Der Tooltip weist mit „Geteilte Unterhaltung" darauf hin.

### Badge bleibt auf einem alten Wert stehen

- Ab **v1.0.5** lädt das Skript den Wert nach jeder Antwort automatisch nach. Bleibt die Zahl trotzdem
  stehen, einmal `F5` drücken (dann wird die History neu geladen) und das Skript in Tampermonkey auf
  die neueste Version aktualisieren.

### Meldung „Nachrichtenlimit erreicht" / „Längenbegrenzung erreicht" und ein ⚠ am Badge

Es gibt **zwei** verschiedene Ablehnungen — beide werden ab v1.2.1/v1.2.5 erkannt und angezeigt
(Badge `⚠`, Tooltip-Zeile mit dem Hinweis):

1. **Nachrichtenlimit** (Server-Fehlercode `MAX_MESSAGE_COUNT_REACHED`) — DeepSeek lehnt weitere
   Nachrichten in **diesem** Chat ab, unabhängig von der Tokenzahl.
2. **Längenbegrenzung** (`finish_reason: context_length_exceeded`) — **Kontextstand + Prompt** passen
   nicht mehr ins Fenster (960.000). Der Tooltip nennt zusätzlich die geschätzte Promptgröße.

- **Lösung in beiden Fällen:** einen **neuen Chat** starten. Beim Nachrichtenlimit kann der Füllstand
  dabei niedrig oder hoch sein; bei der Längenbegrenzung hilft es, den Prompt zu kürzen.
- Den Merker zurücksetzen (z. B. nachdem du im Chat aufgeräumt hast):
  `localStorage.removeItem('xdsTokenBadge.fullSessions')` in der Konsole (`F12`).

### Der Füllstand wirkt falsch (z. B. über 100 %)

Ab **v1.2.0** verwaltet das Skript die Kontextgrenze selbst: Es lernt sie, sobald DeepSeek eine
Kontext-Überschreitung meldet, und nennt die benutzte Quelle im Tooltip („Kontext … · Quelle").
Ab **v1.2.5** ist die Standardgrenze **gemessen: 960.000 Token** (Kontextfenster 1 Mio. abzüglich der
Reserve, die der Server für die Antwort freihält). Werte über der Grenze erscheinen in derselben
Einheit, z. B. `📊 967K / 960K  (101 %)`.

> **Warum die Meldung „schon bei 94 %" kommen kann:** Die Grenze gilt für **Kontextstand + Prompt**.
> Das Badge zeigt aber nur den Kontextstand. Ein langer Prompt (z. B. 20.000 Token Übergabetext) löst
> die Längenbegrenzung deshalb bei einem niedrigeren Badge-Wert aus: 945.022 (94,5 %) + 20.000
> ≈ 965.000 > 960.000 → abgelehnt. Mit einem kurzen Prompt wird bei 958.918 (95,9 %) noch gesendet,
> ab 964.693 (96,5 %) nicht mehr. Das ist kein Fehler des Badges.

- **Prüfen:** Maus aufs Badge → Zeile `Kontext …` zeigt Wert und Quelle.
- **Manuell setzen** (falls du das echte Fenster kennst), in der Konsole (`F12`):
  ```js
  localStorage.setItem('xdsTokenBadge.limitOverride', '2000000');  // Beispiel: 2 Mio.
  location.reload();
  ```
- **Zurücksetzen:**
  ```js
  localStorage.removeItem('xdsTokenBadge.limitOverride');  // wieder automatische Grenze
  localStorage.removeItem('xdsTokenBadge.limit');          // gelernte Grenze verwerfen
  localStorage.removeItem('xdsTokenBadge.observedMax');    // Höchstwert verwerfen
  ```

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
