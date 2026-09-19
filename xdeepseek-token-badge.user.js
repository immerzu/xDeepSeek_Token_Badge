// ==UserScript==
// @name         xDeepSeek Token Badge
// @namespace    https://greasyfork.org/de/users/1629833-immerzu
// @version      1.2.7
// @description  Zeigt den aktuellen Kontext-Füllstand (Token) als schwebendes Badge im DeepSeek-Chat an.
// @description:en  Shows the current context window usage (tokens) as a floating badge in the DeepSeek web chat.
// @description:ru  Показывает текущий уровень заполнения контекстного окна (токены) в виде плавающего значка в веб-чате DeepSeek.
// @author       immerzu
// @match        https://chat.deepseek.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=deepseek.com
// @grant        none
// @run-at       document-start
// @noframes
// @license      MIT
// ==/UserScript==

/*
 * xDeepSeek Token Badge
 * --------------------
 * Liest aus den History-Antworten der DeepSeek-Web-API das Feld
 * "accumulated_token_usage" und zeigt es als Badge unten rechts an.
 *
 * Seit DeepSeek die Chat-History clientseitig zwischenspeichert (IndexedDB
 * "history-message"), antwortet /chat/history_messages bei warmem Cache mit
 * cache_control "MERGE" und liefert nur noch Deltas — der Tokenstand fehlt
 * dann komplett in der Antwort. In diesem Fall wird die History genau einmal
 * ohne cache_version/cache_reset_at nachgeladen (identische Session, identische
 * Header) und der Wert daraus gelesen. Zusätzlich merkt sich das Skript den
 * letzten Wert je Chat, damit nach einem Reload nie "k.A." stehen bleibt.
 *
 * Kein Server, keine externen Calls, keine Tampermonkey-APIs nötig.
 * Die Kontextgrenze wird aus den DeepSeek-Settings gelesen
 * (/api/v0/client/settings?scope=model|main, Feld file_feature.token_limit bzw.
 * normal_history_and_file_token_limit); DEFAULT_CONTEXT_SIZE gilt nur als Rückfall.
 */

(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // Konfiguration
    // ---------------------------------------------------------------------
    const URL_FRAGMENTS      = ['/chat/history_messages', '/history_messages'];
    const SETTINGS_FRAGMENT  = '/client/settings';
    const COMPLETION_FRAGMENT = '/chat/completion';   // SSE-Antwortstrom
    const SHARE_FRAGMENT     = '/share/content';      // geteilte Unterhaltung
    // Kontextgrenze des Modells — GEMESSEN am 16.09.2026 (v1.2.6).
    // Der Server lehnt das Senden ab, sobald „Kontextstand + Promptlänge" 962.000 übersteigt
    // (SSE-Hinweis mit finish_reason "context_length_exceeded", DE: „Längenbegrenzung erreicht.
    // Bitte neuen Chat starten."). Das Fenster selbst ist 1.000.000 Token (DeepSeek V4,
    // „1M context", https://api-docs.deepseek.com/news/news260424/); die Differenz von 38.000
    // ist die Reserve, die der Server für die Antwort freihält.
    // Kante im Chat b934bbb2… fein eingegrenzt (je Sendeversuch, HTTP 200, Entscheidung im SSE):
    //   961.233 +  450 Tok. → angenommen  (Summe 961.683)
    //   961.703 +  230 Tok. → angenommen  (Summe 961.933)  ← oberste bestätigte Annahme
    //   961.233 +  916 Tok. → ABGELEHNT   (Summe 962.149)  ← unterste bestätigte Ablehnung
    // Ältere Stützstellen: 945.022/958.918/959.813 + Mini → angenommen;
    //   958.963 + 13.350 → ABGELEHNT;  964.693/966.769/984.775 + Mini → ABGELEHNT.
    // WICHTIG: Die Grenze gilt für Kontextstand + Prompt. Ein langer Prompt löst die Meldung
    // deshalb schon bei niedrigerem Badge-Stand aus — das Badge zeigt nur den Kontextstand
    // (das war die Ursache der Beobachtung „Meldung kommt schon bei 94 %").
    // ACHTUNG: Die Client-Settings melden mit 890.880 nur ein DATEI-/HISTORY-Limit — das ist
    // NICHT das Kontextfenster und darf den Prozentsatz nicht bestimmen.
    // Die Formatierung (formatTokens) nutzt IMMER die feste 1-Mio.-Schwelle für „M", damit
    // Wert und Grenze nicht in verschiedenen Einheiten erscheinen („1,1M / 1M" war ein Fehler).
    const CONTEXT_WINDOW = 962000;
    const CONTEXT_SOURCE = 'gemessen: 962K (Kontextlimit)';
    // Ab diesem Füllstand wird die Prozentangabe im Badge rot (Warnung vor dem Kontextlimit).
    const PCT_WARN = 90;
    const PCT_WARN_COLOR = '#ff5252';
    const DEBUG              = false;    // true → Konsolen-Logs aktivieren
    const STORE_KEY          = 'xdsTokenBadge.sessionTokens';
    const POS_KEY            = 'xdsTokenBadge.position';
    // Lernfähige Kontextgrenze: gelerntes Limit, manueller Override, größter beobachteter Stand
    const LIMIT_KEY          = 'xdsTokenBadge.limit';
    const OVERRIDE_KEY       = 'xdsTokenBadge.limitOverride';
    const OBSERVED_KEY       = 'xdsTokenBadge.observedMax';
    // DeepSeek lehnt das Senden aus ZWEI verschiedenen Gründen ab — beide führen zu ⚠ im Badge:
    // 1. Nachrichtenlimit (Anzahl der Nachrichten im Chat): Server-Fehlercode
    //    MAX_MESSAGE_COUNT_REACHED ("hintMaxMessageCount" → DE: „Nachrichtenlimit erreicht.
    //    Bitte starten Sie einen neuen Chat.").
    // 2. Längenbegrenzung (Kontextstand + Prompt > Kontextfenster): SSE-Hinweis mit
    //    finish_reason "context_length_exceeded" → DE: „Längenbegrenzung erreicht. Bitte neuen
    //    Chat starten." Die App zeigt dafür zusätzlich am Senden-Button den Tooltip
    //    „Längenlimit überschritten. Ihre Nachricht wird an einen neuen Chat gesendet."
    // Der technische Code (context_length_exceeded) ist sprachunabhängig und daher der Anker.
    const FULL_KEY           = 'xdsTokenBadge.fullSessions';
    const CHAT_FULL_RE       = /(Nachrichtenlimit\s+erreicht|Message\s+limit\s+reached|MAX_MESSAGE_COUNT_REACHED|消息数量达到上限)/i;
    const LENGTH_LIMIT_RE    = /(Längenbegrenzung\s+erreicht|Längengrenze\s+erreicht|Length\s+limit\s+exceeded|context_length_exceeded)/i;
    const REFETCH_DELAY      = 4000;     // ms Mindestabstand zwischen zwei Nachladungen
    // Nach einer Antwort kann der Server den neuen Tokenstand verzögert fortschreiben.
    // Deshalb mehrere Versuche mit wachsendem Abstand (Summe ≈ 35 s).
    const REFRESH_STEPS      = [1500, 3000, 6000, 10000, 15000];
    const STORE_MAX          = 200;      // max. Anzahl gemerkter Chats

    const log = (...a) => { if (DEBUG) console.log('[TokenBadge]', ...a); };

    let badgeEl        = null;
    let tipEl          = null;    // eigener Tooltip (bleibt bei Tastendruck stehen)
    let tipContent     = '';
    let tipPinned      = false;
    let tipHideTimer   = null;
    let posX           = null;    // gespeicherte Badge-Position (Viewport-Pixel)
    let posY           = null;
    let lastValue      = null;
    let lastStale      = false;
    let currentSession = null;
    let lastRefetchAt  = 0;
    let lastRefreshAt  = 0;
    let lastMsgCount   = null;
    let refreshInfo    = 'noch keins nach einer Antwort';
    let refreshSeq     = 0;
    let contextSize    = CONTEXT_WINDOW;         // Kontextfenster (nicht das Datei-Limit!)
    let contextSource  = CONTEXT_SOURCE;
    let fileLimit      = null;    // Datei-/History-Limit aus den Settings (nur informativ)
    let learnedLimit   = null;    // gelernte Grenze (aus Beobachtung/Überschreitung)
    let learnedSource  = '';
    let observedMax    = 0;       // größter je gesehener Tokenstand
    let chatFull       = null;    // { at, text } wenn DeepSeek den Chat als voll gemeldet hat
    let modelLimits    = {};      // model_type -> { plain, thinking }
    let globalLimit    = null;    // normal_history_and_file_token_limit
    let currentModel   = null;
    let currentThinking = null;

    // ---------------------------------------------------------------------
    // Badge (schwebende Anzeige unten rechts)
    // ---------------------------------------------------------------------
    function ensureBadge() {
        if (badgeEl && document.body.contains(badgeEl)) return badgeEl;
        if (!document.body) return null;

        // Neues Element (z. B. nach einem SPA-Rerender der Seite): alten Tooltip-Zustand aufräumen,
        // sonst bliebe eine sichtbare Anzeige ohne mouseleave-Handler hängen.
        tipPinned = false;
        hideTip(true);

        badgeEl = document.createElement('div');
        badgeEl.id = 'deepseek-token-badge';
        badgeEl.style.cssText = [
            'position:fixed',
            'bottom:16px',
            'right:16px',
            'background:rgba(13,13,13,0.82)',
            'color:#fff',
            'padding:6px 12px',
            'border-radius:10px',
            'font:500 12px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
            'letter-spacing:0.02em',
            'z-index:2147483647',
            'pointer-events:auto',
            'cursor:grab',
            'touch-action:none',
            'user-select:none',
            'box-shadow:0 2px 10px rgba(0,0,0,0.25)',
            'backdrop-filter:blur(6px)',
            'transition:opacity .2s ease',
            'opacity:0.92'
        ].join(';');
        badgeEl.textContent = '📊 --';
        badgeEl.setAttribute('aria-label', 'DeepSeek Kontext-Füllstand');
        document.body.appendChild(badgeEl);
        if (!tipContent) {
            tipContent = [
                'DeepSeek Kontext-Füllstand — noch keine Daten',
                'Klick fixiert · Doppelklick setzt Position zurück'
            ].join('\n');
        }
        restorePosition();
        enableDrag(badgeEl);
        enableTooltip(badgeEl);
        if (lastValue !== null) renderValue(lastValue, lastStale);
        return badgeEl;
    }

    // ---------------------------------------------------------------------
    // Eigener Tooltip
    // ---------------------------------------------------------------------
    // Ein natives title-Attribut verschwindet, sobald eine Taste gedrückt wird —
    // damit sind Screenshots unmöglich. Deshalb ein eigenes Element: es bleibt bei
    // Tastendruck stehen und verschwindet erst, wenn die Maus das Badge verlässt.
    // Klick fixiert den Tooltip (bleibt auch ohne Hover), Escape oder erneuter Klick löst ihn.
    function ensureTip() {
        if (tipEl && document.body.contains(tipEl)) return tipEl;
        if (!document.body) return null;
        tipEl = document.createElement('div');
        tipEl.id = 'deepseek-token-badge-tip';
        tipEl.style.cssText = [
            'position:fixed',
            'z-index:2147483647',
            'max-width:420px',
            'background:rgba(13,13,13,0.95)',
            'color:#fff',
            'padding:8px 10px',
            'border-radius:8px',
            'font:400 11px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
            'white-space:pre-line',
            'box-shadow:0 4px 16px rgba(0,0,0,0.35)',
            'border:1px solid rgba(255,255,255,0.12)',
            'pointer-events:none',
            'display:none'
        ].join(';');
        document.body.appendChild(tipEl);
        return tipEl;
    }

    function placeTip() {
        const t = tipEl;
        const b = badgeEl;
        if (!t || !b) return;
        const r = b.getBoundingClientRect();
        t.style.display = 'block';
        const tw = t.offsetWidth;
        const th = t.offsetHeight;
        let x = r.left;
        if (x + tw > window.innerWidth - 8) x = window.innerWidth - tw - 8;
        if (x < 8) x = 8;
        let y = r.top - th - 8;                       // bevorzugt über dem Badge
        if (y < 8) y = r.bottom + 8;                  // sonst darunter
        if (y + th > window.innerHeight - 8) y = window.innerHeight - th - 8;
        t.style.left = x + 'px';
        t.style.top = y + 'px';
    }

    function showTip() {
        const t = ensureTip();
        if (!t) return;
        if (tipHideTimer) { window.clearTimeout(tipHideTimer); tipHideTimer = null; }
        t.textContent = tipContent || 'DeepSeek Kontext-Füllstand';
        placeTip();
    }

    function hideTip(force) {
        if (tipPinned && !force) return;
        if (tipHideTimer) { window.clearTimeout(tipHideTimer); tipHideTimer = null; }
        if (tipEl) tipEl.style.display = 'none';
    }

    function enableTooltip(el) {
        let armed = false;        // erst nach kurzer Ruhe zählt "Bewegung" als Schließgeste
        let armTimer = null;
        let lastX = null;
        let lastY = null;

        const disarm = () => {
            armed = false;
            if (armTimer) { window.clearTimeout(armTimer); armTimer = null; }
        };

        el.addEventListener('mouseenter', () => {
            disarm();
            lastX = null;
            lastY = null;
            // Nach 250 ms ohne Bewegung ist der Tooltip "scharf" — dann schließt ihn Mausbewegung.
            armTimer = window.setTimeout(() => { armed = true; armTimer = null; }, 250);
            showTip();
        });

        // Mausbewegung blendet aus (Tastendrücke NICHT) — außer der Tooltip ist per Klick fixiert.
        el.addEventListener('pointermove', (e) => {
            if (tipPinned) return;
            const moved = lastX !== null &&
                (Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY)) >= 6;
            if (moved) {
                const wasArmed = armed;
                disarm();
                if (wasArmed) hideTip(false);
            }
            lastX = e.clientX;
            lastY = e.clientY;
        });

        el.addEventListener('mouseleave', () => {
            disarm();
            lastX = null;
            lastY = null;
            if (tipHideTimer) window.clearTimeout(tipHideTimer);
            tipHideTimer = window.setTimeout(() => { tipHideTimer = null; hideTip(false); }, 250);
        });

        // Tastendrücke (z. B. Windows+Shift+S für einen Screenshot) blenden NICHTS aus.
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && tipPinned) {
                tipPinned = false;
                hideTip(true);
                log('Tooltip gelöst (Escape)');
            }
        }, true);
    }

    // ---------------------------------------------------------------------
    // Position: mit der Maus verschiebbar, wird gemerkt
    // ---------------------------------------------------------------------
    // Ziehen = verschieben · Doppelklick = zurück in die Standardecke.
    // Die Position liegt als Viewport-Pixel in localStorage und wird bei
    // Fenstergrößenänderungen wieder in den sichtbaren Bereich geholt.
    function clamp(v, min, max) {
        return Math.min(Math.max(v, min), Math.max(min, max));
    }

    function setPosition(x, y) {
        const el = badgeEl;
        if (!el) return;
        const maxX = window.innerWidth - el.offsetWidth - 4;
        const maxY = window.innerHeight - el.offsetHeight - 4;
        posX = clamp(x, 4, maxX);
        posY = clamp(y, 4, maxY);
        el.style.left = posX + 'px';
        el.style.top = posY + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        if (tipEl && tipEl.style.display !== 'none') placeTip();
    }

    function savePosition() {
        try { localStorage.setItem(POS_KEY, JSON.stringify({ x: posX, y: posY })); }
        catch (err) { log('pos save error', err); }
    }

    function restorePosition() {
        try {
            const raw = localStorage.getItem(POS_KEY);
            if (!raw) return;
            const p = JSON.parse(raw);
            if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) setPosition(p.x, p.y);
        } catch (err) { log('pos read error', err); }
    }

    function resetPosition() {
        try { localStorage.removeItem(POS_KEY); } catch (err) { log('pos reset error', err); }
        posX = null;
        posY = null;
        if (badgeEl) {
            badgeEl.style.left = 'auto';
            badgeEl.style.top = 'auto';
            badgeEl.style.right = '16px';
            badgeEl.style.bottom = '16px';
        }
        if (tipEl && tipEl.style.display !== 'none') placeTip();
    }

    function enableDrag(el) {
        let dragging = false;
        let moved = false;
        let startX = 0;
        let startY = 0;
        let origX = 0;
        let origY = 0;

        el.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;                 // nur linke Maustaste
            const r = el.getBoundingClientRect();
            dragging = true;
            moved = false;
            startX = e.clientX;
            startY = e.clientY;
            origX = r.left;
            origY = r.top;
            el.style.cursor = 'grabbing';
            try { el.setPointerCapture(e.pointerId); } catch (err) { log('capture error', err); }
            hideTip(true);                               // beim Anfassen ausblenden
            e.preventDefault();
            e.stopPropagation();
        });

        el.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (!moved && Math.abs(dx) + Math.abs(dy) < 4) return;   // Klick nicht als Drag werten
            moved = true;
            setPosition(origX + dx, origY + dy);
        });

        const finish = (e) => {
            if (!dragging) return;
            dragging = false;
            el.style.cursor = 'grab';
            try { el.releasePointerCapture(e.pointerId); } catch (err) { log('release error', err); }
            if (moved) {
                tipPinned = false;                       // Verschieben löst eine Fixierung
                savePosition();
                log('Position gemerkt', posX, posY);
                return;
            }
            // Kurzer Klick ohne Ziehen: Tooltip fixieren bzw. wieder lösen.
            tipPinned = !tipPinned;
            if (tipPinned) {
                showTip();
                log('Tooltip fixiert');
            } else {
                hideTip(true);
                log('Tooltip gelöst');
            }
        };

        el.addEventListener('pointerup', finish);
        el.addEventListener('pointercancel', finish);
        el.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetPosition();
            log('Position zurückgesetzt');
        });
    }

    window.addEventListener('resize', () => {
        if (posX !== null) setPosition(posX, posY);
        if (tipEl && tipEl.style.display !== 'none') placeTip();
    });

    // Kompakte Darstellung: dreistellig gerundet (192K, 891K, 1,5M).
    function formatTokens(n) {
        if (!Number.isFinite(n)) return '--';
        if (n >= 1000000) {
            const m = n / 1000000;
            const r = m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
            return String(r).replace('.', ',') + 'M';
        }
        if (n >= 1000) return Math.round(n / 1000) + 'K';
        return String(Math.round(n));
    }

    function setTip(lines) {
        tipContent = lines.join('\n');
        if (tipEl && tipEl.style.display !== 'none') showTip();   // sichtbaren Tooltip aktualisieren
    }

    function renderValue(tokens, stale) {
        const el = ensureBadge();
        if (!el) return;
        lastStale = !!stale;
        if (tokens == null || !Number.isFinite(tokens)) {
            el.textContent = '📊 --';
            setTip([
                'DeepSeek Kontext-Füllstand — noch keine Daten',
                `Nachladen: ${refreshInfo}`,
                'Klick fixiert · Doppelklick setzt Position zurück'
            ]);
            return;
        }
        const rawPct = tokens / contextSize * 100;
        const pct = rawPct > 0 && rawPct < 1 ? '<1' : String(Math.round(rawPct));
        const warn = chatFull ? '⚠ ' : '';
        // Prozentangabe ab 90 % Füllstand rot: eigener Span, damit NUR die Zahl rot wird
        // (Badge-Breite bleibt gleich — kein Fettdruck, keine Layout-Änderung).
        el.textContent = `📊 ${warn}${stale ? '~' : ''}${formatTokens(tokens)} / ${formatTokens(contextSize)}  `;
        const pctEl = document.createElement('span');
        pctEl.className = 'xds-tokenbadge-pct';
        pctEl.textContent = `(${pct} %)`;
        pctEl.style.color = rawPct >= PCT_WARN ? PCT_WARN_COLOR : 'inherit';
        el.appendChild(pctEl);
        setTip([
            isShareView()
                ? 'Geteilte Unterhaltung — Stand zum Zeitpunkt des Teilens'
                : (stale
                    ? 'Letzter bekannter Wert für diesen Chat (Server lieferte nur ein Delta)'
                    : 'Aktueller Wert aus der Server-Antwort'),
            `Exakt: ${tokens.toLocaleString()} von ${contextSize.toLocaleString()} Token (${rawPct.toFixed(2).replace('.', ',')} %)`,
            `Kontext ${contextSize.toLocaleString()} · ${contextSource}${fileLimit && fileLimit !== contextSize ? ` · Datei-Limit ${fileLimit.toLocaleString()}` : ''}`,
            ...(chatFull ? (chatFull.kind === 'length'
                ? [
                    '⚠ Längenbegrenzung erreicht — neuer Chat nötig',
                    Number.isFinite(chatFull.promptTokens)
                        ? `Kontext ${formatTokens(tokens)} + Prompt ≈ ${formatTokens(chatFull.promptTokens)} > ${formatTokens(contextSize)}`
                        : `Kontext + Prompt über ${formatTokens(contextSize)}`
                  ]
                : [`⚠ DeepSeek meldet: ${chatFull.text}`]) : []),
            ...(isShareView() ? [] : [`Nachladen: ${refreshInfo}`]),
            'Klick fixiert · Doppelklick setzt Position zurück'
        ]);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ensureBadge(), { once: true });
    } else {
        ensureBadge();
    }

    // ---------------------------------------------------------------------
    // Merker: letzter Tokenstand je Chat (überlebt den Reload)
    // ---------------------------------------------------------------------
    function readStore() {
        try {
            const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (err) { log('store read error', err); return {}; }
    }

    function remember(sessionId, tokens) {
        if (!sessionId || !Number.isFinite(tokens)) return;
        try {
            const store = readStore();
            store[sessionId] = tokens;
            const keys = Object.keys(store);
            if (keys.length > STORE_MAX) {
                for (const k of keys.slice(0, keys.length - STORE_MAX)) delete store[k];
            }
            localStorage.setItem(STORE_KEY, JSON.stringify(store));
        } catch (err) { log('store write error', err); }
    }

    function recall(sessionId) {
        if (!sessionId) return null;
        const v = readStore()[sessionId];
        return Number.isFinite(v) ? v : null;
    }

    // ---------------------------------------------------------------------
    // Lernfähige Kontextgrenze
    // ---------------------------------------------------------------------
    // DeepSeek meldet das Kontextfenster NICHT als Feld. Es gibt aber ein verwertbares Signal:
    // erreicht eine Nachricht den Status CONTEXT_LENGTH_EXCEEDED, war das echte Limit erreicht.
    // Daraus lernt das Skript die Grenze und passt sie bei künftigen Änderungen selbst an.
    // Priorität: manueller Override > gelernte Grenze > Settings (nur wenn > 962K) > gemessene 962K.
    function readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (err) { log('read error', key, err); return fallback; }
    }

    function writeJson(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); }
        catch (err) { log('write error', key, err); }
    }

    function loadLearnedLimit() {
        const stored = readJson(LIMIT_KEY, null);
        if (stored && Number.isFinite(stored.value) && stored.value > 0) {
            // Migration v1.2.5: Grenzen, die nur aus einem hohen Tokenstand ABGELEITET wurden
            // („aus Beobachtung"), sind nicht belastbar. Ein Stand über der Grenze entsteht,
            // weil die letzte erlaubte Antwort den Kontext darüber hinaus wachsen lässt —
            // senden kann man dort nicht mehr. Solche Altwerte (typisch 1.000.000) würden die
            // gemessenen 962K dauerhaft überschreiben und deshalb verworfen.
            if (/beobachtung/i.test(String(stored.source || ''))) {
                console.warn('[TokenBadge] Alte Beobachtungs-Grenze verworfen:', stored.value, '(nicht belastbar)');
                try { localStorage.removeItem(LIMIT_KEY); } catch (err) { /* ignore */ }
            } else {
                learnedLimit = stored.value;
                learnedSource = stored.source || 'gelernt';
            }
        }
        const observed = readJson(OBSERVED_KEY, 0);
        if (Number.isFinite(observed) && observed > 0) observedMax = observed;
    }

    function overrideLimit() {
        const v = readJson(OVERRIDE_KEY, null);
        return Number.isFinite(v) && v > 0 ? v : null;
    }

    // Wird bei jedem neuen Tokenstand aufgerufen: merkt den Höchstwert (nur noch informativ).
    function noteObserved(tokens) {
        if (!Number.isFinite(tokens) || tokens <= observedMax) return;
        observedMax = tokens;
        writeJson(OBSERVED_KEY, observedMax);
        log('Höchstwert beobachtet →', observedMax);
        // BEWUSST KEINE Anhebung der Grenze mehr (Änderung in v1.2.5): Ein Tokenstand über der
        // Grenze beweist KEIN größeres Fenster — die letzte erlaubte Antwort wächst über die
        // Grenze hinaus (gemessen: 984.775 bei einer Grenze von 962.000; senden ist dort
        // abgelehnt). Die Grenze stammt jetzt aus der Messung und wird nur noch durch ein
        // echtes CONTEXT_LENGTH_EXCEEDED (noteContextExceeded) oder einen Override geändert.
        if (tokens > contextSize) {
            log('Stand über der Grenze (letzte Antwort wuchs darüber hinaus):', tokens, '>', contextSize);
        }
    }

    // Kontext-Überschreitung erkannt: der zuletzt gültige Stand ist die belastbare Grenze.
    function noteContextExceeded(tokens) {
        const candidate = Number.isFinite(tokens) && tokens > 0 ? tokens : lastValue;
        if (!Number.isFinite(candidate) || candidate <= 0) return;
        if (learnedLimit === candidate && learnedSource === 'gelernt (Kontext-Überschreitung)') return;
        learnedLimit = candidate;
        learnedSource = 'gelernt (Kontext-Überschreitung)';
        writeJson(LIMIT_KEY, { value: learnedLimit, source: learnedSource, at: Date.now() });
        console.warn('[TokenBadge] Kontextgrenze gelernt:', learnedLimit, '(Status CONTEXT_LENGTH_EXCEEDED)');
        updateContextSize();
    }

    function checkContextExceeded(json) {
        try {
            const biz = bizData(json);
            const msgs = biz && biz.chat_messages;
            if (!Array.isArray(msgs)) return;
            const hit = msgs.find((m) => m && m.status === 'CONTEXT_LENGTH_EXCEEDED');
            if (!hit) return;
            const vals = msgs.map((m) => m && m.accumulated_token_usage).filter((v) => typeof v === 'number' && Number.isFinite(v));
            noteContextExceeded(vals.length ? Math.max.apply(null, vals) : null);
        } catch (err) { log('exceeded check error', err); }
    }

    // Chat blockiert: DeepSeek lehnt das Senden ab. Zwei Arten (CHAT_FULL_RE / LENGTH_LIMIT_RE):
    //   'messages' = Nachrichtenlimit (Anzahl der Nachrichten) — unabhängig von der Tokenzahl
    //   'length'   = Längenbegrenzung (Kontextstand + Prompt > Kontextfenster)
    // In BEIDEN Fällen bleibt die Kontextgrenze unverändert; nur die Anzeige warnt.
    function loadChatFull(sessionId) {
        if (!sessionId) return null;
        const store = readJson(FULL_KEY, {});
        return store && store[sessionId] ? store[sessionId] : null;
    }

    function noteChatFull(text, sessionId, info) {
        const sid = sessionId || currentSession;
        if (!sid) return;
        const entry = {
            at: Date.now(),
            text: String(text || '').replace(/\s+/g, ' ').trim().slice(0, 160),
            kind: (info && info.kind) || 'messages',
        };
        if (info && Number.isFinite(info.promptTokens) && info.promptTokens > 0) {
            entry.promptTokens = info.promptTokens;
        }
        if (chatFull && chatFull.text === entry.text && chatFull.kind === entry.kind) {
            // Schon gemeldet. Die Promptgröße kennt nur der Antwortstrom (der DOM-Hinweis nicht)
            // → sie wird nachgetragen, sobald sie bekannt ist.
            if (Number.isFinite(entry.promptTokens) && !Number.isFinite(chatFull.promptTokens)) {
                chatFull.promptTokens = entry.promptTokens;
                const again = readJson(FULL_KEY, {});
                if (again[sid] && again[sid].kind === entry.kind) {
                    again[sid].promptTokens = entry.promptTokens;
                    writeJson(FULL_KEY, again);
                }
                log('Promptgröße nachgetragen →', entry.promptTokens);
                renderValue(lastValue, lastStale);
            }
            return;
        }
        chatFull = entry;
        const store = readJson(FULL_KEY, {});
        store[sid] = entry;
        const keys = Object.keys(store);
        if (keys.length > 50) for (const k of keys.slice(0, keys.length - 50)) delete store[k];
        writeJson(FULL_KEY, store);
        console.warn('[TokenBadge] Chat blockiert gemeldet:', entry.kind, entry.text);
        renderValue(lastValue, lastStale);
    }

    // Sucht in einem Antworttext (SSE des completion-Requests) nach beiden Ablehnungsgründen.
    // Die Längenbegrenzung hat Vorrang — sie ist die inhaltlich genauere Aussage.
    function checkChatFullText(text, promptTokens) {
        try {
            if (typeof text !== 'string' || !text) return false;
            const len = text.match(LENGTH_LIMIT_RE);
            if (len) { noteChatFull(len[0], null, { kind: 'length', promptTokens }); return true; }
            const m = text.match(CHAT_FULL_RE);
            if (!m) return false;
            noteChatFull(m[0], null, { kind: 'messages', promptTokens });
            return true;
        } catch (err) { log('full check error', err); return false; }
    }
    // Fallback: Der Hinweis erscheint auch als Text im Eingabebereich (falls der Code nicht sichtbar ist).
    function watchChatFullNotice() {
        const start = () => {
            try {
                const obs = new MutationObserver((muts) => {
                    for (const m of muts) {
                        for (const n of m.addedNodes) {
                            const el = n.nodeType === 1 ? n : n.parentElement;
                            if (!el) continue;
                            // Eigene Elemente nie auswerten — sonst erkennt sich der Tooltip selbst
                            // (er zeigt die Meldung ja an) und überschreibt den gemerkten Text.
                            if (el.closest && el.closest('#deepseek-token-badge, #deepseek-token-badge-tip')) continue;
                            const txt = (el.textContent || '').slice(0, 300);
                            if (!txt) continue;
                            const hitLen = txt.match(LENGTH_LIMIT_RE);
                            if (hitLen) { noteChatFull(hitLen[0], null, { kind: 'length' }); continue; }
                            const hit = txt.match(CHAT_FULL_RE);
                            if (hit) noteChatFull(hit[0], null, { kind: 'messages' });   // nur den Treffer speichern
                        }
                    }
                });
                obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
                log('Chat-voll-Beobachter aktiv');
            } catch (err) { log('watch full error', err); }
        };
        if (document.body) start();
        else document.addEventListener('DOMContentLoaded', start, { once: true });
    }

    loadLearnedLimit();
    updateContextSize();
    watchChatFullNotice();

    // ---------------------------------------------------------------------
    // Extraktion des Token-Werts aus der API-Antwort
    // ---------------------------------------------------------------------
    // Sucht rekursiv nach "accumulated_token_usage" und nimmt das Maximum.
    // Robust gegen verschachtelte Strukturen und künftige Feldverschiebungen.
    function extractTokenUsage(json) {
        try {
            let max = null;
            const seen = new Set();
            const walk = (node, depth) => {
                if (!node || typeof node !== 'object' || depth > 12 || seen.has(node)) return;
                seen.add(node);
                if (Array.isArray(node)) {
                    for (const item of node) walk(item, depth + 1);
                    return;
                }
                for (const key of Object.keys(node)) {
                    if (key === 'accumulated_token_usage') {
                        const v = node[key];
                        if (typeof v === 'number' && Number.isFinite(v) && (max === null || v > max)) max = v;
                    }
                    walk(node[key], depth + 1);
                }
            };
            walk(json, 0);
            return max;
        } catch (err) {
            log('extract error', err);
            return null;
        }
    }

    function bizData(json) {
        return json && json.data ? json.data.biz_data || null : null;
    }

    function sessionIdFromUrl(url) {
        try { return new URL(url, location.origin).searchParams.get('chat_session_id'); }
        catch (err) { log('session id error', err); return null; }
    }

    function requestUrl(input) {
        try {
            if (typeof input === 'string') return input;
            if (input instanceof Request) return input.url;
            if (input && typeof input === 'object') {
                if (typeof input.url === 'string') return input.url;
                if (typeof input.href === 'string') return input.href;   // URL-Objekt
            }
        } catch (err) { log('url error', err); }
        return '';
    }

    // ---------------------------------------------------------------------
    // Kontextgrenze aus den DeepSeek-Settings
    // ---------------------------------------------------------------------
    // Die App liefert die Grenze selbst: model_configs[].file_feature.token_limit
    // (bzw. token_limit_with_thinking) und normal_history_and_file_token_limit.
    // Ohne diese Werte würde das Badge mit einem geratenen Nenner rechnen.
    function pickSetting(value) {
        return value && typeof value === 'object' && 'value' in value ? value.value : value;
    }

    // Die Client-Settings melden Datei-/History-Limits (890.880). Das ist NICHT das Kontextfenster
    // (V4 = 1 Mio.). Wir merken den Wert nur für den Tooltip — und übernehmen ihn ausschließlich
    // dann als Kontextgrenze, wenn er GRÖSSER als das bekannte Kontextfenster ist.
    function updateContextSize() {
        const candidates = [];
        const model = currentModel && modelLimits[currentModel] ? modelLimits[currentModel] : null;
        if (model) {
            candidates.push(model.thinking, model.plain);
        }
        for (const k of Object.keys(modelLimits)) {
            candidates.push(modelLimits[k].plain, modelLimits[k].thinking);
        }
        candidates.push(globalLimit);

        const finite = candidates.filter((v) => Number.isFinite(v) && v > 0);
        fileLimit = finite.length ? Math.max.apply(null, finite) : null;

        // Priorität: Override > gelernt > Settings (nur wenn > 962K) > gemessene 962K
        const override = overrideLimit();
        let next = CONTEXT_WINDOW;
        let source = CONTEXT_SOURCE;
        if (fileLimit !== null && fileLimit > CONTEXT_WINDOW) {
            next = fileLimit;
            source = 'DeepSeek-Settings (größer als der Standardwert)';
        }
        if (learnedLimit !== null && learnedLimit > 0) {
            next = learnedLimit;
            source = learnedSource || 'gelernt';
        }
        if (override !== null) {
            next = override;
            source = 'manuell gesetzt (localStorage)';
        }

        if (next === contextSize) {
            contextSource = source;
            return;
        }
        contextSize = next;
        contextSource = source;
        log('Kontextfenster →', contextSize, contextSource, 'Datei-Limit:', fileLimit, 'Höchstwert:', observedMax);
        if (lastValue !== null) renderValue(lastValue, lastStale);
    }

    function applySettings(url, json) {
        try {
            const scope = new URL(url, location.origin).searchParams.get('scope');
            const biz = bizData(json);
            const settings = biz ? biz.settings : null;
            if (!settings) return;

            if (scope === 'model') {
                const models = pickSetting(settings.model_configs) || [];
                for (const m of models) {
                    const ff = m.file_feature || {};
                    modelLimits[m.model_type] = {
                        plain: Number.isFinite(ff.token_limit) ? ff.token_limit : null,
                        thinking: Number.isFinite(ff.token_limit_with_thinking) ? ff.token_limit_with_thinking : null
                    };
                }
                log('Modell-Limits:', JSON.stringify(modelLimits));
            } else if (scope === 'main') {
                const limit = pickSetting(settings.normal_history_and_file_token_limit);
                if (Number.isFinite(limit) && limit > 0) globalLimit = limit;
            }
            updateContextSize();
        } catch (err) {
            log('settings error', err);
        }
    }

    // Modell/Denkmodus des aktiven Chats merken (bestimmt die passende Grenze).
    function noteSession(json) {
        const biz = bizData(json);
        if (!biz) return;
        const session = biz.chat_session;
        if (session && session.model_type && session.model_type !== currentModel) {
            currentModel = session.model_type;
            updateContextSize();
        }
        const msgs = biz.chat_messages;
        if (Array.isArray(msgs)) {
            lastMsgCount = msgs.length;
            const last = msgs[msgs.length - 1];
            if (last && typeof last.thinking_enabled === 'boolean' && last.thinking_enabled !== currentThinking) {
                currentThinking = last.thinking_enabled;
                updateContextSize();
            }
        }
    }

    // ---------------------------------------------------------------------
    // Anzeige-Logik
    // ---------------------------------------------------------------------
    // Beim Chat-Wechsel darf der Wert des vorherigen Chats nicht stehen bleiben.
    function handleSession(sessionId) {
        if (!sessionId || sessionId === currentSession) return;
        currentSession = sessionId;
        lastValue = null;
        const known = recall(sessionId);
        chatFull = loadChatFull(sessionId);
        if (known !== null) {
            lastValue = known;
            renderValue(known, true);
        } else {
            renderValue(null);
        }
        log('Chat gewechselt →', sessionId, 'gemerkt:', known);
    }

    function handle(tokens, sessionId) {
        handleSession(sessionId);
        if (!Number.isFinite(tokens)) return;
        noteObserved(tokens);
        if (tokens === lastValue && !lastStale) return;
        lastValue = tokens;
        remember(currentSession, tokens);
        renderValue(tokens, false);
        log('Badge aktualisiert →', tokens, currentSession);
    }

    // ---------------------------------------------------------------------
    // Chat-Wechsel erkennen, auch wenn dabei kein Request läuft
    // ---------------------------------------------------------------------
    // Die App wechselt den Chat teils komplett aus dem Speicher (kein Netzwerk).
    // Ohne diesen Wächter bliebe der Wert des vorherigen Chats stehen.
    function sessionFromLocation() {
        const chat = location.pathname.match(/\/a\/chat\/s\/([0-9a-fA-F-]{8,})/);
        if (chat) return chat[1];
        // Geteilte Unterhaltung: /share/<share_id> — als eigene "Session" behandeln.
        const share = location.pathname.match(/\/share\/([A-Za-z0-9_-]+)/);
        return share ? 'share:' + share[1] : null;
    }

    // Geteilte Unterhaltung? Dort ist der Tokenstand ein statischer Stand vom Teilen.
    function isShareView() {
        return /^\/share\//.test(location.pathname);
    }

    function syncSessionFromLocation() {
        const sid = sessionFromLocation();
        if (sid) handleSession(sid);
    }

    ['pushState', 'replaceState'].forEach((fn) => {
        const orig = history[fn];
        history[fn] = function (...a) {
            const r = orig.apply(this, a);
            try { syncSessionFromLocation(); } catch (err) { log('url watch error', err); }
            return r;
        };
    });
    window.addEventListener('popstate', syncSessionFromLocation);
    setInterval(syncSessionFromLocation, 1500);

    // ---------------------------------------------------------------------
    // Kernfix: volle History nachladen, wenn der Server nur ein Delta schickt
    // ---------------------------------------------------------------------
    // headers: die Header des Original-Requests, damit die Session erhalten bleibt.
    // Lädt die volle History einer Session (ohne Cache-Parameter) und wertet den Tokenstand aus.
    async function fetchHistory(sessionId, headers) {
        if (!sessionId) return null;
        try {
            const target = new URL('/api/v0/chat/history_messages', location.origin);
            target.searchParams.set('chat_session_id', sessionId);
            const init = { method: 'GET', credentials: 'include' };
            if (headers && Object.keys(headers).length) init.headers = headers;
            const response = await originalFetch.call(window, target.toString(), init);
            const json = await response.json();
            const tokens = extractTokenUsage(json);
            const msgs = (bizData(json) || {}).chat_messages;
            const count = Array.isArray(msgs) ? msgs.length : null;
            if (Number.isFinite(count)) lastMsgCount = count;
            log('History geladen →', tokens, 'Nachrichten:', count, sessionId);
            if (tokens !== null) handle(tokens, sessionId);
            return { tokens, count };
        } catch (err) {
            log('fetchHistory error', err);
            return { tokens: null, count: null, error: String(err).slice(0, 120) };
        }
    }

    // Session-ID aus dem Body eines POST (chat/completion).
    function sessionIdFromBody(body) {
        try {
            if (typeof body !== 'string' || !body) return null;
            const m = body.match(/"chat_session_id"\s*:\s*"([0-9a-fA-F-]{8,})"/);
            return m ? m[1] : null;
        } catch (err) { log('body session error', err); return null; }
    }

    // Geschätzte Tokenzahl des gesendeten Prompts aus dem Request-Body.
    // Gemessenes Verhältnis (16.09.2026, Fülltext): 843 Zeichen ≈ 230 Token, 3.043 ≈ 825,
    // 30.042 ≈ 8.015 ⇒ rund 3,6 Zeichen je Token (vorher 3,0 — das überschätzte die Promptgröße um ~20 %).
    // Nur eine Schätzung für den Tooltip-Hinweis — die Kontextgrenze wird davon NICHT berührt.
    function promptTokensFromBody(body) {
        try {
            if (typeof body !== 'string' || !body) return null;
            let text = null;
            try {
                const parsed = JSON.parse(body);
                if (parsed && typeof parsed.prompt === 'string') text = parsed.prompt;
            } catch (err) { /* Body evtl. kein reines JSON → Regex-Fallback */ }
            if (text === null) {
                const m = body.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                if (!m) return null;
                text = m[1];
            }
            const chars = text.length;
            return chars > 0 ? Math.round(chars / 3.6) : null;
        } catch (err) { log('prompt tokens error', err); return null; }
    }

    // Nach dem Ende einer Antwort lädt die App die History NICHT neu — der Tokenstand
    // bliebe bis F5/Chat-Wechsel stehen (der SSE-Stream liefert nur accumulated_token_usage: 0
    // beim Anlegen der Nachricht). Deshalb holen wir die History hier selbst — mehrfach mit
    // wachsendem Abstand, weil der Server den neuen Stand verzögert fortschreibt.
    function refreshAfterAnswer(sessionId, headers) {
        if (!sessionId) {
            refreshInfo = 'abgebrochen: keine Session-ID';
            renderValue(lastValue, lastStale);
            log('Refresh ohne Session-ID');
            return;
        }
        const beforeTokens = lastValue;
        const beforeCount = lastMsgCount;
        const seq = ++refreshSeq;           // neuere Antworten übernehmen
        let step = 0;
        refreshInfo = `läuft … (vorher ${beforeTokens === null ? 'unbekannt' : beforeTokens.toLocaleString()})`;
        renderValue(lastValue, lastStale);

        const attempt = () => {
            if (seq !== refreshSeq) return;
            if (step >= REFRESH_STEPS.length) {
                refreshInfo = `aufgegeben nach ${REFRESH_STEPS.length} Versuchen (Wert unverändert)`;
                renderValue(lastValue, lastStale);
                log('Refresh aufgegeben für', sessionId);
                return;
            }
            const delay = REFRESH_STEPS[step];
            step += 1;
            window.setTimeout(async () => {
                if (seq !== refreshSeq) return;
                lastRefreshAt = Date.now();
                const r = await fetchHistory(sessionId, headers);
                if (seq !== refreshSeq) return;
                const tokens = r ? r.tokens : null;
                const count = r ? r.count : null;

                if (Number.isFinite(tokens) && tokens !== beforeTokens) {
                    refreshInfo = `ok (Versuch ${step}): ${tokens.toLocaleString()} Token`;
                    log('Refresh ok nach Versuch', step, '→', tokens);
                    return;
                }
                // Keine neue Nachricht in der History → es gibt nichts nachzuladen.
                if (Number.isFinite(count) && Number.isFinite(beforeCount) && count <= beforeCount) {
                    refreshInfo = `fertig: keine neue Nachricht (${count}), Wert ${tokens === null ? 'unbekannt' : tokens.toLocaleString()}`;
                    renderValue(lastValue, lastStale);
                    log('Refresh beendet: Nachrichtenzahl unverändert', count);
                    return;
                }
                refreshInfo = `Versuch ${step}: ${tokens === null ? 'kein Wert erhalten' : tokens.toLocaleString() + ' (unverändert)'}, ${count} Nachrichten`;
                renderValue(lastValue, lastStale);
                attempt();
            }, delay);
        };
        attempt();
    }

    async function refetchFullHistory(url, headers) {
        let target;
        try { target = new URL(url, location.origin); }
        catch (err) { log('refetch url error', err); return; }

        // Nur nötig, wenn der Client Cache-Parameter mitgeschickt hat.
        if (!target.searchParams.has('cache_version') && !target.searchParams.has('cache_reset_at')) return;
        if (Date.now() - lastRefetchAt < REFETCH_DELAY) return;
        lastRefetchAt = Date.now();

        const sessionId = target.searchParams.get('chat_session_id');
        log('MERGE-Antwort ohne Tokenstand → History nachladen', sessionId);
        await fetchHistory(sessionId, headers);
    }

    // Header eines fetch()-Aufrufs als einfaches Objekt (für den Re-Request).
    function headersFromFetchArgs(args) {
        try {
            const first = args && args[0];
            const out = {};
            const take = (h) => {
                if (!h) return;
                if (typeof h.forEach === 'function' && !Array.isArray(h)) { h.forEach((v, k) => { out[k] = v; }); return; }
                if (Array.isArray(h)) { for (const pair of h) out[pair[0]] = pair[1]; return; }
                Object.assign(out, h);
            };
            if (first instanceof Request) take(first.headers);
            else take(args && args[1] && args[1].headers);
            return out;
        } catch (err) { log('header error', err); return {}; }
    }

    // ---------------------------------------------------------------------
    // fetch()-Hook (Fallback — die DeepSeek-Web-App nutzt derzeit XHR)
    // ---------------------------------------------------------------------
    const originalFetch = window.fetch;
    if (typeof originalFetch === 'function') {
        window.fetch = async function (...args) {
            const response = await originalFetch.apply(this, args);
            try {
                const url = requestUrl(args[0]);
                log('fetch →', url);
                const isSettings = !!url && url.includes(SETTINGS_FRAGMENT);
                const isShare = !!url && url.includes(SHARE_FRAGMENT);
                if (url && (isSettings || isShare || URL_FRAGMENTS.some(f => url.includes(f)))) {
                    const fromUrl = sessionIdFromUrl(url);
                    response.clone().json()
                        .then(json => {
                            if (isSettings) {
                                applySettings(url, json);
                                return;
                            }
                            if (isShare) {
                                const shareTokens = extractTokenUsage(json);
                                const shareSession = sessionFromLocation() || 'share';
                                log('Share-Inhalt (fetch) →', shareTokens);
                                if (shareTokens !== null) handle(shareTokens, shareSession);
                                else handleSession(shareSession);
                                return;
                            }
                            noteSession(json);
                            checkContextExceeded(json);
                            const biz = bizData(json);
                            const sessionId = (biz && biz.chat_session && biz.chat_session.id) || fromUrl;
                            const tokens = extractTokenUsage(json);
                            if (tokens !== null) {
                                handle(tokens, sessionId);
                            } else {
                                // MERGE-Antwort ohne Tokenstand: Session binden und nachladen.
                                handleSession(sessionId);
                                log('kein Tokenwert in Antwort, cache_control =', biz && biz.cache_control);
                                refetchFullHistory(url, headersFromFetchArgs(args));
                            }
                        })
                        .catch(err => log('json parse error', err));
                }
                // Antwort-Stream per fetch (Sicherheitsnetz): am Ende Tokenstand nachladen.
                if (url && url.includes(COMPLETION_FRAGMENT)) {
                    response.clone().text()
                        .then(() => refreshAfterAnswer(sessionFromLocation() || currentSession, headersFromFetchArgs(args)))
                        .catch(err => log('completion fetch error', err));
                }
            } catch (err) {
                log('hook error', err);
            }
            return response;
        };
    }

    // ---------------------------------------------------------------------
    // XMLHttpRequest-Hook (Hauptpfad: die DeepSeek-Web-App nutzt XHR)
    // ---------------------------------------------------------------------
    const XHR = window.XMLHttpRequest;
    if (typeof XHR === 'function') {
        const origOpen = XHR.prototype.open;
        const origSend = XHR.prototype.send;
        const origSetHeader = XHR.prototype.setRequestHeader;

        XHR.prototype.open = function (method, url, ...rest) {
            this.__tokenbadge_url = url;
            this.__tokenbadge_headers = {};
            return origOpen.call(this, method, url, ...rest);
        };

        // Header mitschneiden, damit ein Re-Request dieselbe Session nutzt.
        XHR.prototype.setRequestHeader = function (name, value) {
            try {
                if (!this.__tokenbadge_headers) this.__tokenbadge_headers = {};
                this.__tokenbadge_headers[name] = value;
            } catch (err) { log('header collect error', err); }
            return origSetHeader.call(this, name, value);
        };

        XHR.prototype.send = function (...args) {
            const reqUrl = this.__tokenbadge_url || '';

            // Antwort-Stream (SSE): am Ende den Tokenstand selbst nachladen.
            if (reqUrl.includes(COMPLETION_FRAGMENT)) {
                const self = this;
                const body = args && args[0];
                const promptTokens = promptTokensFromBody(body);
                this.addEventListener('load', function () {
                    try {
                        const sid = sessionIdFromBody(body) || sessionFromLocation() || currentSession;
                        // Ablehnung erkennen: Nachrichtenlimit ODER Längenbegrenzung (Kontext + Prompt)
                        checkChatFullText(this.responseText, promptTokens);
                        log('Antwort-Stream beendet → History nachladen', sid);
                        refreshAfterAnswer(sid, self.__tokenbadge_headers);
                    } catch (err) { log('completion hook error', err); }
                });
            }

            this.addEventListener('load', function () {
                try {
                    const url = this.__tokenbadge_url || '';
                    const isSettings = url.includes(SETTINGS_FRAGMENT);
                    const isShare = url.includes(SHARE_FRAGMENT);
                    if (!isSettings && !isShare && !URL_FRAGMENTS.some(f => url.includes(f))) return;
                    const json = JSON.parse(this.responseText);
                    if (isSettings) {
                        applySettings(url, json);
                        return;
                    }
                    if (isShare) {
                        // Geteilte Unterhaltung: Tokenstand steckt in data.biz_data.messages[].accumulated_token_usage
                        const shareTokens = extractTokenUsage(json);
                        const shareSession = sessionFromLocation() || 'share';
                        log('Share-Inhalt →', shareTokens);
                        if (shareTokens !== null) handle(shareTokens, shareSession);
                        else handleSession(shareSession);
                        return;
                    }
                    noteSession(json);
                    checkContextExceeded(json);
                    const biz = bizData(json);
                    const sessionId = (biz && biz.chat_session && biz.chat_session.id) || sessionIdFromUrl(url);
                    const tokens = extractTokenUsage(json);
                    if (tokens !== null) {
                        handle(tokens, sessionId);
                    } else {
                        handleSession(sessionId);
                        log('kein Tokenwert in XHR-Antwort, cache_control =', biz && biz.cache_control);
                        refetchFullHistory(url, this.__tokenbadge_headers);
                    }
                } catch (err) {
                    log('xhr hook error', err);
                }
            });
            return origSend.apply(this, args);
        };
    }

    log('xDeepSeek Token Badge v1.2.7 geladen.');
})();
