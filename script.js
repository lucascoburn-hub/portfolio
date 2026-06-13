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

  // Collect counters
  const counters = Array.from(section.querySelectorAll('.counter')).map(el => ({
    el,
    target: parseInt(el.dataset.target, 10),
    suffix: el.dataset.suffix || '',
  }));

  // Collect charts
  const charts = Array.from(section.querySelectorAll('.stats__chart svg')).map(svg => {
    const line = svg.querySelector('.chart-line');
    const area = svg.querySelector('.chart-area');
    const dot  = svg.querySelector('.chart-dot');
    const len  = line ? line.getTotalLength() : 0;
    if (line) line.style.strokeDasharray = len;
    return { line, area, dot, len };
  });

  function runCycle() {
    // Reset everything
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

      // Counters — same eased progress
      counters.forEach(({ el, target, suffix }) => {
        el.textContent = Math.round(eased * target) + suffix;
      });

      // Charts — same eased progress
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

// ── VIDEO MODAL ────────────────────────────────────────────────
const clientVideos = {
  james: [
    'assets/work/james-1.mp4',
    'assets/work/james-2.mp4',
  ],
  fin: [
    'assets/work/fin-1.mp4',
    'assets/work/fin-2.mp4',
  ],
  fon: [
    'assets/work/fon-1.mp4',
    'assets/work/fon-2.mp4',
  ],
};

const clientLabels = {
  james: 'James Magnussen',
  fin:   'Fin Kwong',
  fon:   'First or Nothing',
};

const backdrop       = document.getElementById('modal-backdrop');
const modal          = document.getElementById('video-modal');
const modalTrack     = document.getElementById('modal-track');
const modalClose     = document.getElementById('modal-close');
const modalClientName = document.getElementById('modal-client-name');

function openModal(clientKey) {
  const videos = clientVideos[clientKey];
  if (!videos) return;

  // Populate track
  modalTrack.innerHTML = '';
  videos.forEach(src => {
    const item  = document.createElement('div');
    item.className = 'modal-video-item';

    const vid = document.createElement('video');
    vid.src         = src;
    vid.controls    = true;
    vid.playsinline = true;
    vid.preload     = 'metadata';
    // NOT muted — user can hear audio

    item.appendChild(vid);
    modalTrack.appendChild(item);
  });

  modalClientName.textContent = clientLabels[clientKey] || '';

  backdrop.classList.add('open');
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Auto-play first video
  const firstVid = modalTrack.querySelector('video');
  if (firstVid) firstVid.play().catch(() => {});
}

function closeModal() {
  backdrop.classList.remove('open');
  modal.classList.remove('open');
  document.body.style.overflow = '';

  // Pause and clear all videos to stop audio
  modalTrack.querySelectorAll('video').forEach(v => {
    v.pause();
    v.src = '';
  });
  modalTrack.innerHTML = '';
}

// Open on "View Work" button click
document.querySelectorAll('.view-work-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation(); // don't trigger the Instagram link on the media pane
    openModal(btn.dataset.client);
  });
});

// Close on backdrop or × button
backdrop.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Prevent modal click from closing when clicking inside
modal.addEventListener('click', e => e.stopPropagation());

// ── CURSOR-FOLLOWING BUTTON (Contact section) ─────────────────
(function () {
  const contact   = document.getElementById('contact');
  const btn       = document.getElementById('cursor-btn');
  if (!contact || !btn) return;

  // Only activate on non-touch devices
  if (!window.matchMedia('(hover: hover)').matches) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let raf = null;
  let inside = false;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate() {
    currentX = lerp(currentX, targetX, 0.12);
    currentY = lerp(currentY, targetY, 0.12);
    btn.style.left = currentX + 'px';
    btn.style.top  = currentY + 'px';
    raf = requestAnimationFrame(animate);
  }

  contact.addEventListener('mouseenter', () => {
    inside = true;
    btn.classList.add('is-visible');
    if (!raf) raf = requestAnimationFrame(animate);
  });

  contact.addEventListener('mouseleave', () => {
    inside = false;
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

// Pause non-visible videos as user scrolls through the modal track
modalTrack.addEventListener('scroll', () => {
  const trackRect = modalTrack.getBoundingClientRect();
  modalTrack.querySelectorAll('video').forEach(vid => {
    const r = vid.getBoundingClientRect();
    const visible = r.left < trackRect.right && r.right > trackRect.left;
    if (!visible) vid.pause();
  });
}, { passive: true });
