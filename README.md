# xDeepSeek Token Badge 🎯

Ein Tampermonkey-Userscript, das den aktuellen **Kontext-Füllstand** des DeepSeek-Chats als schwebendes Badge unten rechts anzeigt — in Echtzeit, ohne Server, ohne Datenverlust.

**Autor:** [immerzu](https://greasyfork.org/de/users/1629833-immerzu)  
**Lizenz:** MIT  
**Plattform:** [GreasyFork](https://greasyfork.org/de)  
**Version:** 1.0.4

---

## Was macht dieses Skript?

DeepSeek schneidet den ältesten Teil der Konversation ab, sobald der Kontext voll ist — der Chat „vergisst" frühere Details. Das Problem: DeepSeek zeigt nirgendwo an, **wie voll** das Fenster gerade ist. Das Skript rechnet deshalb gegen eine **gemessene Grenze von 962.000 Token** (Kontextfenster 1 Mio. abzüglich 38.000 Antwort-Reserve; siehe „Kontextfenster" unten).

Dieses Skript fängt die API-Antworten des DeepSeek-Web-Chats ab, liest das Feld `accumulated_token_usage` daraus und zeigt es als kleines Badge unten rechts an:

```

📊 406K / 891K  (46 %)

```

Der Nutzer sieht so auf einen Blick, wann er einen neuen Chat starten sollte, um Kontextverlust zu vermeiden.

---

## Features

- 🎯 **Live-Anzeige** des aktuellen Token-Füllstands (dreistellig gerundet + Prozent, exakt im Tooltip) — **ab 90 % wird die Prozentangabe rot**
- 📐 **Passende Grenze** — gerechnet wird gegen die gemessene Kontextgrenze (962.000 Token); das Datei-/History-Limit der App (890.880) zeigt der Tooltip zusätzlich
- 🚀 **Null Konfiguration** — installieren, fertig
- 🔒 **Lokal & sicher** — kein Server, keine externen Aufrufe, kein Tracking
- 🖱️ **Verschiebbar** — mit der Maus an jede Stelle ziehen; Position bleibt erhalten, Doppelklick setzt das Badge zurück
- 🎨 **Dezentes Design** — dark glassy badge, passend zum DeepSeek-Look
- ♻️ **Reload-fest** — merkt sich den letzten Wert je Chat (mit `~` markiert)

---

## Installation

### Variante A: GreasyFork (empfohlen)

1. [Tampermonkey](https://www.tampermonkey.net/) im Browser installieren (Chrome, Firefox, Edge, Safari)
2. GreasyFork-Link zum Skript öffnen
3. Auf **„Installieren"** klicken
4. `https://chat.deepseek.com` neu laden — Badge erscheint unten rechts

### Variante B: Manuell

1. Tampermonkey-Dashboard öffnen → **Dashboard → „+"**
2. Den Inhalt von `xdeepseek-token-badge.user.js` komplett einfügen
3. Speichern (`Strg+S`)
4. DeepSeek-Chat neu laden (`F5`)

---

## Bedienung

| Aktion | Verhalten |
| --- | --- |
| Badge ist sichtbar | Wert wird automatisch beim Chat-Wechsel und nach jeder Antwort aktualisiert |
| **Ziehen** mit der Maus | Badge verschieben — die Position wird gemerkt (auch nach Reload) |
| **Doppelklick** auf das Badge | zurück in die Standardecke unten rechts |
| **Maus über dem Badge** | eigenes Tooltip mit exaktem Wert, Kontextgrenze und Nachlade-Status — bleibt beim Drücken von Tasten stehen (screenshot-freundlich) und verschwindet bei Mausbewegung bzw. wenn die Maus das Badge verlässt |
| **Klick** auf das Badge | Tooltip fixieren (bleibt dann auch bei Mausbewegung stehen); erneuter Klick oder `Escape` löst ihn |
| Badge zeigt `~406K / 891K  (46 %)` | Letzter bekannter Wert für diesen Chat — der Server lieferte nur ein Delta; der aktuelle Wert wird nachgeladen |
| Badge zeigt `--` | Noch keine API-Antwort abgefangen — einmal `F5` drücken |
| Badge fehlt komplett | Prüfen, ob Tampermonkey aktiv ist und das Skript in der Liste steht |

---

## Technische Details

- **Hook-Punkte:** `XMLHttpRequest.prototype.send` (+ `setRequestHeader`) und `window.fetch`
- **Ziel-Endpunkte:** `*/chat/history_messages` (Tokenstand), `*/client/settings` (Kontextgrenze), `*/chat/completion` (Ende des Antwort-Streams → Nachladen auslösen), `*/share/content` (geteilte Unterhaltung)
- **Ausgelesenes Feld:** `data.biz_data.chat_messages[].accumulated_token_usage` (in der Share-Ansicht `data.biz_data.messages[].accumulated_token_usage`)
- **Angezeigter Wert:** Maximum der `accumulated_token_usage`-Werte; bei `cache_control: MERGE` wird die History einmalig ohne Cache-Parameter nachgeladen
- **Kontextfenster:** **962.000 Token** — **gemessen** am 16.09.2026 (`CONTEXT_WINDOW`, v1.2.5). Das Fenster selbst sind 1.000.000 Token (offizielle DeepSeek-Doku für V4 „1M context", <https://api-docs.deepseek.com/news/news260424/>); der Server lehnt das Senden ab, sobald **Kontextstand + Promptlänge** 962.000 übersteigt — die Differenz von 40.000 ist die Reserve, die er für die Antwort freihält. Messreihe: 945.022 + Mini-Prompt ✅ · 958.918 + Mini-Prompt ✅ · **958.963 + ~13.350-Token-Prompt ❌** · 964.693 ❌ · 966.769 ❌ · 984.775 ❌. Die Client-Settings liefern nur Datei-/History-Limits (`file_feature.token_limit`, `normal_history_and_file_token_limit` = 890.880) — sie werden informativ im Tooltip gezeigt und nur übernommen, wenn sie größer als die Grenze sind.
- **Zwei Ablehnungsgründe:** *Nachrichtenlimit* (`MAX_MESSAGE_COUNT_REACHED`) und *Längenbegrenzung* (`finish_reason: context_length_exceeded`, DE „Längenbegrenzung erreicht. Bitte neuen Chat starten."). Beide zeigen `⚠` im Badge und eine Zeile im Tooltip; bei der Längenbegrenzung wird zusätzlich die geschätzte Promptgröße genannt (~3 Zeichen je Token).
- **Formatierung:** `formatTokens` nutzt **immer** die feste 1-Mio.-Schwelle für „M" — sie darf **nicht** an das Kontextfenster gekoppelt werden (sonst entsteht „1,1M / 1M").
- **Verwendete Tampermonkey-APIs:** keine (`@grant none`)

---

## Dateien in diesem Paket

| Datei | Zweck |
| --- | --- |
| `xdeepseek-token-badge.user.js` | **Das eigentliche Skript** — wird auf GreasyFork hochgeladen |
| `PUBLISHING.md` | Schritt-für-Schritt-Anleitung zur Veröffentlichung |
| `DESCRIPTION.greasyfork.md` | Fertig formulierte Listings-Beschreibung zum Einfügen |
| `metadata.json` | Alle Metadaten in strukturierter Form |
| `CHANGELOG.md` | Versionshistorie |
| `INSTALL.md` | Anleitung für Endnutzer |
| `LICENSE` | MIT-Lizenz |

---

## Bekannte Einschränkungen

- Das Badge lädt den Tokenstand nach **jeder Antwort** automatisch nach sowie beim Öffnen/Wechseln eines Chats und nach einem Reload. Zwischen zwei Antworten bleibt der zuletzt empfangene Wert stehen.
- Angezeigt werden die History-/Kontext-Tokens der Unterhaltung; Datei-Tokens zählen nicht mit.
- In verzweigten Chats (Alternativ-Antworten) kann das Maximum über alle Nachrichten höher liegen als der aktive Zweig.
- Bei DeepSeek-Versionen, die den Endpunkt `/history_messages` umbenennen, muss `URL_FRAGMENTS` im Skript angepasst werden.
- Der Hook greift ausschließlich auf `chat.deepseek.com` — andere DeepSeek-Domains werden bewusst nicht erfasst.

---

## Blockierter Chat (`⚠`)

DeepSeek lehnt das Senden aus **zwei** Gründen ab — beide erkennt das Skript und markiert sie mit `⚠`:

**1. Nachrichtenlimit** (Anzahl der Nachrichten): Server-Fehlercode `MAX_MESSAGE_COUNT_REACHED`,
Anzeige „Nachrichtenlimit erreicht. Bitte starten Sie einen neuen Chat."

**2. Längenbegrenzung** (Kontextstand + Prompt passen nicht mehr ins Fenster): Der Antwortstrom endet mit
`{"type":"error","content":"Längenbegrenzung erreicht. Bitte neuen Chat starten.","finish_reason":"context_length_exceeded"}`.
Die App zeigt dafür zusätzlich am Senden-Button den Tooltip „Längenlimit überschritten. Ihre Nachricht
wird an einen neuen Chat gesendet."

Anzeige in beiden Fällen:

- Badge: `📊 ⚠ 967K / 962K  (101 %)`
- Tooltip (Nachrichtenlimit): `⚠ DeepSeek meldet: Nachrichtenlimit erreicht`
- Tooltip (Längenbegrenzung): `⚠ Längenbegrenzung erreicht — neuer Chat nötig` und
  `Kontext 967K + Prompt ≈ 13K > 962K` (zwei Zeilen, damit nichts umbricht)

Der Zustand wird pro Chat gemerkt (`xdsTokenBadge.fullSessions`, mit `kind: "messages" | "length"`);
ein neuer Chat startet ohne Warnung.

**Wichtig — warum die Warnung „schon bei 94 %" erscheinen kann:** Die Längengrenze gilt für
**Kontextstand + Promptlänge**. Das Badge zeigt aber nur den Kontextstand. Ein langer Prompt
(z. B. ein 20K-Token-Übergabetext) löst die Meldung deshalb bei einem niedrigeren Badge-Wert aus:
945.022 (94,5 %) + 20.000 ≈ 965.000 > 962.000 → abgelehnt, obwohl das Badge 94 % zeigt.
Gemessen: Mit **Mini-Prompt** wird bei 958.918 (95,9 %) noch gesendet, ab 964.693 (96,5 %) nicht mehr.

Das Nachrichtenlimit ist dagegen **unabhängig** von der Tokenzahl — es ändert die Kontextgrenze nicht.

---

## Dynamische Kontextgrenze

DeepSeek meldet das Kontextfenster in **keinem** Datenfeld (die Settings enthalten nur Datei-/History-Limits).
Das Skript verwaltet die Grenze deshalb selbst und passt sie automatisch an:

| Priorität | Quelle | Wie sie entsteht |
|---|---|---|
| 1 | **Manuell** | `localStorage.setItem('xdsTokenBadge.limitOverride', '2000000')` → feste Grenze; `removeItem` gibt sie frei |
| 2 | **Gelernt** | Sobald eine Nachricht den Status `CONTEXT_LENGTH_EXCEEDED` hat, gilt der zuletzt gültige Tokenstand als echte Grenze (funktioniert auch bei Verkleinerung des Fensters) |
| 3 | **Settings** | Nur wenn die App ein Limit **größer** als die Standardgrenze meldet |
| 4 | **Standard** | **962.000 Token** — gemessene Grenze (Kontextfenster 1 Mio. − 38.000 Antwort-Reserve) |

Zusätzlich merkt sich das Skript den **größten je gesehenen Tokenstand** (`xdsTokenBadge.observedMax`) —
**informativ**. Seit v1.2.5 hebt er die Grenze **nicht mehr** an: Ein Stand über der Grenze beweist kein
größeres Fenster, denn die letzte erlaubte Antwort wächst über die Grenze hinaus (gemessen: 984.775 bei
einer Grenze von 962.000 — Senden ist dort abgelehnt).

Der Tooltip nennt immer die benutzte Quelle, z. B.
`Kontext 962.000 · gemessen: 962K (Kontextlimit) · Datei-Limit 890.880` oder
`Kontext 2.000.000 · manuell gesetzt (localStorage)`.

**Grenze der Automatik:** Ein Abgleich mit der DeepSeek-Dokumentation findet nicht statt (das Skript
macht keine externen Requests). Ändert DeepSeek das Fenster, erkennt das Skript das beim ersten
Erreichen der Grenze — bis dahin gilt die zuletzt gelernte bzw. die Standardgrenze.

---

## Datenschutz

Das Skript:
- sendet **keine** Daten irgendwohin
- kontaktiert **keinen** Server
- liest nur die API-Antworten, die der Browser ohnehin empfängt
- merkt sich den letzten Tokenwert je Chat lokal im Browser (`localStorage`, Schlüssel `xdsTokenBadge.sessionTokens`)

Alle Verarbeitung findet ausschließlich lokal im Browser des Nutzers statt.
