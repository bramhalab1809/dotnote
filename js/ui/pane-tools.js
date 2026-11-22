window.ILW = window.ILW || {};

(function (ILW) {
    async function pasteToPane(pane) {
        const target = pane === 'left' ? ILW.dom.editorLeft : ILW.dom.editorRight;
        target.focus();
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                if (text) {
                    target.setRangeText(text, target.selectionStart, target.selectionEnd, 'end');
                    ILW.editor.saveCurrentNow();
                    ILW.showToast('clipboard-check');
                    return;
                }
            }
        } catch (err) {
            // Fallback below
        }
        try {
            document.execCommand('paste');
            ILW.editor.saveCurrentNow();
            ILW.showToast('clipboard-check');
        } catch (err) {
            ILW.showToast('alert-circle');
        }
    }

    async function copyFromPane(pane) {
        const target = pane === 'left' ? ILW.dom.editorLeft : ILW.dom.editorRight;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(target.value);
                ILW.showToast('check');
                return;
            }
        } catch (err) {
            // Fallback below
        }
        const s = target.selectionStart;
        const e = target.selectionEnd;
        target.select();
        try {
            document.execCommand('copy');
            ILW.showToast('check');
        } catch (err) {
            ILW.showToast('alert-circle');
        }
        target.setSelectionRange(s, e);
    }

    function clearPane(pane) {
        const target = pane === 'left' ? ILW.dom.editorLeft : ILW.dom.editorRight;
        target.value = '';
        if (ILW.suggestions) ILW.suggestions.hide();
        ILW.editor.saveCurrentNow();
        ILW.showToast('eraser');
    }

    function downloadPane(pane) {
        const target = pane === 'left' ? ILW.dom.editorLeft : ILW.dom.editorRight;
        const clean = (ILW.dom.letterTitleInput.value || '').trim().replace(/[^a-z0-9_\-\s]/gi, '_');
        ILW.triggerTextDownload(
            target.value,
            clean ? `${clean}-${pane}.txt` : `letter-${pane}-${Date.now()}.txt`
        );
    }

    function setupResizer() {
        let isResizing = false;
        const start = (e) => {
            if (e.cancelable) e.preventDefault();
            isResizing = true;
            document.body.style.cursor = window.innerWidth >= 768 ? 'col-resize' : 'row-resize';
        };
        const move = (e) => {
            if (!isResizing) return;
            if (e.cancelable) e.preventDefault();
            const rect = document.getElementById('workspace').getBoundingClientRect();
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            const cy = e.touches ? e.touches[0].clientY : e.clientY;
            const pct = window.innerWidth >= 768
                ? Math.max(15, Math.min(85, ((cx - rect.left) / rect.width) * 100))
                : Math.max(15, Math.min(85, ((cy - rect.top) / rect.height) * 100));
            ILW.dom.paneLeft.style.flex = `0 0 ${pct}%`;
            ILW.dom.paneRight.style.flex = '1 1 0%';
        };
        const stop = () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
            }
        };

        ILW.dom.splitDivider.addEventListener('mousedown', start);
        ILW.dom.splitDivider.addEventListener('touchstart', start, { passive: false });
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('mouseup', stop);
        window.addEventListener('touchend', stop);
        window.addEventListener('touchcancel', stop);
    }

    ILW.editor = Object.assign(ILW.editor || {}, {
        pasteToPane,
        copyFromPane,
        clearPane,
        downloadPane,
        setupResizer
    });
})(window.ILW);
