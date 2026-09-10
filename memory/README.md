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

- Skript **v1.0.4** ist auf Greasy Fork live (`https://greasyfork.org/de/scripts/595207.json`),
  Quelle ist `main/xdeepseek-token-badge.user.js`, Auto-Sync (periodisch, **kein Webhook**).
- Badge zeigt dreistellig gerundet: `📊 217K / 891K  (24 %)`, exakte Werte im Tooltip.
- Bekannte Grenzen: Maximum über alle Nachrichten (nicht aktiver Zweig), Datei-Tokens nicht enthalten,
  Wert nicht live zwischen zwei History-Ladevorgängen — Details in der Analyse.
- **Verlässlichkeit:** Der Badge-Wert ist der Serverwert (`accumulated_token_usage`). Im Chat
  auftauchende Zeilen wie `[ 76 % von 100 % gefüllt]` sind **Modell-Selbstauskünfte** im Denkblock
  (Feld `fragments`) und messen nichts — sie lagen im geprüften Fall um Faktor ~3,7 zu hoch.
- Nachrichtentexte liegen in `fragments`; die API kennt kein `content`/`reasoning_content`.
- Versionskopien liegen in `!Ausgabe/` (gitignored), Namensschema
  `xdeepseek-token-badge-v<version>.user.js`.
