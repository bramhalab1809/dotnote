window.ILW = window.ILW || {};

(function (ILW) {
    let saveTimeout = null;
    let saveIndicatorTimer = null;

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

    async function goHome() {
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

    async function saveCurrentNow() {
        const { currentLetterId, letters } = ILW.state;
        if (!currentLetterId) return;
        const letter = letters.find((l) => l.id === currentLetterId);
        if (!letter) return;

        if (!letter.createdAt) letter.createdAt = parseInt(letter.id, 10) || Date.now();
        letter.title = ILW.dom.letterTitleInput.value;
        letter.leftText = ILW.dom.editorLeft.value;
        letter.rightText = ILW.dom.editorRight.value;
        letter.updatedAt = Date.now();

        await ILW.db.saveLetter(letter, letters);
        ILW.rebuildUserWordCache();

        ILW.dom.saveIndicator.classList.remove('opacity-0');
        clearTimeout(saveIndicatorTimer);
        saveIndicatorTimer = setTimeout(() => {
            ILW.dom.saveIndicator.classList.add('opacity-0');
        }, 850);
    }

    function setupAutoSave() {
        const triggerSave = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveCurrentNow, 450);
        };
        ILW.dom.letterTitleInput.addEventListener('input', triggerSave);
        ILW.dom.editorLeft.addEventListener('input', triggerSave);
        ILW.dom.editorRight.addEventListener('input', triggerSave);
        ILW.dom.editorLeft.addEventListener('paste', () => setTimeout(saveCurrentNow, 60));
        ILW.dom.editorRight.addEventListener('paste', () => setTimeout(saveCurrentNow, 60));
    }

    async function createNewLetter() {
        await saveCurrentNow();
        const now = Date.now();
        const newLetter = {
            id: now.toString(), title: '', leftText: '', rightText: '',
            createdAt: now, updatedAt: now
        };
        ILW.state.letters.unshift(newLetter);
        await ILW.db.saveLetter(newLetter, ILW.state.letters);
        loadLetterIntoEditors(newLetter.id);
        ILW.ui.renderAllLists();
        ILW.showToast('file-plus');
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

        if (ILW.state.letters.length === 0) {
            const now = Date.now();
            const fresh = { id: now.toString(), title: '', leftText: '', rightText: '', createdAt: now, updatedAt: now };
            ILW.state.letters.push(fresh);
            await ILW.db.saveLetter(fresh, ILW.state.letters);
            loadLetterIntoEditors(fresh.id);
        } else if (ILW.state.currentLetterId === id) {
            loadLetterIntoEditors(ILW.state.letters[0].id);
        }
        ILW.rebuildUserWordCache();
        ILW.ui.renderAllLists();
        ILW.showToast('trash-2');
    }

    function downloadLetterById(id) {
        ILW.state.openDropdownId = null;
        ILW.homeGrid.render();
        const letter = ILW.state.letters.find((l) => l.id === id);
        if (!letter) return;
        const combined = letter.rightText ? `${letter.leftText}

--------------------

${letter.rightText}` : (letter.leftText || '');
        const clean = (letter.title || '').trim().replace(/[^a-z0-9_\-\s]/gi, '_');
        ILW.triggerTextDownload(combined, clean ? `${clean}.txt` : `letter-${letter.id}.txt`);
    }

    function downloadCurrentLetter() {
        const left = ILW.dom.editorLeft.value;
        const right = ILW.dom.editorRight.value;
        const combined = right ? `${left}

--------------------

${right}` : left;
        const clean = (ILW.dom.letterTitleInput.value || '').trim().replace(/[^a-z0-9_\-\s]/gi, '_');
        ILW.triggerTextDownload(combined, clean ? `${clean}.txt` : `letter-${Date.now()}.txt`);
    }

    ILW.editor = Object.assign(ILW.editor || {}, {
        openEditor, goHome, toggleSplitMode, updateModeSwitchIcon,
        loadLetterIntoEditors, saveCurrentNow, setupAutoSave,
        createNewLetter, selectLetter, openNoteFromHome, openNoteFromSettings,
        confirmDeleteLetter, downloadLetterById, downloadCurrentLetter
    });
})(window.ILW);
