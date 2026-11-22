window.ILW = window.ILW || {};

(function (ILW) {
    let toastTimer = null;

    ILW.showToast = function (iconName) {
        const toast = ILW.dom.toast;
        const wrap = ILW.dom.toastIconWrap;
        if (!toast || !wrap) return;

        wrap.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5"></i>`;
        ILW.refreshIcons(wrap);

        toast.classList.remove('opacity-0');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.add('opacity-0');
        }, 900);
    };

    ILW.triggerTextDownload = function (content, fileName) {
        const blob = new Blob([content || ''], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Delayed revoke prevents download cancellation on Android Chrome
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        ILW.showToast('download');
    };
})(window.ILW);
