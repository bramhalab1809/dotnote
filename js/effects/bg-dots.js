window.ILW = window.ILW || {};

(function (ILW) {
    let animId = null;
    let paused = false;

    function init() {
        const canvas = ILW.dom.bgDotsCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        let time = 0;
        let dots = [];

        const mouse = { x: -9999, y: -9999, radius: 125 };
        const radiusSq = mouse.radius * mouse.radius;

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        }, { passive: true });

        const resetPointer = () => {
            mouse.x = -9999;
            mouse.y = -9999;
        };
        window.addEventListener('touchend', resetPointer, { passive: true });
        window.addEventListener('mouseleave', resetPointer, { passive: true });

        function buildGrid() {
            width = window.innerWidth;
            height = window.innerHeight;
            const spacing = width < 640 ? 44 : 40;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            dots = [];
            const cols = Math.ceil(width / spacing) + 1;
            const rows = Math.ceil(height / spacing) + 1;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const bx = c * spacing;
                    const by = r * spacing;
                    dots.push({ bx, by, x: bx, y: by, vx: 0, vy: 0, phase: (c + r) * 0.35 });
                }
            }
        }

        buildGrid();
        window.addEventListener('resize', buildGrid);

        function tick() {
            if (paused || document.hidden) {
                animId = null;
                return;
            }

            ctx.clearRect(0, 0, width, height);
            time += 0.022;
            const isDark = ILW.state.settings.theme === 'dark';
            const baseFill = isDark ? 'rgba(161,161,170,0.22)' : 'rgba(113,113,122,0.22)';

            for (let i = 0; i < dots.length; i++) {
                const d = dots[i];
                const tx = d.bx + Math.cos(time + d.phase) * 2.2;
                const ty = d.by + Math.sin(time + d.phase) * 2.2;

                const dx = d.x - mouse.x;
                const dy = d.y - mouse.y;
                const distSq = dx * dx + dy * dy;
                let proximity = 0;

                if (distSq < radiusSq && distSq > 0.001) {
                    const dist = Math.sqrt(distSq);
                    proximity = 1 - (dist / mouse.radius);
                    const force = proximity * 3.2;
                    d.vx += (dx / dist) * force;
                    d.vy += (dy / dist) * force;
                }

                d.vx = (d.vx + (tx - d.x) * 0.08) * 0.82;
                d.vy = (d.vy + (ty - d.y) * 0.08) * 0.82;
                d.x += d.vx;
                d.y += d.vy;

                ctx.beginPath();
                ctx.arc(d.x, d.y, 1.5 + proximity * 2.2, 0, 6.2831853);
                ctx.fillStyle = proximity > 0.05
                    ? (isDark
                        ? `rgba(129,140,248,${0.35 + proximity * 0.65})`
                        : `rgba(79,70,229,${0.30 + proximity * 0.65})`)
                    : baseFill;
                ctx.fill();
            }

            animId = requestAnimationFrame(tick);
        }

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !paused && !animId) {
                animId = requestAnimationFrame(tick);
            }
        });

        ILW.bgDots = {
            pause: () => {
                paused = true;
                if (animId) {
                    cancelAnimationFrame(animId);
                    animId = null;
                }
            },
            resume: () => {
                paused = false;
                if (!animId) animId = requestAnimationFrame(tick);
            }
        };

        animId = requestAnimationFrame(tick);
    }

    ILW.initBgDots = init;
})(window.ILW);
