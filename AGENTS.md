# Projekt: xDeepSeek Token Badge

Userscript für den DeepSeek-Web-Chat: zeigt den Kontext-Füllstand (Token) als schwebendes Badge.

## Ablageregel (verbindlich)

**Alle Informationen und Daten zu diesem Projekt liegen ausschließlich hier:**
`F:\001_Coding_Projekte\xDeepSeek_Token_Badge`

- Keine Arbeits- oder Verteilkopien in `E:\Downloads\…` (der frühere Ordner
  `E:\Downloads\!rar\BDS_configs\xDeepSeek_Token_Badge` ist aufgelöst).
- Der Projektordner ist das Git-Repo (origin `immerzu/xDeepSeek_Token_Badge`, Branch `main`).
- Änderungen am Skript laufen **immer** hier → Commit → Push. GF zieht die Datei automatisch
  (Auto-Sync), solange Skript und GitHub-Inhalt identisch bleiben.

## Publikation

| Ziel | Adresse |
|---|---|
| Greasy Fork | https://greasyfork.org/de/scripts/595207-xdeepseek-token-badge (Skript-ID **595207**) |
| GitHub | https://github.com/immerzu/xDeepSeek_Token_Badge |
| GF-Sync Quelle | `main/xdeepseek-token-badge.user.js` (sync_type `automatic`) |
| GF-Zusatzinfos | `main/description.md` (`value_markup = markdown`) |

## Dateien

| Datei | Zweck |
|---|---|
| `xdeepseek-token-badge.user.js` | **Das Skript** — GF-Sync-Quelle, hier wird geändert |
| `description.md` | GF-„Zusätzliche Informationen" (DE → RU → EN) |
| `DESCRIPTION.greasyfork.md` | Listing-Beschreibung (Markdown) |
| `README.md` | Projektübersicht (dreisprachig) |
| `INSTALL.md` | Endnutzer-Installation + Fehlerbehebung |
| `CHANGELOG.md` | Versionshistorie |
| `PUBLISHING.md` | Anleitung zur GF-Veröffentlichung |
| `AGENT-BRIEFING.md` | Ursprüngliches Briefing des Vorgänger-Agenten (Historie) |
| `metadata.json` | Strukturierte Metadaten |
| `better-deepseek-20260910-125937.zip` | Original-Ausgangspaket v1.0.0 (Historie, nicht bearbeiten) |
| `memory/` | Projektgedächtnis: Handover, Entscheidungen, Fallstricke |
| `LICENSE` | MIT |

## Änderungs-Workflow

1. In `xdeepseek-token-badge.user.js` ändern und `@version` **erhöhen** (nie zweimal dieselbe).
2. `CHANGELOG.md` ergänzen.
3. Metablock-Konventionen beachten: `@description` = **Deutsch** (Skript-Locale), dazu
   `@description:en` und `@description:ru`, **keine** `@name:xx`-Zeilen, jede Zeile ≤ 500 Zeichen.
4. `git commit` + `git push origin main` → GF-Sync (Auto) zieht die neue Version.
5. Verifikation: `https://greasyfork.org/de/scripts/595207.json` → `version` prüfen.

## Werkzeuge (außerhalb des Projekts, wiederverwendbar)

- `C:\Users\lolo\.dsh\browser-tools\gf-publish.mjs` — GF: `status`, `login`, `version`, `new`,
  `check`, `dump` (read-only Formulardiagnose)
- `C:\Users\lolo\.dsh\browser-tools\gf-admin-sync.mjs` — GF-Admin: Sync-Quellen setzen
  (`--script-url`, `--sync-url`, `--info-sync-url`, `--dry-run`)
- Skills: `greasy-fork-publish`, `userscript-beschreibungen-immerzu`, `github-immerzu`

## Wichtige Fallstricke

- GF verlangt eine **sichere Anmeldemethode** am Konto; sonst erscheint auf der Upload-Seite nur
  `needs_secure_login` statt des Formulars.
- Neu-Anlegen-URL ist `https://greasyfork.org/de/script_versions/new`
  (NICHT `/de/scripts/new` → 404).
- GF hat kein Feld zum Umbenennen: der Name kommt beim Upload/Sync aus `@name`.
