// ==UserScript==
// @name         xDeepSeek Token Badge
// @namespace    https://greasyfork.org/de/users/1629833-immerzu
// @version      1.0.2
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

    const log = (...a) => { if (DEBUG) console.log('[TokenBadge]', ...a); };

    let badgeEl   = null;
    let lastValue = null;

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
        if (lastValue !== null) renderValue(lastValue);
        return badgeEl;
    }

    function renderValue(tokens) {
        const el = ensureBadge();
        if (!el) return;
        if (tokens == null || !Number.isFinite(tokens)) {
            el.textContent = '📊 --';
            return;
        }
        const pct = (tokens / CONTEXT_SIZE * 100).toFixed(2);
        const fmt = tokens.toLocaleString();
        el.textContent = `📊 ${fmt} / 1M  (${pct} %)`;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ensureBadge(), { once: true });
    } else {
        ensureBadge();
    }

    // ---------------------------------------------------------------------
    // Extraktion des Token-Werts aus der API-Antwort
    // ---------------------------------------------------------------------
    function extractTokenUsage(json) {
        try {
            const msgs = json?.data?.biz_data?.chat_messages;
            if (!Array.isArray(msgs) || msgs.length === 0) return null;

            let max = null;
            for (const m of msgs) {
                const v = m?.accumulated_token_usage;
                if (typeof v === 'number' && Number.isFinite(v)) {
                    if (max === null || v > max) max = v;
                }
            }
            return max;
        } catch (err) {
            log('extract error', err);
            return null;
        }
    }

    function handle(tokens) {
        if (tokens === null) return;
        if (tokens === lastValue) return;
        lastValue = tokens;
        renderValue(tokens);
        log('Badge aktualisiert →', tokens);
    }

    // ---------------------------------------------------------------------
    // fetch()-Hook
    // ---------------------------------------------------------------------
    const originalFetch = window.fetch;
    if (typeof originalFetch === 'function') {
        window.fetch = async function (...args) {
            const response = await originalFetch.apply(this, args);
            try {
                let url = '';
                if (typeof args[0] === 'string') url = args[0];
                else if (args[0] && typeof args[0] === 'object') url = args[0].url || '';
                else if (args[0] instanceof Request) url = args[0].url;

                if (url && URL_FRAGMENTS.some(f => url.includes(f))) {
                    const clone = response.clone();
                    clone.json()
                        .then(json => {
                            const t = extractTokenUsage(json);
                            if (t !== null) handle(t);
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
    // XMLHttpRequest-Hook (Fallback)
    // ---------------------------------------------------------------------
    const XHR = window.XMLHttpRequest;
    if (typeof XHR === 'function') {
        const origOpen = XHR.prototype.open;
        const origSend = XHR.prototype.send;

        XHR.prototype.open = function (method, url, ...rest) {
            this.__tokenbadge_url = url;
            return origOpen.call(this, method, url, ...rest);
        };

        XHR.prototype.send = function (...args) {
            this.addEventListener('load', function () {
                try {
                    const url = this.__tokenbadge_url || '';
                    if (!URL_FRAGMENTS.some(f => url.includes(f))) return;
                    const json = JSON.parse(this.responseText);
                    const t = extractTokenUsage(json);
                    if (t !== null) handle(t);
                } catch (err) {
                    log('xhr hook error', err);
                }
            });
            return origSend.apply(this, args);
        };
    }

    log('xDeepSeek Token Badge v1.0.2 geladen.');
})();
