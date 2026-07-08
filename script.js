'use strict';

/* ══ AUDIO ENGINE ═══════════════════════════════════════════ */
const sfx = {
  subhit:   document.getElementById('sfx-subhit'),
  ambience: document.getElementById('sfx-ambience'),
  whoosh:   document.getElementById('sfx-whoosh'),
  cwhoosh:  document.getElementById('sfx-cwhoosh'),
  click:    document.getElementById('sfx-click'),
  click2:   document.getElementById('sfx-click2'),
};

sfx.subhit.volume   = 0.9;   // the entry boom — loud but clean
sfx.ambience.volume = 0;
sfx.whoosh.volume   = 0.16;  // scroll transformation whoosh
sfx.cwhoosh.volume  = 0.12;  // carousel slide swoosh
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

function playWhoosh() {
  if (!audioStarted) return;
  sfx.whoosh.currentTime = 0;
  sfx.whoosh.play().catch(() => {});
}

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

let whooshPlayed = false;
let statsPlayed  = false;

function clamp01(v) { return Math.max(0, Math.min(1, v)); }
function phase(p, a, b) {
  const t = clamp01((p - a) / (b - a));
  return t * t * (3 - 2 * t); // smoothstep
}

let storyRaf = false;
function updateStory() {
  storyRaf = false;
  if (!story) return;
  const vh = window.innerHeight;
  const total = story.offsetHeight - vh;
  const p = clamp01((-story.getBoundingClientRect().top) / total);

  // 1. Hero text fades out completely first
  const heroFade = 1 - phase(p, 0.02, 0.2);
  storyHero.style.opacity = heroFade;
  storyHero.style.visibility = heroFade < 0.01 ? 'hidden' : 'visible';

  // 2. Only then the image grows to cover the screen (16:9 box, cover scale)
  const grow = phase(p, 0.22, 0.58);
  const coverScale = Math.max(
    window.innerWidth  / storyImg.offsetWidth,
    window.innerHeight / storyImg.offsetHeight
  );
  const scale = 1 + grow * (coverScale - 1);
  const yDrift = grow * -4; // settle to true center as it fills
  storyImg.style.transform =
    `translate(-50%, calc(-50% + ${yDrift}vh)) scale(${scale})`;

  // 3. Crossfade mountain → running as the growth finishes
  runningImg.style.opacity = phase(p, 0.52, 0.64);

  // 4. Hold the running image alone for a beat…
  // 5. …then the about text and animations fade in
  const aboutIn = phase(p, 0.76, 0.9);
  storyAbout.style.opacity = aboutIn;
  storyAbout.style.pointerEvents = aboutIn > 0.5 ? 'auto' : 'none';

  // Whoosh rides along with the image movement
  if (p > 0.22 && !whooshPlayed) { whooshPlayed = true; playWhoosh(); }
  if (p < 0.08 && whooshPlayed) whooshPlayed = false;

  // Stats animate once about is visible
  if (p > 0.82 && !statsPlayed) {
    statsPlayed = true;
    const stats = document.getElementById('stats');
    if (stats) animateStats(stats);
  }

  // Nature ambience fades away as you leave the mountain
  ambienceTarget = 0.1 * (1 - phase(p, 0.3, 0.7));
}

window.addEventListener('scroll', () => {
  if (!storyRaf) { storyRaf = true; requestAnimationFrame(updateStory); }
}, { passive: true });
window.addEventListener('resize', updateStory);
updateStory();

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
