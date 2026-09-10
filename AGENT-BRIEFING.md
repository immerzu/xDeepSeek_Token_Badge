# Briefing für den veröffentlichenden Agenten

Dieses Dokument fasst zusammen, was der andere Agent wissen muss, um das Skript auf GreasyFork zu veröffentlichen. Es ist so geschrieben, dass es ohne den ursprünglichen Kontext verständlich ist.

---

## Auftrag

Das Userscript `xdeepseek-token-badge.user.js` aus diesem Paket soll auf **GreasyFork** unter dem Konto `immerzu` (https://greasyfork.org/de/users/1629833-immerzu) veröffentlicht werden.

---

## Kurzbeschreibung des Skripts

- **Zweck:** Zeigt den aktuellen Kontext-Füllstand des DeepSeek-Web-Chats als schwebendes Badge an.
- **Technik:** Tampermonkey-Userscript, hookt `window.fetch` und `XMLHttpRequest.prototype.send`, liest `accumulated_token_usage` aus `/chat/history_messages`.
- **Zielgruppe:** DeepSeek-Nutzer, die wissen wollen, wann ihr Kontextfenster voll wird.
- **Umfang:** ~170 Zeilen JavaScript, keine externen Abhängigkeiten.

---

## Was hochgeladen werden soll

**Genau eine Datei:**

```

xdeepseek-token-badge.user.js

```

Diese Datei wird **vollständig** (inklusive des `// ==UserScript==`-Headers) in den GreasyFork-Editor kopiert.

---

## Was in die Beschreibung kommt

Der Inhalt von `DESCRIPTION.greasyfork.md` wird ins Feld **„Description"** kopiert. Er enthält Markdown mit Tabellen und Codeblöcken — GreasyFork rendert das korrekt.

Alternativ kann der kürzere Text aus dem `@description`-Tag des Skriptkopfs genutzt werden:

> Zeigt den aktuellen Kontext-Füllstand (Token) als schwebendes Badge im DeepSeek-Chat an.

---

## Empfohlene Formular-Werte

| Feld | Wert |
| --- | --- |
| Name | `xDeepSeek Token Badge` (automatisch aus `@name` gezogen) |
| Language | `Deutsch` |
| Script Type | `Public` |
| License | `MIT` (steckt im `@license`-Tag) |
| Tags | `deepseek`, `token`, `context`, `badge`, `chat` |

---

## Vorprüfungen vor dem Klick auf „Publish"

1. **Metadaten-Block vorhanden:** Das Skript beginnt mit `// ==UserScript==` und endet mit `// ==/UserScript==`.
2. **Pflichtfelder im Kopf:** `@name`, `@namespace`, `@version`, `@description`, `@match`, `@author` sind gesetzt.
3. **Keine externen Calls:** Das Skript enthält nur lokale Logik — kein `fetch` zu fremden Servern, kein `GM_xmlhttpRequest`, keine Skript-Includes.
4. **Kein minifizierter Code:** Der Code ist lesbar und kommentiert.
5. **Ehrliche Beschreibung:** Die Beschreibung im Listing entspricht dem, was das Skript tatsächlich tut.

---

## Nach der Veröffentlichung

1. Die öffentliche Skript-URL kopieren (z. B. `https://greasyfork.org/de/scripts/XXXXX-deepseek-token-badge`)
2. Diese URL dem Nutzer zurückmelden
3. Optional: Auf der Skript-Seite einen Test durchführen — auf „Install this script" klicken und prüfen, ob Tampermonkey die Installation anbietet

---

## Kontext zum Umfeld

- Das Skript wurde in Zusammenarbeit zwischen dem Nutzer (GreasyFork-Konto: `immerzu`) und einem KI-Assistenten (Better DeepSeek mit MCP-Tool-Support) entwickelt.
- Ein früherer Ansatz nutzte einen lokalen Python-MCP-Server zur Bereitstellung des Token-Werts. Dieser wurde verworfen, da der reine Browser-Ansatz ohne Serverinfrastruktur auskommt.
- Die vorliegende Version 1.0.0 ist die für den produktiven Einsatz freigegebene Fassung.

---

## Bei Rückfragen

Alle relevanten Informationen finden sich in:

- `README.md` — Projektübersicht, Technik, Einschränkungen
- `PUBLISHING.md` — Detaillierte Schritt-für-Schritt-Anleitung für GreasyFork
- `metadata.json` — Strukturierte Metadaten (maschinenlesbar)
- `CHANGELOG.md` — Versionshistorie und Entwicklungsnotizen

Sollten Widersprüche zwischen den Dateien auftreten, gilt immer das Skript selbst (`xdeepseek-token-badge.user.js`) als Referenz.
