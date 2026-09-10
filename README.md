# xDeepSeek Token Badge 🎯

Ein Tampermonkey-Userscript, das den aktuellen **Kontext-Füllstand** des DeepSeek-Chats als schwebendes Badge unten rechts anzeigt — in Echtzeit, ohne Server, ohne Datenverlust.

**Autor:** [immerzu](https://greasyfork.org/de/users/1629833-immerzu)  
**Lizenz:** MIT  
**Plattform:** [GreasyFork](https://greasyfork.org/de)  
**Version:** 1.0.0

---

## Was macht dieses Skript?

DeepSeek hat ein Kontextfenster von **1.000.000 Token**. Sobald dieses Fenster voll ist, wird der älteste Teil der Konversation abgeschnitten — und der Chat „vergisst" frühere Details. Das Problem: DeepSeek zeigt nirgendwo an, **wie voll** das Fenster gerade ist.

Dieses Skript fängt die API-Antworten des DeepSeek-Web-Chats ab, liest das Feld `accumulated_token_usage` daraus und zeigt es als kleines Badge unten rechts an:

```

📊 406.488 / 1M  (40,65 %)

```

Der Nutzer sieht so auf einen Blick, wann er einen neuen Chat starten sollte, um Kontextverlust zu vermeiden.

---

## Features

- 🎯 **Live-Anzeige** des aktuellen Token-Füllstands (absolut + Prozent)
- 🚀 **Null Konfiguration** — installieren, fertig
- 🔒 **Lokal & sicher** — kein Server, keine externen Aufrufe, kein Tracking
- 💡 **Minimal-invasiv** — das Badge hat `pointer-events: none` und stört die Bedienung nicht
- 🎨 **Dezentes Design** — dark glassy badge, passend zum DeepSeek-Look
- 🌐 **Sprachneutral** — Zahlenformat nach Systemsprache (de-DE, en-US, etc.)

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
| Badge zeigt `--` | Noch keine API-Antwort abgefangen — einmal `F5` drücken |
| Badge fehlt komplett | Prüfen, ob Tampermonkey aktiv ist und das Skript in der Liste steht |

---

## Technische Details

- **Hook-Punkte:** `window.fetch` und `XMLHttpRequest.prototype.send`
- **Ziel-Endpunkt:** `*/chat/history_messages`
- **Ausgelesenes Feld:** `data.biz_data.chat_messages[].accumulated_token_usage`
- **Angezeigter Wert:** Maximum der `accumulated_token_usage`-Werte im `chat_messages`-Array
- **Verwendete Tampermonkey-APIs:** keine (`@grant none`)
- **Kontextfenster-Konstante:** 1.000.000 (anpassbar in Zeile `CONTEXT_SIZE`)

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

- Das Badge aktualisiert sich nur, wenn DeepSeek die History lädt — also beim Öffnen/Wechseln eines Chats oder kurz nach dem Senden einer Nachricht. Zwischen diesen Ereignissen bleibt der letzte Wert stehen.
- Bei DeepSeek-Versionen, die den Endpunkt `/history_messages` umbenennen, muss `URL_FRAGMENTS` im Skript angepasst werden.
- Der Hook greift ausschließlich auf `chat.deepseek.com` — andere DeepSeek-Domains werden bewusst nicht erfasst.

---

## Datenschutz

Das Skript:
- sendet **keine** Daten irgendwohin
- kontaktiert **keinen** Server
- liest nur die API-Antworten, die der Browser ohnehin empfängt
- speichert nichts persistent

Alle Verarbeitung findet ausschließlich lokal im Browser des Nutzers statt.
