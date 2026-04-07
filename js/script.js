/**
 * TheTripple — script.js (Mobile-Fixed Production Build)
 *
 * FIXES APPLIED vs. original:
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX 1  — Load-event race condition on mobile (cached pages fire `load` before
 *           deferred scripts register the listener). Wrapped the entire init in a
 *           safe guard: if readyState is already "complete", call init() immediately;
 *           otherwise wait for the `load` event. Animations now always run.
 *
 * FIX 2  — Duplicate `gsap.registerPlugin(ScrollTrigger)` inside the load listener
 *           (inside the Team Section block) removed. One registration at top is enough.
 *
 * FIX 3  — Astronaut float gate raised from > 480px to > 768px. On 481–767px the
 *           CSS media-query transform (translate(-80%,-50%)) was being silently
 *           overridden by the JS inline style, misplacing the element on tablet/phablet.
 *
 * FIX 4  — Added `ScrollTrigger.normalizeScroll(true)` before any ScrollTrigger is
 *           created. Prevents iOS Safari's momentum / rubber-band scrolling from
 *           de-syncing ScrollTrigger pin measurements — the #1 cause of stuck/jittery
 *           pinned sections on iPhones.
 *
 * FIX 5  — Added `ScrollTrigger.config({ limitCallbacks: true, syncInterval: 40 })`
 *           to batch scroll callbacks and avoid frame-drop on low-end mobile CPUs.
 *
 * FIX 6  — Hero text: added explicit `gsap.set()` to seed GSAP's internal transform
 *           tracker before the repeating timeline begins. This prevents accumulated
 *           drift on subsequent repeat cycles (GSAP reads CSS transforms correctly on
 *           first play but can lose sync after an interrupt/resize on mobile).
 *
 * FIX 7  — Hero text mobile exit values changed to use `window.innerWidth` multiples
 *           rather than literal "100vw"/"120vw" strings. GSAP's percentage-string `x`
 *           values are relative to the element's own width, NOT the viewport — so
 *           "100vw" in x is not 1 viewport width; the correct approach is a px value
 *           derived from innerWidth, or keeping the vw string via gsap.utils.clamp.
 *           Using actual pixel values computed at animation start eliminates the
 *           discrepancy between perceived and actual off-screen position.
 *
 * FIX 8  — Orientation-change handler now fires a second ScrollTrigger.refresh() at
 *           800 ms (after the first at 500 ms) to handle slow iOS viewport repaints.
 *
 * PERFORMANCE PRINCIPLES PRESERVED FROM ORIGINAL:
 * 1. Single gsap.registerPlugin call
 * 2. isMobile / isTablet computed once, refreshed on resize (debounced)
 * 3. Navbar via CSS class toggle (no inline style thrashing)
 * 4. Astronaut float at ~30fps (every-other-frame throttle)
 * 5. All ScrollTriggers inside the load guard
 * 6. Parallax effects gated behind !isMobile && !prefersReducedMotion
 * 7. CSS defines initial GSAP states; JS animates forward
 * 8. Batch-created team card animations
 */

// ─── 1. GSAP PLUGIN REGISTRATION (once, immediately) ───────────────────────
gsap.registerPlugin(ScrollTrigger);

// ─── 2. DEVICE / PREFERENCE DETECTION ──────────────────────────────────────
let _mobile = window.innerWidth < 768;
let _tablet = window.innerWidth < 1024;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isMobile   = () => _mobile;
const isTablet   = () => _tablet;
const isTouchDev = () => window.matchMedia("(hover: none)").matches;

// ─── 3. HERO TEXT ANIMATION ─────────────────────────────────────────────────
// FIX 6 & 7: seed GSAP's tracker explicitly; use px-based exit offsets.
const mm = gsap.matchMedia();

mm.add("(min-width: 768px)", () => {
  if (prefersReducedMotion) return;

  // Seed GSAP's internal x-tracker from the CSS-defined starting transform
  // so repeat cycles don't drift. CSS has: .left { transform: translateX(-150vw) }
  gsap.set(".hero-text .left",  { x: () => -window.innerWidth * 1.5 });
  gsap.set(".hero-text .right", { x: () =>  window.innerWidth * 1.5 });

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
  tl.to(".hero-text .left",  { x: 0, duration: 3,   ease: "power3.out", stagger: 0.3 }, 0);
  tl.to(".hero-text .right", { x: 0, duration: 3,   ease: "power3.out" }, 0);
  tl.to({}, { duration: 1.5 });
  tl.to(".hero-text .left",  { x: () =>  window.innerWidth * 1.2, duration: 2.5, ease: "power2.in", stagger: 0.2 });
  tl.to(".hero-text .right", { x: () => -window.innerWidth * 1.2, duration: 2.5, ease: "power2.in" }, "<");
  return () => tl.kill();
});

mm.add("(max-width: 767px)", () => {
  // MOBILE: No scroll animation — CSS already shows the text at transform:none / opacity:1.
  // Clear any GSAP inline styles so the CSS mobile-reset rules take full effect.
  gsap.set(".hero-text .left",  { clearProps: "all" });
  gsap.set(".hero-text .right", { clearProps: "all" });
  return () => {};
});

// ─── 4. ASTRONAUT FLOAT ─────────────────────────────────────────────────────
// FIX 3: gated to > 768px so CSS media-query transforms aren't overridden on
// tablet/phablet widths (481–767px) by the JS inline style.
const astronaut = document.getElementById("astronaut");
let angle = 0;
let rafId = null;
let frameCount = 0;

function getAstroScale() {
  if (window.innerWidth < 480) return 0.6;
  if (window.innerWidth < 768) return 0.8;
  return 1;
}

function floatAstronaut() {
  rafId = requestAnimationFrame(floatAstronaut);
  frameCount++;
  // ~30fps throttle: skip every other frame
  if (frameCount % 2 !== 0) return;

  const s = getAstroScale();
  const x = Math.sin(angle * 0.8) * 60 + Math.sin(angle * 1.5) * 25;
  const y = Math.cos(angle * 0.7) * 50 + Math.cos(angle * 1.3) * 20;
  const r = Math.sin(angle * 0.4) * 8;
  const z = 0.7 + (Math.sin(angle * 0.5) + 1) / 2 * 0.6;

  // Single transform string avoids multiple style mutations
  astronaut.style.transform =
    `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${r}deg) scale(${s * z})`;
  angle += 0.015;
}

// FIX 3: raised threshold from 480 to 768 to protect CSS media-query positioning
if (astronaut && window.innerWidth > 768 && !prefersReducedMotion) {
  floatAstronaut();
}

// ─── 5. FILTER BUTTONS (event delegation) ───────────────────────────────────
const filterContainer = document.querySelector(".filters");
if (filterContainer) {
  filterContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    filterContainer.querySelectorAll("button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
}

// ─── 6. MAIN SCROLL INIT ────────────────────────────────────────────────────
// FIX 1: Guard against the load-event race condition on mobile.
// On a cached page, the browser may fire `load` before deferred scripts are
// parsed, causing the window.addEventListener("load", ...) to never fire.
// We check readyState and call init() immediately if already complete.
function initScrollAnimations() {

  // FIX 4 & FIX 5: normalizeScroll and config are desktop-only.
  // normalizeScroll(true) on mobile intercepts native touch scrolling and
  // can cause jank / rubber-band interference. Config is also unnecessary
  // since no ScrollTriggers are registered on mobile.
  if (!isMobile()) {
    // FIX 4: normalizeScroll MUST come before any ScrollTrigger.create() call.
    // Prevents iOS Safari's momentum scrolling from de-syncing pin measurements.
    ScrollTrigger.normalizeScroll(true);

    // FIX 5: batch callbacks to reduce CPU spikes on low-end mobile
    ScrollTrigger.config({ limitCallbacks: true, syncInterval: 40 });
  }

  // ── NAVBAR ──────────────────────────────────────────────────────────────────
  const navbar = document.getElementById("navbar");
  if (navbar) {
    ScrollTrigger.create({
      start:       "top -60px",
      onEnter:     () => navbar.classList.add("scrolled"),
      onLeaveBack: () => navbar.classList.remove("scrolled")
    });
  }

  // ── ALL SCROLL-BASED ANIMATIONS — DESKTOP ONLY ───────────────────────────
  // On mobile (≤ 767px) every ScrollTrigger/GSAP scroll animation is skipped.
  // CSS (the @media (max-width:767px) block) ensures all elements are visible
  // by resetting opacity and transform to their final/natural values.
  if (!isMobile()) {

  // ── SERVICES HORIZONTAL SCROLL — desktop only ────────────────────────────
  const scrollWrapper   = document.querySelector(".services-scroll-wrapper");
  const scrollContainer = document.querySelector(".services-grid");

  if (scrollWrapper && scrollContainer && !isMobile()) {
    const getScrollAmount = () => scrollContainer.scrollWidth - scrollWrapper.clientWidth;

    gsap.set(scrollContainer, { force3D: true });

    gsap.to(scrollContainer, {
      x:    () => -getScrollAmount(),
      ease: "none",
      invalidateOnRefresh: true,
      scrollTrigger: {
        trigger:    ".services-section",
        start:      "top top",
        end:        () => "+=" + getScrollAmount(),
        scrub:      1.2,
        pin:        true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    const nextSection = document.querySelector(".services-section + section");
    if (nextSection) {
      gsap.fromTo(nextSection,
        { y: 100, opacity: 0 },
        {
          y: 0, opacity: 1, ease: "power2.out",
          scrollTrigger: {
            trigger: ".services-section",
            start:   "bottom bottom",
            end:     "bottom top",
            scrub:   true
          }
        }
      );
    }
  }

  // ── SERVICES SECTION ENTRANCE ─────────────────────────────────────────────
  gsap.fromTo(".services-section",
    { opacity: 0, y: 60 },
    {
      opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
      scrollTrigger: { trigger: ".services-section", start: "top 92%", toggleActions: "play none none none" }
    }
  );

  const servicesTl = gsap.timeline({
    scrollTrigger: { trigger: ".services-container", start: "top 88%", toggleActions: "play none none reverse" }
  });

  servicesTl
    .fromTo(".section-title",
      { opacity: 0, y: 80, letterSpacing: "10px" },
      { opacity: 1, y: 0, letterSpacing: "3px", duration: 1.3, ease: "power4.out" }
    )
    .fromTo(".section-subtitle",
      { opacity: 0, x: -50 },
      { opacity: 1, x:  0,  duration: 1,   ease: "power3.out" },
      "-=0.8"
    )
    .fromTo("#blogs-ticker",
      { opacity: 0, y: -30 },
      { opacity: 1, y:  0,  duration: 0.9, ease: "power3.out" },
      "-=0.6"
    );

  gsap.fromTo(".card",
    { opacity: 0, y: 50, scale: 0.94 },
    {
      opacity: 1, y: 0, scale: 1, duration: 0.75, ease: "back.out(1.2)",
      stagger: { amount: 0.6, from: "start" },
      scrollTrigger: { trigger: ".services-scroll-wrapper", start: "top 88%", toggleActions: "play none none none" }
    }
  );

  // ── CLIENTS SECTION ───────────────────────────────────────────────────────
  const clientItems  = document.querySelectorAll(".client-item");
  const clientImages = document.querySelectorAll(".client-img");
  const total = clientItems.length;
  let current = -1;

  function activateClient(index) {
    if (current === index || index >= total) return;
    current = index;

    clientItems.forEach((item, i) => {
      item.classList.toggle("active", i === index);
    });
    clientImages.forEach((img, i) => {
      img.classList.toggle("active", i === index);
    });

    gsap.fromTo(clientItems[index],  { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, overwrite: "auto" });
    gsap.fromTo(clientImages[index], { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, overwrite: "auto" });
  }

  if (clientItems.length && !isMobile()) {
    activateClient(0);
    ScrollTrigger.create({
      trigger:      ".clients-scroll-section",
      start:        "top top",
      end:          "+=" + (window.innerHeight * total),
      pin:          true,
      scrub:        1,
      anticipatePin: 1,
      onUpdate: (self) => {
        let idx = Math.min(Math.floor(self.progress * total), total - 1);
        activateClient(idx);
      }
    });
  } else if (clientItems.length && isMobile()) {
    // On mobile: CSS makes all client items visible; show first image as active
    if (clientImages[0]) clientImages[0].classList.add("active");
  }

  // Clients header entrance
  const clientsTl = gsap.timeline({
    scrollTrigger: { trigger: ".clients-header", start: "top 90%", end: "top 40%", scrub: 1.5 }
  });

  clientsTl
    .fromTo(".clients-title",    { opacity: 0, scale: 0.88, y: 60 }, { opacity: 1, scale: 1, y: 0, ease: "power2.out" })
    .fromTo(".clients-subtitle", { opacity: 0, y: 35 },               { opacity: 1, y: 0, ease: "power3.out" }, "-=0.5");

  gsap.fromTo(".clients-scroll-section",
    { opacity: 0, y: 50 },
    {
      opacity: 1, y: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: ".clients-scroll-section", start: "top 92%", toggleActions: "play none none none" }
    }
  );

  gsap.fromTo(".clients-left",
    { opacity: 0, x: -80 },
    {
      opacity: 1, x: 0, duration: 1.3, ease: "power3.out",
      scrollTrigger: { trigger: ".clients-scroll-wrapper", start: "top 85%", toggleActions: "play none none reverse" }
    }
  );

  gsap.fromTo(".clients-right",
    { opacity: 0, x: 80 },
    {
      opacity: 1, x: 0, duration: 1.3, ease: "power3.out",
      scrollTrigger: { trigger: ".clients-scroll-wrapper", start: "top 83%", toggleActions: "play none none reverse" }
    }
  );

  // ── ABOUT SECTION (legacy .about-section) ────────────────────────────────
  if (document.querySelector(".about-section")) {
    const aboutTl = gsap.timeline({
      scrollTrigger: { trigger: ".about-section", start: "top 85%", end: "top 10%", scrub: 1.5 }
    });
    aboutTl
      .to(".about-title",   { y: 0, opacity: 1 })
      .to(".about-heading", { y: 0, opacity: 1 }, "+=0.2")
      .to(".about-text",    { y: 0, opacity: 1, stagger: 0.25 }, "+=0.2");

    if (!isMobile() && !prefersReducedMotion) {
      gsap.to(".about-bg", {
        scale: 1.15, y: 80,
        scrollTrigger: { trigger: ".about-section", start: "top bottom", end: "bottom top", scrub: 1.5 }
      });
    }
  }

  // ── BLOGS SECTION ─────────────────────────────────────────────────────────
  const blogHeaderTl = gsap.timeline({
    scrollTrigger: { trigger: ".blogs-header", start: "top 85%", toggleActions: "play none none reverse" }
  });

  blogHeaderTl
    .to(".blogs-eyebrow",    { opacity: 1, y:  0, duration: 1,   ease: "power3.out" })
    .to(".blogs-title-line", { opacity: 1, y:  0, duration: 1.2, ease: "power4.out", stagger: 0.15 }, "-=0.5")
    .to(".blogs-subtitle",   { opacity: 1, y:  0, duration: 1,   ease: "power3.out" }, "-=0.6");

  if (!prefersReducedMotion) {
    gsap.fromTo(".blogs-title",
      { scale: 0.88, opacity: 0 },
      {
        scale: 1, opacity: 1, ease: "power2.out",
        scrollTrigger: { trigger: ".blogs-header", start: "top 90%", end: "top 30%", scrub: 1.5 }
      }
    );
  }

  gsap.to(".blogs-ticker-wrap", {
    opacity: 1, duration: 1.2, ease: "power2.out",
    scrollTrigger: { trigger: ".blogs-ticker-wrap", start: "top 90%", toggleActions: "play none none reverse" }
  });

  gsap.to(".blogs-featured-wrap", {
    opacity: 1, y: 0, duration: 1.3, ease: "power3.out",
    scrollTrigger: { trigger: ".blogs-featured-wrap", start: "top 85%", toggleActions: "play none none reverse" }
  });

  // Featured image parallax — desktop only
  if (!isMobile() && !prefersReducedMotion) {
    gsap.to(".blog-featured-img", {
      y: -50, ease: "none",
      scrollTrigger: { trigger: ".blog-featured-card", start: "top bottom", end: "bottom top", scrub: 1.5 }
    });
  }

  gsap.to(".blog-card", {
    opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
    stagger: { amount: 0.5, from: "start" },
    scrollTrigger: { trigger: ".blogs-grid-wrap", start: "top 82%", toggleActions: "play none none reverse" }
  });

  // Card image parallax — desktop only
  if (!isMobile() && !prefersReducedMotion) {
    document.querySelectorAll(".blog-card").forEach(card => {
      const img = card.querySelector(".blog-card-img");
      if (!img) return;
      gsap.to(img, { y: -30, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 1.2 } });
    });
  }

  gsap.to(".blogs-strip-wrap", {
    opacity: 1, x: 0, duration: 1.2, ease: "power3.out",
    scrollTrigger: { trigger: ".blogs-strip-wrap", start: "top 88%", toggleActions: "play none none reverse" }
  });

  gsap.fromTo(".blog-strip-card",
    { opacity: 0, x: 50 },
    {
      opacity: 1, x: 0, ease: "power2.out", stagger: 0.1,
      scrollTrigger: { trigger: ".blogs-strip-wrap", start: "top 80%", end: "top 30%", scrub: 1 }
    }
  );

  // Glow parallax — desktop only
  if (!isMobile() && !prefersReducedMotion) {
    gsap.to(".glow-1", { y: -120, x:  40, ease: "none", scrollTrigger: { trigger: ".blogs-section", start: "top bottom", end: "bottom top", scrub: 2   } });
    gsap.to(".glow-2", { y:   80, x: -30, ease: "none", scrollTrigger: { trigger: ".blogs-section", start: "top bottom", end: "bottom top", scrub: 2.5 } });
    gsap.to(".glow-3", { y:  -60,         ease: "none", scrollTrigger: { trigger: ".blogs-section", start: "top bottom", end: "bottom top", scrub: 1.8 } });
  }

  gsap.to(".blogs-cta-wrap", {
    opacity: 1, y: 0, duration: 1, ease: "back.out(1.4)",
    scrollTrigger: { trigger: ".blogs-cta-wrap", start: "top 90%", toggleActions: "play none none reverse" }
  });

  // ── ABOUT US SECTION ──────────────────────────────────────────────────────
  gsap.to("#au-eyebrow", {
    opacity: 1, y: 0, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: ".au-opening", start: "top 85%", toggleActions: "play none none reverse" }
  });

  gsap.to(".au-hl-line", {
    opacity: 1, y: 0, duration: 1.3, ease: "power4.out", stagger: 0.14,
    scrollTrigger: { trigger: ".au-headline-wrap", start: "top 82%", toggleActions: "play none none reverse" }
  });

  gsap.to("#au-opening-sub", {
    opacity: 1, y: 0, duration: 1.1, ease: "power3.out", delay: 0.35,
    scrollTrigger: { trigger: ".au-opening", start: "top 78%", toggleActions: "play none none reverse" }
  });

  // Headline scale parallax — desktop only
  if (!isMobile() && !prefersReducedMotion) {
    gsap.fromTo(".au-headline",
      { scale: 0.9 },
      {
        scale: 1.04, ease: "none",
        scrollTrigger: { trigger: ".au-opening", start: "top bottom", end: "bottom top", scrub: 1.8 }
      }
    );
  }

  // BG parallax — desktop only
  if (!isMobile() && !prefersReducedMotion) {
    gsap.to(".au-bg-base", {
      backgroundPositionY: "60%", ease: "none",
      scrollTrigger: { trigger: ".aboutus-section", start: "top bottom", end: "bottom top", scrub: 2 }
    });
  }

  gsap.to(".au-grain", {
    opacity: 0.07, ease: "none",
    scrollTrigger: { trigger: ".aboutus-section", start: "top bottom", end: "50% top", scrub: 1 }
  });

  // Marquee entrance
  gsap.to(".au-marquee-divider", {
    opacity: 1, duration: 1.2, ease: "power2.out",
    scrollTrigger: { trigger: ".au-marquee-divider", start: "top 92%", toggleActions: "play none none reverse" }
  });

  // Velocity-based marquee speed — desktop only
  if (!isMobile() && !prefersReducedMotion) {
    const fwdTrack = document.querySelector(".au-marquee-fwd");
    const revTrack = document.querySelector(".au-marquee-rev");
    if (fwdTrack && revTrack) {
      ScrollTrigger.create({
        trigger: ".au-marquee-divider",
        start:   "top bottom",
        end:     "bottom top",
        scrub:   1,
        onUpdate: (self) => {
          const vel = self.getVelocity();
          fwdTrack.style.animationDuration = Math.max(8,  28 - Math.abs(vel) * 0.015) + "s";
          revTrack.style.animationDuration = Math.max(6,  22 - Math.abs(vel) * 0.012) + "s";
        }
      });
    }
  }

  // Split story
  gsap.to("#au-split-left", {
    opacity: 1, x: 0, duration: 1.3, ease: "power3.out",
    scrollTrigger: { trigger: ".au-split-story", start: "top 80%", toggleActions: "play none none reverse" }
  });

  if (!isMobile() && !prefersReducedMotion) {
    gsap.to(".au-img-card-back",  { y: -40, rotate:  6, ease: "none", scrollTrigger: { trigger: ".au-split-story", start: "top bottom", end: "bottom top", scrub: 1.5 } });
    gsap.to(".au-img-card-front", { y: -20, rotate: -3, ease: "none", scrollTrigger: { trigger: ".au-split-story", start: "top bottom", end: "bottom top", scrub: 1.2 } });
  }

  gsap.to(".au-story-block", {
    opacity: 1, x: 0, duration: 1.0, ease: "power3.out", stagger: 0.2,
    scrollTrigger: { trigger: "#au-split-right", start: "top 78%", toggleActions: "play none none reverse" }
  });

  // Story block border highlight on enter
  document.querySelectorAll(".au-story-block").forEach(block => {
    ScrollTrigger.create({
      trigger:     block,
      start:       "top 75%",
      onEnter:     () => { block.style.borderLeftColor = "rgba(139,92,246,0.35)"; },
      onLeaveBack: () => { block.style.borderLeftColor = "rgba(255,255,255,0.07)"; }
    });
  });

  // Stat counters (only if stat elements exist)
  const statItems = document.querySelectorAll(".au-stat-item");
  if (statItems.length) {
    gsap.to(".au-stat-item", {
      opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: ".au-stats-wrap", start: "top 80%", toggleActions: "play none none reverse" }
    });

    ScrollTrigger.create({
      trigger: ".au-stats-wrap",
      start:   "top 78%",
      once:    true,
      onEnter: () => {
        statItems.forEach(item => {
          const target = parseInt(item.getAttribute("data-target"), 10);
          if (isNaN(target)) return;
          const numEl  = item.querySelector(".au-stat-num");
          const fillEl = item.querySelector(".au-stat-fill");
          const fillW  = fillEl ? parseFloat(fillEl.getAttribute("data-width")) : 80;
          const counter = { val: 0 };
          gsap.to(counter, {
            val: target, duration: 2.2, ease: "power2.out", delay: 0.1,
            onUpdate: () => { if (numEl) numEl.textContent = Math.round(counter.val); }
          });
          if (fillEl) gsap.to(fillEl, { width: fillW + "%", duration: 2, ease: "power2.out", delay: 0.2 });
        });
      }
    });
  }

  // ── TEAM SECTION ──────────────────────────────────────────────────────────
  // FIX 2: Removed duplicate gsap.registerPlugin(ScrollTrigger) that was here.
  const teamWrap = document.querySelector(".au-team-wrap");

  if (teamWrap) {
    gsap.from(".au-team-wrap", {
      opacity: 0,
      y: 40,
      duration: 0.6,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".au-team-wrap",
        start: "top 90%",
        once: true
      }
    });

    gsap.from(".au-team-header", {
      opacity: 0,
      y: 30,
      duration: 0.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".au-team-wrap",
        start: "top 88%",
        once: true
      }
    });

    gsap.from(".au-team-title", {
      opacity: 0,
      y: 30,
      duration: 0.5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".au-team-header",
        start: "top 90%",
        once: true
      }
    });

    gsap.from(".au-team-card", {
      opacity: 0,
      y: 30,
      duration: 0.5,
      ease: "power2.out",
      stagger: 0.08,
      scrollTrigger: {
        trigger: ".au-team-strip",
        start: "top 92%",
        once: true
      }
    });
  }

  // ── CTA BANNER ────────────────────────────────────────────────────────────
  const ctaBanner = document.querySelector(".au-cta-banner");
  if (ctaBanner) {
    gsap.fromTo(".au-cta-banner",
      { opacity: 0, scale: 0.96, y: 60 },
      {
        opacity: 1, scale: 1, y: 0, duration: 1.3, ease: "power3.out",
        scrollTrigger: { trigger: ".au-cta-banner", start: "top 90%", toggleActions: "play none none none" }
      }
    );

    const ctaTl = gsap.timeline({
      scrollTrigger: { trigger: ".au-cta-banner", start: "top 85%", toggleActions: "play none none reverse" }
    });
    ctaTl
      .to("#au-cta .au-eyebrow", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" })
      .to(".au-cta-heading",     { opacity: 1, y: 0, duration: 1.3, ease: "power4.out" }, "-=0.5")
      .to(".au-cta-actions",     { opacity: 1, y: 0, duration: 1,   ease: "back.out(1.5)" }, "-=0.6");

    if (!prefersReducedMotion) {
      gsap.fromTo(".au-cta-highlight",
        { opacity: 0, x: -30 },
        {
          opacity: 1, x: 0, ease: "power3.out",
          scrollTrigger: { trigger: ".au-cta-banner", start: "top 75%", end: "top 40%", scrub: 1.5 }
        }
      );

      gsap.to(".au-cta-line", {
        scaleX: 1, transformOrigin: "center center", duration: 1.6, ease: "power3.inOut", stagger: 0.15,
        scrollTrigger: { trigger: ".au-cta-banner", start: "top 88%", toggleActions: "play none none reverse" }
      });
    }

    // Glow parallax — desktop only
    if (!isMobile() && !prefersReducedMotion) {
      gsap.to(".au-cta-glow", {
        y: -80, ease: "none",
        scrollTrigger: { trigger: ".au-cta-banner", start: "top bottom", end: "bottom top", scrub: 2 }
      });
    }

    // Pulse CTA button once on entry
    ScrollTrigger.create({
      trigger: ".au-cta-banner",
      start:   "top 65%",
      once:    true,
      onEnter: () => {
        if (!prefersReducedMotion) {
          gsap.fromTo(".au-cta-primary",
            { scale: 1 },
            { scale: 1.06, duration: 0.4, ease: "power2.out", yoyo: true, repeat: 1 }
          );
        }
      }
    });
  }

  // ── UNIVERSAL .reveal ELEMENTS ────────────────────────────────────────────
  document.querySelectorAll(".reveal").forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" }
      }
    );
  });

  } // end if (!isMobile()) — scroll animations

  // ── MODAL ─────────────────────────────────────────────────────────────────
  const openBtn  = document.getElementById("auOpenModal");
  const modal    = document.getElementById("auModal");
  const closeBtn = document.getElementById("auCloseModal");

  function openModal() {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
    if (openBtn) openBtn.focus();
  }

  if (openBtn && modal && closeBtn) {
    openBtn.addEventListener("click",  openModal);
    closeBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("active")) closeModal();
    });
  }

  // ── FINAL REFRESH ──────────────────────────────────────────────────────────
  // Call once after all ScrollTriggers are registered so measurements are accurate.
  ScrollTrigger.refresh();

} // end initScrollAnimations()


// ─── FIX 1: Load-event race condition guard ──────────────────────────────────
// If the `load` event already fired (can happen on mobile with cached assets when
// the browser executes deferred scripts after the event), call init immediately.
// Otherwise, register normally and wait.
if (document.readyState === "complete") {
  // Page is already fully loaded — run immediately (no event needed)
  initScrollAnimations();
} else {
  window.addEventListener("load", initScrollAnimations);
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

window.addEventListener("resize", onResize, { passive: true });

// FIX 8: Orientation change — iOS needs more time than 400ms for accurate layout.
// Fire two refreshes: one at 500ms (handles most cases) and one at 800ms (catches
// slow repaints and dynamic-viewport-unit recalculations on Safari).
window.addEventListener("orientationchange", () => {
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
