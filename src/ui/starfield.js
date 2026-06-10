/**
 * starfield.js — Canvas de estrelas animadas
 * Reutilizado nas telas de intro, menu, etc.
 */
export function initStarfield(canvasEl) {
  const ctx  = canvasEl.getContext('2d');
  let stars  = [];
  let raf;

  function resize() {
    canvasEl.width  = window.innerWidth;
    canvasEl.height = window.innerHeight;
    buildStars();
  }

  function buildStars() {
    stars = [];
    const N = Math.floor((canvasEl.width * canvasEl.height) / 900);
    for (let i = 0; i < N; i++) {
      stars.push({
        x:  Math.random() * canvasEl.width,
        y:  Math.random() * canvasEl.height,
        r:  Math.random() * 1.4 + 0.2,
        o:  Math.random() * 0.7 + 0.3,
        sp: Math.random() * 0.012 + 0.003,
        ph: Math.random() * Math.PI * 2,
      });
    }
  }

  function animate(ts) {
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    stars.forEach(s => {
      const alpha = s.o * (0.5 + 0.5 * Math.sin(ts * s.sp + s.ph));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,220,255,${alpha})`;
      ctx.fill();
    });
    raf = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(animate);

  return {
    stop: () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); },
  };
}
