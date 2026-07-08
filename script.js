'use strict';

/* ══ AUDIO ENGINE ═══════════════════════════════════════════ */
const sfx = {
  subhit:   document.getElementById('sfx-subhit'),
  ambience: document.getElementById('sfx-ambience'),
  cwhoosh:  document.getElementById('sfx-cwhoosh'),
  whoosh:   document.getElementById('sfx-whoosh'),
  click:    document.getElementById('sfx-click'),
  click2:   document.getElementById('sfx-click2'),
};

sfx.subhit.volume   = 0.9;   // the entry boom — loud but clean
sfx.ambience.volume = 0;
sfx.cwhoosh.volume  = 0.12;  // carousel slide swoosh
sfx.whoosh.volume   = 0.3;   // intro auto-play whoosh
sfx.click.volume    = 0.2;   // hover blip
sfx.click2.volume   = 0.1;   // pop-up open click

let audioStarted = false;
let ambienceTarget = 0.1; // set each frame by scroll progress

function startAudio() {
  if (audioStarted) return;
  const tryPlay = Promise.all([
    sfx.subhit.play(),
    sfx.ambience.play(),
  ]);
  tryPlay.then(() => {
    audioStarted = true;
  }).catch(() => {
    // Autoplay blocked — wait for first real interaction
    const unlock = () => {
      if (audioStarted) return;
      audioStarted = true;
      sfx.subhit.play().catch(() => {});
      sfx.ambience.play().catch(() => {});
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('wheel', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('wheel', unlock, { passive: true });
  });
}

// Smooth ambience volume toward target
setInterval(() => {
  if (!audioStarted) return;
  const v = sfx.ambience.volume;
  sfx.ambience.volume = Math.max(0, Math.min(1, v + (ambienceTarget - v) * 0.08));
}, 80);

function playClick() {
  if (!audioStarted) return;
  sfx.click.currentTime = 0;
  sfx.click.play().catch(() => {});
}

function playPopClick() {
  if (!audioStarted) return;
  sfx.click2.currentTime = 0;
  sfx.click2.play().catch(() => {});
}

// Tiny synthesized tick for the counter animation. `level` (0–1)
// scales the already-quiet volume so it fades with visibility.
let tickCtx = null;
function playTick(level) {
  if (!audioStarted || level <= 0.01) return;
  try {
    tickCtx = tickCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = tickCtx.currentTime;
    const osc  = tickCtx.createOscillator();
    const gain = tickCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 1800;
    gain.gain.setValueAtTime(0.018 * level, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    osc.connect(gain).connect(tickCtx.destination);
    osc.start(t);
    osc.stop(t + 0.035);
  } catch (e) { /* Web Audio unavailable — skip ticks */ }
}

// Hover click sound on interactive elements (delegated).
// No sound on: contact circle button, carousel arrows, video thumbnails,
// or View Work (it gets a single click sound on open instead).
document.addEventListener('pointerover', e => {
  const t = e.target.closest('a, button, .resource-card');
  if (!t || t.closest('.cursor-btn') || t.closest('.carousel-btn') || t.closest('.view-work-btn')) return;
  if (!(e.relatedTarget && t.contains(e.relatedTarget))) playClick();
});

/* ══ LOADER ═════════════════════════════════════════════════ */
(function () {
  const loader = document.getElementById('loader');
  const bar    = document.getElementById('loader-bar');
  if (!loader || !bar) return;

  // Creep the bar forward while assets load
  let fake = 0;
  const creep = setInterval(() => {
    fake = Math.min(fake + 12 + Math.random() * 10, 82);
    bar.style.width = fake + '%';
  }, 140);

  function finish() {
    clearInterval(creep);
    bar.style.width = '100%';
    setTimeout(() => {
      loader.classList.add('hidden');
      startAudio();
      setTimeout(() => loader.remove(), 2500);
    }, 350);
  }

  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish);

  // Safety: never hang more than 4s
  setTimeout(finish, 4000);
})();

/* ══ CURSOR TRAIL ═══════════════════════════════════════════ */
(function () {
  if (!window.matchMedia('(hover: hover)').matches) return;
  const COUNT = 12;
  const dots = Array.from({ length: COUNT }, (_, i) => {
    const el = document.createElement('div');
    el.className = 'cursor-trail-dot';
    el.style.opacity = (1 - i / COUNT) * 0.45;
    el.style.width = el.style.height = (6 - i * 0.3) + 'px';
    document.body.appendChild(el);
    return el;
  });

  const positions = Array.from({ length: COUNT }, () => ({ x: -100, y: -100 }));
  let mouse = { x: -100, y: -100 };

  window.addEventListener('mousemove', e => { mouse = { x: e.clientX, y: e.clientY }; });

  function animateTrail() {
    positions[0].x += (mouse.x - positions[0].x) * 0.35;
    positions[0].y += (mouse.y - positions[0].y) * 0.35;
    for (let i = 1; i < COUNT; i++) {
      positions[i].x += (positions[i - 1].x - positions[i].x) * 0.35;
      positions[i].y += (positions[i - 1].y - positions[i].y) * 0.35;
    }
    dots.forEach((dot, i) => {
      dot.style.left = positions[i].x + 'px';
      dot.style.top  = positions[i].y + 'px';
    });
    requestAnimationFrame(animateTrail);
  }
  animateTrail();
})();

/* ══ MELBOURNE CLOCK ════════════════════════════════════════ */
(function () {
  const clock = document.getElementById('nav-clock');
  if (!clock) return;
  const fmt = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  function tick() { clock.textContent = fmt.format(new Date()); }
  tick();
  setInterval(tick, 1000);
})();

/* ══ NAV ════════════════════════════════════════════════════ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

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

/* ══ SCROLL STORY (hero → about) ════════════════════════════ */
const story      = document.getElementById('story');
const storyHero  = document.getElementById('story-hero');
const storyImg   = document.getElementById('story-img');
const runningImg = document.getElementById('story-img-running');
const storyAbout = document.getElementById('story-about');

let statsPlayed = false;

// Split the About title into letters for the staggered sweep-in
(function () {
  const title = document.querySelector('.story__about-title');
  if (!title) return;
  title.innerHTML = title.textContent.split('').map((c, i) =>
    `<span class="char" style="transition-delay:${i * 45}ms">${c === ' ' ? '&nbsp;' : c}</span>`
  ).join('');
})();

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function phase(p, a, b) {
  const t = clamp01((p - a) / (b - a));
  return t * t * (3 - 2 * t); // smoothstep
}

// Scroll progress is lerped each frame so discrete wheel steps
// become a continuous glide instead of visible jumps.
let pTarget = 0;
let pSmooth = 0;

function readScrollTarget() {
  if (!story) return;
  const total = story.offsetHeight - window.innerHeight;
  pTarget = clamp01((-story.getBoundingClientRect().top) / total);
  // Keep the story current even if rAF is throttled (background tabs,
  // battery saver) — the loop takes over again once frames resume.
  pSmooth += (pTarget - pSmooth) * 0.09;
  renderStory(pSmooth);
}
window.addEventListener('scroll', readScrollTarget, { passive: true });
window.addEventListener('resize', readScrollTarget);
readScrollTarget();
pSmooth = pTarget;

function renderStory(p) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // 1. Hero text fades out completely first
  const heroFade = 1 - phase(p, 0.02, 0.2);
  storyHero.style.opacity = heroFade;
  storyHero.style.visibility = heroFade < 0.01 ? 'hidden' : 'visible';

  // 2. The 16:9 mask opens until the (already fullscreen) photo fills
  //    the viewport — no pixel scaling, so the reveal stays crisp.
  const grow = phase(p, 0.22, 0.58);
  const frameW = Math.min(vw * (vw <= 900 ? 0.92 : 0.74), vh * 1.18);
  const frameH = frameW * 9 / 16;
  const insetX      = ((vw - frameW) / 2) * (1 - grow);
  const insetTop    = (vh * 0.54 - frameH / 2) * (1 - grow);
  const insetBottom = (vh * 0.46 - frameH / 2) * (1 - grow);
  storyImg.style.clipPath =
    `inset(${insetTop}px ${insetX}px ${insetBottom}px ${insetX}px)`;

  // 3. Crossfade mountain → running as the reveal finishes
  runningImg.style.opacity = phase(p, 0.52, 0.64);

  // 4. Hold the running image alone for a beat…
  // 5. …then the about text and animations fade in
  const aboutIn = phase(p, 0.76, 0.9);
  storyAbout.style.opacity = aboutIn;
  storyAbout.style.pointerEvents = aboutIn > 0.5 ? 'auto' : 'none';
  storyAbout.classList.toggle('chars-in', aboutIn > 0.15);

  // Stats animate once about is visible
  if (p > 0.82 && !statsPlayed) {
    statsPlayed = true;
    const stats = document.getElementById('stats');
    if (stats) animateStats(stats);
  }

  // Nature ambience fades away as you leave the mountain
  ambienceTarget = 0.1 * (1 - phase(p, 0.3, 0.7));
}

(function storyLoop() {
  if (story) {
    pSmooth += (pTarget - pSmooth) * 0.09;
    if (Math.abs(pTarget - pSmooth) < 0.0005) pSmooth = pTarget;
    renderStory(pSmooth);
  }
  requestAnimationFrame(storyLoop);
})();

/* ══ PLAY-INTRO BUTTON (scored auto-scroll) ═════════════════ */
(function () {
  const playBtn = document.getElementById('story-play');
  if (!playBtn || !story) return;

  const DURATION = 3800; // ms — paced to the ~4s whoosh so sound and motion land together
  let playing = false;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function cancelOnUserScroll() { playing = false; }

  playBtn.addEventListener('click', () => {
    if (playing) return;
    playing = true;

    // Score the shot: whoosh starts with the motion
    if (audioStarted) {
      sfx.whoosh.currentTime = 0;
      sfx.whoosh.play().catch(() => {});
    }

    const startY = window.scrollY;
    const endY   = story.offsetHeight - window.innerHeight;
    const t0     = performance.now();

    // Hand over control if the user scrolls mid-play
    window.addEventListener('wheel', cancelOnUserScroll, { passive: true, once: true });
    window.addEventListener('touchmove', cancelOnUserScroll, { passive: true, once: true });

    function step(now) {
      if (!playing) return;
      const t = Math.min((now - t0) / DURATION, 1);
      window.scrollTo({ top: startY + (endY - startY) * easeInOutCubic(t), behavior: 'instant' });
      if (t < 1) requestAnimationFrame(step);
      else playing = false;
    }
    requestAnimationFrame(step);
  });
})();

/* ══ SCROLL REVEAL ══════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-up').forEach(el => revealObserver.observe(el));

/* ══ COUNTER + CHART ANIMATION ══════════════════════════════ */
function animateStats(section) {
  const duration = 1800;
  const pause    = 1000;

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
    let lastTickAt = 0;

    function tick(now) {
      const p     = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);

      // Soft tick in time with the counting, fading with visibility
      if (p < 1 && now - lastTickAt > 110) {
        lastTickAt = now;
        const vis = storyAbout ? parseFloat(storyAbout.style.opacity || 0) : 0;
        playTick(vis);
      }

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

/* ══ CLIENT CAROUSEL ════════════════════════════════════════ */
(function () {
  const track   = document.getElementById('clients-track');
  const btnPrev = document.getElementById('carousel-prev');
  const btnNext = document.getElementById('carousel-next');
  const elCur   = document.getElementById('carousel-current');
  const elTot   = document.getElementById('carousel-total');
  if (!track || !btnPrev || !btnNext) return;

  const panels = Array.from(track.querySelectorAll('.client-section'));
  const total  = panels.length;
  let current  = 0;

  elTot.textContent = total;

  function goTo(index, silent) {
    const prev = current;
    current = Math.max(0, Math.min(total - 1, index));
    track.style.transform = `translateX(${-current * track.clientWidth}px)`;
    elCur.textContent = current + 1;
    btnPrev.disabled = current === 0;
    btnNext.disabled = current === total - 1;
    if (!silent && current !== prev && audioStarted) {
      sfx.cwhoosh.currentTime = 0;
      sfx.cwhoosh.play().catch(() => {});
    }
  }

  btnPrev.addEventListener('click', () => goTo(current - 1));
  btnNext.addEventListener('click', () => goTo(current + 1));

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') goTo(current + 1);
    if (e.key === 'ArrowLeft')  goTo(current - 1);
  });

  window.addEventListener('resize', () => goTo(current, true));

  // Touch swipe on mobile
  const viewport = document.querySelector('.carousel-viewport');
  if (viewport) {
    let touchX = null;
    viewport.addEventListener('touchstart', e => {
      touchX = e.touches[0].clientX;
    }, { passive: true });
    viewport.addEventListener('touchend', e => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) goTo(dx < 0 ? current + 1 : current - 1);
      touchX = null;
    }, { passive: true });
  }

  goTo(0, true);
})();

/* ══ VIDEO MODAL + LIGHTBOX ═════════════════════════════════ */
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
    'assets/work/fon-3.mp4',
  ],
  bruno: [
    'assets/work/bruno-1.mp4',
    'assets/work/bruno-2.mp4',
    'assets/work/bruno-3.mp4',
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

function openLightbox(src) {
  playPopClick();
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

function openModal(clientKey) {
  const videos = clientVideos[clientKey];
  if (!videos) return;

  modalTrack.innerHTML = '';
  videos.forEach(src => {
    const item = document.createElement('div');
    item.className = 'modal-video-item';

    const thumb = document.createElement('video');
    thumb.src         = src;
    thumb.controls    = false;
    thumb.playsinline = true;
    thumb.preload     = 'metadata';
    thumb.muted       = true;

    const playIcon = document.createElement('div');
    playIcon.className = 'modal-play-icon';
    playIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;

    item.addEventListener('click', () => openLightbox(src));

    item.appendChild(thumb);
    item.appendChild(playIcon);
    modalTrack.appendChild(item);
  });

  modalClientName.textContent = clientLabels[clientKey] || '';
  playPopClick();
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

/* ══ CURSOR-FOLLOWING BUTTON (Contact) ══════════════════════ */
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
