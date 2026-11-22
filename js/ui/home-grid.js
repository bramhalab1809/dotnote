window.ILW = window.ILW || {};

(function (ILW) {
    function renderHomeLettersGrid() {
        const grid = ILW.dom.homeLettersGrid;
        if (!grid) return;
        grid.innerHTML = '';

        const frag = document.createDocumentFragment();
        const { letters, currentLetterId, openDropdownId } = ILW.state;

        letters.forEach((letter, index) => {
            const isActive = letter.id === currentLetterId;
            const hasRight = (letter.rightText || '').trim().length > 0;
            const titleText = (letter.title || '').trim();
            const dateStr = ILW.formatDate(
                letter.createdAt || parseInt(letter.id, 10) || letter.updatedAt
            );
            const isMenuOpen = openDropdownId === letter.id;

            const wrap = document.createElement('div');
            wrap.style.animationDelay = `${(index % 6) * 0.42}s`;
            wrap.className = `floating-card-wrap ${isMenuOpen ? 'menu-open z-50' : 'z-10'}`;

            const card = document.createElement('div');
            card.className = `floating-card relative group rounded-2xl bg-white/92 dark:bg-zinc-900/92 border ${
                isActive
                    ? 'border-indigo-400/90 dark:border-indigo-500/80'
                    : 'border-white/90 dark:border-zinc-700/80 hover:border-indigo-300 dark:hover:border-indigo-500/70'
            } px-3 py-2.5 pt-3.5 cursor-pointer transition-all duration-300 inline-flex items-center gap-2.5 max-w-[215px] sm:max-w-[235px]`;

            card.addEventListener('click', () => ILW.editor.openNoteFromHome(letter.id));

            card.innerHTML = `
                <span class="date-stamp absolute -top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-indigo-50/95 dark:bg-indigo-950/95 text-indigo-600 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800/80 shadow-sm pointer-events-none whitespace-nowrap">
                    ${dateStr}
                </span>
                <div class="p-2 rounded-xl shrink-0 ${
                    isActive
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'bg-zinc-100/90 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-500'
                } transition-colors">
                    <i data-lucide="${hasRight ? 'columns-2' : 'file-text'}" class="w-4 h-4"></i>
                </div>
                <div class="min-w-0 flex items-center">
                    ${titleText
                        ? `<p class="text-xs sm:text-sm font-semibold truncate max-w-[115px] sm:max-w-[130px] text-zinc-800 dark:text-zinc-100">${ILW.escapeHTML(titleText)}</p>`
                        : ILW.buildThreeDotsHTML(isActive)
                    }
                </div>
                <div class="relative card-menu-wrapper shrink-0 -mr-1">
                    <button type="button" data-card-menu="${letter.id}" aria-label="Letter Options" title="Options"
                        class="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 active:scale-90 transition-all">
                        <i data-lucide="more-vertical" class="w-4 h-4"></i>
                    </button>
                    ${isMenuOpen ? `
                        <div class="absolute right-0 top-9 z-50 flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-1 shadow-2xl">
                            <button type="button" data-card-download="${letter.id}" aria-label="Download" title="Download"
                                class="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 active:scale-90 transition-all">
                                <i data-lucide="download" class="w-4 h-4"></i>
                            </button>
                            <button type="button" data-card-delete="${letter.id}" aria-label="Delete" title="Delete"
                                class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-red-500 dark:text-red-400 active:scale-90 transition-all">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;

            const menuBtn = card.querySelector('[data-card-menu]');
            if (menuBtn) {
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    ILW.state.openDropdownId = ILW.state.openDropdownId === letter.id ? null : letter.id;
                    renderHomeLettersGrid();
                });
            }

            const dlBtn = card.querySelector('[data-card-download]');
            if (dlBtn) {
                dlBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    ILW.editor.downloadLetterById(letter.id);
                });
            }

            const delBtn = card.querySelector('[data-card-delete]');
            if (delBtn) {
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    ILW.ui.openDeleteConfirm(letter.id);
                });
            }

            wrap.appendChild(card);
            frag.appendChild(wrap);
        });

        grid.appendChild(frag);
        ILW.refreshIcons(grid);
    }

    ILW.homeGrid = { render: renderHomeLettersGrid };
})(window.ILW);
