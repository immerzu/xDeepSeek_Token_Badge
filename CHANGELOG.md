# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).  
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

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
