window.ILW = window.ILW || {};

(function (ILW) {
    const MAX_SUGGESTIONS = 12;
    let rafId = null;

    const sState = {
        activeEditor: null,
        matches: [],
        selectedIndex: 0,
        wordStart: 0,
        wordEnd: 0
    };

    function hide() {
        ILW.dom.suggestionBar.classList.add('hidden');
        ILW.dom.suggestionBar.classList.remove('flex');
        sState.matches = [];
        sState.selectedIndex = 0;
    }

    function applySelected() {
        const { activeEditor, matches, selectedIndex, wordStart, wordEnd } = sState;
        if (!activeEditor || !matches[selectedIndex]) return;
        activeEditor.focus();
        activeEditor.setRangeText(matches[selectedIndex] + ' ', wordStart, wordEnd, 'end');
        hide();
        ILW.editor.saveCurrentNow();
    }

    function render(scrollToActive) {
        const track = ILW.dom.suggestionTrack;
        const bar = ILW.dom.suggestionBar;
        const moreBtn = ILW.dom.suggestionMoreBtn;

        track.innerHTML = '';
        let activeBtn = null;
        const buttons = [];

        sState.matches.forEach((word, idx) => {
            const isSelected = idx === sState.selectedIndex;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = word;
            btn.className = `shrink-0 px-2.5 py-1 text-sm rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`;
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                sState.selectedIndex = idx;
                applySelected();
            });
            if (isSelected) activeBtn = btn;
            buttons.push(btn);
            track.appendChild(btn);
        });

        moreBtn.classList.toggle('hidden', sState.matches.length <= 3);
        bar.classList.remove('hidden');
        bar.classList.add('flex');

        if (buttons.length > 3) {
            const threeW = buttons.slice(0, 3).reduce((acc, b) => acc + b.offsetWidth, 0) + 12;
            const maxW = Math.min(280, Math.max(180, window.innerWidth - 64));
            track.style.maxWidth = `${Math.min(threeW, maxW)}px`;
        } else {
            track.style.maxWidth = `${Math.max(180, window.innerWidth - 40)}px`;
        }

        if (scrollToActive && activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
        } else if (!scrollToActive) {
            track.scrollLeft = 0;
        }
    }

    function computeMatches(editor) {
        const cursorPos = editor.selectionStart;
        const textBefore = editor.value.slice(0, cursorPos);
        const match = textBefore.match(/([A-Za-z]{2,})$/);
        if (!match) {
            hide();
            return;
        }

        const currentWord = match[1];
        const lower = currentWord.toLowerCase();
        const key = lower.slice(0, 2);
        const seen = new Set();
        const results = [];

        const pushWord = (w) => {
            if (results.length >= MAX_SUGGESTIONS) return;
            if (w !== lower && w.startsWith(lower) && !seen.has(w)) {
                seen.add(w);
                results.push(w);
            }
        };

        const userWords = ILW.state.userWordCache || [];
        for (let i = 0; i < userWords.length && results.length < MAX_SUGGESTIONS; i++) {
            pushWord(userWords[i]);
        }

        const bucket = ILW.WORD_PREFIX_INDEX ? ILW.WORD_PREFIX_INDEX.get(key) : null;
        if (bucket) {
            for (let i = 0; i < bucket.length && results.length < MAX_SUGGESTIONS; i++) {
                pushWord(bucket[i]);
            }
        }

        if (results.length === 0) {
            hide();
            return;
        }

        const isCap = currentWord[0] === currentWord[0].toUpperCase();
        sState.activeEditor = editor;
        sState.matches = results.map((w) => (isCap ? w[0].toUpperCase() + w.slice(1) : w));
        sState.selectedIndex = 0;
        sState.wordStart = cursorPos - currentWord.length;
        sState.wordEnd = cursorPos;

        render(false);
        ILW.positionSuggestionBar(editor, sState.wordStart);
    }

    function setup() {
        [ILW.dom.editorLeft, ILW.dom.editorRight].forEach((editor) => {
            editor.addEventListener('input', () => {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => computeMatches(editor));
            });
            editor.addEventListener('keydown', (e) => {
                if (ILW.dom.suggestionBar.classList.contains('hidden') || sState.activeEditor !== editor) return;
                if (e.key === 'Tab') {
                    e.preventDefault();
                    const len = sState.matches.length;
                    sState.selectedIndex = e.shiftKey
                        ? (sState.selectedIndex - 1 + len) % len
                        : (sState.selectedIndex + 1) % len;
                    render(true);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    applySelected();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    hide();
                }
            });
            editor.addEventListener('scroll', () => {
                if (sState.activeEditor === editor && !ILW.dom.suggestionBar.classList.contains('hidden')) {
                    ILW.positionSuggestionBar(editor, sState.wordStart);
                }
            });
            editor.addEventListener('blur', () => {
                setTimeout(() => {
                    if (document.activeElement !== ILW.dom.editorLeft && document.activeElement !== ILW.dom.editorRight) {
                        hide();
                    }
                }, 180);
            });
        });

        ILW.dom.suggestionTrack.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                ILW.dom.suggestionTrack.scrollLeft += e.deltaY;
            }
        }, { passive: false });

        ILW.dom.suggestionBar.addEventListener('pointerdown', (e) => {
            if (e.target === ILW.dom.suggestionBar || e.target === ILW.dom.suggestionTrack) {
                e.preventDefault();
            }
        });

        ILW.dom.suggestionMoreBtn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (sState.matches.length > 0) {
                sState.selectedIndex = (sState.selectedIndex + 1) % sState.matches.length;
                render(true);
            }
        });
    }

    ILW.suggestions = { setup, hide };
})(window.ILW);
