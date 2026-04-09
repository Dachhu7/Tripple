/**
 * TheTripple — script.js (Production Build — Reviewed & Updated)
 *
 * CHANGES vs. previous version:
 * ─────────────────────────────────────────────────────────────
 * CHANGE 1 — Clients section completely rewritten.
 *   The old layout used a pinned ScrollTrigger that cycled
 *   through client items with text & details. The new layout
 *   is a pure CSS infinite-scroll logo marquee — no JS logic
 *   is needed (and the old activateClient / ScrollTrigger pin
 *   was removed). The clientsTl header animations also removed
 *   since the header no longer exists.
 *
 * CHANGE 2 — Removed all references to:
 *   .clients-title, .clients-subtitle, .clients-scroll-wrapper,
 *   .clients-left, .clients-right, .client-item, .client-img
 *   These elements no longer exist in the HTML.
 *
 * PRESERVED FIXES from previous version:
 * FIX 1  — Load-event race condition guard
 * FIX 2  — No duplicate gsap.registerPlugin
 * FIX 3  — Astronaut float gated to > 768px
 * FIX 4  — ScrollTrigger.normalizeScroll (desktop only)
 * FIX 5  — ScrollTrigger.config batch callbacks
 * FIX 6  — Hero text GSAP.set() seed
 * FIX 7  — Hero text px-based exit offsets
 * FIX 8  — Orientation-change double refresh
 */

// ─── 1. GSAP PLUGIN REGISTRATION (once, at parse time) ──────────────────────
gsap.registerPlugin(ScrollTrigger);

// ─── 2. DEVICE / PREFERENCE DETECTION ──────────────────────────────────────
let _mobile = window.innerWidth < 768;
let _tablet = window.innerWidth < 1024;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isMobile   = () => _mobile;
const isTablet   = () => _tablet;

// ─── 3. HERO TEXT ANIMATION ─────────────────────────────────────────────────
// FIX 6 & 7: seed GSAP tracker explicitly; use px-based exit offsets.
const mm = gsap.matchMedia();

mm.add('(min-width: 768px)', () => {
  if (prefersReducedMotion) return;

  gsap.set('.hero-text .left',  { x: () => -window.innerWidth * 1.5 });
  gsap.set('.hero-text .right', { x: () =>  window.innerWidth * 1.5 });

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
  tl.to('.hero-text .left',  { x: 0, duration: 3,   ease: 'power3.out', stagger: 0.3 }, 0);
  tl.to('.hero-text .right', { x: 0, duration: 3,   ease: 'power3.out' }, 0);
  tl.to({}, { duration: 1.5 });
  tl.to('.hero-text .left',  { x: () =>  window.innerWidth * 1.2, duration: 2.5, ease: 'power2.in', stagger: 0.2 });
  tl.to('.hero-text .right', { x: () => -window.innerWidth * 1.2, duration: 2.5, ease: 'power2.in' }, '<');

  return () => tl.kill();
});

mm.add('(max-width: 767px)', () => {
  // Mobile: CSS already shows text at transform:none / opacity:1.
  // Clear any residual GSAP inline styles.
  gsap.set('.hero-text .left',  { clearProps: 'all' });
  gsap.set('.hero-text .right', { clearProps: 'all' });
  return () => {};
});

// ─── 4. ASTRONAUT FLOAT ─────────────────────────────────────────────────────
// FIX 3: gated to > 768px — CSS media-query transforms stay intact below.
const astronaut = document.getElementById('astronaut');
let angle      = 0;
let rafId      = null;
let frameCount = 0;

function floatAstronaut() {
  rafId = requestAnimationFrame(floatAstronaut);
  frameCount++;
  // ~30fps throttle: skip every other frame
  if (frameCount % 2 !== 0) return;

  const x = Math.sin(angle * 0.8) * 60 + Math.sin(angle * 1.5) * 25;
  const y = Math.cos(angle * 0.7) * 50 + Math.cos(angle * 1.3) * 20;
  const r = Math.sin(angle * 0.4) * 8;
  const z = 0.7 + (Math.sin(angle * 0.5) + 1) / 2 * 0.6;

  // Single concatenated transform avoids multiple style mutations
  astronaut.style.transform =
    `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${r}deg) scale(${z})`;
  angle += 0.015;
}

if (astronaut && window.innerWidth > 768 && !prefersReducedMotion) {
  floatAstronaut();
}

// Pause float when page hidden — saves battery on mobile/background tabs
document.addEventListener('visibilitychange', () => {
  if (!astronaut || window.innerWidth <= 768) return;
  if (document.hidden) {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  } else if (!rafId) {
    floatAstronaut();
  }
});

// ─── 5. FILTER BUTTONS (event delegation — only if filters exist) ────────────
const filterContainer = document.querySelector('.filters');
if (filterContainer) {
  filterContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    filterContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
}

// ─── 6. MAIN SCROLL INIT ────────────────────────────────────────────────────
// FIX 1: Guard against load-event race on cached pages.
function initScrollAnimations() {

  // FIX 4 & 5: normalizeScroll + config — desktop only.
  // normalizeScroll on mobile intercepts native touch and causes jank.
  if (!isMobile()) {
    ScrollTrigger.normalizeScroll(true);
    ScrollTrigger.config({ limitCallbacks: true, syncInterval: 40 });
  }

  // ── NAVBAR ──────────────────────────────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  if (navbar) {
    ScrollTrigger.create({
      start:       'top -60px',
      onEnter:     () => navbar.classList.add('scrolled'),
      onLeaveBack: () => navbar.classList.remove('scrolled')
    });
  }

  // ── DESKTOP-ONLY SCROLL ANIMATIONS ──────────────────────────────────────────
  // On mobile (≤ 767px): all GSAP initial-state resets are handled in CSS
  // (@media max-width:767px block). No ScrollTriggers registered on mobile.
  if (!isMobile()) {

    // ── SERVICES SECTION ──────────────────────────────────────────────────────
    const srvHeaderTl = gsap.timeline({
      scrollTrigger: {
        trigger:       '.srv-header',
        start:         'top 88%',
        toggleActions: 'play none none none'
      }
    });

    srvHeaderTl
      .fromTo('.srv-eyebrow',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }
      )
      .fromTo('.srv-title-line',
        { opacity: 0, x: -60 },
        { opacity: 1, x: 0, duration: 1, ease: 'power4.out', stagger: 0.18 },
        '-=0.4'
      )
      .fromTo('.srv-header-right',
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 1, ease: 'power3.out' },
        '-=0.7'
      );

    // Ticker strip
    gsap.fromTo('#blogs-ticker',
      { opacity: 0, y: -20 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: {
          trigger:       '#blogs-ticker',
          start:         'top 92%',
          toggleActions: 'play none none none'
        }
      }
    );

    // Bento cards — staggered reveal per row
    document.querySelectorAll('.srv-bento-row').forEach((row) => {
      const cards = row.querySelectorAll('.srv-card');
      gsap.fromTo(cards,
        { opacity: 0, y: 55, scale: 0.95 },
        {
          opacity:  1,
          y:        0,
          scale:    1,
          duration: 0.8,
          ease:     'back.out(1.15)',
          stagger:  { amount: 0.35, from: 'start' },
          scrollTrigger: {
            trigger:       row,
            start:         'top 90%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    // ── CLIENTS SECTION ───────────────────────────────────────────────────────
    // The new clients section is a pure-CSS infinite-scroll logo marquee.
    // No JS interaction, no pin, no ScrollTrigger needed for the scroll itself.
    // We only add a simple entrance animation for the whole section.
    const clientsSection = document.querySelector('.clients-scroll-section');
    if (clientsSection) {
      gsap.fromTo(clientsSection,
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: {
            trigger:       clientsSection,
            start:         'top 92%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Logo rows slide in from opposite sides
      gsap.fromTo('.clients-logo-row--fwd',
        { opacity: 0, x: -60 },
        {
          opacity: 1, x: 0, duration: 1.2, ease: 'power3.out',
          scrollTrigger: {
            trigger:       clientsSection,
            start:         'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );

      gsap.fromTo('.clients-logo-row--rev',
        { opacity: 0, x: 60 },
        {
          opacity: 1, x: 0, duration: 1.2, ease: 'power3.out', delay: 0.12,
          scrollTrigger: {
            trigger:       clientsSection,
            start:         'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }

    // ── ABOUT SECTION (legacy .about-section) ────────────────────────────────
    if (document.querySelector('.about-section')) {
      const aboutTl = gsap.timeline({
        scrollTrigger: { trigger: '.about-section', start: 'top 85%', end: 'top 10%', scrub: 1.5 }
      });
      aboutTl
        .to('.about-title',   { y: 0, opacity: 1 })
        .to('.about-heading', { y: 0, opacity: 1 }, '+=0.2')
        .to('.about-text',    { y: 0, opacity: 1, stagger: 0.25 }, '+=0.2');

      if (!prefersReducedMotion) {
        gsap.to('.about-bg', {
          scale: 1.15, y: 80,
          scrollTrigger: { trigger: '.about-section', start: 'top bottom', end: 'bottom top', scrub: 1.5 }
        });
      }
    }

    // ── BLOGS SECTION ─────────────────────────────────────────────────────────
    const blogHeaderTl = gsap.timeline({
      scrollTrigger: { trigger: '.blogs-header', start: 'top 85%', toggleActions: 'play none none reverse' }
    });

    blogHeaderTl
      .to('.blogs-eyebrow',    { opacity: 1, y:  0, duration: 1,   ease: 'power3.out' })
      .to('.blogs-title-line', { opacity: 1, y:  0, duration: 1.2, ease: 'power4.out', stagger: 0.15 }, '-=0.5')
      .to('.blogs-subtitle',   { opacity: 1, y:  0, duration: 1,   ease: 'power3.out' }, '-=0.6');

    if (!prefersReducedMotion) {
      gsap.fromTo('.blogs-title',
        { scale: 0.88, opacity: 0 },
        {
          scale: 1, opacity: 1, ease: 'power2.out',
          scrollTrigger: { trigger: '.blogs-header', start: 'top 90%', end: 'top 30%', scrub: 1.5 }
        }
      );
    }

    gsap.to('.blogs-featured-wrap', {
      opacity: 1, y: 0, duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: '.blogs-featured-wrap', start: 'top 85%', toggleActions: 'play none none reverse' }
    });

    if (!prefersReducedMotion) {
      gsap.to('.blog-featured-img', {
        y: -50, ease: 'none',
        scrollTrigger: { trigger: '.blog-featured-card', start: 'top bottom', end: 'bottom top', scrub: 1.5 }
      });
    }

    gsap.to('.blog-card', {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      stagger: { amount: 0.5, from: 'start' },
      scrollTrigger: { trigger: '.blogs-grid-wrap', start: 'top 82%', toggleActions: 'play none none reverse' }
    });

    if (!prefersReducedMotion) {
      document.querySelectorAll('.blog-card').forEach(card => {
        const img = card.querySelector('.blog-card-img');
        if (!img) return;
        gsap.to(img, {
          y: -30, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
        });
      });
    }

    gsap.to('.blogs-strip-wrap', {
      opacity: 1, x: 0, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: '.blogs-strip-wrap', start: 'top 88%', toggleActions: 'play none none reverse' }
    });

    gsap.fromTo('.blog-strip-card',
      { opacity: 0, x: 50 },
      {
        opacity: 1, x: 0, ease: 'power2.out', stagger: 0.1,
        scrollTrigger: { trigger: '.blogs-strip-wrap', start: 'top 80%', end: 'top 30%', scrub: 1 }
      }
    );

    if (!prefersReducedMotion) {
      gsap.to('.glow-1', { y: -120, x:  40, ease: 'none', scrollTrigger: { trigger: '.blogs-section', start: 'top bottom', end: 'bottom top', scrub: 2   } });
      gsap.to('.glow-2', { y:   80, x: -30, ease: 'none', scrollTrigger: { trigger: '.blogs-section', start: 'top bottom', end: 'bottom top', scrub: 2.5 } });
      gsap.to('.glow-3', { y:  -60,         ease: 'none', scrollTrigger: { trigger: '.blogs-section', start: 'top bottom', end: 'bottom top', scrub: 1.8 } });
    }

    gsap.to('.blogs-cta-wrap', {
      opacity: 1, y: 0, duration: 1, ease: 'back.out(1.4)',
      scrollTrigger: { trigger: '.blogs-cta-wrap', start: 'top 90%', toggleActions: 'play none none reverse' }
    });

    // ── ABOUT US SECTION ──────────────────────────────────────────────────────
    gsap.to('#au-eyebrow', {
      opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: '.au-opening', start: 'top 85%', toggleActions: 'play none none reverse' }
    });

    gsap.to('.au-hl-line', {
      opacity: 1, y: 0, duration: 1.3, ease: 'power4.out', stagger: 0.14,
      scrollTrigger: { trigger: '.au-headline-wrap', start: 'top 82%', toggleActions: 'play none none reverse' }
    });

    gsap.to('#au-opening-sub', {
      opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: 0.35,
      scrollTrigger: { trigger: '.au-opening', start: 'top 78%', toggleActions: 'play none none reverse' }
    });

    if (!prefersReducedMotion) {
      gsap.fromTo('.au-headline',
        { scale: 0.9 },
        {
          scale: 1.04, ease: 'none',
          scrollTrigger: { trigger: '.au-opening', start: 'top bottom', end: 'bottom top', scrub: 1.8 }
        }
      );
    }

    if (!prefersReducedMotion) {
      gsap.to('.au-bg-base', {
        backgroundPositionY: '60%', ease: 'none',
        scrollTrigger: { trigger: '.aboutus-section', start: 'top bottom', end: 'bottom top', scrub: 2 }
      });
    }

    gsap.to('.au-grain', {
      opacity: 0.07, ease: 'none',
      scrollTrigger: { trigger: '.aboutus-section', start: 'top bottom', end: '50% top', scrub: 1 }
    });

    gsap.to('.au-marquee-divider', {
      opacity: 1, duration: 1.2, ease: 'power2.out',
      scrollTrigger: { trigger: '.au-marquee-divider', start: 'top 92%', toggleActions: 'play none none reverse' }
    });

    // Velocity-based marquee speed (desktop only)
    if (!prefersReducedMotion) {
      const fwdTrack = document.querySelector('.au-marquee-fwd');
      const revTrack = document.querySelector('.au-marquee-rev');
      if (fwdTrack && revTrack) {
        ScrollTrigger.create({
          trigger: '.au-marquee-divider',
          start:   'top bottom',
          end:     'bottom top',
          scrub:   1,
          onUpdate: (self) => {
            const vel = self.getVelocity();
            fwdTrack.style.animationDuration = Math.max(8,  28 - Math.abs(vel) * 0.015) + 's';
            revTrack.style.animationDuration = Math.max(6,  22 - Math.abs(vel) * 0.012) + 's';
          }
        });
      }
    }

    // Split story
    gsap.to('#au-split-left', {
      opacity: 1, x: 0, duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: '.au-split-story', start: 'top 80%', toggleActions: 'play none none reverse' }
    });

    if (!prefersReducedMotion) {
      gsap.to('.au-img-card-back',  { y: -40, rotate:  6, ease: 'none', scrollTrigger: { trigger: '.au-split-story', start: 'top bottom', end: 'bottom top', scrub: 1.5 } });
      gsap.to('.au-img-card-front', { y: -20, rotate: -3, ease: 'none', scrollTrigger: { trigger: '.au-split-story', start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    }

    gsap.to('.au-story-block', {
      opacity: 1, x: 0, duration: 1.0, ease: 'power3.out', stagger: 0.2,
      scrollTrigger: { trigger: '#au-split-right', start: 'top 78%', toggleActions: 'play none none reverse' }
    });

    // Border highlight on enter
    document.querySelectorAll('.au-story-block').forEach(block => {
      ScrollTrigger.create({
        trigger:     block,
        start:       'top 75%',
        onEnter:     () => { block.style.borderLeftColor = 'rgba(139,92,246,0.35)'; },
        onLeaveBack: () => { block.style.borderLeftColor = 'rgba(255,255,255,0.07)'; }
      });
    });

    // Stat counters (only if .au-stat-item elements exist)
    const statItems = document.querySelectorAll('.au-stat-item');
    if (statItems.length) {
      gsap.to('.au-stat-item', {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
        scrollTrigger: { trigger: '.au-stats-wrap', start: 'top 80%', toggleActions: 'play none none reverse' }
      });

      ScrollTrigger.create({
        trigger: '.au-stats-wrap',
        start:   'top 78%',
        once:    true,
        onEnter: () => {
          statItems.forEach(item => {
            const target = parseInt(item.getAttribute('data-target'), 10);
            if (isNaN(target)) return;
            const numEl  = item.querySelector('.au-stat-num');
            const fillEl = item.querySelector('.au-stat-fill');
            const fillW  = fillEl ? parseFloat(fillEl.getAttribute('data-width')) : 80;
            const counter = { val: 0 };
            gsap.to(counter, {
              val: target, duration: 2.2, ease: 'power2.out', delay: 0.1,
              onUpdate: () => { if (numEl) numEl.textContent = Math.round(counter.val); }
            });
            if (fillEl) gsap.to(fillEl, { width: fillW + '%', duration: 2, ease: 'power2.out', delay: 0.2 });
          });
        }
      });
    }

    // ── TEAM SECTION ──────────────────────────────────────────────────────────
    const teamWrap = document.querySelector('.au-team-wrap');
    if (teamWrap) {
      gsap.from('.au-team-wrap', {
        opacity: 0, y: 40, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: '.au-team-wrap', start: 'top 90%', once: true }
      });

      gsap.from('.au-team-header', {
        opacity: 0, y: 30, duration: 0.5, ease: 'power2.out',
        scrollTrigger: { trigger: '.au-team-wrap', start: 'top 88%', once: true }
      });

      gsap.from('.au-team-title', {
        opacity: 0, y: 30, duration: 0.5, ease: 'power2.out',
        scrollTrigger: { trigger: '.au-team-header', start: 'top 90%', once: true }
      });

      gsap.from('.au-team-card', {
        opacity: 0, y: 30, duration: 0.5, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: '.au-team-strip', start: 'top 92%', once: true }
      });
    }

    // ── CTA BANNER ────────────────────────────────────────────────────────────
    const ctaBanner = document.querySelector('.au-cta-banner');
    if (ctaBanner) {
      gsap.fromTo('.au-cta-banner',
        { opacity: 0, scale: 0.96, y: 60 },
        {
          opacity: 1, scale: 1, y: 0, duration: 1.3, ease: 'power3.out',
          scrollTrigger: { trigger: '.au-cta-banner', start: 'top 90%', toggleActions: 'play none none none' }
        }
      );

      const ctaTl = gsap.timeline({
        scrollTrigger: { trigger: '.au-cta-banner', start: 'top 85%', toggleActions: 'play none none reverse' }
      });
      ctaTl
        .to('#au-cta .au-eyebrow', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
        .to('.au-cta-heading',     { opacity: 1, y: 0, duration: 1.3, ease: 'power4.out' }, '-=0.5')
        .to('.au-cta-actions',     { opacity: 1, y: 0, duration: 1,   ease: 'back.out(1.5)' }, '-=0.6');

      if (!prefersReducedMotion) {
        gsap.fromTo('.au-cta-highlight',
          { opacity: 0, x: -30 },
          {
            opacity: 1, x: 0, ease: 'power3.out',
            scrollTrigger: { trigger: '.au-cta-banner', start: 'top 75%', end: 'top 40%', scrub: 1.5 }
          }
        );

        gsap.to('.au-cta-line', {
          scaleX: 1, transformOrigin: 'center center', duration: 1.6, ease: 'power3.inOut', stagger: 0.15,
          scrollTrigger: { trigger: '.au-cta-banner', start: 'top 88%', toggleActions: 'play none none reverse' }
        });
      }

      if (!prefersReducedMotion) {
        gsap.to('.au-cta-glow', {
          y: -80, ease: 'none',
          scrollTrigger: { trigger: '.au-cta-banner', start: 'top bottom', end: 'bottom top', scrub: 2 }
        });
      }

      ScrollTrigger.create({
        trigger: '.au-cta-banner',
        start:   'top 65%',
        once:    true,
        onEnter: () => {
          if (!prefersReducedMotion) {
            gsap.fromTo('.au-cta-primary',
              { scale: 1 },
              { scale: 1.06, duration: 0.4, ease: 'power2.out', yoyo: true, repeat: 1 }
            );
          }
        }
      });
    }

    // ── UNIVERSAL .reveal ELEMENTS ────────────────────────────────────────────
    document.querySelectorAll('.reveal').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reverse' }
        }
      );
    });

  } // end if (!isMobile()) — scroll animations

  // ── MODAL ─────────────────────────────────────────────────────────────────
  const openBtn  = document.getElementById('auOpenModal');
  const modal    = document.getElementById('auModal');
  const closeBtn = document.getElementById('auCloseModal');

  function openModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (openBtn) openBtn.focus();
  }

  if (openBtn && modal && closeBtn) {
    openBtn.addEventListener('click',  openModal);
    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });
  }

  // ── FINAL REFRESH ──────────────────────────────────────────────────────────
  // Called once after all ScrollTriggers registered so measurements are accurate.
  ScrollTrigger.refresh();

} // end initScrollAnimations()


// ─── FIX 1: Load-event race condition guard ──────────────────────────────────
if (document.readyState === 'complete') {
  initScrollAnimations();
} else {
  window.addEventListener('load', initScrollAnimations);
}


// ─── 7. RESIZE & ORIENTATION HANDLERS ───────────────────────────────────────
let resizeTimer;

function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    _mobile = window.innerWidth < 768;
    _tablet = window.innerWidth < 1024;
    ScrollTrigger.refresh();
  }, 250);
}

window.addEventListener('resize', onResize, { passive: true });

// FIX 8: Orientation change — iOS needs two refreshes.
// First at 500ms (most cases), second at 800ms (Safari slow repaints).
window.addEventListener('orientationchange', () => {
  _mobile = window.innerWidth < 768;
  _tablet = window.innerWidth < 1024;

  setTimeout(() => {
    _mobile = window.innerWidth < 768;
    _tablet = window.innerWidth < 1024;
    ScrollTrigger.refresh();
  }, 500);

  setTimeout(() => {
    _mobile = window.innerWidth < 768;
    _tablet = window.innerWidth < 1024;
    ScrollTrigger.refresh();
  }, 800);
}, { passive: true });
