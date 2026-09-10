# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).  
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

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
