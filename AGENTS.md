# Projekt: xDeepSeek Token Badge

Userscript für den DeepSeek-Web-Chat: zeigt den Kontext-Füllstand (Token) als schwebendes Badge.

## Ablageregel (verbindlich)

**Alle Informationen und Daten zu diesem Projekt liegen ausschließlich hier:**
`F:\001_Coding_Projekte\xDeepSeek_Token_Badge`

- Keine Arbeits- oder Verteilkopien in `E:\Downloads\…` (der frühere Ordner
  `E:\Downloads\!rar\BDS_configs\xDeepSeek_Token_Badge` ist aufgelöst).
- Der Projektordner ist das Git-Repo (origin `immerzu/xDeepSeek_Token_Badge`, Branch `main`).
- Änderungen am Skript laufen **immer** hier → Commit → Push → GF-Sync (periodisch, kein Webhook;
  sofortiges Auslösen siehe „Wichtige Fallstricke").
- **Skriptversionen (Ausgaben) immer hier ablegen: `F:\001_Coding_Projekte\xDeepSeek_Token_Badge\!Ausgabe\`**
  Namensschema: `xdeepseek-token-badge-v<version>.user.js` (z. B. `…-v1.0.3.user.js`).
  Der Ordner ist per `.gitignore` vom Repo ausgenommen (Verteilkopien, nicht die Quelle) und ist
  der Ort, aus dem installiert/importiert wird (Tampermonkey-Import, GF-Upload).

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
| `!Ausgabe/` | **Ablageort für Skriptversionen** (`xdeepseek-token-badge-v<version>.user.js`) |
| `description.md` | GF-„Zusätzliche Informationen" (DE → RU → EN) |
| `DESCRIPTION.greasyfork.md` | Listing-Beschreibung (Markdown) |
| `README.md` | Projektübersicht (dreisprachig) |
| `INSTALL.md` | Endnutzer-Installation + Fehlerbehebung |
| `CHANGELOG.md` | Versionshistorie |
| `PUBLISHING.md` | Anleitung zur GF-Veröffentlichung |
| `AGENT-BRIEFING.md` | Ursprüngliches Briefing des Vorgänger-Agenten (Historie) |
| `metadata.json` | Strukturierte Metadaten |
| `better-deepseek-20260910-125937.zip` | Original-Ausgangspaket v1.0.0 (Historie, nicht bearbeiten) |
| `memory/` | Projektgedächtnis — Index in `memory/README.md` (Handover, Analyse, Testrezept) |
| `LICENSE` | MIT |

## Änderungs-Workflow

1. In `xdeepseek-token-badge.user.js` ändern und `@version` **erhöhen** (nie zweimal dieselbe).
2. `CHANGELOG.md` ergänzen.
3. Metablock-Konventionen beachten: `@description` = **Deutsch** (Skript-Locale), dazu
   `@description:en` und `@description:ru`, **keine** `@name:xx`-Zeilen, jede Zeile ≤ 500 Zeichen.
4. `git commit` + `git push origin main` → GF-Sync zieht **periodisch** (kein Webhook); sofort
   auslösen mit `gf-admin-sync.mjs` (siehe Fallstricke).
5. Verifikation: `https://greasyfork.org/de/scripts/595207.json` → `version` prüfen.
6. Skriptkopie nach `!Ausgabe\xdeepseek-token-badge-v<version>.user.js` und **Hash-Gleichheit** mit
   der Quelle prüfen. Vor dem Release den Testlauf nach `memory/TESTEN-userscript-deepseek.md` fahren.

## Werkzeuge (außerhalb des Projekts, wiederverwendbar)

- `C:\Users\lolo\.dsh\browser-tools\gf-publish.mjs` — GF: `status`, `login`, `version`, `new`,
  `check`, `dump` (read-only Formulardiagnose)
- `C:\Users\lolo\.dsh\browser-tools\gf-admin-sync.mjs` — GF-Admin: Sync-Quellen setzen
  (`--script-url`, `--sync-url`, `--info-sync-url`, `--dry-run`)
- `C:\Users\lolo\.dsh\browser-tools\deepseek-*.mjs` — Diagnose für **dieses** Skript im echten
  DeepSeek-Chat (Profil `reasonix-profil`, DeepSeek-Login nötig):
  `deepseek-verify-fix.mjs` (injiziert die lokale `.user.js` als document-start-Skript und prüft
  Badge-Texte an definierten Schritten, optional Screenshot), `deepseek-sniff-chat.mjs`
  (schneidet History-Antworten mit: `cache_control`, Nachrichtenanzahl, Tokenfelder),
  `deepseek-limits.mjs` (echte Kontextgrenzen), `deepseek-bundle-dump.mjs` (App-Bundles/Endpunkte),
  `deepseek-open-chat.mjs` (einzelnen Chat öffnen und Badge prüfen, Fenster bleibt offen),
  `deepseek-analyze-context.mjs` (Chat-Tiefenanalyse: Tokenverlauf, Marker, Nachrichtenfelder),
  `deepseek-live-send.mjs` (sendet eine Testnachricht und prüft, ob das Badge ohne Reload aktualisiert),
  `deepseek-value-timing.mjs` (misst, ab wann der Server den neuen Tokenstand führt),
  `deepseek-test-drag.mjs` (prüft Verschieben, gemerkte Position und Doppelklick-Reset des Badges),
  `deepseek-test-tooltip.mjs` (prüft, dass der Tooltip Tastendrücke übersteht und per Klick fixiert),
  `deepseek-share-test.mjs` (analysiert Share-Seiten `/share/<id>` samt Tokenstand),
  `deepseek-find-chat.mjs` (sucht einen Chat per Titel im Account und prüft dort den Zähler).
  **Ablauf, Befehle und erwartete Checks: `memory/TESTEN-userscript-deepseek.md`**
- Skills: `greasy-fork-publish`, `userscript-beschreibungen-immerzu`, `github-immerzu`,
  `playwright-browser`, `tampermonkey-install-update`

## Wichtige Fallstricke

- GF verlangt eine **sichere Anmeldemethode** am Konto; sonst erscheint auf der Upload-Seite nur
  `needs_secure_login` statt des Formulars.
- Neu-Anlegen-URL ist `https://greasyfork.org/de/script_versions/new`
  (NICHT `/de/scripts/new` → 404).
- GF hat kein Feld zum Umbenennen: der Name kommt beim Upload/Sync aus `@name`.
- **GF-Auto-Sync ist NICHT webhook-basiert** (im Repo existiert kein GitHub-Hook) → GF zieht die
  Sync-Quelle nur **periodisch**. Sofort auslösen mit
  `node C:\Users\lolo\.dsh\browser-tools\gf-admin-sync.mjs --script-url https://greasyfork.org/de/scripts/595207-xdeepseek-token-badge --sync-url <raw .user.js> --info-sync-url <raw description.md>`
  (Achtung: `--script-url` ist die **GF-Skriptseite**, nicht die Raw-URL — sonst baut das Tool
  `<raw-url>/admin` und scheitert mit „Admin-Formular nicht gefunden").
- **CLI-Argumente erreichen Node bei `pwsh`-Aufrufen nicht** (kein `--out`/`--script` in `process.argv`);
  Werkzeuge deshalb über **Umgebungsvariablen** steuern (z. B. `DS_VERIFY_SCRIPT`, `DS_VERIFY_OUT`).
- **DeepSeek-Web nutzt `XMLHttpRequest`, nicht `fetch`** — und liefert bei warmem History-Cache
  (`cache_version`/`cache_reset_at` gesetzt) `cache_control: MERGE` mit **0 Nachrichten**, sodass der
  Tokenstand in der Antwort fehlt. Hook- und Nachladelogik daher immer im **XHR-Pfad** prüfen.
  Belege, Messwerte und Codeanker: `memory/ANALYSE-20260910-deepseek-history-cache-und-anzeige.md`.
- **Browserstart ohne „Seiten wiederherstellen?"-Blase:** Playwright beendet Chromium hart → das Profil
  `reasonix-profil` steht auf `Preferences.profile.exit_type = "Crashed"` und Chromium zeigt beim
  nächsten Start die Wiederherstellen-Meldung. Gelöst in `browser-tools/lib.mjs`: `BASE_ARGS`
  (`--hide-crash-restore-bubble`, `--no-first-run`, `--no-default-browser-check`) plus
  `resetProfileCrashFlag()` vor jedem Start (von `launchBrowser()` und allen `deepseek-*.mjs`
  aufgerufen). Neue Launcher müssen `args: BASE_ARGS` setzen.
- **Kontextgrenze nicht raten:** Sie kommt aus `/api/v0/client/settings?scope=model|main`
  (`model_configs[].file_feature.token_limit(_with_thinking)`, derzeit **890.880**; nicht 1 Mio.).
- **Badge-Bedienung (seit v1.0.7):** Das Badge hat `pointer-events: auto` (vorher `none`) und ist per
  Pointer-Events **verschiebbar**; die Position liegt in `localStorage` (`xdsTokenBadge.position`),
  Doppelklick setzt in die Standardecke zurück. Wer Interaktionslogik ändert, muss beachten, dass das
  Badge jetzt Mausereignisse abfängt (nur auf seiner kleinen Fläche) und dass die Position
  Resize-sicher begrenzt wird.
- **Geteilte Chats laufen über einen eigenen Endpunkt:** `/share/<id>` lädt `GET /api/v0/share/content?share_id=…`;
  der Tokenstand liegt in `data.biz_data.messages[].accumulated_token_usage` (nicht `chat_messages`),
  und es gibt dort keine `chat_session.id` → die Share-ID wird als `share:<id>` geführt. Seit v1.1.0
  liest das Skript diesen Endpunkt in beiden Hooks aus (vorher blieb das Badge dort auf `--`).
- **Kein natives `title`-Attribut (seit v1.0.8):** Es verschwindet bei jedem Tastendruck und machte
  Screenshots unmöglich. Stattdessen eigenes Element `#deepseek-token-badge-tip`, gesteuert **nur**
  über Mausereignisse. Wer die Detailanzeige ändert, muss `setTip([...])` statt `title` verwenden.
- **Tooltip-Verhalten (v1.1.1, getestet):** Erscheint bei Hover; **Tastendrücke blenden ihn nicht aus**;
  **Mausbewegung auf dem Badge blendet ihn aus** (ab 6 px, erst nach 250 ms Ruhe, damit das Anfahren
  ihn nicht sofort schließt); Verlassen blendet nach 250 ms aus. **Klick toggelt die Fixierung**
  (fixiert überlebt Mausbewegung/-verlassen/Tastendruck, `Escape` löst), **Verschieben löst die
  Fixierung**, und bei neu aufgebautem Badge (SPA-Rerender) wird der Tooltip-Zustand zurückgesetzt.
  Fallstrick aus der Praxis: `pointerdown` darf den Pin **nicht** auf `false` setzen — sonst kann
  jeder Klick nur fixieren und nie lösen (der Toggle im `pointerup` kippt dann immer auf `true`).
- **Anzeige-Konvention:** dreistellig gerundet (`📊 217K / 891K  (24 %)`), Prozent ganzzahlig
  (`<1 %` unter 1 %), exakte Werte und Grenzquelle im Tooltip.
- **Modell-Selbstauskünfte im Chat sind keine Messwerte:** Zeilen wie `[ 76% von 100% gefüllt]`
  schreibt das Modell selbst in seinen Denkblock (Feld `fragments` der Nachricht) — sie überschätzen
  den echten Füllstand stark (gemessen: 76 % behauptet vs. 20,61 % laut Server). Verlässlich ist nur
  `accumulated_token_usage`. Nachrichtentexte liegen in `fragments` (es gibt kein `content`-Feld).
- **Nach dem Senden lädt die App die History NICHT neu** — der Zustand kommt aus dem SSE-Stream
  `/api/v0/chat/completion`, und der enthält `accumulated_token_usage` nur als Startwert `0` (WIP),
  nie den finalen Stand. Der Badge-Wert muss deshalb am **Ende des Antwort-Streams** selbst
  nachgeladen werden (v1.0.5: `refreshAfterAnswer`). Wer Hook-Logik ergänzt, muss diesen Pfad
  mitdenken — sonst hängt die Anzeige wieder an `F5`.
- **Tests ohne Tampermonkey-Altversion** fahren: Profil mit Playwrights Default
  `--disable-extensions` starten (sonst beschreibt die installierte Altversion das Badge doppelt).
