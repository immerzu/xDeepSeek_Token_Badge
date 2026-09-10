Zeigt den aktuellen Kontext-Füllstand des DeepSeek-Chats als schwebendes Badge an — kompakt, live und ohne Server.

DeepSeek hat ein Kontextfenster von bis zu 1.000.000 Token. Sobald dieses Fenster voll ist, schneidet DeepSeek die ältesten Teile der Konversation ab: Der Chat „vergisst" frühere Details, ohne dass man es merkt. DeepSeek zeigt nirgends an, wie voll der Kontext gerade ist.

Dieses Skript liest die ohnehin übertragene `accumulated_token_usage` aus den Chat-History-Antworten und zeigt sie als Badge unten rechts an:

```
📊 406.488 / 1M  (40,65 %)
```

So siehst du auf einen Blick, ob du bald einen neuen Chat starten solltest.

**Features**

- Live-Anzeige — Token absolut + Prozent
- Null Konfiguration — installieren und vergessen
- 100 % lokal — kein Server, keine externen Aufrufe, kein Tracking
- Dezentes Design — schwebendes Badge, stört die Bedienung nicht (`pointer-events: none`)
- Sprachneutral — Zahlen werden nach Systemsprache formatiert (de-DE: `406.488`, en-US: `406,488`)

**Bedienung**

| Anzeige | Bedeutung |
| --- | --- |
| `📊 406.488 / 1M  (40,65 %)` | Aktueller Füllstand — alles in Ordnung |
| `📊 950.000 / 1M  (95,00 %)` | Kontext fast voll — neuen Chat starten empfohlen |
| `📊 --` | Noch keine API-Antwort abgefangen — einmal `F5` drücken |

Das Badge aktualisiert sich automatisch beim Chat-Wechsel und kurz nach dem Senden einer Nachricht.

**Bekannte Einschränkungen**

- Zwischen zwei History-Ladevorgängen zeigt das Badge den zuletzt empfangenen Wert.
- Bei DeepSeek-Versionen mit geändertem API-Endpunkt muss das Skript angepasst werden.

**Datenschutz**

Das Skript sendet keine Daten irgendwohin. Es liest ausschließlich die API-Antworten, die dein Browser ohnehin empfängt, und verarbeitet sie lokal. Keine Persistenz, kein Tracking, keine externen Requests.

Показывает текущий уровень заполнения контекстного окна в веб-чате DeepSeek в виде плавающего значка — компактно, в реальном времени и без сервера.

Контекстное окно DeepSeek вмещает до 1 000 000 токенов. Когда оно заполняется, DeepSeek отбрасывает самые старые части переписки: чат «забывает» прежние детали, и это происходит незаметно. При этом DeepSeek нигде не показывает, насколько контекст уже заполнен.

Скрипт читает поле `accumulated_token_usage`, которое и так передаётся в ответах истории чата, и показывает его в виде значка в правом нижнем углу:

```
📊 406.488 / 1M  (40,65 %)
```

Так вы сразу видите, когда стоит начать новый чат.

**Возможности**

- Показ в реальном времени — токены в абсолюте и в процентах
- Без настройки — установить и забыть
- 100 % локально — без сервера, без внешних запросов, без отслеживания
- Ненавязчивый дизайн — плавающий значок не мешает работе (`pointer-events: none`)
- Нейтральность к языку — числа форматируются по системной локали (de-DE: `406.488`, en-US: `406,488`)

**Управление**

| Показание | Значение |
| --- | --- |
| `📊 406.488 / 1M  (40,65 %)` | Текущее заполнение — всё в порядке |
| `📊 950.000 / 1M  (95,00 %)` | Контекст почти полон — рекомендуется начать новый чат |
| `📊 --` | Ответ API ещё не перехвачен — нажмите `F5` |

Значок обновляется автоматически при переключении чата и вскоре после отправки сообщения.

**Известные ограничения**

- Между загрузками истории значок показывает последнее полученное значение.
- В версиях DeepSeek с изменённой конечной точкой API скрипт требует правки.

**Конфиденциальность**

Скрипт никуда не отправляет данные. Он читает только те ответы API, которые ваш браузер и так получает, и обрабатывает их локально. Без хранения, без отслеживания, без внешних запросов.

Shows the current context window usage of the DeepSeek web chat as a floating badge — compact, live and serverless.

DeepSeek has a context window of up to 1,000,000 tokens. Once that window is full, DeepSeek truncates the oldest parts of the conversation: the chat "forgets" earlier details without you noticing. DeepSeek never shows how full the context currently is.

This script reads the `accumulated_token_usage` field that is transmitted anyway in the chat history responses and displays it as a badge in the bottom right corner:

```
📊 406.488 / 1M  (40,65 %)
```

That way you can see at a glance when it is time to start a new chat.

**Features**

- Live display — tokens in absolute numbers and percent
- Zero configuration — install and forget
- 100 % local — no server, no external calls, no tracking
- Unobtrusive design — floating badge that does not interfere (`pointer-events: none`)
- Language neutral — numbers are formatted according to the system locale (de-DE: `406.488`, en-US: `406,488`)

**Usage**

| Display | Meaning |
| --- | --- |
| `📊 406.488 / 1M  (40,65 %)` | Current fill level — all good |
| `📊 950.000 / 1M  (95,00 %)` | Context nearly full — starting a new chat is recommended |
| `📊 --` | No API response intercepted yet — press `F5` once |

The badge updates automatically when you switch chats and shortly after sending a message.

**Known limitations**

- Between two history loads the badge keeps showing the last value it received.
- On DeepSeek versions with a changed API endpoint the script needs adjusting.

**Privacy**

The script does not send any data anywhere. It only reads the API responses your browser receives anyway and processes them locally. No persistence, no tracking, no external requests.
