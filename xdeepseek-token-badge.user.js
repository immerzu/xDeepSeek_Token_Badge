// ==UserScript==
// @name         xDeepSeek Token Badge
// @namespace    https://greasyfork.org/de/users/1629833-immerzu
// @version      1.0.3
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
 * Kontextfenster-Größe wird über CONTEXT_SIZE konfiguriert.
 */

(function () {
    'use strict';

    // ---------------------------------------------------------------------
    // Konfiguration
    // ---------------------------------------------------------------------
    const URL_FRAGMENTS = ['/chat/history_messages', '/history_messages'];
    const CONTEXT_SIZE  = 1000000;   // DeepSeek V4: 1 Mio. Token
    const DEBUG         = false;     // true → Konsolen-Logs aktivieren
    const STORE_KEY     = 'xdsTokenBadge.sessionTokens';
    const REFETCH_DELAY = 4000;      // ms Mindestabstand zwischen zwei Nachladungen
    const STORE_MAX     = 200;       // max. Anzahl gemerkter Chats

    const log = (...a) => { if (DEBUG) console.log('[TokenBadge]', ...a); };

    let badgeEl        = null;
    let lastValue      = null;
    let lastStale      = false;
    let currentSession = null;
    let lastRefetchAt  = 0;

    // ---------------------------------------------------------------------
    // Badge (schwebende Anzeige unten rechts)
    // ---------------------------------------------------------------------
    function ensureBadge() {
        if (badgeEl && document.body.contains(badgeEl)) return badgeEl;
        if (!document.body) return null;

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
            'pointer-events:none',
            'user-select:none',
            'box-shadow:0 2px 10px rgba(0,0,0,0.25)',
            'backdrop-filter:blur(6px)',
            'transition:opacity .2s ease',
            'opacity:0.92'
        ].join(';');
        badgeEl.textContent = '📊 --';
        badgeEl.title = 'DeepSeek Kontext-Füllstand';
        document.body.appendChild(badgeEl);
        if (lastValue !== null) renderValue(lastValue, lastStale);
        return badgeEl;
    }

    function renderValue(tokens, stale) {
        const el = ensureBadge();
        if (!el) return;
        lastStale = !!stale;
        if (tokens == null || !Number.isFinite(tokens)) {
            el.textContent = '📊 --';
            el.title = 'DeepSeek Kontext-Füllstand — noch keine Daten';
            return;
        }
        const pct = (tokens / CONTEXT_SIZE * 100).toFixed(2);
        const fmt = tokens.toLocaleString();
        el.textContent = `📊 ${stale ? '~' : ''}${fmt} / 1M  (${pct} %)`;
        el.title = stale
            ? 'DeepSeek Kontext-Füllstand — letzter bekannter Wert für diesen Chat (Server lieferte nur ein Delta)'
            : 'DeepSeek Kontext-Füllstand';
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
    // Anzeige-Logik
    // ---------------------------------------------------------------------
    // Beim Chat-Wechsel darf der Wert des vorherigen Chats nicht stehen bleiben.
    function handleSession(sessionId) {
        if (!sessionId || sessionId === currentSession) return;
        currentSession = sessionId;
        lastValue = null;
        const known = recall(sessionId);
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
        const m = location.pathname.match(/\/a\/chat\/s\/([0-9a-fA-F-]{8,})/);
        return m ? m[1] : null;
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
    async function refetchFullHistory(url, headers) {
        let target;
        try { target = new URL(url, location.origin); }
        catch (err) { log('refetch url error', err); return; }

        // Nur nötig, wenn der Client Cache-Parameter mitgeschickt hat.
        if (!target.searchParams.has('cache_version') && !target.searchParams.has('cache_reset_at')) return;
        if (Date.now() - lastRefetchAt < REFETCH_DELAY) return;
        lastRefetchAt = Date.now();

        const sessionId = target.searchParams.get('chat_session_id');
        target.searchParams.delete('cache_version');
        target.searchParams.delete('cache_reset_at');

        try {
            const init = { method: 'GET', credentials: 'include' };
            if (headers && Object.keys(headers).length) init.headers = headers;
            const response = await originalFetch.call(window, target.toString(), init);
            const json = await response.json();
            const tokens = extractTokenUsage(json);
            log('Nachladen ohne Cache →', tokens);
            if (tokens !== null) handle(tokens, sessionId || (bizData(json) || {}).chat_session?.id || currentSession);
        } catch (err) {
            log('refetch error', err);
        }
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
                if (url && URL_FRAGMENTS.some(f => url.includes(f))) {
                    const fromUrl = sessionIdFromUrl(url);
                    response.clone().json()
                        .then(json => {
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
            this.addEventListener('load', function () {
                try {
                    const url = this.__tokenbadge_url || '';
                    if (!URL_FRAGMENTS.some(f => url.includes(f))) return;
                    const json = JSON.parse(this.responseText);
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

    log('xDeepSeek Token Badge v1.0.3 geladen.');
})();
