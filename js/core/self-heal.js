window.ILW = window.ILW || {};

(function (ILW) {
    let lastHealToastAt = 0;

    function sanitizeLetter(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const now = Date.now();
        const id = raw.id ? String(raw.id) : `${now}-${Math.random().toString(36).slice(2, 6)}`;
        const createdAt = Number.isFinite(Number(raw.createdAt)) ? Number(raw.createdAt) : (parseInt(id, 10) || now);
        const updatedAt = Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : createdAt;
        return {
            id,
            title: typeof raw.title === 'string' ? raw.title : '',
            leftText: typeof raw.leftText === 'string' ? raw.leftText : '',
            rightText: typeof raw.rightText === 'string' ? raw.rightText : '',
            createdAt,
            updatedAt
        };
    }

    function healLettersList(list) {
        if (!Array.isArray(list)) return [];
        const byId = new Map();
        for (let i = 0; i < list.length; i++) {
            const clean = sanitizeLetter(list[i]);
            if (!clean) continue;
            const prev = byId.get(clean.id);
            if (!prev || clean.updatedAt >= prev.updatedAt) {
                byId.set(clean.id, clean);
            }
        }
        return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    }

    function recoverUI() {
        try {
            if (ILW.editor && typeof ILW.editor.emergencyFlushSync === 'function') {
                ILW.editor.emergencyFlushSync();
            }
            if (ILW.suggestions) ILW.suggestions.hide();
            if (ILW.dom.settingsModal) ILW.dom.settingsModal.classList.add('hidden');
            if (ILW.dom.deleteConfirmModal) ILW.dom.deleteConfirmModal.classList.add('hidden');
            if (ILW.dom.sidebarBackdrop) ILW.dom.sidebarBackdrop.classList.add('hidden');
            if (ILW.dom.sidebar) ILW.dom.sidebar.classList.add('-translate-x-full');
            ILW.state.openDropdownId = null;

            const now = Date.now();
            if (now - lastHealToastAt > 4000 && ILW.showToast) {
                lastHealToastAt = now;
                ILW.showToast('shield-check');
            }
        } catch (err) {
            // Never throw inside recovery handler
        }
    }

    function installWatchdog() {
        window.addEventListener('error', () => recoverUI());
        window.addEventListener('unhandledrejection', (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            recoverUI();
        });
    }

    function exportBackupJSON() {
        const payload = {
            app: 'DotNote',
            version: 1,
            exportedAt: Date.now(),
            letters: healLettersList(ILW.state.letters),
            vocab: ILW.learner ? ILW.learner.exportData() : null
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dotnote-backup-${ILW.formatDate(Date.now())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        ILW.showToast('shield-check');
    }

    async function importBackupJSON(file) {
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const incoming = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.letters) ? parsed.letters : null);
            if (!incoming) {
                ILW.showToast('alert-circle');
                return;
            }
            const merged = healLettersList([...ILW.state.letters, ...incoming]);
            ILW.state.letters = merged;
            for (let i = 0; i < merged.length; i++) {
                await ILW.db.saveLetter(merged[i], merged);
            }
            ILW.db.persistFallback(merged);

            if (parsed && parsed.vocab && ILW.learner) {
                ILW.learner.importData(parsed.vocab);
            }
            if (ILW.learner) ILW.learner.learnFromLetters(merged);
            ILW.ui.renderAllLists();
            ILW.showToast('check');
        } catch (err) {
            ILW.showToast('alert-circle');
        }
    }

    ILW.heal = {
        sanitizeLetter,
        healLettersList,
        installWatchdog,
        exportBackupJSON,
        importBackupJSON
    };
})(window.ILW);
