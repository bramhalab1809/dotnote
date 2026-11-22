window.ILW = window.ILW || {};

(function (ILW) {
    let mirrorEl = null;

    const MIRROR_PROPS = [
        'direction', 'boxSizing', 'width', 'overflowX', 'overflowY',
        'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
        'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
        'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize',
        'lineHeight', 'fontFamily', 'textAlign', 'textTransform',
        'textIndent', 'letterSpacing', 'wordSpacing', 'tabSize'
    ];

    function getMirror() {
        if (!mirrorEl) {
            mirrorEl = document.createElement('div');
            mirrorEl.style.position = 'fixed';
            mirrorEl.style.visibility = 'hidden';
            mirrorEl.style.pointerEvents = 'none';
            mirrorEl.style.whiteSpace = 'pre-wrap';
            mirrorEl.style.wordWrap = 'break-word';
            mirrorEl.style.top = '0';
            mirrorEl.style.left = '-9999px';
            document.body.appendChild(mirrorEl);
        }
        return mirrorEl;
    }

    ILW.positionSuggestionBar = function (editor, caretIndex) {
        const bar = ILW.dom.suggestionBar;
        if (!bar) return;

        const mirror = getMirror();
        const style = window.getComputedStyle(editor);
        for (let i = 0; i < MIRROR_PROPS.length; i++) {
            mirror.style[MIRROR_PROPS[i]] = style[MIRROR_PROPS[i]];
        }

        mirror.textContent = editor.value.substring(0, caretIndex);
        const span = document.createElement('span');
        span.textContent = editor.value.substring(caretIndex, caretIndex + 1) || '.';
        mirror.appendChild(span);

        const editorRect = editor.getBoundingClientRect();
        const spanTop = span.offsetTop - editor.scrollTop;
        const spanLeft = span.offsetLeft - editor.scrollLeft;

        const barHeight = bar.offsetHeight || 38;
        const barWidth = bar.offsetWidth || 220;
        const lineHeight = parseFloat(style.lineHeight) || (parseFloat(style.fontSize) * 1.5) || 26;
        const vpH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const vpW = window.visualViewport ? window.visualViewport.width : window.innerWidth;

        const caretTop = editorRect.top + spanTop;
        const aboveTop = caretTop - barHeight - 8;
        const belowTop = caretTop + lineHeight + 6;
        const minTop = Math.max(64, editorRect.top + 4);
        const maxTop = Math.min(editorRect.bottom, vpH) - barHeight - 8;

        const topPos = Math.max(minTop, Math.min(maxTop, aboveTop >= minTop ? aboveTop : belowTop));
        const leftPos = Math.max(10, Math.min(vpW - barWidth - 10, editorRect.left + spanLeft));

        bar.style.top = `${topPos}px`;
        bar.style.left = `${leftPos}px`;
    };
})(window.ILW);
