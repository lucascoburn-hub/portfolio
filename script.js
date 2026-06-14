'use strict';

// ── NAV SCROLL ─────────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── MOBILE MENU ────────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
  });
});

// ── SCROLL REVEAL ──────────────────────────────────────────────
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.fade-up, .client-section__media, .client-section__content'
).forEach(el => revealObserver.observe(el));

// ── COUNTER + CHART ANIMATION (single shared rAF loop) ─────────
function animateStats(section) {
  const duration = 1800;
  const pause    = 3000;

  const counters = Array.from(section.querySelectorAll('.counter')).map(el => ({
    el,
    target: parseInt(el.dataset.target, 10),
    suffix: el.dataset.suffix || '',
  }));

  const charts = Array.from(section.querySelectorAll('.stats__chart svg')).map(svg => {
    const line = svg.querySelector('.chart-line');
    const area = svg.querySelector('.chart-area');
    const dot  = svg.querySelector('.chart-dot');
    const len  = line ? line.getTotalLength() : 0;
    if (line) line.style.strokeDasharray = len;
    return { line, area, dot, len };
  });

  function runCycle() {
    counters.forEach(({ el, suffix }) => { el.textContent = '0' + suffix; });
    charts.forEach(({ line, area, dot, len }) => {
      if (line) line.style.strokeDashoffset = len;
      if (area) area.style.opacity = 0;
      if (dot)  { dot.style.opacity = 0; dot.style.transform = 'scale(0)'; }
    });

    const start = performance.now();

    function tick(now) {
      const p     = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);

      counters.forEach(({ el, target, suffix }) => {
        el.textContent = Math.round(eased * target) + suffix;
      });

      charts.forEach(({ line, area, dot, len }) => {
        if (line) line.style.strokeDashoffset = len * (1 - eased);
        if (area) area.style.opacity = Math.max(0, (p - 0.2) / 0.8) * 0.45;
        if (dot && p > 0.85) {
          const dp = (p - 0.85) / 0.15;
          dot.style.opacity   = dp;
          dot.style.transform = `scale(${dp})`;
        }
      });

      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(runCycle, pause);
      }
    }
    requestAnimationFrame(tick);
  }

  runCycle();
}

const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    animateStats(e.target);
    statsObserver.unobserve(e.target);
  });
}, { threshold: 0.2 });

const statsSection = document.getElementById('stats');
if (statsSection) statsObserver.observe(statsSection);

// ── VIDEO MODAL + LIGHTBOX ─────────────────────────────────────
const clientVideos = {
  james: [
    'assets/work/james-1.mp4',
    'assets/work/james-2.mp4',
    'assets/work/james-3.mp4',
  ],
  fin: [
    'assets/work/fin-1.mp4',
    'assets/work/fin-2.mp4',
    'assets/work/fin-3.mp4',
  ],
  fon: [
    'assets/work/fon-1.mp4',
    'assets/work/fon-2.mp4',
  ],
  bruno: [
    'assets/work/bruno-1.mp4',
  ],
};

const clientLabels = {
  james: 'James Magnussen',
  fin:   'Fin Kwong',
  fon:   'First or Nothing',
  bruno: 'Bruno Casanovas',
};

const backdrop        = document.getElementById('modal-backdrop');
const modal           = document.getElementById('video-modal');
const modalTrack      = document.getElementById('modal-track');
const modalClose      = document.getElementById('modal-close');
const modalClientName = document.getElementById('modal-client-name');
const lightbox        = document.getElementById('vid-lightbox');
const lightboxClose   = document.getElementById('vid-lightbox-close');
const lightboxVideo   = document.getElementById('vid-lightbox-video');

// ── Lightbox ───────────────────────────────────────────────────
function openLightbox(src) {
  lightboxVideo.src = src;
  lightbox.classList.add('open');
  lightboxVideo.play().catch(() => {});
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightboxVideo.pause();
  lightboxVideo.src = '';
}

lightboxClose.addEventListener('click', e => {
  e.stopPropagation();
  closeLightbox();
});

lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

// ── Modal ──────────────────────────────────────────────────────
function openModal(clientKey) {
  const videos = clientVideos[clientKey];
  if (!videos) return;

  modalTrack.innerHTML = '';
  videos.forEach(src => {
    const item = document.createElement('div');
    item.className = 'modal-video-item';

    // Static thumbnail — shows first frame, no controls, not playing
    const thumb = document.createElement('video');
    thumb.src         = src;
    thumb.controls    = false;
    thumb.playsinline = true;
    thumb.preload     = 'metadata';
    thumb.muted       = true;

    // Play icon overlay
    const playIcon = document.createElement('div');
    playIcon.className = 'modal-play-icon';
    playIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;

    // Click thumbnail → expand into lightbox and play
    item.addEventListener('click', () => openLightbox(src));

    item.appendChild(thumb);
    item.appendChild(playIcon);
    modalTrack.appendChild(item);
  });

  modalClientName.textContent = clientLabels[clientKey] || '';
  backdrop.classList.add('open');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  closeLightbox();
  backdrop.classList.remove('open');
  modal.classList.remove('open');
  document.body.style.overflow = '';
  modalTrack.querySelectorAll('video').forEach(v => { v.src = ''; });
  modalTrack.innerHTML = '';
}

document.querySelectorAll('.view-work-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    openModal(btn.dataset.client);
  });
});

backdrop.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => e.stopPropagation());

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (lightbox.classList.contains('open')) closeLightbox();
    else closeModal();
  }
});

// ── CLIENT SECTION SCROLL FADE IN/OUT ─────────────────────────
(function () {
  const sections = Array.from(document.querySelectorAll('.client-section'));
  if (!sections.length) return;

  // Start invisible
  sections.forEach(s => { s.style.opacity = '0'; });

  let rafPending = false;

  function updateFades() {
    const vh = window.innerHeight;
    sections.forEach(s => {
      const rect = s.getBoundingClientRect();
      const center = rect.top + rect.height / 2;

      let opacity;
      if (center > vh) {
        opacity = 0; // below viewport
      } else if (center > vh * 0.7) {
        opacity = 1 - (center - vh * 0.7) / (vh - vh * 0.7); // fading in
      } else if (center > vh * 0.3) {
        opacity = 1; // fully visible
      } else if (center > 0) {
        opacity = center / (vh * 0.3); // fading out
      } else {
        opacity = 0; // above viewport
      }

      s.style.opacity = Math.max(0, Math.min(1, opacity));
    });
    rafPending = false;
  }

  window.addEventListener('scroll', () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateFades);
    }
  }, { passive: true });

  updateFades(); // run once on load
})();

// ── CURSOR-FOLLOWING BUTTON (Contact section) ─────────────────
(function () {
  const contact = document.getElementById('contact');
  const btn     = document.getElementById('cursor-btn');
  if (!contact || !btn) return;

  if (!window.matchMedia('(hover: hover)').matches) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let raf = null;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate() {
    currentX = lerp(currentX, targetX, 0.12);
    currentY = lerp(currentY, targetY, 0.12);
    btn.style.left = currentX + 'px';
    btn.style.top  = currentY + 'px';
    raf = requestAnimationFrame(animate);
  }

  contact.addEventListener('mouseenter', () => {
    btn.classList.add('is-visible');
    if (!raf) raf = requestAnimationFrame(animate);
  });

  contact.addEventListener('mouseleave', () => {
    btn.classList.remove('is-visible');
    cancelAnimationFrame(raf);
    raf = null;
  });

  contact.addEventListener('mousemove', e => {
    const rect = contact.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
  });
})();
