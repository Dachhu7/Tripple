// ==============================
// GSAP INIT (ONLY ONCE — must be first)
// ==============================
gsap.registerPlugin(ScrollTrigger);

// ==============================
// HERO TEXT ANIMATION
// ==============================
const mm = gsap.matchMedia();

mm.add("(min-width: 768px)", () => {
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
  tl.to(".hero-text .left",  { x: "0%",    duration: 3,   ease: "power3.out", stagger: 0.3 }, 0);
  tl.to(".hero-text .right", { x: "0%",    duration: 3,   ease: "power3.out" }, 0);
  tl.to({}, { duration: 1.5 });
  tl.to(".hero-text .left",  { x: "120vw", duration: 2.5, ease: "power2.in",  stagger: 0.2 });
  tl.to(".hero-text .right", { x: "-120vw",duration: 2.5, ease: "power2.in" }, "<");
});

mm.add("(max-width: 767px)", () => {
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
  tl.to(".hero-text .left",  { x: "0%",    duration: 2 }, 0);
  tl.to(".hero-text .right", { x: "0%",    duration: 2 }, 0);
  tl.to({}, { duration: 1 });
  tl.to(".hero-text .left",  { x: "100vw", duration: 2 });
  tl.to(".hero-text .right", { x: "-100vw",duration: 2 }, "<");
});

// ==============================
// ASTRONAUT FLOAT
// ==============================
const astronaut = document.getElementById("astronaut");
let angle = 0;

function getResponsiveScale() {
  if (window.innerWidth < 480) return 0.6;
  if (window.innerWidth < 768) return 0.8;
  return 1;
}

function floatAstronaut() {
  if (!astronaut) return;
  const baseScale = getResponsiveScale();
  const x       = Math.sin(angle * 0.8) * 60 + Math.sin(angle * 1.5) * 25;
  const y       = Math.cos(angle * 0.7) * 50 + Math.cos(angle * 1.3) * 20;
  const rotate  = Math.sin(angle * 0.4) * 8;
  const zoom    = 0.7 + (Math.sin(angle * 0.5) + 1) / 2 * 0.6;
  astronaut.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${rotate}deg) scale(${baseScale * zoom})`;
  angle += 0.015;
  requestAnimationFrame(floatAstronaut);
}

if (astronaut) floatAstronaut();

// ==============================
// FILTER BUTTONS
// ==============================
const filterButtons = document.querySelectorAll(".filters button");
if (filterButtons.length) {
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

// ==============================
// ALL SCROLL / LOAD LOGIC
// ==============================
window.addEventListener("load", () => {

  // ============================================================
  // NAVBAR — shrink + blur on scroll
  // ============================================================
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    ScrollTrigger.create({
      start: "top -60px",
      onEnter: () => {
        navbar.style.transition = "background 0.5s, backdrop-filter 0.5s, border-bottom 0.5s, padding 0.5s";
        navbar.style.background = "rgba(0,0,0,0.75)";
        navbar.style.backdropFilter = "blur(18px)";
        navbar.style.webkitBackdropFilter = "blur(18px)";
        navbar.style.borderBottom = "1px solid rgba(255,255,255,0.07)";
        navbar.style.padding = "12px 20px";
      },
      onLeaveBack: () => {
        navbar.style.background = "transparent";
        navbar.style.backdropFilter = "blur(0px)";
        navbar.style.webkitBackdropFilter = "blur(0px)";
        navbar.style.borderBottom = "1px solid rgba(255,255,255,0)";
        navbar.style.padding = "20px";
      }
    });
  }

  // ============================================================
  // SERVICES SCROLL — horizontal pin
  // ============================================================
  const scrollWrapper   = document.querySelector(".services-scroll-wrapper");
  const scrollContainer = document.querySelector(".services-grid");

  if (scrollWrapper && scrollContainer) {
    const getScrollAmount = () => scrollContainer.scrollWidth - scrollWrapper.clientWidth;

    gsap.set(scrollContainer, { willChange: "transform", force3D: true });

    gsap.to(scrollContainer, {
      x: () => -getScrollAmount(),
      scale: 0.95,
      opacity: 0.9,
      ease: "none",
      invalidateOnRefresh: true,
      scrollTrigger: {
        trigger: ".services-section",
        start: "top top",
        end: () => "+=" + getScrollAmount(),
        scrub: 1.2,
        pin: true,
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
            start: "bottom bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    }
  }

  // ============================================================
  // SERVICES SECTION — title / subtitle / ticker / cards entrance
  // ============================================================
  gsap.fromTo(".services-section",
    { opacity: 0, y: 60 },
    {
      opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
      scrollTrigger: { trigger: ".services-section", start: "top 92%", toggleActions: "play none none none" }
    }
  );

  gsap.fromTo(".section-title",
    { opacity: 0, y: 80, letterSpacing: "10px" },
    {
      opacity: 1, y: 0, letterSpacing: "3px", duration: 1.3, ease: "power4.out",
      scrollTrigger: { trigger: ".services-container", start: "top 88%", toggleActions: "play none none reverse" }
    }
  );

  gsap.fromTo(".section-subtitle",
    { opacity: 0, x: -50 },
    {
      opacity: 1, x: 0, duration: 1, ease: "power3.out", delay: 0.25,
      scrollTrigger: { trigger: ".services-container", start: "top 85%", toggleActions: "play none none reverse" }
    }
  );

  gsap.fromTo("#blogs-ticker",
    { opacity: 0, y: -30 },
    {
      opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: 0.4,
      scrollTrigger: { trigger: ".services-container", start: "top 82%", toggleActions: "play none none reverse" }
    }
  );

  gsap.fromTo(".card",
    { opacity: 0, y: 50, scale: 0.94 },
    {
      opacity: 1, y: 0, scale: 1, duration: 0.75, ease: "back.out(1.2)",
      stagger: { amount: 0.6, from: "start" },
      scrollTrigger: { trigger: ".services-scroll-wrapper", start: "top 88%", toggleActions: "play none none none" }
    }
  );

  // ============================================================
  // CLIENTS SECTION — pin scroll logic
  // ============================================================
  const clientItems  = document.querySelectorAll(".client-item");
  const clientImages = document.querySelectorAll(".client-img");
  const total = clientItems.length;
  let current = -1;

  function activateClient(index) {
    if (current === index) return;
    current = index;
    gsap.killTweensOf(clientItems);
    gsap.killTweensOf(clientImages);
    clientItems.forEach(item => { item.classList.remove("active"); gsap.set(item, { clearProps: "all" }); });
    clientImages.forEach(img  => { img.classList.remove("active");  gsap.set(img,  { clearProps: "all" }); });
    clientItems[index].classList.add("active");
    clientImages[index].classList.add("active");
    gsap.fromTo(clientItems[index],  { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 });
    gsap.fromTo(clientImages[index], { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7 });
  }

  if (clientItems.length) {
    activateClient(0);
    ScrollTrigger.create({
      trigger: ".clients-scroll-section",
      start: "top top",
      end: "+=" + (window.innerHeight * total),
      pin: true,
      scrub: 1,
      anticipatePin: 1,
      onUpdate: (self) => {
        let index = Math.floor(self.progress * total);
        if (index >= total) index = total - 1;
        activateClient(index);
      }
    });
  }

  // ============================================================
  // CLIENTS SECTION — header entrance
  // ============================================================
  gsap.fromTo(".clients-scroll-section",
    { opacity: 0, y: 50 },
    {
      opacity: 1, y: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: ".clients-scroll-section", start: "top 92%", toggleActions: "play none none none" }
    }
  );

  gsap.fromTo(".clients-title",
    { opacity: 0, scale: 0.88, y: 60 },
    {
      opacity: 1, scale: 1, y: 0, ease: "power2.out",
      scrollTrigger: { trigger: ".clients-header", start: "top 90%", end: "top 40%", scrub: 1.5 }
    }
  );

  gsap.fromTo(".clients-subtitle",
    { opacity: 0, y: 35 },
    {
      opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.2,
      scrollTrigger: { trigger: ".clients-header", start: "top 82%", toggleActions: "play none none reverse" }
    }
  );

  gsap.fromTo(".clients-left",
    { opacity: 0, x: -100, rotateY: 8 },
    {
      opacity: 1, x: 0, rotateY: 0, duration: 1.3, ease: "power3.out",
      scrollTrigger: { trigger: ".clients-scroll-wrapper", start: "top 85%", toggleActions: "play none none reverse" }
    }
  );

  gsap.fromTo(".clients-right",
    { opacity: 0, x: 100 },
    {
      opacity: 1, x: 0, duration: 1.3, ease: "power3.out",
      scrollTrigger: { trigger: ".clients-scroll-wrapper", start: "top 83%", toggleActions: "play none none reverse" }
    }
  );

  // NOTE: pseudo-elements (::before / ::after) cannot be targeted by GSAP.
  // The original ".clients-header::before" animation has been removed.
  // To animate it, use a real child element instead.

  // ============================================================
  // ABOUT SECTION
  // ============================================================
  const aboutTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".about-section",
      start: "top 85%",
      end: "top 10%",
      scrub: 1.5
    }
  });

  aboutTl
    .to(".about-title",   { y: 0, opacity: 1 })
    .to(".about-heading", { y: 0, opacity: 1 }, "+=0.2")
    .to(".about-text",    { y: 0, opacity: 1, stagger: 0.25 }, "+=0.2");

  gsap.to(".about-bg", {
    scale: 1.15, y: 80,
    scrollTrigger: { trigger: ".about-section", start: "top bottom", end: "bottom top", scrub: 1.5 }
  });

  // ============================================================
  // BLOGS SECTION
  // ============================================================
  gsap.to(".blogs-eyebrow", {
    opacity: 1, y: 0, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: ".blogs-header", start: "top 85%", toggleActions: "play none none reverse" }
  });
  gsap.to(".blogs-title-line", {
    opacity: 1, y: 0, duration: 1.2, ease: "power4.out", stagger: 0.15,
    scrollTrigger: { trigger: ".blogs-header", start: "top 80%", toggleActions: "play none none reverse" }
  });
  gsap.to(".blogs-subtitle", {
    opacity: 1, y: 0, duration: 1, delay: 0.3, ease: "power3.out",
    scrollTrigger: { trigger: ".blogs-header", start: "top 78%", toggleActions: "play none none reverse" }
  });
  gsap.to(".blogs-ticker-wrap", {
    opacity: 1, duration: 1.2, ease: "power2.out",
    scrollTrigger: { trigger: ".blogs-ticker-wrap", start: "top 90%", toggleActions: "play none none reverse" }
  });
  gsap.to(".blogs-featured-wrap", {
    opacity: 1, y: 0, duration: 1.3, ease: "power3.out",
    scrollTrigger: { trigger: ".blogs-featured-wrap", start: "top 85%", toggleActions: "play none none reverse" }
  });
  gsap.to(".blog-featured-img", {
    y: -50, ease: "none",
    scrollTrigger: { trigger: ".blog-featured-card", start: "top bottom", end: "bottom top", scrub: 1.5 }
  });
  gsap.to(".blog-card", {
    opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
    stagger: { amount: 0.5, from: "start" },
    scrollTrigger: { trigger: ".blogs-grid-wrap", start: "top 82%", toggleActions: "play none none reverse" }
  });
  document.querySelectorAll(".blog-card").forEach(card => {
    const img = card.querySelector(".blog-card-img");
    if (!img) return;
    gsap.to(img, { y: -30, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 1.2 } });
  });
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
  gsap.to(".glow-1", { y: -120, x: 40,  ease: "none", scrollTrigger: { trigger: ".blogs-section", start: "top bottom", end: "bottom top", scrub: 2   } });
  gsap.to(".glow-2", { y: 80,   x: -30, ease: "none", scrollTrigger: { trigger: ".blogs-section", start: "top bottom", end: "bottom top", scrub: 2.5 } });
  gsap.to(".glow-3", { y: -60,          ease: "none", scrollTrigger: { trigger: ".blogs-section", start: "top bottom", end: "bottom top", scrub: 1.8 } });
  gsap.to(".blogs-cta-wrap", {
    opacity: 1, y: 0, duration: 1, ease: "back.out(1.4)",
    scrollTrigger: { trigger: ".blogs-cta-wrap", start: "top 90%", toggleActions: "play none none reverse" }
  });
  gsap.fromTo(".blogs-title",
    { scale: 0.88, opacity: 0 },
    {
      scale: 1, opacity: 1, ease: "power2.out",
      scrollTrigger: { trigger: ".blogs-header", start: "top 90%", end: "top 30%", scrub: 1.5 }
    }
  );
  gsap.fromTo(".blogs-header",
    { "--lineProgress": "0%" },
    {
      "--lineProgress": "100%", duration: 1.5, ease: "power2.inOut",
      scrollTrigger: { trigger: ".blogs-header", start: "top 75%", toggleActions: "play none none reverse" }
    }
  );

  // ============================================================
  // ABOUT US SECTION
  // ============================================================
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
  gsap.fromTo(".au-headline",
    { scale: 0.9 },
    {
      scale: 1.04, ease: "none",
      scrollTrigger: { trigger: ".au-opening", start: "top bottom", end: "bottom top", scrub: 1.8 }
    }
  );
  gsap.to(".au-marquee-divider", {
    opacity: 1, duration: 1.2, ease: "power2.out",
    scrollTrigger: { trigger: ".au-marquee-divider", start: "top 92%", toggleActions: "play none none reverse" }
  });
  ScrollTrigger.create({
    trigger: ".au-marquee-divider", start: "top bottom", end: "bottom top", scrub: 1,
    onUpdate: (self) => {
      const vel = self.getVelocity();
      const fwd = document.querySelector(".au-marquee-fwd");
      const rev = document.querySelector(".au-marquee-rev");
      if (!fwd || !rev) return;
      fwd.style.animationDuration = Math.max(8,  28 - Math.abs(vel) * 0.015) + "s";
      rev.style.animationDuration = Math.max(6,  22 - Math.abs(vel) * 0.012) + "s";
    }
  });
  gsap.to("#au-split-left", {
    opacity: 1, x: 0, duration: 1.3, ease: "power3.out",
    scrollTrigger: { trigger: ".au-split-story", start: "top 80%", toggleActions: "play none none reverse" }
  });
  gsap.to(".au-img-card-back",  { y: -40, rotate:  6, ease: "none", scrollTrigger: { trigger: ".au-split-story", start: "top bottom", end: "bottom top", scrub: 1.5 } });
  gsap.to(".au-img-card-front", { y: -20, rotate: -3, ease: "none", scrollTrigger: { trigger: ".au-split-story", start: "top bottom", end: "bottom top", scrub: 1.2 } });
  gsap.to(".au-story-block", {
    opacity: 1, x: 0, duration: 1.0, ease: "power3.out", stagger: 0.2,
    scrollTrigger: { trigger: "#au-split-right", start: "top 78%", toggleActions: "play none none reverse" }
  });
  document.querySelectorAll(".au-story-block").forEach(block => {
    ScrollTrigger.create({
      trigger: block, start: "top 75%",
      onEnter:     () => { block.style.borderLeftColor = "rgba(139,92,246,0.35)"; },
      onLeaveBack: () => { block.style.borderLeftColor = "rgba(255,255,255,0.07)"; }
    });
  });
  gsap.to(".au-stat-item", {
    opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
    scrollTrigger: { trigger: ".au-stats-wrap", start: "top 80%", toggleActions: "play none none reverse" }
  });
  ScrollTrigger.create({
    trigger: ".au-stats-wrap", start: "top 78%", once: true,
    onEnter: () => {
      document.querySelectorAll(".au-stat-item").forEach(item => {
        const target  = parseInt(item.getAttribute("data-target"), 10);
        const numEl   = item.querySelector(".au-stat-num");
        const fillEl  = item.querySelector(".au-stat-fill");
        const fillW   = fillEl ? parseFloat(fillEl.getAttribute("data-width")) : 80;
        const startVal = { val: 0 };
        gsap.to(startVal, {
          val: target, duration: 2.2, ease: "power2.out", delay: 0.1,
          onUpdate: () => { if (numEl) numEl.textContent = Math.round(startVal.val); }
        });
        if (fillEl) gsap.to(fillEl, { width: fillW + "%", duration: 2, ease: "power2.out", delay: 0.2 });
      });
    }
  });
  gsap.to(".au-values-header", {
    opacity: 1, y: 0, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: ".au-values-wrap", start: "top 85%", toggleActions: "play none none reverse" }
  });
  gsap.to(".au-val-card", {
    opacity: 1, y: 0, scale: 1, duration: 0.85, ease: "back.out(1.3)",
    stagger: { amount: 0.55, from: "start" },
    scrollTrigger: { trigger: ".au-values-grid", start: "top 82%", toggleActions: "play none none reverse" }
  });

  // ============================================================
  // TEAM SECTION — header + cards (deduplicated & combined)
  // ============================================================
  gsap.fromTo(".au-team-wrap",
    { opacity: 0, y: 70 },
    {
      opacity: 1, y: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: ".au-team-wrap", start: "top 92%", toggleActions: "play none none none" }
    }
  );
  gsap.to(".au-team-header", {
    opacity: 1, y: 0, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: ".au-team-wrap", start: "top 85%", toggleActions: "play none none reverse" }
  });
  gsap.fromTo(".au-team-wrap .au-eyebrow",
    { opacity: 0, x: -40, letterSpacing: "10px" },
    {
      opacity: 1, x: 0, letterSpacing: "4px", duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: ".au-team-wrap", start: "top 88%", toggleActions: "play none none reverse" }
    }
  );
  gsap.fromTo(".au-team-title",
    { opacity: 0, y: 70, skewX: -4 },
    {
      opacity: 1, y: 0, skewX: 0, ease: "power4.out",
      scrollTrigger: { trigger: ".au-team-header", start: "top 88%", end: "top 50%", scrub: 1.2 }
    }
  );

  // Team cards — alternating direction with parallax images (single definition)
  document.querySelectorAll(".au-team-card").forEach((card, i) => {
    const fromX      = i % 2 === 0 ? -60 : 60;
    const fromRotate = i % 2 === 0 ?  -4 :  4;
    gsap.fromTo(card,
      { opacity: 0, y: 90, x: fromX, rotate: fromRotate },
      {
        opacity: 1, y: 0, x: 0, rotate: 0, duration: 1.1, ease: "power3.out", delay: i * 0.12,
        scrollTrigger: { trigger: ".au-team-strip", start: "top 84%", toggleActions: "play none none reverse" }
      }
    );
    const img = card.querySelector(".au-team-img");
    if (img) {
      gsap.to(img, { y: -40, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: 1.3 } });
    }
  });

  // ============================================================
  // CTA BANNER — deduplicated single set of animations
  // ============================================================
  gsap.fromTo(".au-cta-banner",
    { opacity: 0, scale: 0.96, y: 60 },
    {
      opacity: 1, scale: 1, y: 0, duration: 1.3, ease: "power3.out",
      scrollTrigger: { trigger: ".au-cta-banner", start: "top 90%", toggleActions: "play none none none" }
    }
  );
  gsap.to("#au-cta .au-eyebrow", {
    opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".au-cta-banner", start: "top 85%", toggleActions: "play none none reverse" }
  });
  gsap.to(".au-cta-heading", {
    opacity: 1, y: 0, duration: 1.3, ease: "power4.out",
    scrollTrigger: { trigger: ".au-cta-banner", start: "top 80%", toggleActions: "play none none reverse" }
  });
  gsap.fromTo(".au-cta-highlight",
    { opacity: 0, x: -30 },
    {
      opacity: 1, x: 0, ease: "power3.out",
      scrollTrigger: { trigger: ".au-cta-banner", start: "top 75%", end: "top 40%", scrub: 1.5 }
    }
  );
  gsap.to(".au-cta-actions", {
    opacity: 1, y: 0, duration: 1, ease: "back.out(1.5)", delay: 0.25,
    scrollTrigger: { trigger: ".au-cta-banner", start: "top 78%", toggleActions: "play none none reverse" }
  });
  gsap.to(".au-cta-line", {
    scaleX: 1, transformOrigin: "center center", duration: 1.6, ease: "power3.inOut", stagger: 0.15,
    scrollTrigger: { trigger: ".au-cta-banner", start: "top 88%", toggleActions: "play none none reverse" }
  });
  gsap.to(".au-cta-glow", {
    y: -80, ease: "none",
    scrollTrigger: { trigger: ".au-cta-banner", start: "top bottom", end: "bottom top", scrub: 2 }
  });
  ScrollTrigger.create({
    trigger: ".au-cta-banner", start: "top 65%", once: true,
    onEnter: () => {
      gsap.fromTo(".au-cta-primary",
        { scale: 1 },
        { scale: 1.06, duration: 0.4, ease: "power2.out", yoyo: true, repeat: 1 }
      );
    }
  });

  // ============================================================
  // ABOUT US — bg parallax + grain depth
  // ============================================================
  gsap.to(".au-bg-base", {
    backgroundPositionY: "60%", ease: "none",
    scrollTrigger: { trigger: ".aboutus-section", start: "top bottom", end: "bottom top", scrub: 2 }
  });
  gsap.to(".au-grain", {
    opacity: 0.07, ease: "none",
    scrollTrigger: { trigger: ".aboutus-section", start: "top bottom", end: "50% top", scrub: 1 }
  });
  gsap.to(".au-glow-a", { y: -150, x:  50, ease: "none", scrollTrigger: { trigger: ".aboutus-section", start: "top bottom", end: "bottom top", scrub: 2.2 } });
  gsap.to(".au-glow-b", { y:  100, x: -40, ease: "none", scrollTrigger: { trigger: ".aboutus-section", start: "top bottom", end: "bottom top", scrub: 2.8 } });
  gsap.to(".au-glow-c", { y:  -70,         ease: "none", scrollTrigger: { trigger: ".aboutus-section", start: "top bottom", end: "bottom top", scrub: 1.6 } });
  gsap.to(".au-bg-grid", { y:  -60,         ease: "none", scrollTrigger: { trigger: ".aboutus-section", start: "top bottom", end: "bottom top", scrub: 1   } });

  // ============================================================
  // UNIVERSAL .reveal CLASS
  // ============================================================
  document.querySelectorAll(".reveal").forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 50 },
      {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" }
      }
    );
  });

  // ============================================================
  // MODAL
  // ============================================================
  const openBtn  = document.getElementById("auOpenModal");
  const modal    = document.getElementById("auModal");
  const closeBtn = document.getElementById("auCloseModal");

  if (openBtn && modal && closeBtn) {
    openBtn.addEventListener("click", () => {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    });
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
      document.body.style.overflow = "auto";
    });
    modal.addEventListener("click", e => {
      if (e.target === modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
      }
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
      }
    });
  }

  // ============================================================
  // SINGLE FINAL REFRESH — only once, after everything is set up
  // ============================================================
  ScrollTrigger.refresh();

}); // end window.addEventListener("load")