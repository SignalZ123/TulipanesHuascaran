/* ==========================================================================
   Tulipanes Huascarán · main.js (ES6+, se carga con "defer")
   1) Enlaces dinámicos de WhatsApp   2) Carruseles accesibles   3) Acordeón FAQ
   ========================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIGURACIÓN — cambia solo estos datos
     phone: código de país + número, sin "+" ni espacios (Perú = 51)
     ------------------------------------------------------------------ */
  const CONFIG = {
    phone: '51962544456', // ← REEMPLAZAR por el WhatsApp real del negocio
    brand: 'Tulipanes Huascarán',
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ============================ 1) WHATSAPP ============================ */
  const buildMessage = (producto) =>
    producto
      ? `Hola ${CONFIG.brand}, deseo cotizar el producto: ${producto}`
      : `Hola ${CONFIG.brand}, deseo información sobre sus tulipanes.`;

  const buildWhatsAppUrl = (producto) =>
    `https://wa.me/${CONFIG.phone}?text=${encodeURIComponent(buildMessage(producto))}`;

  function initWhatsApp() {
    document.querySelectorAll('[data-wa]').forEach((link) => {
      link.href = buildWhatsAppUrl(link.dataset.producto);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });
  }

  /* ============================ 2) CARRUSEL ============================ */
  function initCarousel(root) {
    const track = root.querySelector('[data-track]');
    const slides = Array.from(track.children);
    const prev = root.querySelector('[data-prev]');
    const next = root.querySelector('[data-next]');
    const dots = Array.from(root.querySelectorAll('[data-dot]'));
    const pauseBtn = root.querySelector('[data-pause]');
    const status = root.querySelector('[data-status]');
    const controls = root.querySelector('[data-controls]');
    const interval = Number(root.dataset.autoplay) || 0;
    const loop = root.hasAttribute('data-loop');

    let index = 0;
    let timer = null;
    let userPaused = reduceMotion.matches; // sin autoplay si el usuario prefiere menos movimiento
    let hovering = false;
    let focusing = false;
    let visible = true;

    const behavior = () => (reduceMotion.matches ? 'auto' : 'smooth');
    const clamp = (i) => Math.max(0, Math.min(slides.length - 1, i));

    const goTo = (i, { fromUser = false } = {}) => {
      index = loop ? (i + slides.length) % slides.length : clamp(i);
      track.scrollTo({ left: slides[index].offsetLeft, behavior: behavior() });
      if (fromUser && interval) {
        userPaused = true; // si el usuario navega a mano, no peleamos con él
      }
      update();
    };

    const nearestIndex = () => {
      const x = track.scrollLeft;
      let best = 0;
      slides.forEach((s, i) => {
        if (Math.abs(s.offsetLeft - x) < Math.abs(slides[best].offsetLeft - x)) best = i;
      });
      return best;
    };

    const playing = () => interval && !userPaused && !hovering && !focusing && visible && !document.hidden;

    function update() {
      dots.forEach((dot, i) => {
        if (i === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (!loop) {
        const atStart = index === 0;
        const atEnd = index === slides.length - 1;
        if (prev) prev.setAttribute('aria-disabled', String(atStart));
        if (next) next.setAttribute('aria-disabled', String(atEnd));
      }
      if (status && !playing()) {
        status.textContent = `Imagen ${index + 1} de ${slides.length}`;
      }
      if (pauseBtn) {
        const paused = !interval ? true : userPaused;
        pauseBtn.dataset.state = paused ? 'paused' : 'playing';
        pauseBtn.setAttribute('aria-label', paused ? 'Reanudar carrusel automático' : 'Pausar carrusel automático');
      }
    }

    function schedule() {
      clearInterval(timer);
      timer = null;
      if (playing()) timer = setInterval(() => goTo(index + 1), interval);
    }

    // Controles
    if (prev) {
      prev.addEventListener('click', () => {
        if (prev.getAttribute('aria-disabled') !== 'true') goTo(index - 1, { fromUser: true });
        schedule();
      });
    }
    if (next) {
      next.addEventListener('click', () => {
        if (next.getAttribute('aria-disabled') !== 'true') goTo(index + 1, { fromUser: true });
        schedule();
      });
    }
    dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i, { fromUser: true }); schedule(); }));
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        userPaused = !userPaused;
        update();
        schedule();
      });
    }

    // Seguimiento del scroll (arrastre táctil, teclado, rueda)
    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const i = nearestIndex();
        if (i !== index) { index = i; update(); }
      });
    }, { passive: true });

    // Pausas automáticas (WCAG 2.2.2): hover, foco y pestaña/ventana oculta
    root.addEventListener('mouseenter', () => { hovering = true; schedule(); });
    root.addEventListener('mouseleave', () => { hovering = false; schedule(); });
    root.addEventListener('focusin', () => { focusing = true; schedule(); });
    root.addEventListener('focusout', () => { focusing = false; schedule(); });
    document.addEventListener('visibilitychange', schedule);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }, { threshold: 0.3 }).observe(root);
    }
    reduceMotion.addEventListener?.('change', (e) => { if (e.matches) userPaused = true; update(); schedule(); });

    // Re-alinear al cambiar el tamaño de la ventana
    window.addEventListener('resize', () => { track.scrollTo({ left: slides[index].offsetLeft, behavior: 'auto' }); }, { passive: true });

    if (controls) controls.dataset.ready = 'true';
    update();
    // El autoplay arranca cuando la página ya cargó: no compite con el LCP.
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', () => setTimeout(schedule, 1500), { once: true });
  }

  /* ============================ 3) ACORDEÓN FAQ ============================ */
  function initAccordion(root) {
    const triggers = Array.from(root.querySelectorAll('[data-accordion-trigger]'));

    const setOpen = (btn, open) => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    };

    triggers.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        setOpen(btn, btn.getAttribute('aria-expanded') !== 'true');
      });

      // Navegación con flechas, Inicio y Fin (patrón WAI-ARIA APG)
      btn.addEventListener('keydown', (e) => {
        const last = triggers.length - 1;
        let target = null;
        if (e.key === 'ArrowDown') target = triggers[i === last ? 0 : i + 1];
        else if (e.key === 'ArrowUp') target = triggers[i === 0 ? last : i - 1];
        else if (e.key === 'Home') target = triggers[0];
        else if (e.key === 'End') target = triggers[last];
        if (target) { e.preventDefault(); target.focus(); }
      });
    });
  }

  /* ============================ ARRANQUE ============================ */
  function init() {
    initWhatsApp();
    document.querySelectorAll('[data-carousel]').forEach(initCarousel);
    document.querySelectorAll('[data-accordion]').forEach(initAccordion);
    document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  // Con "defer" el DOM ya está listo; esto cubre también otros casos de carga.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
