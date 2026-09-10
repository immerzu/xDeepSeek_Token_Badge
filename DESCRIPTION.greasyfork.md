# xDeepSeek Token Badge

Zeigt den aktuellen Kontext-Füllstand des DeepSeek-Chats als schwebendes Badge an — kompakt, live und ohne Server.

## Was macht dieses Skript?

DeepSeek schneidet die ältesten Teile der Konversation ab, sobald der Kontext voll ist. Der Chat „vergisst" dann frühere Details — ohne dass man es merkt. Die Grenze liest dieses Skript direkt aus den DeepSeek-Einstellungen (derzeit **890.880 Token**), statt sie anzunehmen.

**Das Problem:** DeepSeek zeigt nirgends an, wie voll der Kontext gerade ist.

**Die Lösung:** Dieses Skript liest die ohnehin übertragene `accumulated_token_usage` aus den Chat-History-Antworten und zeigt sie als Badge unten rechts an:

```

📊 406K / 891K  (46 %)

```

So siehst du auf einen Blick, ob du bald einen neuen Chat starten solltest.

## Features

- 🎯 **Live-Anzeige** — dreistellig gerundete Token (`406K`, `891K`) + Prozent, exakte Werte im Tooltip
- 📐 **Korrekte Grenze** — der Nenner kommt aus den DeepSeek-Einstellungen, nicht aus einer Annahme
- 🚀 **Null Konfiguration** — installieren und vergessen
- 🔒 **100 % lokal** — kein Server, keine externen Aufrufe, kein Tracking
- 🎨 **Dezentes Design** — schwebendes dark glassy Badge, stört die Bedienung nicht
- ♻️ **Reload-fest** — merkt sich den letzten Wert je Chat (mit `~` markiert, bis der Serverwert kommt)

## Installation

1. [Tampermonkey](https://www.tampermonkey.net/) installieren (falls noch nicht vorhanden)
2. Auf dieser Seite **„Install this script"** klicken
3. `https://chat.deepseek.com` mit `F5` neu laden

## Bedienung

| Anzeige | Bedeutung |
| --- | --- |
| `📊 406K / 891K  (46 %)` | Aktueller Füllstand — alles in Ordnung |
| `📊 860K / 891K  (97 %)` | Kontext fast voll — neuen Chat starten empfohlen |
| `📊 ~406K / 891K  (46 %)` | Letzter bekannter Wert (Server lieferte nur ein Delta) |
| `📊 --` | Noch keine API-Antwort abgefangen — einmal `F5` drücken |

Das Badge aktualisiert sich beim Chat-Wechsel, nach dem Senden einer Nachricht und nach einem Reload.

## Kompatibilität

- **Browser:** Chrome, Firefox, Edge, Safari, Brave, Opera
- **Add-on:** [Tampermonkey](https://www.tampermonkey.net/) (empfohlen), alternativ Violentmonkey
- **DeepSeek:** Web-Chat unter `chat.deepseek.com`

## Bekannte Einschränkungen

- Das Badge lädt den Tokenstand nach **jeder Antwort** automatisch nach (sowie bei Chat-Wechsel und Reload). Zwischen zwei Antworten zeigt es den zuletzt empfangenen Wert.
- Angezeigt werden die History-/Kontext-Tokens der Unterhaltung; Datei-Tokens zählen nicht mit.
- In verzweigten Chats (Alternativ-Antworten) kann das Maximum über alle Nachrichten höher liegen als der aktive Zweig.
- Bei DeepSeek-Versionen mit geändertem API-Endpunkt muss das Skript angepasst werden.

## Datenschutz

Das Skript sendet **keine Daten** irgendwohin. Es liest ausschließlich die API-Antworten, die dein Browser ohnehin empfängt, und verarbeitet sie lokal. Kein Tracking, keine externen Requests. Der letzte Wert je Chat wird lokal im Browser (`localStorage`) gemerkt.

## Lizenz

MIT — frei nutzbar, anpassbar, weitergebbar.
