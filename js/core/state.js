window.ILW = window.ILW || {};

(function (ILW) {
    function safeGetItem(key, fallback) {
        try {
            const val = localStorage.getItem(key);
            return val !== null ? val : fallback;
        } catch (err) {
            return fallback;
        }
    }

    function safeSetItem(key, value) {
        try {
            localStorage.setItem(key, String(value));
        } catch (err) {
            // Ignore storage restrictions
        }
    }

    ILW.storage = { get: safeGetItem, set: safeSetItem };

    ILW.state = {
        mode: 'split',
        currentLetterId: null,
        letters: [],
        openDropdownId: null,
        pendingDeleteId: null,
        userWordCache: [],
        settings: {
            theme: safeGetItem('ilw_theme', 'light'),
            fontSize: parseInt(safeGetItem('ilw_fontSize', '18'), 10) || 18,
            fontFamily: safeGetItem('ilw_fontFamily', 'font-sans')
        }
    };

    ILW.dom = {};

    ILW.cacheDom = function () {
        const ids = [
            'home-view', 'editor-view', 'pane-left', 'pane-right',
            'split-divider', 'editor-left', 'editor-right', 'sidebar',
            'sidebar-backdrop', 'letters-list', 'settings-notes-list',
            'home-letters-grid', 'settings-modal', 'delete-confirm-modal',
            'save-indicator', 'letter-title-input', 'suggestion-bar',
            'suggestion-track', 'suggestion-more-btn', 'mode-switch-btn',
            'font-size-badge', 'toast', 'toast-icon-wrap', 'bg-dots-canvas'
        ];
        ids.forEach((id) => {
            const camel = id.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
            ILW.dom[camel] = document.getElementById(id);
        });
    };

    // Scoped Lucide rendering avoids expensive full-document rescans
    ILW.refreshIcons = function (rootEl) {
        if (!window.lucide || typeof window.lucide.createIcons !== 'function') return;
        if (rootEl) {
            window.lucide.createIcons({ root: rootEl });
        } else {
            window.lucide.createIcons();
        }
    };

    ILW.escapeHTML = function (str) {
        return String(str).replace(/[&<>"']/g, (m) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    };

    ILW.formatDate = function (timestamp) {
        const d = new Date(timestamp || Date.now());
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${mm}-${dd}-${d.getFullYear()}`;
    };

    ILW.buildThreeDotsHTML = function (isActive) {
        const dotColor = isActive
            ? 'bg-indigo-500 dark:bg-indigo-400'
            : 'bg-zinc-400 dark:bg-zinc-500';
        return `
            <div class="flex items-center gap-1 px-0.5" aria-label="Untitled letter">
                <span class="w-1.5 h-1.5 rounded-full ${dotColor}"></span>
                <span class="w-1.5 h-1.5 rounded-full ${dotColor} opacity-75"></span>
                <span class="w-1.5 h-1.5 rounded-full ${dotColor} opacity-50"></span>
            </div>
        `;
    };

    // Refresh cached user words only on load/save instead of every keystroke
    ILW.rebuildUserWordCache = function () {
        const seen = new Set();
        const words = [];
        const addFrom = (text) => {
            if (!text) return;
            const found = text.match(/[A-Za-z]{3,}/g);
            if (!found) return;
            for (let i = 0; i < found.length; i++) {
                const lw = found[i].toLowerCase();
                if (!seen.has(lw)) {
                    seen.add(lw);
                    words.push(lw);
                }
            }
        };
        ILW.state.letters.forEach((l) => {
            addFrom(l.leftText);
            addFrom(l.rightText);
        });
        ILW.state.userWordCache = words;
    };
})(window.ILW);
