window.ILW = window.ILW || {};

(function (ILW) {
    function renderSidebarList() {
        const list = ILW.dom.lettersList;
        if (!list) return;
        list.innerHTML = '';

        const frag = document.createDocumentFragment();
        ILW.state.letters.forEach((letter) => {
            const isActive = letter.id === ILW.state.currentLetterId;
            const hasRight = (letter.rightText || '').trim().length > 0;
            const titleText = (letter.title || '').trim();

            const item = document.createElement('div');
            item.className = `flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                isActive
                    ? 'bg-white dark:bg-zinc-800 shadow-md border-2 border-indigo-500'
                    : 'bg-white/60 dark:bg-zinc-800/40 hover:bg-white dark:hover:bg-zinc-800 border border-transparent'
            }`;
            item.addEventListener('click', () => ILW.editor.selectLetter(letter.id));

            item.innerHTML = `
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div class="p-2 rounded-xl shrink-0 ${isActive ? 'bg-indigo-500 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}">
                        <i data-lucide="${hasRight ? 'columns-2' : 'file-text'}" class="w-4 h-4"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        ${titleText
                            ? `<span class="block text-xs font-medium truncate text-zinc-700 dark:text-zinc-200">${ILW.escapeHTML(titleText)}</span>`
                            : ILW.buildThreeDotsHTML(isActive)
                        }
                    </div>
                </div>
                <button type="button" data-sidebar-delete="${letter.id}" aria-label="Delete Letter" title="Delete"
                    class="ml-2 p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/60 text-zinc-400 hover:text-red-500 transition-colors shrink-0">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            `;

            const delBtn = item.querySelector('[data-sidebar-delete]');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openDeleteConfirm(letter.id);
                });
            }
            frag.appendChild(item);
        });

        list.appendChild(frag);
        ILW.refreshIcons(list);
    }

    function renderSettingsNotesList() {
        const list = ILW.dom.settingsNotesList;
        if (!list) return;
        list.innerHTML = '';

        const frag = document.createDocumentFragment();
        ILW.state.letters.forEach((letter) => {
            const isActive = letter.id === ILW.state.currentLetterId;
            const hasRight = (letter.rightText || '').trim().length > 0;
            const titleText = (letter.title || '').trim();

            const item = document.createElement('div');
            item.className = `flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all ${
                isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-400'
                    : 'bg-zinc-100/80 dark:bg-zinc-800/70 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 border border-transparent'
            }`;
            item.addEventListener('click', () => ILW.editor.openNoteFromSettings(letter.id));

            item.innerHTML = `
                <div class="flex items-center gap-2.5 flex-1 min-w-0">
                    <div class="p-2 rounded-xl shrink-0 ${isActive ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}">
                        <i data-lucide="${hasRight ? 'columns-2' : 'file-text'}" class="w-4 h-4"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        ${titleText
                            ? `<span class="block text-xs font-medium truncate text-zinc-700 dark:text-zinc-200">${ILW.escapeHTML(titleText)}</span>`
                            : ILW.buildThreeDotsHTML(isActive)
                        }
                    </div>
                </div>
                <div class="ml-2 p-1.5 text-zinc-400">
                    <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
                </div>
            `;
            frag.appendChild(item);
        });

        list.appendChild(frag);
        ILW.refreshIcons(list);
    }

    function toggleSidebar() {
        const { sidebar, sidebarBackdrop } = ILW.dom;
        const isClosed = sidebar.classList.contains('-translate-x-full');
        if (isClosed) {
            renderSidebarList();
            sidebar.classList.remove('-translate-x-full');
            sidebarBackdrop.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            sidebarBackdrop.classList.add('hidden');
        }
    }

    function toggleSettings(show) {
        if (ILW.suggestions) ILW.suggestions.hide();
        if (show) {
            renderSettingsNotesList();
            ILW.dom.settingsModal.classList.remove('hidden');
        } else {
            ILW.dom.settingsModal.classList.add('hidden');
        }
    }

    function openDeleteConfirm(id) {
        ILW.state.openDropdownId = null;
        ILW.homeGrid.render();
        ILW.state.pendingDeleteId = id;
        ILW.dom.deleteConfirmModal.classList.remove('hidden');
        ILW.refreshIcons(ILW.dom.deleteConfirmModal);
    }

    function closeDeleteConfirm() {
        ILW.state.pendingDeleteId = null;
        ILW.dom.deleteConfirmModal.classList.add('hidden');
    }

    function applySettings() {
        const { theme, fontSize, fontFamily } = ILW.state.settings;
        const btnLight = document.getElementById('btn-light');
        const btnDark = document.getElementById('btn-dark');

        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            btnDark.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-500/10');
            btnLight.classList.remove('ring-2', 'ring-amber-500', 'bg-amber-500/10');
        } else {
            document.documentElement.classList.remove('dark');
            btnLight.classList.add('ring-2', 'ring-amber-500', 'bg-amber-500/10');
            btnDark.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-500/10');
        }

        ILW.dom.editorLeft.style.fontSize = `${fontSize}px`;
        ILW.dom.editorRight.style.fontSize = `${fontSize}px`;
        if (ILW.dom.fontSizeBadge) {
            ILW.dom.fontSizeBadge.textContent = `${fontSize}px`;
        }

        ['font-sans', 'font-serif', 'font-mono'].forEach((f) => {
            ILW.dom.editorLeft.classList.remove(f);
            ILW.dom.editorRight.classList.remove(f);
            const btn = document.getElementById(`${f}-btn`);
            if (btn) btn.classList.remove('ring-2', 'ring-indigo-500', 'bg-indigo-500/10');
        });
        ILW.dom.editorLeft.classList.add(fontFamily);
        ILW.dom.editorRight.classList.add(fontFamily);
        const activeBtn = document.getElementById(`${fontFamily}-btn`);
        if (activeBtn) activeBtn.classList.add('ring-2', 'ring-indigo-500', 'bg-indigo-500/10');
    }

    function setTheme(theme) {
        ILW.state.settings.theme = theme;
        ILW.storage.set('ilw_theme', theme);
        applySettings();
    }

    function changeFontSize(delta) {
        ILW.state.settings.fontSize = Math.max(12, Math.min(40, ILW.state.settings.fontSize + delta));
        ILW.storage.set('ilw_fontSize', ILW.state.settings.fontSize);
        applySettings();
        ILW.showToast(delta > 0 ? 'a-arrow-up' : 'a-arrow-down');
    }

    function setFontFamily(family) {
        ILW.state.settings.fontFamily = family;
        ILW.storage.set('ilw_fontFamily', family);
        applySettings();
    }

    ILW.ui = {
        renderSidebarList,
        renderSettingsNotesList,
        renderAllLists: () => {
            ILW.homeGrid.render();
            renderSidebarList();
            renderSettingsNotesList();
        },
        toggleSidebar,
        toggleSettings,
        openDeleteConfirm,
        closeDeleteConfirm,
        applySettings,
        setTheme,
        changeFontSize,
        setFontFamily
    };
})(window.ILW);
