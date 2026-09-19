# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden hier dokumentiert.

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).  
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

---

## [1.2.6] — 2026-09-16

### Behoben
- **Kontextgrenze war um 2.000 Token zu niedrig angesetzt.** v1.2.5 setzte 960.000 (Fenster 1 Mio.
  − 40.000 Reserve); diese Reserve war aber nur **geschätzt**. Die Kante wurde am 16.09.2026 im Chat
  `b934bbb2-8724-4107-b8ec-f22794efe367` per Sendeversuchen fein eingegrenzt:

  | Kontextstand | Prompt | Summe | Ergebnis |
  |---|---|---|---|
  | 961.233 | ~450 Token | 961.683 | ✅ angenommen |
  | 961.703 | ~230 Token | **961.933** | ✅ angenommen ← oberste bestätigte Annahme |
  | 961.233 | ~916 Token | **962.149** | ❌ `context_length_exceeded` ← unterste bestätigte Ablehnung |

  **Fix:** `CONTEXT_WINDOW = 962000`, `CONTEXT_SOURCE = 'gemessen: 962K (Kontextlimit)'`
  (Kontextfenster 1 Mio. − **38.000** Antwort-Reserve).
- **Die Promptgrößen-Schätzung war ~20 % zu hoch.** Gemessen wurden rund **3,6 Zeichen je Token**
  (843 Zeichen ≈ 230 Token · 3.043 ≈ 825 · 30.042 ≈ 8.015) statt der bisher angenommenen 3,0.
  Der Tooltip nennt damit eine realistische Promptgröße.

### Verifiziert
- Kante im echten Chat (siehe Tabelle): oberste Annahme 961.933, unterste Ablehnung 962.149.
  Ablehnungen sind spurlos (`clear_response: true`); der Chat blieb bei 961.955 stehen.
- Mit injizierter v1.2.6 im selben Chat: Nenner `962K`, `⚠` im Badge, zweizeilige Tooltip-Warnung
  ohne Umbruch (`wraps: 0`), Merker `kind: "length"`.

### Hinweis
- v1.2.5 (960.000) war in der Mechanik korrekt, im Nenner aber ~0,2 % zu niedrig.
  Wer v1.2.5 installiert hat, sollte auf v1.2.6 aktualisieren.

---

## [1.2.5] — 2026-09-16

### Behoben
- **Die Meldung „Längenbegrenzung erreicht" wurde vom Skript nicht erkannt.** Das Skript kannte
  bisher nur das **Nachrichtenlimit** (`MAX_MESSAGE_COUNT_REACHED`). Lehnt DeepSeek das Senden wegen
  zu großer Länge ab, sendet der Server im SSE-Strom des `completion`-Requests:
  `{"type":"error","content":"Längenbegrenzung erreicht. Bitte neuen Chat starten.","finish_reason":"context_length_exceeded"}`.
  Es erschien **kein** ⚠ und **keine** Tooltip-Zeile.
  **Fix:** Neue Erkennung `LENGTH_LIMIT_RE` (Anker: der sprachunabhängige Code
  `context_length_exceeded`, dazu DE/EN-Texte) — im Antwortstrom **und** im DOM-Beobachter.
  Badge zeigt `⚠`, der Tooltip zwei Zeilen:
  `⚠ Längenbegrenzung erreicht — neuer Chat nötig` und
  `Kontext 967K + Prompt ≈ 13K > 960K`. Die Promptgröße wird aus dem Request-Body geschätzt
  (gemessen: ~3 Zeichen je Token).

### Geändert
- **Kontextgrenze von 900.000 auf 960.000 Token korrigiert — jetzt gemessen statt gesetzt.**
  Quelle im Tooltip: `gemessen: 960K (Kontextlimit)`.
  Der Server lehnt das Senden ab, sobald **Kontextstand + Promptlänge** 960.000 übersteigt
  (Fenster 1.000.000 laut DeepSeek-Doku abzüglich 40.000 Antwort-Reserve).
- **`noteObserved` hebt die Grenze nicht mehr an.** Ein Tokenstand über der Grenze beweist kein
  größeres Fenster: Die letzte erlaubte Antwort wächst über die Grenze hinaus (gemessen 984.775 bei
  Grenze 960.000 — senden ist dort abgelehnt). Die Grenze ändert nur noch ein echtes
  `CONTEXT_LENGTH_EXCEEDED` oder ein manueller Override.
- **Migration:** Alte, per Beobachtung gesetzte Lerngrenzen (`xdsTokenBadge.limit` mit Quelle
  „aus Beobachtung", typisch 1.000.000) werden beim Laden **verworfen**, sonst würden sie die
  gemessenen 960K dauerhaft überschreiben.

### Messreihe (16.09.2026, echter Account, je ein Sendeversuch)
| Chat-Stand | Prompt | Bewertung | Ergebnis |
|---|---|---|---|
| 945.022 | Mini | 94,50 % von 1M | ✅ angenommen |
| 958.918 | Mini | 95,89 % | ✅ angenommen |
| **958.963** | **~13.350 Token** | 95,90 % | ❌ `context_length_exceeded` |
| 964.693 | Mini | 96,47 % | ❌ abgelehnt |
| 966.769 | Mini | 96,68 % | ❌ abgelehnt |
| 984.775 | Mini | 98,48 % | ❌ abgelehnt |

Alle sechs Punkte sind mit **einer** Regel konsistent: `Kontextstand + Prompt > 960.000` → Ablehnung.
**Damit ist die Beobachtung „die Meldung kommt schon bei 94 %" erklärt:** Das Badge zeigt nur den
Kontextstand; ein langer Prompt (z. B. 20K Token Übergabetext) verschiebt die Grenze entsprechend
nach unten. 94 % war kein Grenzwert — bei 94,5 % mit kurzem Prompt wird anstandslos gesendet.

### Verifiziert
- Sendeversuche siehe Tabelle (HTTP 200 mit SSE-Hinweis, kein HTTP-Fehler).
- Live-Test mit injizierter v1.2.5 im echten Chat (`deepseek-verify-lengthlimit.mjs`):
  Nenner `960K`, ⚠ im Badge, Tooltip-Zeile, Merker in `xdsTokenBadge.fullSessions` mit `kind: "length"`.

### Hinweis zum Ablauf
- v1.2.5 wurde zunächst **nur im Repo** gebaut (kein Push, kein Greasy-Fork-Sync) und am 16.09.2026
  auf Wunsch veröffentlicht: Push `ba0175d` + `gf-admin-sync.mjs`. Greasy Fork meldet
  `version 1.2.5` (`code_updated 16.09.2026 10:47`); der GF-Code und die Zusatzinfos in DE/RU/EN
  wurden gegengeprüft.

---

## [1.2.4] — 2026-09-11

### Behoben
- **Die Anzeige konnte „1,1M / 1M" zeigen und damit wieder über 100 % liegen.** Ursache: In den
  Zwischenversionen v1.2.2/v1.2.3 war die **Formatierungs-Schwelle** für „M" an die Kontextgrenze
  gekoppelt (`if (n >= 900000) … n / 900000 … + 'M'`). Ein Wert von 951.510 wurde dadurch als „1,1M"
  dargestellt, während die Grenze 900.000 als „1M" erschien.
  **Fix:** `formatTokens` nutzt **immer** die feste 1-Mio.-Schwelle für „M" — Wert und Grenze
  erscheinen in derselben Einheit: `📊 952K / 900K  (106 %)`.

### Geändert
- **Kontextgrenze bewusst auf 900.000 Token gesetzt** (`CONTEXT_WINDOW`), Quelle im Tooltip:
  `gesetzt: 900K (Praxisgrenze)`. Die offizielle DeepSeek-Doku nennt für V4 1 Mio. — der Wert ist
  hier absichtlich kleiner gewählt (so gewünscht). Priorität und Lernmechanik bleiben unverändert.

### Verifiziert
- Rechenbeleg: 951.510 → `952K / 900K (106 %)` · 966.769 → `967K / 900K (107 %)` · 894.000 → `894K / 900K (99 %)`
- Echter Chat `460a35e7…`: Badge **`📊 967K / 900K  (107 %)`**, Tooltip
  `Exakt: 966.769 von 900.000 Token (107,42 %)` und
  `Kontext 900.000 · gesetzt: 900K (Praxisgrenze) · Datei-Limit 890.880`
- Tooltip-Hover im Debug-Lauf bestätigt (`tipDisplay: block`, `enter: 1`) — der vorherige
  fehlgeschlagene Hover-Check war ein Testartefakt, kein Skriptfehler

### Hinweis zum Ablauf
- v1.2.2/v1.2.3 lagen **nur** in `!Ausgabe\` (nicht im Repo, nicht veröffentlicht). Änderungen laufen
  laut Projektregel immer über die Arbeitsdatei → Commit → Push, damit GF-Sync und Gedächtnis stimmen.

---

## [1.2.1] — 2026-09-11

### Hinzugefügt
- **Erkennt den vollen Chat.** Ist das **Nachrichtenlimit** erreicht, lehnt DeepSeek das Senden ab — der
  Server meldet den Fehlercode **`MAX_MESSAGE_COUNT_REACHED`**, die App zeigt den Hinweis
  „Nachrichtenlimit erreicht. Bitte starten Sie einen neuen Chat." (EN: „Message limit reached.
  Please start a new chat.", ZH: „消息数量达到上限，请开启新对话"). Das Skript erkennt **beides** —
  den Fehlercode in der Antwort und den Hinweistext in der Oberfläche — und zeigt es an:
  Badge mit **⚠**-Präfix, im Tooltip die Zeile `⚠ DeepSeek meldet: …`. Der Zustand wird pro Chat
  gemerkt (`xdsTokenBadge.fullSessions`) und beim Chat-Wechsel geladen.
- **Wichtig zur Einordnung:** Das ist ein **Nachrichten-Anzahl-Limit** und unabhängig von der Tokenzahl.
  Die Kontextgrenze wird dabei bewusst **nicht** verändert.

### Behoben (beim Testen gefunden)
- Der Beobachter erkannte anfangs seinen **eigenen Tooltip** als Hinweis (der zeigt die Meldung ja an) →
  Rückkopplung und falsch gemerkter Text. Eigene Elemente (`#deepseek-token-badge`, `…-tip`) werden
  jetzt ausgeschlossen und es wird nur der **Treffer** gespeichert.

### Verifiziert (echter Chat, Hinweis simuliert)
Heute im Chat `460a35e7…` (966.769 Token = 97 %): Badge `📊 ⚠ 967K / 1M  (97 %)` ·
Tooltip `⚠ DeepSeek meldet: Nachrichtenlimit erreicht` · Zustand in `localStorage` · nach Bereinigung
wieder normal — 5/5 Checks grün.

---

## [1.2.0] — 2026-09-11

### Hinzugefügt
- **Lernfähige Kontextgrenze** — das Skript passt sich künftigen Änderungen von DeepSeek selbst an.
  DeepSeek meldet das Kontextfenster in keinem Datenfeld, es gibt aber ein verwertbares Signal:
  1. **Gelernt (belastbar):** Erreicht eine Nachricht den Server-Status `CONTEXT_LENGTH_EXCEEDED`
     (den der Client kennt und dann mit „unendlich" rechnet), übernimmt das Skript den zuletzt
     gültigen Tokenstand als **echte** Grenze. Das greift auch, wenn DeepSeek das Fenster später
     **verkleinert**.
  2. **Aus Beobachtung (untere Schranke):** Überschreitet ein Tokenstand das angenommene Fenster,
     ohne dass eine Überschreitung gemeldet wird, hebt das Skript die Grenze automatisch auf den
     nächsten 100k-Schritt an — die Anzeige bleibt dadurch plausibel statt dauerhaft >100 %.
  3. **Manueller Override:** `localStorage.setItem('xdsTokenBadge.limitOverride', '<Zahl>')` setzt die
     Grenze fest (höchste Priorität), `removeItem` gibt sie wieder frei.
- **Priorität:** Override → gelernt → Settings (nur wenn > 1M) → V4-Standard (1M).
  Der Tooltip nennt immer die **Quelle** der Grenze.
- Gespeicherte Werte: `xdsTokenBadge.limit` (gelernt), `xdsTokenBadge.limitOverride` (manuell),
  `xdsTokenBadge.observedMax` (größter je gesehener Tokenstand).

### Verifiziert (echter Chat, ohne Reload-Tricks)
- Standard: `📊 945K / 1M  (95 %)` · Tooltip `Kontext 1.000.000 · DeepSeek V4 (1M) · Datei-Limit 890.880`
- Override `2000000`: `📊 945K / 2M  (47 %)` · Tooltip `Kontext 2.000.000 · manuell gesetzt (localStorage)`
- Override entfernt: wieder `📊 945K / 1M  (95 %)` · `observedMax = 945022` wird gelernt

---

## [1.1.2] — 2026-09-11

### Behoben
- **Der Füllstand konnte über 100 % steigen** (gemeldet für Chat `e26321a7…`: `945K / 891K (106 %)`).
  Ursache: Seit v1.0.4 nutzte das Skript **890.880 Token** als Kontextgrenze — dieser Wert ist aber
  das **Datei-/History-Limit** der App (`model_configs[].file_feature.token_limit` bzw.
  `normal_history_and_file_token_limit`), **nicht** das Kontextfenster.
  DeepSeek V4 hat laut offizieller Doku ein Kontextfenster von **1.000.000 Token**
  („1M Standard: 1M context is now the default across all official DeepSeek services",
  <https://api-docs.deepseek.com/news/news260424/>).
- **Nachweis am betroffenen Chat:** 70 Nachrichten, Serverwert **945.022 Token** → **94,50 %** von 1M
  (statt 106 % von 890.880). Zusätzlich zeigen die Zuwächse pro Turn (2.486–4.946 Token), dass der
  Serverwert ein **Kontextstand** ist und keine kumulierte Lebenszeit-Summe (die bei kumulativer
  Zählung ~945.000 pro Turn betragen müsste).
- Das Skript rechnet jetzt gegen **1.000.000**; das Datei-/History-Limit (890.880) steht informativ
  im Tooltip und wird nur übernommen, wenn es größer als das Kontextfenster ist (Zukunftssicherheit).

### Verifiziert
- Badge im betroffenen Chat: **`📊 945K / 1M  (95 %)`**
- Tooltip (5 Zeilen, kein Umbruch):
  `Exakt: 945.022 von 1.000.000 Token (94,50 %)` ·
  `Kontext 1.000.000 · DeepSeek V4 (1M) · Datei-Limit 890.880`

---

## [1.1.1] — 2026-09-11

### Behoben
- **Der Tooltip (Detailanzeige) verschwand nicht mehr zuverlässig bzw. blieb hängen.** Drei Ursachen:
  1. Er hing nur an „Maus verlässt das Badge". Jetzt schließt ihn auch eine **Mausbewegung auf dem
     Badge** (ab 6 px, aber erst nach 250 ms Ruhe — damit das Anfahren ihn nicht sofort wieder
     schließt). Tastendrücke blenden weiterhin **nichts** aus.
  2. **Logikfehler beim Fixieren:** Ein Klick setzte den Pin immer auf „an" (ein zweiter Klick konnte
     ihn nie lösen, weil `pointerdown` ihn vorher zurücksetzte). Jetzt toggelt der Klick korrekt, und
     **Verschieben** löst eine Fixierung.
  3. **Hängender Tooltip nach SPA-Rerender:** Baut die Seite das Badge neu auf, wird der
     Tooltip-Zustand (Pin + Sichtbarkeit) zurückgesetzt — vorher blieb er ohne `mouseleave`-Handler
     dauerhaft stehen.

### Verifiziert (12 automatische UI-Checks, echter Chat)
Hover → sichtbar · Tastendruck `a`/`Shift`/`Ctrl` → bleibt sichtbar · **Mausbewegung auf dem Badge →
ausgeblendet** · Klick → fixiert (überlebt Mausbewegung, Maus-weg und Tastendruck) · zweiter Klick →
gelöst · 5 Zeilen ohne Umbruch · kein `title`-Attribut.

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
