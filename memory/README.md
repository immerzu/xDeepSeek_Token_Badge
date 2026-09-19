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

- **OFFEN (16.09.2026): Greasy-Fork-Sync für v1.2.6/v1.2.7 steht aus** — GF lieferte beim Versuch HTTP 502/503 (Störung). GitHub ist aktuell (`4a1b39b`), GF zieht periodisch; sonst `gf-admin-sync.mjs` erneut auslösen und die Version prüfen.`n- Skript **v1.2.7** (Kontextgrenze 962.000, Prozentangabe ab 90 % rot) — Stand der Veröffentlichung siehe unten; v1.2.5 war am
  16.09.2026 auf Greasy Fork live (`version 1.2.5`, `code_updated 16.09.2026 10:47`, Commit `ba0175d`
  + `gf-admin-sync.mjs`), wurde aber durch die Feinmessung der Kante überholt.
  Quelle ist `main/xdeepseek-token-badge.user.js`, Auto-Sync (periodisch, **kein Webhook**).
- Badge zeigt dreistellig gerundet: `📊 967K / 962K  (101 %)`; **ab 90 % Füllstand ist die Prozentangabe rot** (`PCT_WARN`, `#ff5252`); Details im **eigenen Tooltip**
  (exakter Wert, Grenze + Quelle + Datei-Limit, Nachlade-Status).
- **Blockierter Chat (⚠)** — DeepSeek lehnt aus **zwei** Gründen ab:
  1. **Nachrichtenlimit** (Anzahl): `MAX_MESSAGE_COUNT_REACHED` / „Nachrichtenlimit erreicht…"
  2. **Längenbegrenzung** (Kontextstand + Prompt > Fenster): `finish_reason: context_length_exceeded`,
     DE „Längenbegrenzung erreicht. Bitte neuen Chat starten." — seit **v1.2.5** erkannt, inklusive
     geschätzter Promptgröße im Tooltip (seit **v1.2.6** mit dem gemessenen Faktor **3,6 Zeichen/Token**
     statt 3,0).
  Merker je Chat in `xdsTokenBadge.fullSessions` mit `kind: "messages" | "length"`.
  Die Kontextgrenze bleibt in beiden Fällen unverändert.
- **Kontextgrenze ist lernfähig (v1.2.0):** Priorität Override (`xdsTokenBadge.limitOverride`) →
  gelernt aus Status `CONTEXT_LENGTH_EXCEEDED` (`xdsTokenBadge.limit`) → Settings (nur wenn > 962K) →
  Standard **962.000**. `xdsTokenBadge.observedMax` merkt den Höchstwert nur noch **informativ** —
  seit v1.2.5 hebt er die Grenze **nicht mehr** an (ein Stand über der Grenze entsteht, weil die letzte
  erlaubte Antwort darüber hinaus wächst). Alte „aus Beobachtung"-Lerngrenzen werden verworfen.
- **Kontextgrenze = 962.000 Token — GEMESSEN (v1.2.6).** Senden wird abgelehnt, sobald
  **Kontextstand + Promptlänge** 962.000 übersteigt; das Fenster ist 1.000.000 (Doku für V4 „1M"),
  die Differenz ist die 38.000-Token-Reserve für die Antwort.
  **Feinmessung der Kante** (Chat `b934bbb2…`): 961.233 + 450 Tok. ✅ (961.683) ·
  961.703 + 230 Tok. ✅ (**961.933** = oberste bestätigte Annahme) ·
  961.233 + 916 Tok. ❌ (**962.149** = unterste bestätigte Ablehnung).
  Ältere Stützstellen: 945.022 ✅ · 958.918 ✅ · 959.813 ✅ · 958.963 + ~13.350 ❌ ·
  964.693 ❌ · 966.769 ❌ · 984.775 ❌.
  **Deshalb kann die Meldung „schon bei 94 %" erscheinen:** Das Badge zeigt nur den Kontextstand,
  der Prompt zählt aber mit (945.022 + 20.000 ≈ 965.000 > 962.000). Bei 94,5 % mit **kurzem** Prompt
  wird anstandslos gesendet. Die Settings-Werte 890.880 sind **Datei-/History-Limits** und dürfen
  nicht als Kontextgrenze dienen.
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
