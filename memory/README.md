# Projektgedächtnis — xDeepSeek Token Badge

Dieser Ordner ist das dauerhafte Gedächtnis des Projekts. **Vor** Arbeiten am Skript lesen,
**nach** Arbeiten ergänzen (neue Erkenntnisse, Fallstricke, offene Punkte).

## Dokumente

| Dokument | Inhalt | Stand |
|---|---|---|
| [`HANDOVER_20260910.md`](HANDOVER_20260910.md) | Ursprüngliches Projektgedächtnis: Auftrag, Skript-Fakten, GF-Veröffentlichung (ID 595207), Sync-Einrichtung, Blocker — plus Nachtrag der zweiten Session. | 2026-09-10 |
| [`ANALYSE-20260910-deepseek-history-cache-und-anzeige.md`](ANALYSE-20260910-deepseek-history-cache-und-anzeige.md) | **Zentrale Analyse:** warum das Badge leer blieb (History-Cache `MERGE`/`REPLACE`, XHR statt fetch), Fix v1.0.3, Realitätsprüfung der Zahl, Kontextgrenze 890.880 + Fix v1.0.4, Codeanker, offene Punkte. | 2026-09-10 |
| [`TESTEN-userscript-deepseek.md`](TESTEN-userscript-deepseek.md) | Rezept, wie eine Änderung am echten DeepSeek-Chat verifiziert wird (Werkzeuge, Befehle, erwartete Checks, Fallstricke). | 2026-09-10 |

## Kurzfassung des aktuellen Stands

- Skript **v1.2.4** ist auf Greasy Fork live (`https://greasyfork.org/de/scripts/595207.json`),
  Quelle ist `main/xdeepseek-token-badge.user.js`, Auto-Sync (periodisch, **kein Webhook**).
- Badge zeigt dreistellig gerundet: `📊 967K / 900K  (107 %)`; Details im **eigenen Tooltip**
  (exakter Wert, Grenze + Quelle + Datei-Limit, Nachlade-Status) — 5 Zeilen ohne Umbrüche (max-width 420 px).
- **Voller Chat:** Meldet DeepSeek „Nachrichtenlimit erreicht" (`MAX_MESSAGE_COUNT_REACHED`), zeigt das
  Badge **⚠** und der Tooltip die Meldung. Das ist ein **Nachrichten-Anzahl-Limit**, unabhängig von der
  Tokenzahl — die Kontextgrenze bleibt dabei unverändert.
- **Kontextgrenze ist lernfähig (v1.2.0):** Priorität Override (`xdsTokenBadge.limitOverride`) →
  gelernt aus Status `CONTEXT_LENGTH_EXCEEDED` (`xdsTokenBadge.limit`) → Settings (nur wenn > 900K) →
  Standard **900.000**. `xdsTokenBadge.observedMax` hebt die Grenze an, wenn der
  Tokenstand sie übersteigt. Der Tooltip nennt immer die Quelle.
- **Kontextgrenze = 900.000 Token — bewusste Setzung (v1.2.4).** Die offizielle Doku nennt für V4
  1 Mio.; der kleinere Wert ist gewünscht. Die Settings-Werte 890.880 sind **Datei-/History-Limits**
  und dürfen nicht als Kontextgrenze dienen.
- **Formatierungsregel:** Die „M"-Schwelle in `formatTokens` ist **fest 1.000.000** — nie an die
  Kontextgrenze koppeln, sonst entsteht „1,1M / 1M" (Fehler aus v1.2.2/v1.2.3).
- Tooltip: Tastendruck lässt ihn stehen (screenshot-fähig), **Mausbewegung blendet ihn aus**,
  Klick fixiert ihn (zweiter Klick/`Escape` löst).
- **Auch geteilte Chats** (`/share/<id>`) werden ausgelesen (`/api/v0/share/content`) — dort gilt der
  Stand zum Zeitpunkt des Teilens.
- **Bedienung:** Badge mit der Maus **verschiebbar** (Position in `localStorage`, Doppelklick setzt
  zurück in die Standardecke). Der Tooltip erscheint bei Hover, **bleibt bei Tastendruck stehen**
  (screenshot-fähig) und wird per Klick fixiert (`Escape`/Klick löst ihn).
- Bekannte Grenzen: Maximum über alle Nachrichten (nicht aktiver Zweig), Datei-Tokens nicht enthalten,
  Wert wird nach jeder Antwort nachgeladen (bis zu 35 s Backoff) — Details in der Analyse.
- **Verlässlichkeit:** Der Badge-Wert ist der Serverwert (`accumulated_token_usage`). Im Chat
  auftauchende Zeilen wie `[ 76 % von 100 % gefüllt]` sind **Modell-Selbstauskünfte** im Denkblock
  (Feld `fragments`) und messen nichts — sie lagen im geprüften Fall um Faktor ~3,7 zu hoch.
- Nachrichtentexte liegen in `fragments`; die API kennt kein `content`/`reasoning_content`.
- Versionskopien liegen in `!Ausgabe/` (gitignored), Namensschema
  `xdeepseek-token-badge-v<version>.user.js`.
