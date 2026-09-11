# ANALYSE 2026-09-10 — DeepSeek History-Cache: Badge blieb leer (v1.0.3) + Realitätsprüfung der Zahl (v1.0.4)

Bezug: `xdeepseek-token-badge.user.js` (Greasy Fork 595207, Repo `immerzu/xDeepSeek_Token_Badge`).
Ersetzt das frühere Dokument `FIX-20260910-v1.0.3-badge-zeigt-keine-token.md` (Inhalt vollständig hier).

---

## 1. Symptom (Nutzer, Yandex-Browser + Tampermonkey)

- Anfangs wurde der Tokenstand korrekt angezeigt.
- Nach einigen Gesprächen hin und her: nur noch `📊 --` — auch beim Wechsel in andere Chats.
- Nach `F5` ebenfalls `--` (bis v1.0.2).

## 2. Root Cause A — DeepSeek liefert bei warmem Cache nur Deltas

DeepSeek hält die Chat-History **clientseitig** (IndexedDB, Store **`history-message`**,
erzeugt in `main.*.js` via `createObjectStore("history-message")`). Bei warmem Cache schickt der
Client `cache_version` + `cache_reset_at` an `/api/v0/chat/history_messages`:

| Fall | `cache_control` | `chat_messages` | Tokenstand in der Antwort |
|---|---|---|---|
| Cache kalt | `REPLACE` | volle History | **ja** (alle Nachrichten) |
| Cache warm | `MERGE` | **0 bis wenige Deltas** | **nein** (Feld fehlt komplett) |

Client-Merge (im Bundle belegt):
`g = "REPLACE" === h.cache_control ? h.chat_messages : merge([...h.chat_messages, ...cache?.data?.chat_messages], "message_id")`

Messwerte der Reproduktion (reasonix-Profil, eingeloggt):

```
?chat_session_id=X                      → REPLACE, 18 msgs, max 217059   Badge 217.059
?chat_session_id=X&cache_version=18&…   → MERGE,    0 msgs, kein Feld   Badge --
```

Bis v1.0.2 hing das Skript ausschließlich am Netzwerk-Response → bei `MERGE` ohne Nachrichten
kein `accumulated_token_usage` → `--`.

**Zusatzfehler:** Beim Chat-Wechsel blieb der Wert des **vorherigen** Chats stehen (falsche Zahl),
weil ohne neue Antwort nichts neu gerendert wurde. Und: Wechselt die App den Chat komplett aus dem
Speicher, entsteht **gar kein** Netzwerk-Request — dann fehlt jedes Ereignis zum Aktualisieren.

## 3. Root Cause B — Die App nutzt XMLHttpRequest, nicht fetch

- Im `main`-Bundle: **0** Treffer für `XMLHttpRequest` (nur das Vendor-Bundle enthält Vorkommen).
- Empirisch entscheidend: Mit Instrumentierung (`log('fetch →', url)`) sah der **fetch-Hook keinen
  einzigen** Request, während der **XHR-Hook** die Werte lieferte
  (`[TokenBadge] Badge aktualisiert → 191768`).
- Konsequenz: Ein erster Fix-Versuch, der den Nachlade-Request nur im fetch-Pfad einbaute, lief ins
  Leere — sichtbar daran, dass **kein** Refetch-Request im Netzwerk auftauchte.

**→ Der XHR-Hook ist der Hauptpfad; der fetch-Hook bleibt nur als Absicherung.**

## 4. Fix v1.0.3 (Commit `e7c18a3`)

1. **Kern:** Antwort ohne Tokenstand (`MERGE`) → History **einmalig ohne `cache_version`/`cache_reset_at`**
   nachladen, mit den Headern des Original-Requests (`setRequestHeader`-Mitschnitt) → gleiche Session
   → Server antwortet `REPLACE` mit voller History → Wert lesen. Drossel: max. 1 Nachladen / 4 s.
2. **Merker** je Chat (`localStorage`, Schlüssel `xdsTokenBadge.sessionTokens`, max. 200):
   nach Reload sofort letzter bekannter Wert, mit `~` markiert, bis der Serverwert kommt.
3. **Session-Bindung:** Wert gehört zur Chat-Session; beim Wechsel wird der alte Wert verworfen.
4. **URL-Wächter** (`pushState`/`popstate` + 1,5-s-Intervall): erkennt Chat-Wechsel auch ohne Request.
5. **Rekursive Suche** nach `accumulated_token_usage` (robust gegen Feldverschiebungen).

Verifikation (echter Chat): `MERGE (0 msgs)` → Refetch → `REPLACE, 20 msgs, max 191768` →
`Badge 191.768 / 1M (19.18 %)`; Chat-Wechsel → 217.059; nach `F5` sofort ein Wert.
Alle 5 Checks grün.

## 5. Realitätsprüfung der Anzeige (Nutzerfrage, → v1.0.4)

**Der Zähler ist echt:** `accumulated_token_usage` — die App nennt ihn intern
**`useBranchUsedTokenCount`** und rechnet `getTokenConfig({thinking, modelType}) − verbraucht`
(`useMaxTokenNewFilesAllowed`, `useIsProcessingTokenCountExceeded`). Keine Schätzung.

**Der Nenner war geraten** (1.000.000). Tatsächlich meldet die App:

| Quelle | Wert |
|---|---|
| `model_configs[].file_feature.token_limit` (Schnell/Experte/Vision) | **890.880** |
| `token_limit_with_thinking` | 890.880 |
| `normal_history_and_file_token_limit` / `r1_…` (`scope=main`) | 890.880 |
| Code-Fallback in `getTokenConfig` (`d3` im Bundle) | 61.440 |

→ Der Prozentsatz war ~11 % zu niedrig (191.768 → 19,18 % statt 21,53 %).

**Bekannte Grenzen der Anzeige** (bewusst offen gelassen; Nutzer wollte nur den Nenner korrigieren):

1. Das Skript nimmt das **Maximum über alle Nachrichten**. Exakt wäre der Wert des **aktiven Zweigs** —
   bei Alternativ-Antworten/Bearbeitungen kann ein verworfener, längerer Zweig höher liegen.
2. Die App addiert für „verbraucht" zusätzlich die **Datei-Tokens**
   (`useBranchAndProcessingFilesTokenCount = getFilesTokenCount + BranchUsedTokenCount`); das Badge
   zeigt nur den History-Anteil.
3. Zwischen zwei History-Ladevorgängen ist der Wert nicht live (kein SSE-Mitlesen).

## 6. Umsetzung v1.0.4 (Commit `7fa0f3b`, Memory `f3206bf`)

- **Kontextgrenze dynamisch:** gelesen aus `/api/v0/client/settings?scope=model|main`
  (`file_feature.token_limit` je Modell + Denkmodus, sonst globales Limit), Rückfall **890.880**.
  Modell/Denkmodus kommen aus `chat_session.model_type` und `chat_messages[].thinking_enabled`.
- **Kompakte Anzeige (Nutzerwunsch „zu breit"):** dreistellig gerundet
  `📊 217K / 891K  (24 %)` — Badge **171 px** statt ~230 px; Prozent ganzzahlig (`<1 %` unter 1 %).
  Tooltip enthält weiterhin exakte Werte, Prozent mit zwei Dezimalen und die Quelle der Grenze.
- **Doku konsistent:** README, INSTALL, `DESCRIPTION.greasyfork.md`, `description.md` (DE/RU/EN),
  `metadata.json`, `CHANGELOG.md` auf Format und reale Grenzen umgestellt; description.md nennt die
  Einschränkungen ehrlich.
- **Verifikation:** Format `192K / 891K (22 %)` bzw. `217K / 891K (24 %)`, kein `--` nach F5,
  Screenshot-Kontrolle der Badge-Breite; GF live auf **1.0.4** (12:09:54), Code und Zusatzinfos
  gegengeprüft.

## 7. Nachtrag — „[ 76 % von 100 % gefüllt]" im Chat vs. Badge (21 %)

**Frage des Nutzers:** Im Chat steht über der Agenten-Ausgabe `[ 76% von 100% gefüllt]`, das Badge zeigt
nur 21 %. Warum der große Unterschied?

**Befund: Die Zeile ist eine Selbsteinschätzung des Modells, keine Messung.**

Belege (Chat `a2d146c5-…`, „LoloChat_06", live gemessen):

1. **DOM-Pfad des Markers:** `span → p.ds-markdown-paragraph → div.ds-markdown.ds-assistant-message-main-content → div.ds-message`
   — er steht im **Denkblock der Assistenten-Nachricht**, direkt nach der Überschrift
   „7 Sekunden nachgedacht …" bzw. „3 Sekunden nachgedacht …", unmittelbar vor der eigentlichen Antwort.
2. **Datenherkunft:** Die History-Antwort enthält **kein** Prozentfeld. Der Marker liegt im Feld
   **`fragments`** (13.948 Zeichen, `marker=true`). Die API-Felder einer Nachricht sind:
   `message_id, parent_id, model, role, thinking_enabled, ban_edit, ban_regenerate, status,
   incomplete_message, accumulated_token_usage, feedback, inserted_at, search_enabled, fragments,
   has_pending_fragment, auto_continue, search_triggered` — es gibt **kein** `content`/`reasoning_content`;
   Text steht in `fragments`.
3. **Kein Fremd-Tool:** Der Marker erscheint auch mit **deaktivierten Extensions** und **ohne**
   injiziertes Skript → reiner Chat-Inhalt, kein Overlay/Userscript.
4. **Gegenrechnung:**

| Selbstauskunft im Chat | beanspruchte Token (bei Limit 890.880) | Serverwert (max) | Faktor |
|---|---|---|---|
| `71 %` | 632.525 | 183.652 (= 20,61 %) | 3,4× |
| `76 %` | 677.069 | 183.652 (= 20,61 %) | 3,7× |

5. **Serververlauf (22 Nachrichten, lückenlos, in sich schlüssig):**
   `25249, 25599, 43669, 44440, 59891, 60916, 75940, 76674, 89421, 90317, 102974, 104653, 120368,
   122201, 137485, 138396, 154730, 155444, 171776, 171776, 180762, 183652`
   → je Turn ~15.000 Token Zuwachs; der letzte Wert ist das Maximum (183.652 = 20,61 %).
6. **Das DOM ist virtualisiert:** gerendert waren nur **4** Nachrichten (`div.ds-message`), davon
   2 Assistenten mit Marker — die API lieferte **22**. Aussagen über einen ganzen Verlauf daher
   ausschließlich aus der API-History ableiten, nie aus dem DOM.

**Ursache des Unterschieds:** Ein LLM kann seine Kontextauslastung nicht messen — es hat keinen Zugriff
auf Tokenzähler und schätzt den „Gesprächsumfang" (hier offenbar stark überschätzend, weil der Kontext
durch BDS-Prompt-Blöcke dicht wirkt). Die Zahl ist Dekoration/Schätzung, kein Messwert.

**Umfeld-Hinweis:** Der Nutzer betreibt ein eigenes Agent-System (**BDS / Better DeepSeek**), das
Prompt-Blöcke wie `<BDS:memory_calls importance="always">` und Auftrags-/Formatregeln in die Chats
injiziert. Die Selbstauskunft `[ X % von 100 % gefüllt]` ist sehr wahrscheinlich eine per Prompt
angeforderte Statuszeile — sie wird vom Modell aber frei geschätzt. Wenn dieser Wert gebraucht wird,
muss er dem Modell vorgegeben werden (z. B. aus dem Badge/der API), statt es schätzen zu lassen.

**Konsequenz:** Dem Badge-Wert (Serverfeld `accumulated_token_usage`) ist zu vertrauen; die
`[ X % von 100 % gefüllt]`-Zeile im Chat ist unzuverlässig. Soll ein Agent den Füllstand berichten,
muss man ihm den echten Wert vorgeben (Prompt-Injection aus dem Badge) statt ihn schätzen zu lassen.

## 8. Nachtrag v1.0.5 — Badge aktualisierte sich nach einer Antwort nicht (nur nach F5)

**Symptom (Nutzer):** Nach einer Antwort des Assistenten blieb der Badge-Wert stehen; erst `F5` (oder
Chat-Wechsel) brachte den neuen Stand.

**Messung (Livetest mit Testnachricht in einem neuen Chat, `deepseek-live-send.mjs`):**

Request-Timeline nach dem Senden:

```
+16205ms request  /api/v0/chat/completion          ← SSE-Antwortstrom
+16213ms request  /api/v0/chat_session/create
+16513ms response /api/v0/chat/completion
+16527ms response /api/v0/chat_session/create
… danach 80 s lang KEINE history_messages-Anfrage
```

Der SSE-Stream enthält `accumulated_token_usage` **nur einmal mit Wert `0`** (Nachricht im Status
`WIP`) — den finalen Stand liefert er nie:

```
data: {"v":{"response":{…,"status":"WIP","accumulated_token_usage":0,…}}}
```

**Root Cause:** Nach dem Senden lädt die App die History **nicht** neu (sie baut den Zustand aus dem
Stream auf), und der Stream transportiert den finalen Tokenstand nicht. Das Skript hing aber
ausschließlich an `history_messages` → nach einer Antwort passierte nichts. (Bis v1.0.4 war das
Verhalten sogar dokumentiert: „aktualisiert sich nur, wenn DeepSeek die History lädt".)

**Fix (v1.0.5, Commit `d2c7b2c`):** Am **Ende des Antwort-Streams** (XHR-`load` auf
`/chat/completion` bzw. fetch-Ende) lädt das Skript die History **selbst** nach:
`GET /api/v0/chat/history_messages?chat_session_id=…` ohne Cache-Parameter, mit den per
`setRequestHeader` gesammelten Session-Headern. Zeitplan: 1,5 s nach Stream-Ende; bleibt der Wert
unverändert (oder leer), einmal nach 3 s erneut. Drossel `REFRESH_DELAY` = 2,5 s.
Session-ID aus dem POST-Body (`chat_session_id`), sonst aus der URL, sonst `currentSession`.

**Verifikation (ohne Reload, im laufenden Chat):**

```
neuer Chat:   vor dem Senden  📊 --          → nach der Antwort  📊 74 / 891K  (<1 %)
zweite Antwort:               📊 74 / 891K   →                    📊 113 / 891K (<1 %)
```

Der Merker (`localStorage`) wurde jeweils mitgeschrieben; GF live auf 1.0.5 (13:24:31).

### Nachtrag v1.0.6 — Timing gemessen, Refresh gehärtet, Selbstdiagnose im Tooltip

**Nutzer-Rückmeldung nach v1.0.5:** „Es aktualisiert sich immer noch nicht automatisch" (Version 1.0.5
war nachweislich installiert).

**Timing-Messung** (`deepseek-value-timing.mjs`: sendet und fragt die History danach alle 2 s im
Seitenkontext ab, mit Bearer-Token aus `localStorage`):

```
+16001ms  req  /api/v0/chat/completion
+16306ms  res  /api/v0/chat/completion      (Stream-Ende)
+18021ms  req  /api/v0/chat/history_messages?chat_session_id=…   ← unser Refresh
ab +2s    Serverwert bereits abrufbar (74 Token), danach konstant
```

Erkenntnis: Der Serverwert ist **~2 s nach dem Senden** verfügbar. Bei **sehr kurzen** Antworten
bleibt er unverändert (Stillstand ist dann korrekt, kein Fehler). Bei längeren Turns steigt er deutlich
(Sequenz: jeder Turn ≈ +15.000 Token).

**v1.0.6 (Commit `90806c0`):**

1. Refresh mit **Backoff**: 1,5 / 3 / 6 / 10 / 15 s (≈ 35 s) statt zwei Versuchen.
2. **Nachrichtenzahl-Prüfung**: `fetchHistory` liefert jetzt `{tokens, count}`; enthält die History
   keine neue Nachricht, wird nicht weiter nachgeladen.
3. **Selbstdiagnose im Tooltip**: `Nachladen nach Antwort: ok (Versuch 1): … Token` /
   `Versuch 3: … Token (unverändert), Nachrichten 22` / `aufgegeben nach 5 Versuchen` /
   `abgebrochen: keine Session-ID erkannt`. Damit ist ohne Konsole erkennbar, warum eine Zahl steht.
4. **Debug-Fassung** (`!Ausgabe/xdeepseek-token-badge-v1.0.6-debug.user.js`, `DEBUG = true`) für die
   Ferndiagnose beim Nutzer — nicht auf Greasy Fork.

**Testnachweis v1.0.6** (ohne Reload): `74 → 581` (nach der Antwort), später `→ 1107`.

**Interpretationshilfe (wichtig für künftige Meldungen):** Die Anzeige ist dreistellig gerundet —
Änderungen unter ~1.000 Token sind in der Leiste **nicht** sichtbar (`184K` bleibt `184K`). Ob sich
der Wert real bewegt hat, zeigt der **Tooltip** (exakte Tokenzahl + Prozent mit zwei Dezimalen).

## 9. Nachtrag v1.1.0 — geteilte Chats (`/share/…`) liefen ins Leere

**Anlass:** Der Nutzer legte zum Testen einen geteilten Chat an:
`https://chat.deepseek.com/share/t5f3etgz9rhqfwe78b` (Thema Mallorca-Wettervorhersage).

**Messung** (`deepseek-share-test.mjs`, alle JSON-Antworten der Share-Seite):

```
/api/v0/share/content?share_id=t5f3etgz9rhqfwe78b  → acc=JA, max=151801
Badge (v1.0.9): "📊 --"      ← kein Wert, obwohl die Antwort ihn enthält
```

Struktur der Share-Antwort: `data.biz_data` = `{ title, messages[], model_type }` — **kein**
`chat_messages`, **keine** `chat_session.id`, und der Endpunkt heißt `/share/content` (nicht
`/chat/history_messages`). Deshalb griff keiner der bestehenden Hooks.

**Fix (Commit `c653ee3`):**

1. Neue Konstante `SHARE_FRAGMENT = '/share/content'`; XHR- **und** fetch-Hook lesen Share-Antworten
   und ziehen den Tokenstand über die bestehende rekursive Extraktion aus `messages[].accumulated_token_usage`.
2. `sessionFromLocation()` erkennt zusätzlich `/share/<id>` und liefert `share:<id>` → eigene
   Session-Bindung + Merker-Eintrag.
3. Tooltip unterscheidet den Kontext: „Geteilte Unterhaltung — Stand zum Zeitpunkt des Teilens";
   die Nachlade-Zeile entfällt dort (der geteilte Verlauf ist statisch).

**Verifikation:**

| Kontext | Wert |
|---|---|
| Geteilter Chat `share/t5f3etgz9rhqfwe78b` | `📊 152K / 891K  (17 %)` = **151.801** Token |
| Original-Chat „Mallorca Wetter" (`327679f9-380e-4673-923c-25db1b4f122c`) | identisch, auch nach `F5` |

Der Original-Chat wurde über die **Chat-Liste des Accounts** gefunden (`chat_session/fetch_page`,
Titelsuche „mallorca") — Werkzeug: `deepseek-find-chat.mjs`. Beide Werte stimmen exakt überein, d. h.
die Anzeige ist auch im geteilten Kontext korrekt.

## 10. Wichtige Codeanker (für künftige Änderungen)

| Zweck | Wert |
|---|---|
| Kontextgrenze (Tokenstand) | `accumulated_token_usage` in `data.biz_data.chat_messages[]` |
| Tokenstand (geteilter Chat) | `accumulated_token_usage` in `data.biz_data.messages[]` — Endpunkt `GET /api/v0/share/content?share_id=…` |
| Kontextgrenze (Limit) | `data.biz_data.settings.model_configs[].file_feature.token_limit(_with_thinking)` |
| Endpunkt History | `GET /api/v0/chat/history_messages?chat_session_id=…[&cache_version=…&cache_reset_at=…]` |
| Endpunkt Settings | `GET /api/v0/client/settings?did=…&scope=model\|main` |
| Cache-Steuerung | `biz_data.cache_control`: `REPLACE` (voll) / `MERGE` (Deltas) |
| Client-Cache | IndexedDB `history-message` (`version`, `cacheResetAt`, `data.chat_messages`) |
| Netzwerkweg | `XMLHttpRequest` (fetch nur Absicherung) |
| Merker | `localStorage.xdsTokenBadge.sessionTokens` |

## 11. Umgebungs-Erkenntnisse (wiederverwendbar)

- **GF-Auto-Sync ist NICHT webhook-basiert:** kein GitHub-Hook im Repo
  (`gh api repos/immerzu/xDeepSeek_Token_Badge/hooks` → leer) → GF zieht periodisch.
  Sofort auslösen (dauert Sekunden):
  `gf-admin-sync.mjs --script-url https://greasyfork.org/de/scripts/595207-xdeepseek-token-badge
  --sync-url <raw .user.js> --info-sync-url <raw description.md>`
  `--script-url` ist die **GF-Skriptseite**; mit der Raw-URL entsteht `<raw>/admin` → Fehler.
- **CLI-Argumente erreichen Node bei DSH-`pwsh`-Aufrufen nicht** (`--out`, `--script` kamen nie an,
  Defaults griffen) → Werkzeuge über **Umgebungsvariablen** steuern
  (`DS_VERIFY_SCRIPT`, `DS_VERIFY_OUT`, `DS_VERIFY_SHOT`, `DS_LIMITS_OUT`).
  Symptom damals: „out=deepseek-sniff.json" statt des übergebenen Pfads.
- **Playwright-Profil `reasonix`** hat Tampermonkey 5.5.0 + das Skript installiert; die
  DeepSeek-Session kann ablaufen (`userToken: null`, Redirect `/sign_in`) → nur der Nutzer kann neu
  einloggen. Für Tests ohne TM-Altversion: Profil **mit** Playwrights Default `--disable-extensions`
  starten und das Skript per `addInitScript` injizieren.
- **`tm-import.mjs`** bricht ab, wenn das Chromium-Fenster geschlossen wird
  (`Target page, context or browser has been closed`) → danach Version im TM-LevelDB
  (`Local Extension Settings/dhdgffkkebhmkfjojejmpbldmpobfkfo`) prüfen.
- **Meine Fehlspur:** Ein TM-Check über `GM_info` / `script[src*=tampermonkey]` ist untauglich
  (beides existiert so nicht) — er meldete fälschlich „kein TM".

## 12. Offene Punkte

- [ ] Aktiven **Zweig** statt Maximum zählen (parent_id-Kette + `currentChildIndex`).
- [ ] **Datei-Tokens** berücksichtigen (App addiert `getFilesTokenCount`).
- [ ] Nach jedem `MERGE` wird die volle History geladen (Netzwerklast) — Alternative: IDB-Store
      `history-message` direkt lesen.
- [ ] Optional: Wert aus SSE-Deltas (`/api/v0/chat/completion`) mitlesen → live statt nur beim Load.
- [ ] Optional: GF-Tags (`deepseek`, `token`, `context`, `badge`, `chat`) im GF-UI ergänzen.

## 13. Commits dieser Session

| Commit | Inhalt |
|---|---|
| `e7c18a3` | v1.0.3 — Fix gegen leeres Badge (MERGE-Refetch, Merker, Session-Bindung, URL-Wächter) |
| `c87d64a` | Doku: GF-Sync ohne Webhook, Node-CLI-Args, `!Ausgabe`-Regel |
| `7fa0f3b` | v1.0.4 — Kontextgrenze aus Settings (890.880) + dreistellige Anzeige + Doku |
| `f3206bf` | Memory: v1.0.4 nachgetragen |
| `cc57f46` | Memory konsolidiert (Analyse-, Testrezept-, Index-Dokument) + `AGENTS.md` erweitert |
| `4fd1dfe` | Memory: Analyse der Modell-Selbstauskunft `[ X % von 100 % gefüllt]` + `fragments`-Feld |
| `be712bc` | Memory: Werkzeuge/Befunde der Chat-Analyse nachgetragen |
| `d2c7b2c` | v1.0.5 — Nachladen am Ende des Antwort-Streams (Badge aktualisiert ohne F5) |
| `90806c0` | v1.0.6 — Refresh-Backoff, Nachrichtenzahl-Prüfung, Selbstdiagnose im Tooltip, Debug-Fassung |
| `cb052d6` | v1.0.7 — Badge verschiebbar (Position in `localStorage`, Doppelklick-Reset) |
| `22b1cd9` | v1.0.8 — eigener Tooltip statt `title` (überlebt Tastendruck, per Klick fixierbar) |
| `9568979` | v1.0.9 — Tooltip kompakter (max-width 420 px, gekürzte Statuszeilen) |
| `c653ee3` | v1.1.0 — geteilte Chats unterstützt (`/api/v0/share/content`) |

Zusätzliche Diagnose-Werkzeuge aus dieser Session: `deepseek-open-chat.mjs` (einzelnen Chat öffnen,
Badge prüfen, Fenster offen halten) und `deepseek-analyze-context.mjs` (Chat-Tiefenanalyse:
Tokenverlauf, Marker-Suche, Nachrichtenfelder, DOM-Zählung) — dokumentiert in
[`TESTEN-userscript-deepseek.md`](TESTEN-userscript-deepseek.md).

Testrezept für künftige Änderungen: siehe [`TESTEN-userscript-deepseek.md`](TESTEN-userscript-deepseek.md).
