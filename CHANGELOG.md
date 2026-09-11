# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).  
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

---

## [1.1.0] — 2026-09-11

### Hinzugefügt
- **Geteilte Unterhaltungen werden jetzt unterstützt.** In der Share-Ansicht
  (`chat.deepseek.com/share/<id>`) blieb das Badge bisher leer, weil diese Seite über
  `/api/v0/share/content` lädt und nicht über `/chat/history_messages`. Der Tokenstand steckt dort in
  `data.biz_data.messages[].accumulated_token_usage` und wird nun ausgelesen; die Share-ID dient als
  eigene „Session" (Session-Bindung + Merker). Im Tooltip steht dann
  „Geteilte Unterhaltung — Stand zum Zeitpunkt des Teilens"; die Nachlade-Zeile entfällt, weil der
  Stand statisch ist.

### Verifiziert (echter Chat + geteilter Chat, ohne Reload-Trick)
- Geteilter Chat `share/t5f3etgz9rhqfwe78b`: Badge **`152K / 891K  (17 %)`** (vorher `--`),
  Serverwert **151.801** Token
- Zugehöriger Original-Chat „Mallorca Wetter" (`327679f9-…`): **`152K / 891K  (17 %)`** —
  identischer Wert, auch nach `F5` (keine Regression)

### Werkzeuge (außerhalb des Repos, `browser-tools\`)
- `deepseek-share-test.mjs` — analysiert Share-Seiten (alle JSON-Antworten, Tokenfelder, Badge)
- `deepseek-find-chat.mjs` — sucht einen Chat per Titel im angemeldeten Account und prüft dort den Zähler

---

## [1.0.9] — 2026-09-10

### Geändert
- **Tooltip kompakter:** Die Statuszeilen brechen nicht mehr mitten im Satz um.
  - Breite von 360 auf **420 px** erhöht
  - Label `Nachladen nach Antwort:` → `Nachladen:`
  - Statuswerte gekürzt, z. B. `noch kein Nachladen nach einer Antwort` → `noch keins nach einer Antwort`,
    `Versuch 3: … Token (unverändert), Nachrichten 22` → `Versuch 3: … (unverändert), 22 Nachrichten`
  - Bedienhinweis gekürzt: `Klick fixiert · Doppelklick setzt Position zurück`

### Verifiziert (automatischer UI-Test)
- Der Tooltip rendert **5 logische Zeilen als genau 5 Zeilen** (`wraps = 0`) — keine Umbrüche
- Alle 9 Prüfungen grün (Hover, Tastendruck-Überleben, Maus-weg, Fixieren, Lösen, kein `title`, kein Umbruch)

---

## [1.0.8] — 2026-09-10

### Behoben
- **Der Tooltip verschwand bei jedem Tastendruck** — ein natives `title`-Attribut wird vom Browser
  ausgeblendet, sobald eine Taste gedrückt wird. Damit waren Screenshots vom Tooltip unmöglich
  (z. B. `Windows + Shift + S` blendete ihn sofort aus).
- **Neu: eigener Tooltip** (`#deepseek-token-badge-tip`) mit mehrzeiliger Anzeige:
  Zustand · `Exakt: … Token (… %)` · Kontextgrenze · `Nachladen nach Antwort: …` · Bedienhinweis.
  Er wird **nur** durch Mausbewegung gesteuert: sichtbar ab Hover, ausgeblendet, wenn die Maus das
  Badge verlässt (400 ms Verzögerung). **Tastendrücke haben keinen Einfluss.**
- **Klick fixiert den Tooltip** (bleibt auch ohne Hover stehen — ideal für Screenshots);
  erneuter Klick oder `Escape` löst ihn wieder. Das native `title`-Attribut ist entfernt.

### Verifiziert (automatischer UI-Test)
- Tooltip sichtbar bei Hover · **bleibt sichtbar nach `a`, `Shift`, `Ctrl`**
- verschwindet nach Mausbewegung weg · Klick fixiert · zweiter Klick löst
- kein `title`-Attribut mehr am Badge — alle 8 Prüfungen grün

---

## [1.0.7] — 2026-09-10

### Hinzugefügt
- **Das Badge ist jetzt mit der Maus verschiebbar:** Ziehen mit der linken Maustaste (über
  Pointer-Events auch Touch/Pen). Die Position wird in `localStorage`
  (`xdsTokenBadge.position`) gemerkt und übersteht Reload und Chat-Wechsel; bei einer
  Fenstergrößenänderung wird sie im sichtbaren Bereich gehalten. **Doppelklick** setzt das Badge
  zurück in die Standardecke unten rechts.
- Dafür wurde `pointer-events: none` durch `auto` ersetzt — nur die kleine Badge-Fläche fängt
  Klicks ab. Eine Bewegung unter 4 px gilt als Klick und verschiebt nichts.

### Verifiziert (automatischer Drag-Test im echten Browser)
- Ziehen: Position 474,631 → 214,311 (`left`/`top` gesetzt, `right`/`bottom` auf `auto`)
- Position in `localStorage` gespeichert und **nach Reload identisch**
- Doppelklick: zurück auf `right`/`bottom = 16px`
- Alle 5 Prüfungen grün (`moved`, `stored`, `keptAfterReload`, `resetToCorner`, `pointerEventsAuto`)

---

## [1.0.6] — 2026-09-10

### Geändert
- **Nachladen nach einer Antwort robuster:** statt zwei Versuchen (1,5 s / 3 s) jetzt **fünf Versuche
  mit wachsendem Abstand** (1,5 / 3 / 6 / 10 / 15 s ≈ 35 s), weil der Server den neuen Tokenstand
  verzögert fortschreibt. Zusätzlich prüft das Skript die **Nachrichtenzahl**: Enthält die History
  keine neue Nachricht, wird nicht weiter nachgeladen (spart Requests).
- **Selbstdiagnose im Tooltip:** Die Zeile „Nachladen nach Antwort: …" zeigt, was der Refresh tut
  (`ok (Versuch 1): 183.652 Token`, `Versuch 3: 183.652 Token (unverändert), Nachrichten 22`,
  `aufgegeben nach 5 Versuchen`, `abgebrochen: keine Session-ID erkannt`). Damit lässt sich ohne
  Konsole klären, warum eine Zahl stehen bleibt.

### Gemessen (zur Einordnung)
- Der neue Tokenstand ist ~2 s nach dem Senden serverseitig abrufbar.
- Bei **sehr kurzen** Antworten bleibt der Wert tatsächlich unverändert (dann ist Stillstand korrekt).
- Zusätzlich zum praktischen Nutzen gibt es eine Debug-Fassung mit Konsolen-Logs unter
  `!Ausgabe/xdeepseek-token-badge-v1.0.6-debug.user.js` (nicht auf Greasy Fork).

---

## [1.0.5] — 2026-09-10

### Behoben
- **Das Badge aktualisierte sich nach einer Antwort nicht** — der neue Wert erschien erst nach `F5`
  oder einem Chat-Wechsel. Ursache (live nachgemessen): Nach dem Senden lädt die App die History
  **nicht** neu, sie baut den Zustand aus dem SSE-Stream `/api/v0/chat/completion` auf — und dieser
  enthält `accumulated_token_usage` nur als Startwert `0` (Status `WIP`), nie den finalen Stand.
  Das Skript hing aber ausschließlich an `history_messages`, also passierte nach einer Antwort nichts.
  **Fix:** Am Ende des Antwort-Streams (XHR-`load` bzw. fetch-Ende) lädt das Skript die History
  **selbst** — ohne Cache-Parameter, mit den Headern der laufenden Session — nach 1,5 s Wartezeit
  (Server persistiert die Nachricht) und, falls der Wert unverändert bleibt, einmal nach 3 s erneut.
- Zusätzlich Doku präzisiert: Die Angabe „aktualisiert sich nach dem Senden einer Nachricht" ist
  jetzt tatsächlich erfüllt; die Einschränkung „zwischen zwei History-Ladevorgängen" entfällt.

### Verifiziert (echter Chat, ohne Reload)
- Neuer Chat: vor dem Senden `📊 --`, nach der Antwort `📊 74 / 891K  (<1 %)`
- Zweite Antwort im selben Chat: `📊 113 / 891K  (<1 %)` — jeweils innerhalb von ~5 s

---

## [1.0.4] — 2026-09-10

### Geändert
- **Kompakte Anzeige:** Tokenwerte und Kontextgrenze werden **dreistellig gerundet** dargestellt
  (`📊 192K / 891K  (22 %)` statt `📊 191.768 / 1M  (19,18 %)`) — das Badge ist dadurch deutlich
  schmaler. Die exakten Zahlen und der Prozentsatz stehen weiterhin im Tooltip.
- **Kontextgrenze aus den DeepSeek-Settings** statt geraten: Das Skript liest
  `/api/v0/client/settings?scope=model|main` und verwendet
  `model_configs[].file_feature.token_limit` bzw. `token_limit_with_thinking` (je nach Modell und
  Denkmodus), sonst `normal_history_and_file_token_limit`. Rückfallwert: **890.880**
  (Stand 2026-09-10; die App meldet für alle Modelle 890.880 — die frühere Annahme „1 Mio."
  ließ den Prozentsatz rund 11 % zu niedrig erscheinen).

### Dokumentation
- README, INSTALL, DESCRIPTION.greasyfork.md und `description.md` (DE/RU/EN) auf das neue
  Anzeigeformat umgestellt und um die tatsächlichen Grenzen ergänzt (History-Tokens ohne
  Datei-Tokens; bei verzweigten Chats zählt das Maximum über alle Nachrichten).

---

## [1.0.3] — 2026-09-10

### Behoben
- **Badge blieb nach einiger Zeit auf „📊 --" stehen** (auch beim Chat-Wechsel). Ursache: DeepSeek
  speichert die Chat-History clientseitig (IndexedDB-Store `history-message`) und schickt an
  `/api/v0/chat/history_messages` bei warmem Cache `cache_control: "MERGE"` mit **0 Nachrichten** —
  der Tokenstand (`accumulated_token_usage`) fehlt dann vollständig in der Antwort.
  Das Skript lädt die History in diesem Fall **einmalig ohne `cache_version`/`cache_reset_at`**
  nach (gleiche Session, Header des Original-Requests) und liest den Wert aus der `REPLACE`-Antwort.
- **Falscher Wert beim Chat-Wechsel:** Bisher blieb die Zahl des vorherigen Chats stehen. Jetzt ist
  der Wert an die Chat-Session gebunden (Erkennung über URL und Antwort), sonst wird `--` gezeigt.

### Hinzugefügt
- Merker pro Chat (`localStorage`, max. 200 Einträge): Nach einem Reload steht sofort der letzte
  bekannte Wert da (mit `~` gekennzeichnet), bis der Server den aktuellen Wert liefert.
- Rekursive Suche nach `accumulated_token_usage` in der Antwort (robust gegen Feldverschiebungen).
- XHR-Header-Mitschnitt (`setRequestHeader`) für den Nachlade-Request.
- URL-Wächter (`pushState`/`popstate` + Intervall), damit Chat-Wechsel auch **ohne** Netzwerk-Request
  erkannt werden.

### Technische Erkenntnisse
- Die DeepSeek-Web-App nutzt **`XMLHttpRequest`** (nicht `fetch`) — der XHR-Hook ist damit der
  Hauptpfad; der fetch-Hook bleibt als Absicherung erhalten.
- Bei warmem Cache liefert der Server nur Deltas; alte Nachrichten kommen aus dem IndexedDB-Cache
  des Clients.

---

## [1.0.2] — 2026-09-10

### Geändert
- **Umbenennung:** Skriptname `DeepSeek Token Badge` → **`xDeepSeek Token Badge`** (Metablock `@name`,
  Kommentarkopf, Init-Log) — passt zum `x`-Namensschema der übrigen immerzu-Userscripts
- Projekt-/Repo-Name: `xDeepSeek_Token_Badge`, Arbeitsdatei `xdeepseek-token-badge.user.js`

---

## [1.0.1] — 2026-09-10

### Geändert
- Metablock auf lokalisierte Beschreibungen umgestellt: `@description` = **Deutsch** (Skript-Locale),
  zusätzlich `@description:en` und `@description:ru` → auffindbar in DE-, EN- und RU-Suche
- `@name:de` entfernt (GF verlangt zu jedem `@name:xx` ein passendes `@description:xx`)

### Hinzugefügt
- `description.md` (GF-„Zusätzliche Informationen", DE → RU → EN), `README.md`, `.gitignore`, `memory/`

---

## [1.0.0] — 2026-09-10

### Hinzugefügt
- Erste stabile Version zur Veröffentlichung auf GreasyFork
- Schwebendes Badge unten rechts mit Token-Füllstand und Prozentanzeige
- Hook auf `window.fetch` und `XMLHttpRequest.prototype.send`
- Auslesen von `data.biz_data.chat_messages[].accumulated_token_usage`
- Automatische Aktualisierung bei Chat-Wechsel und nach gesendeten Nachrichten
- Konfigurierbare Kontextfenster-Größe (`CONTEXT_SIZE`)
- Optionales Debug-Logging (`DEBUG`-Flag)
- Fallback-Handler für XHR-Requests
- Robustheit: `pointer-events: none` verhindert Klick-Interferenzen

### Technische Details
- Keine externen Abhängigkeiten
- Keine Tampermonkey-APIs erforderlich (`@grant none`)
- Lokale Verarbeitung, keine Serverkommunikation
- Unterstützt deutschsprachige und internationale Zahlenformatierung

---

## Entwicklungsnotizen (nicht veröffentlicht)

Diese Einträge dokumentieren den Entwicklungsweg, sind aber nicht Teil der veröffentlichten Version:

### Erwogen und verworfen
- **MCP-Server-Ansatz**: Ein Python-Server, der den Token-Wert über HTTP bereitstellt, wurde prototypisch gebaut und funktionierte. Verworfen, weil er für einen reinen Browser-Anwendungsfall zu viel Infrastruktur benötigt (Serverprozess, Autostart, Portverwaltung).
- **Auto-Refresh per Polling (alle 10 Sekunden)**: Prototypisch gebaut, verworfen, weil der zusätzliche HTTP-Traffic ohne echten Mehrwert ist. Der Wert ändert sich ohnehin nur nach Chat-Aktivität — und genau dann lädt DeepSeek die History ohnehin neu.

### Erkenntnisse
- Der Endpunkt `/chat/history_messages` wird beim Chat-Wechsel und nach gesendeten Nachrichten aufgerufen — also genau dann, wenn sich der Token-Wert geändert haben kann.
- Der ausgelesene Wert `accumulated_token_usage` entspricht dem Maximum aller Messages im Array (nicht der Summe).
