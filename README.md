# xDeepSeek Token Badge 🎯

Ein Tampermonkey-Userscript, das den aktuellen **Kontext-Füllstand** des DeepSeek-Chats als schwebendes Badge unten rechts anzeigt — in Echtzeit, ohne Server, ohne Datenverlust.

**Autor:** [immerzu](https://greasyfork.org/de/users/1629833-immerzu)  
**Lizenz:** MIT  
**Plattform:** [GreasyFork](https://greasyfork.org/de)  
**Version:** 1.0.4

---

## Was macht dieses Skript?

DeepSeek schneidet den ältesten Teil der Konversation ab, sobald der Kontext voll ist — der Chat „vergisst" frühere Details. Das Problem: DeepSeek zeigt nirgendwo an, **wie voll** das Fenster gerade ist. Das Skript rechnet deshalb gegen das **Kontextfenster von 1.000.000 Token** (DeepSeek V4, offizieller „1M-Standard").

Dieses Skript fängt die API-Antworten des DeepSeek-Web-Chats ab, liest das Feld `accumulated_token_usage` daraus und zeigt es als kleines Badge unten rechts an:

```

📊 406K / 891K  (46 %)

```

Der Nutzer sieht so auf einen Blick, wann er einen neuen Chat starten sollte, um Kontextverlust zu vermeiden.

---

## Features

- 🎯 **Live-Anzeige** des aktuellen Token-Füllstands (dreistellig gerundet + Prozent, exakt im Tooltip)
- 📐 **Passende Grenze** — gerechnet wird gegen das V4-Kontextfenster (1 Mio. Token); das Datei-/History-Limit der App (890.880) zeigt der Tooltip zusätzlich
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
- **Kontextfenster:** **1.000.000 Token** (DeepSeek V4, offizieller „1M-Standard"; <https://api-docs.deepseek.com/news/news260424/>). Die Client-Settings liefern nur Datei-/History-Limits (`file_feature.token_limit`, `normal_history_and_file_token_limit` = 890.880) — sie werden informativ im Tooltip gezeigt und nur übernommen, wenn sie größer als das Kontextfenster sind.
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

## Voller Chat (`⚠`)

Ist das **Nachrichtenlimit** erreicht, lehnt DeepSeek das Senden ab (`MAX_MESSAGE_COUNT_REACHED`,
Anzeige: „Nachrichtenlimit erreicht. Bitte starten Sie einen neuen Chat."). Das Skript erkennt den
Fehlercode **und** den Hinweistext und zeigt:

- Badge: `📊 ⚠ 967K / 1M  (97 %)`
- Tooltip: `⚠ DeepSeek meldet: Nachrichtenlimit erreicht`

Der Zustand wird pro Chat gemerkt (`xdsTokenBadge.fullSessions`); ein neuer Chat startet ohne Warnung.

**Wichtig:** Das Nachrichtenlimit ist **unabhängig** von der Tokenzahl. Deshalb ändert es die
Kontextgrenze nicht — ein Chat kann bei 97 % Tokens voll sein oder bei 40 %, je nach Nachrichtenanzahl.

---

## Dynamische Kontextgrenze

DeepSeek meldet das Kontextfenster in **keinem** Datenfeld (die Settings enthalten nur Datei-/History-Limits).
Das Skript verwaltet die Grenze deshalb selbst und passt sie automatisch an:

| Priorität | Quelle | Wie sie entsteht |
|---|---|---|
| 1 | **Manuell** | `localStorage.setItem('xdsTokenBadge.limitOverride', '2000000')` → feste Grenze; `removeItem` gibt sie frei |
| 2 | **Gelernt** | Sobald eine Nachricht den Status `CONTEXT_LENGTH_EXCEEDED` hat, gilt der zuletzt gültige Tokenstand als echte Grenze (funktioniert auch bei Verkleinerung des Fensters) |
| 3 | **Settings** | Nur wenn die App ein Limit **größer** als 1M meldet (dann ist es offensichtlich das Kontextfenster) |
| 4 | **Standard** | 1.000.000 Token — DeepSeek V4, offizieller „1M-Standard" |

Zusätzlich merkt sich das Skript den **größten je gesehenen Tokenstand** (`xdsTokenBadge.observedMax`).
Übersteigt er das angenommene Fenster, wird die Grenze automatisch auf den nächsten 100k-Schritt
angehoben (untere Schranke), damit die Anzeige nicht dauerhaft über 100 % läuft.

Der Tooltip nennt immer die benutzte Quelle, z. B.
`Kontext 1.000.000 · DeepSeek V4 (1M) · Datei-Limit 890.880` oder
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
