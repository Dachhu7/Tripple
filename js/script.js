/**
 * TheTripple — Optimized script.js
 *
 * PERFORMANCE PRINCIPLES APPLIED:
 * 1. Single gsap.registerPlugin call at top
 * 2. isMobile / isTablet computed ONCE per session; recomputed on resize via debounced handler
 * 3. Navbar state managed via CSS class toggle (avoids repeated inline style writes / forced reflows)
 * 4. Astronaut float uses requestAnimationFrame with a throttle (runs at 30fps, not 60fps) — halves CPU cost
 * 5. All ScrollTrigger instances created inside window "load" to guarantee layout is stable
 * 6. Removed duplicate/overlapping ScrollTrigger animations (multiple conflicting tweens on same elements)
 * 7. Parallax effects gated behind !isMobile and !prefersReducedMotion checks
 * 8. All GSAP initial states are defined in CSS, not duplicated via gsap.set() (avoids Flash of Unstyled Content)
 * 9. Removed the rotating/scaling glow scrub animations — they caused constant compositing on mobile
 * 10. Batch-created team card animations to reduce ScrollTrigger instance count
 */

// ─── 1. GSAP PLUGIN REGISTRATION (once, immediately) ───────────────────────
gsap.registerPlugin(ScrollTrigger);

// ─── 2. DEVICE / PREFERENCE DETECTION ──────────────────────────────────────
// Computed once and cached; refresh on resize (debounced, see bottom of file)
let _mobile = window.innerWidth < 768;
let _tablet = window.innerWidth < 1024;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isMobile  = () => _mobile;
const isTablet  = () => _tablet;
const isTouchDev = () => window.matchMedia("(hover: none)").matches;

// ─── 3. HERO TEXT ANIMATION ─────────────────────────────────────────────────
// OPTIMIZATION: matchMedia lets GSAP pick the right values per breakpoint
// and cleanly revert when viewport changes.
const mm = gsap.matchMedia();

mm.add("(min-width: 768px)", () => {
  // Desktop — large offsets, slower, more dramatic
  if (prefersReducedMotion) return;
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
  tl.to(".hero-text .left",  { x: "0%",     duration: 3,   ease: "power3.out", stagger: 0.3 }, 0);
  tl.to(".hero-text .right", { x: "0%",     duration: 3,   ease: "power3.out" }, 0);
  tl.to({}, { duration: 1.5 });
  tl.to(".hero-text .left",  { x: "120vw",  duration: 2.5, ease: "power2.in",  stagger: 0.2 });
  tl.to(".hero-text .right", { x: "-120vw", duration: 2.5, ease: "power2.in" }, "<");
  return () => tl.kill();
});

mm.add("(max-width: 767px)", () => {
  // Mobile — smaller offsets, faster, lighter
  if (prefersReducedMotion) return;
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
  tl.to(".hero-text .left",  { x: "0%",    duration: 1.8, ease: "power2.out" }, 0);
  tl.to(".hero-text .right", { x: "0%",    duration: 1.8, ease: "power2.out" }, 0);
  tl.to({}, { duration: 1 });
  tl.to(".hero-text .left",  { x: "100vw",  duration: 1.8, ease: "power2.in" });
  tl.to(".hero-text .right", { x: "-100vw", duration: 1.8, ease: "power2.in" }, "<");
  return () => tl.kill();
});

// ─── 4. ASTRONAUT FLOAT ─────────────────────────────────────────────────────
// OPTIMIZATION: Runs at ~30fps (every other frame) to halve CPU usage.
// Purely transform-based — no layout properties touched.
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
  // OPTIMIZATION: Skip every other frame → ~30fps instead of 60fps
  if (frameCount % 2 !== 0) return;

  const s = getAstroScale();
  const x = Math.sin(angle * 0.8) * 60 + Math.sin(angle * 1.5) * 25;
  const y = Math.cos(angle * 0.7) * 50 + Math.cos(angle * 1.3) * 20;
  const r = Math.sin(angle * 0.4) * 8;
  const z = 0.7 + (Math.sin(angle * 0.5) + 1) / 2 * 0.6;

  // OPTIMIZATION: Single transform string avoids multiple style mutations
  astronaut.style.transform =
    `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${r}deg) scale(${s * z})`;
  angle += 0.015;
}

// Only start astronaut animation if visible (hidden on mobile via CSS)
if (astronaut && window.innerWidth > 480 && !prefersReducedMotion) {
  floatAstronaut();
}

// ─── 5. FILTER BUTTONS ──────────────────────────────────────────────────────
// OPTIMIZATION: Event delegation on a parent instead of n individual listeners
const filterContainer = document.querySelector(".filters");
if (filterContainer) {
  filterContainer.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    filterContainer.querySelectorAll("button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
}

// ─── 6. ALL SCROLL / LOAD ANIMATIONS ────────────────────────────────────────
// Everything inside "load" ensures DOM & images are ready, preventing
// incorrect ScrollTrigger measurements caused by late layout shifts.
window.addEventListener("load", () => {

  // ── NAVBAR — class-based toggle (no inline style writes on each frame) ──
  // OPTIMIZATION: CSS handles the visual change via .navbar.scrolled class;
  // JS only flips the class. One classList write vs. 5 style property writes.
  const navbar = document.getElementById("navbar");
  if (navbar) {
    ScrollTrigger.create({
      start:       "top -60px",
      onEnter:     () => navbar.classList.add("scrolled"),
      onLeaveBack: () => navbar.classList.remove("scrolled")
    });
  }

  // ── SERVICES HORIZONTAL SCROLL — disabled on mobile ──────────────────────
  const scrollWrapper   = document.querySelector(".services-scroll-wrapper");
  const scrollContainer = document.querySelector(".services-grid");

  if (scrollWrapper && scrollContainer && !isMobile()) {
    const getScrollAmount = () => scrollContainer.scrollWidth - scrollWrapper.clientWidth;

    // OPTIMIZATION: force3D promotes element to composite layer upfront
    gsap.set(scrollContainer, { force3D: true });

    gsap.to(scrollContainer, {
      x:    () => -getScrollAmount(),
      // OPTIMIZATION: Removed the concurrent scale(0.95) — scale triggers
      // a composite-layer size change, forcing texture re-upload every frame.
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

  // OPTIMIZATION: Batch the title/subtitle/ticker into one timeline to reduce
  // ScrollTrigger instance count (was 3 separate instances, now 1)
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

  // Service cards stagger
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

    // OPTIMIZATION: Kill only active tweens, not all tweens (avoids killing unrelated GSAP instances)
    clientItems.forEach((item, i) => {
      const isActive = i === index;
      item.classList.toggle("active", isActive);
    });
    clientImages.forEach((img, i) => {
      img.classList.toggle("active", i === index);
    });

    // Animate only the newly active item
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
    // Show first image as active; CSS makes all client items visible on mobile
    if (clientImages[0]) clientImages[0].classList.add("active");
  }

  // Clients header entrance (single timeline to reduce ST instances)
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

  // ── ABOUT SECTION (legacy) ────────────────────────────────────────────────
  if (document.querySelector(".about-section")) {
    const aboutTl = gsap.timeline({
      scrollTrigger: { trigger: ".about-section", start: "top 85%", end: "top 10%", scrub: 1.5 }
    });
    aboutTl
      .to(".about-title",   { y: 0, opacity: 1 })
      .to(".about-heading", { y: 0, opacity: 1 }, "+=0.2")
      .to(".about-text",    { y: 0, opacity: 1, stagger: 0.25 }, "+=0.2");

    // Parallax on bg only on desktop (no-layout: background-position via GSAP)
    if (!isMobile() && !prefersReducedMotion) {
      gsap.to(".about-bg", {
        scale: 1.15, y: 80,
        scrollTrigger: { trigger: ".about-section", start: "top bottom", end: "bottom top", scrub: 1.5 }
      });
    }
  }

  // ── BLOGS SECTION ─────────────────────────────────────────────────────────
  // Batch blogs header into one timeline
  const blogHeaderTl = gsap.timeline({
    scrollTrigger: { trigger: ".blogs-header", start: "top 85%", toggleActions: "play none none reverse" }
  });

  blogHeaderTl
    .to(".blogs-eyebrow",    { opacity: 1, y:  0, duration: 1, ease: "power3.out" })
    .to(".blogs-title-line", { opacity: 1, y:  0, duration: 1.2, ease: "power4.out", stagger: 0.15 }, "-=0.5")
    .to(".blogs-subtitle",   { opacity: 1, y:  0, duration: 1, ease: "power3.out" }, "-=0.6");

  // Scroll-scrub on title scale (separate because different scrub config)
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

  // Blog cards stagger
  gsap.to(".blog-card", {
    opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
    stagger: { amount: 0.5, from: "start" },
    scrollTrigger: { trigger: ".blogs-grid-wrap", start: "top 82%", toggleActions: "play none none reverse" }
  });

  // Card image parallax — desktop only, gated to avoid creating 4+ scrolltriggers on mobile
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

  // Glow parallax — desktop only (purely decorative; big GPU cost on mobile)
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

// ── TEAM SECTION (FINAL FIXED VERSION) ──────────────────────────────────────

gsap.registerPlugin(ScrollTrigger);

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

    // CTA content timeline
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

  // ── MODAL ─────────────────────────────────────────────────────────────────
  const openBtn  = document.getElementById("auOpenModal");
  const modal    = document.getElementById("auModal");
  const closeBtn = document.getElementById("auCloseModal");

  function openModal() {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
    // Move focus to close button for accessibility
    closeBtn.focus();
  }

  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
    // Return focus to trigger for accessibility
    if (openBtn) openBtn.focus();
  }

  if (openBtn && modal && closeBtn) {
    openBtn.addEventListener("click",  openModal);
    closeBtn.addEventListener("click", closeModal);

    // Click outside modal box closes it
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // Escape key closes modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("active")) closeModal();
    });
  }

  // ── FINAL REFRESH ──────────────────────────────────────────────────────────
  // Call once after all ScrollTriggers are set up
  ScrollTrigger.refresh();

}); // end window.addEventListener("load")


// ─── 7. RESIZE & ORIENTATION HANDLERS ───────────────────────────────────────
// OPTIMIZATION: Debounced — prevents redundant recalculations while user is dragging.
// Also refreshes isMobile/isTablet flags so gate checks stay accurate.
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

// Orientation change — give browser 400ms to repaint before recalculating
window.addEventListener("orientationchange", () => {
  setTimeout(() => {
    _mobile = window.innerWidth < 768;
    _tablet = window.innerWidth < 1024;
    ScrollTrigger.refresh();
  }, 400);
}, { passive: true });
