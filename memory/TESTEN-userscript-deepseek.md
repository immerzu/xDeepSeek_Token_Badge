# TESTEN — xDeepSeek Token Badge (Rezept für künftige Änderungen)

Wie eine Skriptänderung **am echten DeepSeek-Chat** geprüft wird, ohne den Nutzer-Browser (Yandex)
zu belasten. Alle Werkzeuge liegen in `C:\Users\lolo\.dsh\browser-tools\` (dort liegt auch
`node_modules` mit `playwright-core`) und nutzen das Profil `reasonix-profil`
(`C:\Users\lolo\AppData\Local\ms-playwright-mcp\reasonix-profil`).

## Voraussetzungen

- Node ≥ 22; Chromium unter `…\ms-playwright\chromium-1234\chrome-win64\chrome.exe` (siehe `lib.mjs`).
- Im Profil muss ein **DeepSeek-Login** bestehen. Läuft die Session ab, landet die App auf
  `/sign_in` (`localStorage.userToken.value === null`) → **nur der Nutzer** kann sich neu anmelden.
- Kein zweiter Playwright-Lauf gleichzeitig (Profil-Lock: „Profile in use").
- **Kein „Seiten wiederherstellen?" beim Start:** Die Tools setzen `BASE_ARGS`
  (`--hide-crash-restore-bubble`, `--no-first-run`, `--no-default-browser-check`) und rufen
  `resetProfileCrashFlag()` (setzt `Preferences.profile.exit_type` auf `Normal`) — Playwright beendet
  Chromium hart, sonst zeigt das Profil bei jedem Start die Wiederherstellen-Blase. Neue Launcher
  müssen `args: BASE_ARGS` verwenden.

## Werkzeuge

| Werkzeug | Zweck |
|---|---|
| `deepseek-sniff-chat.mjs` | Wartet auf Login, protokolliert `history_messages` (URL mit Query, `cache_control`, Nachrichtenanzahl, Tokenfelder) bei mehreren Chat-Wechseln + Reload. |
| `deepseek-verify-fix.mjs` | **Hauptwerkzeug:** injiziert eine lokale `.user.js` als document-start-Skript, prüft Badge-Texte an definierten Schritten, optional Screenshot des Badges. |
| `deepseek-limits.mjs` | Liest die echten Kontextgrenzen (`file_feature.token_limit`, `token_limit_with_thinking`, `normal_history_and_file_token_limit`). Login-frei. |
| `deepseek-bundle-dump.mjs` | Lädt die App-JS-Bundles über die Browser-Session (login-frei) und sucht nach Endpunkten/Feldern. |
| `deepseek-sniff.mjs` | Grober Mitschnitt aller JSON-Antworten (Bestandsaufnahme, Endpunkte entdecken). |
| `deepseek-open-chat.mjs` | Öffnet eine **bestimmte Chat-URL** (`DS_CHAT_URL`), injiziert optional die lokale `.user.js` und liest Badge + Tooltip + `history_messages` aus. Das Fenster **bleibt offen** (zum Anschauen; `DS_KEEP_OPEN=0` schließt es, `job_kill` beendet). |
| `deepseek-analyze-context.mjs` | Tiefenanalyse eines Chats: kompletter Seitentext (Datei), Prozent-Marker im Chatverlauf, **alle** API-Nachrichten mit Tokenstand/Rolle/`fragments`-Flags, DOM-Nachrichtenzahl, Badge-Zustand. |
| `deepseek-live-send.mjs` | **Sendet eine echte Testnachricht** und protokolliert Request-/Response-Timeline, SSE-Frames (Suche nach `accumulated_token_usage`) und den Badge-Zustand alle 5 s → belegt, ob sich das Badge ohne Reload aktualisiert. `DS_URL` (leer = neuer Chat), `DS_MSG`, `DS_WAIT`. |
| `deepseek-value-timing.mjs` | **Timing-Messung:** sendet eine Nachricht und fragt danach alle 2 s die History im Seitenkontext ab (Bearer-Token aus `localStorage`) → zeigt, ab wann der Server den neuen Tokenstand führt. `DS_WAIT_S` (Default 45). |
| `deepseek-test-drag.mjs` | **Drag-Test (v1.0.7):** zieht das Badge mit der Maus, prüft `left`/`top` + `localStorage`-Eintrag, lädt neu (Position muss bleiben) und macht einen Doppelklick (zurück in die Ecke). Gibt `DRAG:CHECKS` mit fünf Prüfungen aus. |
| `deepseek-test-tooltip.mjs` | **Tooltip-Test (ab v1.1.1, 12 Prüfungen):** Hover → sichtbar; **Tastendrücke (`a`, `Shift`, `Ctrl`) dürfen ihn nicht ausblenden**; **Mausbewegung auf dem Badge muss ihn ausblenden**; Klick fixiert (überlebt Mausbewegung/-weg/Tastendruck); zweiter Klick löst; kein `title`-Attribut; **keine Zeilenumbrüche** (`TIP:LINES`: logische = gerenderte Zeilen, `wraps` muss 0 sein). Für den Umbruch-Check einen Chat mit Wert öffnen (`DS_URL`). |
| `deepseek-share-test.mjs` | **Geteilte Chats (v1.1.0):** öffnet eine Share-URL (`DS_URL=https://chat.deepseek.com/share/<id>`), protokolliert **alle** JSON-Antworten (Endpoint, Struktur, Tokenfelder) und liest Badge + Tooltip + Merker. Belegt, dass `/api/v0/share/content` den Tokenstand enthält. |
| `deepseek-find-chat.mjs` | **Chat im Account finden:** lädt die Chat-Liste (`chat_session/fetch_page`, Bearer-Token), filtert nach `DS_TERMS` (Komma-getrennt), öffnet den Treffer (`DS_PICK`) und prüft Badge + `history_messages` inkl. Reload. So wurde der Original-Chat zum geteilten Chat gefunden. |

## Ablauf A — Skriptänderung verifizieren (Standard)

```powershell
# 1. Syntax prüfen
node --check "F:\001_Coding_Projekte\xDeepSeek_Token_Badge\xdeepseek-token-badge.user.js"

# 2. Debug-Kopie mit DEBUG=true erzeugen (Logs mitlesen)
$src = "F:\001_Coding_Projekte\xDeepSeek_Token_Badge\xdeepseek-token-badge.user.js"
$dbg = "$env:TEMP\xds-debug.user.js"
(Get-Content $src -Raw) -replace 'const DEBUG              = false','const DEBUG              = true' | Set-Content $dbg -Encoding UTF8

# 3. Lauf starten (Umgebungsvariablen! CLI-Argumente kommen hier NICHT an)
$env:DS_VERIFY_SCRIPT = $dbg
$env:DS_VERIFY_OUT    = "$env:TEMP\ds-verify.json"
$env:DS_VERIFY_SHOT   = "$env:TEMP\ds-badge.png"
node deepseek-verify-fix.mjs            # workdir: C:\Users\lolo\.dsh\browser-tools

# 4. Logs + Netzwerk auswerten
$r = Get-Content "$env:TEMP\ds-verify.json" -Raw | ConvertFrom-Json
$r.consoleLines | Where-Object { $_ -match 'TokenBadge' }
$r.network | Format-Table cacheControl, messages, max, url -AutoSize

# 5. Optik prüfen (Badge-Breite)
#    read_image auf $env:TEMP\ds-badge.png
```

Erwartete Endausgabe des Laufs: `VERIFY:CHECKS {...}` mit allen fünf Werten `true`:

```
chatA_hasValue, chatB_hasValue, chatA_differsFromB, afterReload_notEmpty, afterReloadEarly_notEmpty
```

Zusätzlich muss im Netzwerkprotokoll für jeden Chat ein Paar stehen:
`MERGE (0 msgs)` → **`REFETCH` ohne `cache_version`** mit `REPLACE` und Tokenwerten.

Realistische Laufzeit: ~90–120 s (Fenster ist sichtbar; nicht schließen).

## Ablauf B — API-Verhalten beobachten (ohne Skriptänderung)

```powershell
$env:DS_VERIFY_OUT = "$env:TEMP\ds-chat-sniff.json"   # (sniff-chat nutzt --out/ENV je Version)
node deepseek-sniff-chat.mjs --login-wait 300000 --clicks 3   # Achtung: Args ggf. wirkungslos → Defaults prüfen
```

Nützlich, um zu sehen, ob DeepSeek wieder etwas geändert hat (Endpunkt, `cache_control`,
Nachrichtenanzahl, Tokenfelder).

## Ablauf C — Kontextgrenzen prüfen

```powershell
$env:DS_LIMITS_OUT = "$env:TEMP\ds-limits.json"
node deepseek-limits.mjs
```

Erwartet (Stand 2026-09-10): alle Modelle `token_limit = token_limit_with_thinking = 890880`;
`normal_history_and_file_token_limit = 890880`; `input_character_limit = 2621440`.

## Ablauf D — App-Code befragen (login-frei)

```powershell
node deepseek-bundle-dump.mjs --dir "$env:TEMP\ds-bundle"     # lädt die Bundles
$f = Get-ChildItem "$env:TEMP\ds-bundle\02-main*.js" | Select-Object -First 1
$t = Get-Content $f.FullName -Raw
[regex]::Matches($t, '"/api/v0/[a-z0-9_/\-]+"') | ForEach-Object { $_.Value } | Sort-Object -Unique
# gezielt: accumulated_token_usage, cache_control, file_feature, getTokenConfig
```

Damit lassen sich Feldnamen, Endpunkte und Semantik belegen, **bevor** man etwas ändert.

## Ablauf F — Einen bestimmten Chat ansehen oder analysieren

```powershell
# a) Chat öffnen und Badge prüfen (Fenster bleibt offen, max. 10 Min)
$env:DS_CHAT_URL  = "https://chat.deepseek.com/a/chat/s/<SESSION-ID>"
$env:DS_SCRIPT    = "F:\001_Coding_Projekte\xDeepSeek_Token_Badge\xdeepseek-token-badge.user.js"
$env:DS_SHOT      = "$env:TEMP\ds-chat.png"
$env:DS_OUT       = "$env:TEMP\ds-chat-open.json"
$env:DS_KEEP_OPEN = "1"
node deepseek-open-chat.mjs

# b) Tiefenanalyse: Tokenverlauf, Marker im Chattext, Nachrichtenfelder
$env:DS_TEXT = "$env:TEMP\ds-chat-text.txt"
$env:DS_OUT  = "$env:TEMP\ds-chat-analyze.json"
node deepseek-analyze-context.mjs 2>&1 | Select-String -Pattern 'AN:TOKENS|AN:ROW|AN:MARKER|AN:DOM_COUNTS'
```

Damit lässt sich z. B. klären, ob eine im Chat angezeigte Prozentangabe aus den Serverdaten stammt
oder vom Modell selbst geschrieben wurde (Details in der Analyse, Abschnitt 7).

## Ablauf G — Aktualisierung nach einer Antwort prüfen (Sende-Test)

```powershell
$dbg = "$env:TEMP\xds-debug-live.user.js"
(Get-Content $src -Raw) -replace 'const DEBUG              = false','const DEBUG              = true' | Set-Content $dbg -Encoding UTF8

$env:DS_SCRIPT = $dbg
$env:DS_OUT    = "$env:TEMP\ds-live-send.json"
$env:DS_WAIT   = "75000"
$env:DS_URL    = ""                 # leer = neuer Chat (schont den Nutzer-Chat); sonst Chat-URL
$env:DS_MSG    = "Antworte bitte nur mit dem Wort: OK"
node deepseek-live-send.mjs
```

Erwartet (v1.0.5): Badge zeigt **ohne Reload** innerhalb von ~5 s nach der Antwort einen Wert
(`📊 74 / 891K  (<1 %)`), bei einer zweiten Antwort einen höheren (`📊 113 / 891K`).
Vor v1.0.5 blieb `📊 --` stehen, bis `F5` gedrückt wurde.

## Ablauf E — Release + GF-Verifikation

```powershell
# 1. Version im Metablock erhöhen, CHANGELOG, Doku, !Ausgabe-Kopie (Hash-Vergleich!)
Copy-Item $src "F:\001_Coding_Projekte\xDeepSeek_Token_Badge\!Ausgabe\xdeepseek-token-badge-v1.0.X.user.js" -Force
(Get-FileHash $src).Hash -eq (Get-FileHash "…\!Ausgabe\xdeepseek-token-badge-v1.0.X.user.js").Hash

# 2. Commit + Push
git -C "F:\001_Coding_Projekte\xDeepSeek_Token_Badge" add -A
git -C "F:\001_Coding_Projekte\xDeepSeek_Token_Badge" commit -m "v1.0.X: …"
git -C "F:\001_Coding_Projekte\xDeepSeek_Token_Badge" push origin main

# 3. GF-Sync anstoßen (kein Webhook im Repo!)
node C:\Users\lolo\.dsh\browser-tools\gf-admin-sync.mjs `
  --script-url "https://greasyfork.org/de/scripts/595207-xdeepseek-token-badge" `
  --sync-url "https://raw.githubusercontent.com/immerzu/xDeepSeek_Token_Badge/main/xdeepseek-token-badge.user.js" `
  --info-sync-url "https://raw.githubusercontent.com/immerzu/xDeepSeek_Token_Badge/main/description.md"

# 4. Version prüfen
Invoke-RestMethod "https://greasyfork.org/de/scripts/595207.json" | Select-Object version, code_updated_at
# Zusatz: GF-Code-Seite auf neue Funktionsnamen prüfen (/code), Zusatzinfos auf der Skriptseite
```

## Fallstricke (alle schon einmal getroffen)

- **CLI-Argumente kommen bei Node nicht an** → immer Umgebungsvariablen (`DS_VERIFY_*`, `DS_LIMITS_OUT`).
  Sonst laufen Werkzeuge still mit Default-Pfaden.
- **Tampermonkey-Altversion:** Für Tests das Profil **ohne** `ignoreDefaultArgs` starten (Playwrights
  Default `--disable-extensions` bleibt aktiv) → keine parallele v1.0.x-Instanz, die das Badge doppelt
  beschreibt. `deepseek-verify-fix.mjs` macht das bereits so.
- **Fenster nicht schließen:** Bricht der Lauf ab (`Target page, context or browser has been closed`),
  ist der Test ungültig (z. B. `tm-import.mjs`).
- **Login abgelaufen:** `VERIFY:LOGGED_IN false` → Nutzer muss sich im Fenster anmelden (Skript wartet
  bis `--login-wait`).
- **fetch vs. XHR:** Die App nutzt XHR. Änderungen an der Extraktion immer **beide** Pfade prüfen;
  ein Log `fetch → …` bedeutet, dass der fetch-Pfad greift (kommt derzeit nicht vor).
- **Debug-Kopien** liegen in `%TEMP%` und werden **nicht** committet; die Release-Datei bleibt ohne
  DEBUG-Spam (nur Metablock-Version und Doku ändern sich).
- **Badge-Format** ist Konvention: dreistellig gerundet (`192K / 891K`), Prozent ganzzahlig
  (`<1 %` unter 1 %), exakte Werte im Tooltip.
- **`DS_SCRIPT` leer lassen heißt: kein Refetch.** Bei warmem Cache liefert der Server dann nur
  `MERGE` mit **0 Nachrichten** → der Report enthält keine Nachrichtendaten (genau dieser Fehler ist
  bei einer Analyse passiert). Für Nachrichteninhalte immer ein Skript injizieren (das den Refetch
  auslöst) oder den Cache kalt erwischen.
- **Das DOM ist virtualisiert:** gerendert sind nur die sichtbaren ~4 Nachrichten; die API-History
  enthält dagegen alle (im Beispiel 22). Aussagen über den gesamten Verlauf nur aus der API ableiten.
- **Nachrichtentexte liegen in `fragments`** (Objekt), es gibt kein `content`/`reasoning_content` —
  Marker-Suchen im Text müssen über `fragments` laufen.
