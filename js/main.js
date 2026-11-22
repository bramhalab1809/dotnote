window.ILW = window.ILW || {};

(function (ILW) {
    function bindEvents() {
        // Home main circular buttons
        document.getElementById('btn-open-single').addEventListener('click', () => ILW.editor.openEditor('single'));
        document.getElementById('btn-open-split').addEventListener('click', () => ILW.editor.openEditor('split'));
        document.getElementById('btn-open-settings').addEventListener('click', () => ILW.ui.toggleSettings(true));

        // Editor top toolbar
        document.getElementById('btn-toggle-sidebar').addEventListener('click', ILW.ui.toggleSidebar);
        document.getElementById('btn-go-home').addEventListener('click', ILW.editor.goHome);
        document.getElementById('btn-download-editor').addEventListener('click', ILW.editor.downloadCurrentLetter);
        document.getElementById('btn-new-editor').addEventListener('click', ILW.editor.createNewLetter);
        ILW.dom.modeSwitchBtn.addEventListener('click', ILW.editor.toggleSplitMode);

        // Sidebar buttons
        document.getElementById('btn-sidebar-new').addEventListener('click', ILW.editor.createNewLetter);
        document.getElementById('btn-sidebar-close').addEventListener('click', ILW.ui.toggleSidebar);
        ILW.dom.sidebarBackdrop.addEventListener('click', ILW.ui.toggleSidebar);
        document.getElementById('btn-sidebar-settings').addEventListener('click', () => {
            ILW.ui.toggleSidebar();
            ILW.ui.toggleSettings(true);
        });

        // Pane actions (Paste, Copy, Download, Clear)
        document.querySelectorAll('[data-pane-action]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-pane-action');
                const pane = btn.getAttribute('data-pane');
                if (action === 'paste') ILW.editor.pasteToPane(pane);
                else if (action === 'copy') ILW.editor.copyFromPane(pane);
                else if (action === 'download') ILW.editor.downloadPane(pane);
                else if (action === 'clear') ILW.editor.clearPane(pane);
            });
        });

        // Settings modal
        document.getElementById('btn-close-settings').addEventListener('click', () => ILW.ui.toggleSettings(false));
        ILW.dom.settingsModal.addEventListener('click', (e) => {
            if (e.target === ILW.dom.settingsModal) ILW.ui.toggleSettings(false);
        });
        document.getElementById('btn-light').addEventListener('click', () => ILW.ui.setTheme('light'));
        document.getElementById('btn-dark').addEventListener('click', () => ILW.ui.setTheme('dark'));
        document.getElementById('btn-font-dec').addEventListener('click', () => ILW.ui.changeFontSize(-2));
        document.getElementById('btn-font-inc').addEventListener('click', () => ILW.ui.changeFontSize(2));
        document.getElementById('font-sans-btn').addEventListener('click', () => ILW.ui.setFontFamily('font-sans'));
        document.getElementById('font-serif-btn').addEventListener('click', () => ILW.ui.setFontFamily('font-serif'));
        document.getElementById('font-mono-btn').addEventListener('click', () => ILW.ui.setFontFamily('font-mono'));
        document.getElementById('btn-settings-download').addEventListener('click', ILW.editor.downloadCurrentLetter);

        // Delete confirmation modal
        document.getElementById('btn-cancel-delete').addEventListener('click', ILW.ui.closeDeleteConfirm);
        document.getElementById('btn-confirm-delete').addEventListener('click', ILW.editor.confirmDeleteLetter);
        ILW.dom.deleteConfirmModal.addEventListener('click', (e) => {
            if (e.target === ILW.dom.deleteConfirmModal) ILW.ui.closeDeleteConfirm();
        });

        // Close open 3-dot card menu when clicking outside
        document.addEventListener('click', (e) => {
            if (ILW.state.openDropdownId && !e.target.closest('.card-menu-wrapper')) {
                ILW.state.openDropdownId = null;
                ILW.homeGrid.render();
            }
        });

        // Escape key closes active overlay
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (!ILW.dom.deleteConfirmModal.classList.contains('hidden')) {
                ILW.ui.closeDeleteConfirm();
            } else if (!ILW.dom.settingsModal.classList.contains('hidden')) {
                ILW.ui.toggleSettings(false);
            } else if (!ILW.dom.sidebar.classList.contains('-translate-x-full')) {
                ILW.ui.toggleSidebar();
            } else if (ILW.state.openDropdownId) {
                ILW.state.openDropdownId = null;
                ILW.homeGrid.render();
            }
        });

        window.addEventListener('resize', () => {
            if (ILW.suggestions) ILW.suggestions.hide();
            if (!ILW.dom.editorView.classList.contains('hidden')) {
                ILW.editor.updateModeSwitchIcon();
            }
        });
    }

    async function bootstrap() {
        ILW.cacheDom();
        ILW.buildWordIndex();
        ILW.refreshIcons();
        ILW.ui.applySettings();
        bindEvents();
        ILW.initBgDots();

        await ILW.db.init();
        ILW.state.letters = await ILW.db.getAllLetters();

        if (ILW.state.letters.length === 0) {
            const now = Date.now();
            const firstLetter = {
                id: now.toString(),
                title: '',
                leftText: '',
                rightText: '',
                createdAt: now,
                updatedAt: now
            };
            ILW.state.letters.push(firstLetter);
            await ILW.db.saveLetter(firstLetter, ILW.state.letters);
        }

        ILW.rebuildUserWordCache();
        ILW.state.currentLetterId = ILW.state.letters[0].id;
        ILW.editor.loadLetterIntoEditors(ILW.state.currentLetterId);
        ILW.ui.renderAllLists();
        ILW.editor.setupAutoSave();
        ILW.editor.setupResizer();
        ILW.suggestions.setup();
    }

    window.addEventListener('DOMContentLoaded', bootstrap);
})(window.ILW);
