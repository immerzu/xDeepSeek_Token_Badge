# xDeepSeek Token Badge 🎯

Ein Tampermonkey-Userscript, das den aktuellen **Kontext-Füllstand** des DeepSeek-Chats als schwebendes Badge unten rechts anzeigt — in Echtzeit, ohne Server, ohne Datenverlust.

**Autor:** [immerzu](https://greasyfork.org/de/users/1629833-immerzu)  
**Lizenz:** MIT  
**Plattform:** [GreasyFork](https://greasyfork.org/de)  
**Version:** 1.0.4

---

## Was macht dieses Skript?

DeepSeek schneidet den ältesten Teil der Konversation ab, sobald der Kontext voll ist — der Chat „vergisst" frühere Details. Das Problem: DeepSeek zeigt nirgendwo an, **wie voll** das Fenster gerade ist. Die Grenze liest dieses Skript direkt aus den DeepSeek-Einstellungen (derzeit **890.880 Token**) statt sie anzunehmen.

Dieses Skript fängt die API-Antworten des DeepSeek-Web-Chats ab, liest das Feld `accumulated_token_usage` daraus und zeigt es als kleines Badge unten rechts an:

```

📊 406K / 891K  (46 %)

```

Der Nutzer sieht so auf einen Blick, wann er einen neuen Chat starten sollte, um Kontextverlust zu vermeiden.

---

## Features

- 🎯 **Live-Anzeige** des aktuellen Token-Füllstands (dreistellig gerundet + Prozent, exakt im Tooltip)
- 📐 **Korrekte Grenze** — der Nenner kommt aus den DeepSeek-Einstellungen, nicht aus einer Annahme
- 🚀 **Null Konfiguration** — installieren, fertig
- 🔒 **Lokal & sicher** — kein Server, keine externen Aufrufe, kein Tracking
- 💡 **Minimal-invasiv** — das Badge hat `pointer-events: none` und stört die Bedienung nicht
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
| Badge ist sichtbar | Wert wird automatisch beim Chat-Wechsel und nach dem Senden aktualisiert |
| Badge zeigt `~406K / 891K  (46 %)` | Letzter bekannter Wert für diesen Chat — der Server lieferte nur ein Delta; der aktuelle Wert wird nachgeladen |
| Badge zeigt `--` | Noch keine API-Antwort abgefangen — einmal `F5` drücken |
| Badge fehlt komplett | Prüfen, ob Tampermonkey aktiv ist und das Skript in der Liste steht |

---

## Technische Details

- **Hook-Punkte:** `XMLHttpRequest.prototype.send` (+ `setRequestHeader`) und `window.fetch`
- **Ziel-Endpunkt:** `*/chat/history_messages` (Tokenstand), `*/client/settings` (Kontextgrenze)
- **Ausgelesenes Feld:** `data.biz_data.chat_messages[].accumulated_token_usage`
- **Angezeigter Wert:** Maximum der `accumulated_token_usage`-Werte; bei `cache_control: MERGE` wird die History einmalig ohne Cache-Parameter nachgeladen
- **Kontextgrenze:** aus `model_configs[].file_feature.token_limit` bzw. `normal_history_and_file_token_limit` (Rückfall: 890.880)
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

- Das Badge aktualisiert sich nur, wenn DeepSeek die History lädt — also beim Öffnen/Wechseln eines Chats, nach einem Reload oder einmaligem Nachladen. Zwischen diesen Ereignissen bleibt der letzte Wert stehen.
- Angezeigt werden die History-/Kontext-Tokens der Unterhaltung; Datei-Tokens zählen nicht mit.
- In verzweigten Chats (Alternativ-Antworten) kann das Maximum über alle Nachrichten höher liegen als der aktive Zweig.
- Bei DeepSeek-Versionen, die den Endpunkt `/history_messages` umbenennen, muss `URL_FRAGMENTS` im Skript angepasst werden.
- Der Hook greift ausschließlich auf `chat.deepseek.com` — andere DeepSeek-Domains werden bewusst nicht erfasst.

---

## Datenschutz

Das Skript:
- sendet **keine** Daten irgendwohin
- kontaktiert **keinen** Server
- liest nur die API-Antworten, die der Browser ohnehin empfängt
- merkt sich den letzten Tokenwert je Chat lokal im Browser (`localStorage`, Schlüssel `xdsTokenBadge.sessionTokens`)

Alle Verarbeitung findet ausschließlich lokal im Browser des Nutzers statt.
