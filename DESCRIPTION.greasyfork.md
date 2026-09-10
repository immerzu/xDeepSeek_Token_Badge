# xDeepSeek Token Badge

Zeigt den aktuellen Kontext-Füllstand des DeepSeek-Chats als schwebendes Badge an — kompakt, live und ohne Server.

## Was macht dieses Skript?

DeepSeek hat ein Kontextfenster von **bis zu 1.000.000 Token**. Sobald dieses Fenster voll ist, schneidet DeepSeek die ältesten Teile der Konversation ab. Der Chat „vergisst" dann frühere Details — ohne dass man es merkt.

**Das Problem:** DeepSeek zeigt nirgends an, wie voll der Kontext gerade ist.

**Die Lösung:** Dieses Skript liest die ohnehin übertragene `accumulated_token_usage` aus den Chat-History-Antworten und zeigt sie als Badge unten rechts an:

```

📊 406.488 / 1M  (40,65 %)

```

So siehst du auf einen Blick, ob du bald einen neuen Chat starten solltest.

## Features

- 🎯 **Live-Anzeige** — Token absolut + Prozent
- 🚀 **Null Konfiguration** — installieren und vergessen
- 🔒 **100 % lokal** — kein Server, keine externen Aufrufe, kein Tracking
- 🎨 **Dezentes Design** — schwebendes dark glassy Badge, stört die Bedienung nicht
- 🌐 **Sprachneutral** — Zahlen werden nach Systemsprache formatiert (de-DE: `406.488`, en-US: `406,488`)

## Installation

1. [Tampermonkey](https://www.tampermonkey.net/) installieren (falls noch nicht vorhanden)
2. Auf dieser Seite **„Install this script"** klicken
3. `https://chat.deepseek.com` mit `F5` neu laden

## Bedienung

| Anzeige | Bedeutung |
| --- | --- |
| `📊 406.488 / 1M  (40,65 %)` | Aktueller Füllstand — alles in Ordnung |
| `📊 950.000 / 1M  (95,00 %)` | Kontext fast voll — neuen Chat starten empfohlen |
| `📊 --` | Noch keine API-Antwort abgefangen — einmal `F5` drücken |

Das Badge aktualisiert sich automatisch beim Chat-Wechsel und kurz nach dem Senden einer Nachricht.

## Kompatibilität

- **Browser:** Chrome, Firefox, Edge, Safari, Brave, Opera
- **Add-on:** [Tampermonkey](https://www.tampermonkey.net/) (empfohlen), alternativ Violentmonkey
- **DeepSeek:** Web-Chat unter `chat.deepseek.com`

## Bekannte Einschränkungen

- Das Badge aktualisiert sich zwischen zwei History-Ladevorgängen nicht von selbst — es zeigt den zuletzt empfangenen Wert.
- Bei DeepSeek-Versionen mit geändertem API-Endpunkt muss das Skript angepasst werden.

## Datenschutz

Das Skript sendet **keine Daten** irgendwohin. Es liest ausschließlich die API-Antworten, die dein Browser ohnehin empfängt, und verarbeitet sie lokal. Keine Persistenz, kein Tracking, keine externen Requests.

## Lizenz

MIT — frei nutzbar, anpassbar, weitergebbar.
