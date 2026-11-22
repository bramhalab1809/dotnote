window.ILW = window.ILW || {};

(function (ILW) {
    let saveTimeout = null;
    let saveIndicatorTimer = null;

    function hasDraftContent(title, left, right) {
        return Boolean((title || '').trim() || (left || '').trim() || (right || '').trim());
    }

    function updateModeSwitchIcon() {
        const btn = ILW.dom.modeSwitchBtn;
        const isMobile = window.innerWidth < 768;
        if (ILW.state.mode === 'split') {
            btn.innerHTML = '<i data-lucide="square" class="w-5 h-5"></i>';
            btn.title = 'Switch to Single View';
            btn.setAttribute('aria-label', 'Switch to Single View');
        } else {
            const icon = isMobile ? 'rows-2' : 'columns-2';
            btn.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5"></i>`;
            btn.title = 'Switch to Split View';
            btn.setAttribute('aria-label', 'Switch to Split View');
        }
        ILW.refreshIcons(btn);
    }

    function updateSplitUI() {
        ILW.dom.paneLeft.style.flex = '1 1 0%';
        ILW.dom.paneRight.style.flex = '1 1 0%';
        if (ILW.state.mode === 'split') {
            ILW.dom.paneRight.classList.remove('hidden');
            ILW.dom.splitDivider.classList.remove('hidden');
        } else {
            ILW.dom.paneRight.classList.add('hidden');
            ILW.dom.splitDivider.classList.add('hidden');
        }
        updateModeSwitchIcon();
    }

    function openEditor(mode) {
        ILW.state.mode = mode;
        ILW.state.openDropdownId = null;
        ILW.dom.homeView.classList.add('hidden');
        ILW.dom.editorView.classList.remove('hidden');
        if (ILW.suggestions) ILW.suggestions.hide();
        if (ILW.bgDots) ILW.bgDots.pause();
        updateSplitUI();
    }

    // Always opens a fresh blank draft when clicking Single/Split on Home
    function startFreshEditor(mode) {
        ILW.state.currentLetterId = Date.now().toString();
        ILW.dom.letterTitleInput.value = '';
        ILW.dom.editorLeft.value = '';
        ILW.dom.editorRight.value = '';
        openEditor(mode);
        setTimeout(() => ILW.dom.editorLeft.focus(), 40);
    }

    async function goHome() {
        clearTimeout(saveTimeout);
        await saveCurrentNow();
        if (ILW.suggestions) ILW.suggestions.hide();
        ILW.state.openDropdownId = null;
        ILW.dom.editorView.classList.add('hidden');
        ILW.dom.homeView.classList.remove('hidden');
        ILW.ui.renderAllLists();
        if (ILW.bgDots) ILW.bgDots.resume();
        if (!ILW.dom.sidebar.classList.contains('-translate-x-full')) {
            ILW.ui.toggleSidebar();
        }
    }

    function toggleSplitMode() {
        ILW.state.mode = ILW.state.mode === 'split' ? 'single' : 'split';
        if (ILW.suggestions) ILW.suggestions.hide();
        updateSplitUI();
    }

    function loadLetterIntoEditors(id) {
        const letter = ILW.state.letters.find((l) => l.id === id);
        if (!letter) return;
        ILW.state.currentLetterId = id;
        ILW.dom.letterTitleInput.value = letter.title || '';
        ILW.dom.editorLeft.value = letter.leftText || '';
        ILW.dom.editorRight.value = letter.rightText || '';
        if (ILW.suggestions) ILW.suggestions.hide();
    }

    function buildActiveDraftRecord() {
        const title = ILW.dom.letterTitleInput.value;
        const leftText = ILW.dom.editorLeft.value;
        const rightText = ILW.dom.editorRight.value;
        const { currentLetterId, letters } = ILW.state;
        if (!currentLetterId) return null;

        let letter = letters.find((l) => l.id === currentLetterId);
        if (!letter) {
            if (!hasDraftContent(title, leftText, rightText)) return null;
            const now = Date.now();
            letter = {
                id: currentLetterId, title, leftText, rightText,
                createdAt: parseInt(currentLetterId, 10) || now,
                updatedAt: now
            };
            letters.unshift(letter);
        } else {
            if (!letter.createdAt) letter.createdAt = parseInt(letter.id, 10) || Date.now();
            letter.title = title;
            letter.leftText = leftText;
            letter.rightText = rightText;
            letter.updatedAt = Date.now();
        }
        return letter;
    }

    async function saveCurrentNow() {
        const letter = buildActiveDraftRecord();
        if (!letter) return;

        await ILW.db.saveLetter(letter, ILW.state.letters);
        ILW.db.persistFallback(ILW.state.letters);
        if (ILW.learner) { ILW.learner.learnFromText(letter.leftText); ILW.learner.learnFromText(letter.rightText); ILW.learner.save(); }

        ILW.dom.saveIndicator.classList.remove('opacity-0');
        clearTimeout(saveIndicatorTimer);
        saveIndicatorTimer = setTimeout(() => {
            ILW.dom.saveIndicator.classList.add('opacity-0');
        }, 850);
    }

    // Runs synchronously when app/tab is suddenly closed or backgrounded
    function emergencyFlushSync() {
        if (ILW.dom.editorView.classList.contains('hidden')) return;
        const letter = buildActiveDraftRecord();
        if (!letter) return;
        ILW.db.saveEmergencyDraftSync(letter);
        ILW.db.persistFallback(ILW.state.letters);
        ILW.db.saveLetter(letter, ILW.state.letters);
    }

    function setupAutoSave() {
        const triggerSave = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveCurrentNow, 350);
        };
        ILW.dom.letterTitleInput.addEventListener('input', triggerSave);
        ILW.dom.editorLeft.addEventListener('input', triggerSave);
        ILW.dom.editorRight.addEventListener('input', triggerSave);
        ILW.dom.editorLeft.addEventListener('paste', () => setTimeout(saveCurrentNow, 50));
        ILW.dom.editorRight.addEventListener('paste', () => setTimeout(saveCurrentNow, 50));

        window.addEventListener('pagehide', emergencyFlushSync);
        window.addEventListener('beforeunload', emergencyFlushSync);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') emergencyFlushSync();
        });
    }

    async function createNewLetter() {
        await saveCurrentNow();
        ILW.state.currentLetterId = Date.now().toString();
        ILW.dom.letterTitleInput.value = '';
        ILW.dom.editorLeft.value = '';
        ILW.dom.editorRight.value = '';
        if (ILW.suggestions) ILW.suggestions.hide();
        ILW.ui.renderAllLists();
        ILW.showToast('file-plus');
        ILW.dom.editorLeft.focus();
    }

    async function selectLetter(id) {
        await saveCurrentNow();
        loadLetterIntoEditors(id);
        ILW.ui.renderAllLists();
        ILW.ui.toggleSidebar();
    }

    async function openNoteFromHome(id) {
        await saveCurrentNow();
        loadLetterIntoEditors(id);
        const letter = ILW.state.letters.find((l) => l.id === id);
        openEditor(letter && (letter.rightText || '').trim().length > 0 ? 'split' : 'single');
    }

    async function openNoteFromSettings(id) {
        await saveCurrentNow();
        loadLetterIntoEditors(id);
        ILW.ui.toggleSettings(false);
        const letter = ILW.state.letters.find((l) => l.id === id);
        openEditor(letter && (letter.rightText || '').trim().length > 0 ? 'split' : 'single');
    }

    async function confirmDeleteLetter() {
        const id = ILW.state.pendingDeleteId;
        if (!id) return;
        ILW.ui.closeDeleteConfirm();
        ILW.state.letters = ILW.state.letters.filter((l) => l.id !== id);
        await ILW.db.deleteLetter(id, ILW.state.letters);

        if (ILW.state.currentLetterId === id) {
            if (ILW.state.letters.length > 0) {
                loadLetterIntoEditors(ILW.state.letters[0].id);
            } else {
                ILW.state.currentLetterId = Date.now().toString();
                ILW.dom.letterTitleInput.value = '';
                ILW.dom.editorLeft.value = '';
                ILW.dom.editorRight.value = '';
            }
        }
        if (ILW.learner) { ILW.learner.learnFromText(letter.leftText); ILW.learner.learnFromText(letter.rightText); ILW.learner.save(); }
        ILW.ui.renderAllLists();
        ILW.showToast('trash-2');
    }


    ILW.editor = Object.assign(ILW.editor || {}, {
        openEditor, startFreshEditor, goHome, toggleSplitMode, updateModeSwitchIcon,
        loadLetterIntoEditors, saveCurrentNow, setupAutoSave, emergencyFlushSync,
        createNewLetter, selectLetter, openNoteFromHome, openNoteFromSettings,
        confirmDeleteLetter
    });
})(window.ILW);
