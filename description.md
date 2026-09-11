Zeigt den aktuellen Kontext-Füllstand des DeepSeek-Chats als schwebendes Badge an — kompakt, live und ohne Server.

DeepSeek schneidet die ältesten Teile der Konversation ab, sobald der Kontext voll ist: Der Chat „vergisst" frühere Details, ohne dass man es merkt. DeepSeek zeigt nirgends an, wie voll der Kontext gerade ist — die Grenze (derzeit 890.880 Token) liest dieses Skript direkt aus den DeepSeek-Einstellungen.

Es liest die ohnehin übertragene `accumulated_token_usage` aus den Chat-History-Antworten und zeigt sie als Badge unten rechts an:

```
📊 406K / 891K  (46 %)
```

So siehst du auf einen Blick, ob du bald einen neuen Chat starten solltest.

**Features**

- Live-Anzeige — dreistellig gerundete Token (`406K`, `891K`) plus Prozent, exakte Werte im Tooltip
- Korrekte Grenze — der Nenner kommt aus den DeepSeek-Einstellungen, nicht aus einer Annahme
- Null Konfiguration — installieren und vergessen
- 100 % lokal — kein Server, keine externen Aufrufe, kein Tracking
- Verschiebbar — das Badge lässt sich mit der Maus an jede Stelle ziehen; die Position bleibt erhalten, Doppelklick setzt es zurück
- Detailanzeige — Tooltip mit exaktem Wert, Kontextgrenze und Nachlade-Status; er bleibt beim Drücken von Tasten stehen (screenshot-freundlich) und lässt sich per Klick fixieren
- Reload-fest — merkt sich den letzten Wert je Chat (mit `~` markiert, bis der Serverwert kommt)

**Bedienung**

| Anzeige | Bedeutung |
| --- | --- |
| `📊 406K / 891K  (46 %)` | Aktueller Füllstand — alles in Ordnung |
| `📊 860K / 891K  (97 %)` | Kontext fast voll — neuen Chat starten empfohlen |
| `📊 ~406K / 891K  (46 %)` | Letzter bekannter Wert (Server lieferte nur ein Delta) |
| `📊 --` | Noch keine API-Antwort abgefangen — einmal `F5` drücken |

Das Badge aktualisiert sich beim Chat-Wechsel, nach dem Senden einer Nachricht und nach einem Reload. Es lässt sich mit der Maus verschieben (Position bleibt erhalten, Doppelklick setzt es zurück).

**Bekannte Einschränkungen**

- Zwischen zwei Antworten zeigt das Badge den zuletzt empfangenen Wert; nach jeder Antwort wird er automatisch nachgeladen (ohne Reload).
- Angezeigt werden die History-/Kontext-Tokens der Unterhaltung; Datei-Tokens zählen nicht mit.
- In verzweigten Chats (Alternativ-Antworten) kann das Maximum über alle Nachrichten höher liegen als der aktive Zweig.
- Bei DeepSeek-Versionen mit geändertem API-Endpunkt muss das Skript angepasst werden.

**Datenschutz**

Das Skript sendet keine Daten irgendwohin. Es liest ausschließlich die API-Antworten, die dein Browser ohnehin empfängt, und verarbeitet sie lokal. Kein Tracking, keine externen Requests. Der letzte Wert je Chat wird lokal im Browser (localStorage) gemerkt.

Показывает текущий уровень заполнения контекстного окна в веб-чате DeepSeek в виде плавающего значка — компактно, в реальном времени и без сервера.

DeepSeek отбрасывает самые старые части переписки, когда контекст заполнен: чат «забывает» прежние детали, и это происходит незаметно. При этом DeepSeek нигде не показывает, насколько контекст уже заполнен — границу (сейчас 890 880 токенов) скрипт читает прямо из настроек DeepSeek.

Скрипт читает поле `accumulated_token_usage`, которое и так передаётся в ответах истории чата, и показывает его в виде значка в правом нижнем углу:

```
📊 406K / 891K  (46 %)
```

Так вы сразу видите, когда стоит начать новый чат.

**Возможности**

- Показ в реальном времени — токены, округлённые до трёх знаков (`406K`, `891K`), и проценты; точные значения в подсказке
- Верная граница — знаменатель берётся из настроек DeepSeek, а не из предположения
- Без настройки — установить и забыть
- 100 % локально — без сервера, без внешних запросов, без отслеживания
- Перетаскивание — значок можно перетащить мышью в любое место; положение сохраняется, двойной щелчок возвращает его назад
- Подробная информация — подсказка с точным значением, границей контекста и статусом обновления; не исчезает при нажатии клавиш (удобно для скриншотов), фиксируется щелчком
- Устойчивость к перезагрузке — последнее значение по каждому чату запоминается (помечается `~`, пока не придёт значение с сервера)

**Управление**

| Показание | Значение |
| --- | --- |
| `📊 406K / 891K  (46 %)` | Текущее заполнение — всё в порядке |
| `📊 860K / 891K  (97 %)` | Контекст почти полон — рекомендуется начать новый чат |
| `📊 ~406K / 891K  (46 %)` | Последнее известное значение (сервер прислал только дельту) |
| `📊 --` | Ответ API ещё не перехвачен — нажмите `F5` |

Значок обновляется при переключении чата, после отправки сообщения и после перезагрузки.

**Известные ограничения**

- Между двумя ответами значок показывает последнее полученное значение; после каждого ответа оно обновляется автоматически (без перезагрузки).
- Показываются токены истории/контекста переписки; токены файлов не учитываются.
- В ветвящихся чатах (альтернативные ответы) максимум по всем сообщениям может быть выше активной ветви.
- В версиях DeepSeek с изменённой конечной точкой API скрипт требует правки.

**Конфиденциальность**

Скрипт никуда не отправляет данные. Он читает только те ответы API, которые ваш браузер и так получает, и обрабатывает их локально. Без отслеживания, без внешних запросов. Последнее значение по каждому чату сохраняется локально в браузере (localStorage).

Shows the current context window usage of the DeepSeek web chat as a floating badge — compact, live and serverless.

DeepSeek truncates the oldest parts of the conversation once the context is full: the chat "forgets" earlier details without you noticing. DeepSeek never shows how full the context currently is — the limit (currently 890,880 tokens) is read straight from DeepSeek's own settings by this script.

This script reads the `accumulated_token_usage` field that is transmitted anyway in the chat history responses and displays it as a badge in the bottom right corner:

```
📊 406K / 891K  (46 %)
```

That way you can see at a glance when it is time to start a new chat.

**Features**

- Live display — tokens rounded to three digits (`406K`, `891K`) plus percent, exact values in the tooltip
- Correct limit — the denominator comes from DeepSeek's settings, not from an assumption
- Zero configuration — install and forget
- 100 % local — no server, no external calls, no tracking
- Draggable — the badge can be dragged anywhere with the mouse; the position is remembered, a double-click moves it back
- Details on demand — tooltip with the exact value, context limit and refresh status; it stays visible while you press keys (screenshot-friendly) and can be pinned by clicking
- Reload-proof — remembers the last value per chat (marked `~` until the server value arrives)

**Usage**

| Display | Meaning |
| --- | --- |
| `📊 406K / 891K  (46 %)` | Current fill level — all good |
| `📊 860K / 891K  (97 %)` | Context nearly full — starting a new chat is recommended |
| `📊 ~406K / 891K  (46 %)` | Last known value (server sent only a delta) |
| `📊 --` | No API response intercepted yet — press `F5` once |

The badge updates when you switch chats, after sending a message and after a reload.

**Known limitations**

- Between two answers the badge keeps showing the last value it received; after every answer it is refreshed automatically (no reload needed).
- It shows the history/context tokens of the conversation; file tokens are not included.
- In branched chats (alternative answers) the maximum across all messages can be higher than the active branch.
- On DeepSeek versions with a changed API endpoint the script needs adjusting.

**Privacy**

The script does not send any data anywhere. It only reads the API responses your browser receives anyway and processes them locally. No tracking, no external requests. The last value per chat is kept locally in your browser (localStorage).
