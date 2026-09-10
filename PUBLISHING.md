# Veröffentlichung auf GreasyFork

Diese Anleitung führt dich Schritt für Schritt durch die Veröffentlichung des Skripts auf [GreasyFork](https://greasyfork.org/de).

**Voraussetzung:** Ein GreasyFork-Konto. Dieses ist vorhanden:  
👉 https://greasyfork.org/de/users/1629833-immerzu

---

## Schritt 1 — Einloggen

1. Öffne [greasyfork.org/de](https://greasyfork.org/de)
2. Klicke oben rechts auf **„Log in"** und melde dich mit dem Konto `immerzu` an
3. Nach dem Login landest du auf deinem Profil-Dashboard

---

## Schritt 2 — Neues Skript anlegen

1. Gehe auf deine Profilseite
2. Klicke auf **„Neues Skript veröffentlichen"** (engl.: „Publish a script you've written")
3. Der Skript-Editor öffnet sich

---

## Schritt 3 — Code einfügen

1. Öffne die Datei `xdeepseek-token-badge.user.js` aus diesem Paket
2. **Kopiere den kompletten Inhalt** (inklusive des `// ==UserScript==`-Blocks ganz oben!)
3. Füge ihn in den Editor auf GreasyFork ein

**Wichtig:** Der Metadaten-Block `// ==UserScript== ... // ==/UserScript==` muss vollständig enthalten sein. Ohne ihn lehnt GreasyFork das Skript ab.

---

## Schritt 4 — Beschreibung einfügen

1. Öffne die Datei `DESCRIPTION.greasyfork.md`
2. Kopiere den Inhalt in das Feld **„Description"** auf GreasyFork

Die Beschreibung nutzt Markdown — Links, Tabellen und Codeblöcke werden korrekt gerendert.

---

## Schritt 5 — Optionale Felder

GreasyFork zeigt weitere Felder an. Empfohlene Werte:

| Feld | Empfohlener Wert |
| --- | --- |
| **Language** | `Deutsch` (oder `English` falls du internationale Reichweite willst) |
| **Script Type** | `Public` |
| **Additional Info** | *(leer lassen oder Verweis auf GitHub-Repository)* |
| **Tags** | `deepseek`, `token`, `context`, `badge`, `chat` |
| **License** | `MIT` (steckt bereits im Skriptkopf) |

---

## Schritt 6 — Speichern und veröffentlichen

1. Klicke auf **„Publish"** (unten rechts)
2. Das Skript ist jetzt live. Die URL sieht aus wie:
```

[https://greasyfork.org/de/scripts/XXXXX-deepseek-token-badge](https://greasyfork.org/de/scripts/XXXXX-deepseek-token-badge)

```
3. Diese URL kannst du z. B. auf Reddit, in Foren oder im Better-DeepSeek-Repository teilen

---

## Schritt 7 — Test nach Veröffentlichung

1. Öffne die Skript-Seite
2. Klicke auf **„Install this script"**
3. Bestätige in Tampermonkey die Installation
4. Öffne `chat.deepseek.com` in einem neuen Tab
5. Nach ein bis zwei Sekunden sollte das Badge unten rechts erscheinen

---

## Updates veröffentlichen

Wenn du später Änderungen machst:

1. Erhöhe die `@version`-Nummer im Skriptkopf (z. B. von `1.0.0` auf `1.0.2` oder `1.1.0`)
2. Öffne die Skript-Seite auf GreasyFork
3. Klicke oben auf **„Update this script"** (Bearbeiten-Symbol)
4. Ersetze den Code-Block durch die neue Version
5. Speichern — alle Nutzer bekommen das Update automatisch angezeigt

**Wichtig:** GreasyFork erkennt eine neue Version nur, wenn die `@version`-Zahl höher ist als vorher. Änderungen ohne Versionssprung werden nicht verteilt.

---

## Richtlinien-Checkliste vor Veröffentlichung

- ✅ Metadaten-Block enthält `@name`, `@version`, `@description`, `@match`
- ✅ `@description` ist eine ehrliche Kurzbeschreibung (max. 250 Zeichen)
- ✅ Kein minifizierter oder obfuskierter Code
- ✅ Keine externen Skript-Ladungen oder Datenübertragung
- ✅ Keine Urheberrechtsverletzung (Code ist eigenständig, keine Übernahme fremder Skripte)
- ✅ Der Code tut genau das, was die Beschreibung sagt
