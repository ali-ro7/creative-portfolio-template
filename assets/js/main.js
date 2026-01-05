/**
 * ==========================================================================
 * GRADE 1: VANILLA JAVASCRIPT PORTFOLIO DEMO
 * Scroll animations using IntersectionObserver
 * No frameworks, no dependencies — just modern JavaScript!
 * ==========================================================================
 *
 * 🎓 LEARNING OBJECTIVES:
 * - Understand the IntersectionObserver API for scroll-based triggers
 * - Learn why IntersectionObserver is better than scroll event listeners
 * - Implement accessible animations with prefers-reduced-motion
 * - Master the observer pattern for performant scroll detection
 *
 * 📚 WHAT IS INTERSECTIONOBSERVER?
 * IntersectionObserver is a browser API that efficiently detects when elements
 * enter or leave the viewport (or any ancestor element). It's the modern
 * replacement for scroll event listeners.
 *
 * ⚡ WHY NOT USE addEventListener('scroll', ...)?
 * - scroll events fire on EVERY PIXEL of scroll (60+ times per second!)
 * - This blocks the main thread and causes "jank" (stuttering)
 * - IntersectionObserver is optimized by the browser, runs asynchronously,
 *   and only fires when intersection state actually changes
 *
 * 🔗 MDN DOCS: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
 */

// ==========================================================================
// 1. INTERSECTIONOBSERVER CONFIGURATION
// ==========================================================================

/**
 * Observer options control WHEN the callback fires.
 *
 * 📐 UNDERSTANDING THE OPTIONS:
 *
 * root: The element to use as the viewport for checking visibility.
 *       - null = browser viewport (most common)
 *       - element = custom scroll container
 *
 * rootMargin: Expands or shrinks the root's bounding box.
 *       - Format: "top right bottom left" (like CSS margin)
 *       - Negative values shrink the detection area
 *       - "0px 0px -10% 0px" means: trigger when element is 10% INTO the viewport
 *         (not at the very edge, which feels more natural)
 *
 * threshold: What percentage of the element must be visible to trigger.
 *       - 0 = trigger as soon as 1 pixel is visible
 *       - 0.1 = trigger when 10% is visible
 *       - 1.0 = trigger only when 100% visible
 *       - [0, 0.5, 1] = trigger at multiple thresholds
 */
const observerOptions = {
  root: null, // Use the browser viewport
  rootMargin: "0px 0px -10% 0px", // Trigger 10% before fully visible
  threshold: 0.1, // Need 10% visibility to trigger
};

/**
 * CALLBACK: Single-element reveals
 *
 * This function is called by IntersectionObserver whenever an observed
 * element's intersection state changes.
 *
 * @param {IntersectionObserverEntry[]} entries - Array of intersection events
 * @param {IntersectionObserver} observer - The observer instance (for cleanup)
 *
 * 📐 WHAT'S IN AN ENTRY?
 * - entry.isIntersecting: boolean - is element currently visible?
 * - entry.intersectionRatio: number - how much is visible (0-1)
 * - entry.target: Element - the DOM element being observed
 * - entry.boundingClientRect: DOMRect - element's position/size
 */
const revealOnScroll = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // Add class that triggers CSS transition (see style.css)
      entry.target.classList.add("visible");

      // 🎯 PERFORMANCE OPTIMIZATION: Stop observing after reveal
      // Once an element is revealed, we don't need to watch it anymore.
      // This reduces work for the observer and prevents re-triggering.
      observer.unobserve(entry.target);
    }
  });
};

/**
 * CALLBACK: Staggered container reveals
 *
 * Same pattern, but adds 'revealed' class to containers.
 * CSS handles the staggered animation of children via transition-delay.
 */
const revealStaggered = (entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("revealed");
      observer.unobserve(entry.target);
    }
  });
};

/**
 * CREATE OBSERVER INSTANCES
 *
 * We create two separate observers because they add different classes.
 * You could use one observer with logic to determine which class to add,
 * but separate observers are clearer and more maintainable.
 */
const singleObserver = new IntersectionObserver(
  revealOnScroll,
  observerOptions
);
const staggerObserver = new IntersectionObserver(
  revealStaggered,
  observerOptions
);

// ==========================================================================
// 2. INITIALIZE OBSERVERS
// ==========================================================================

/**
 * Main initialization function for scroll animations.
 *
 * 🎓 KEY CONCEPT: PROGRESSIVE ENHANCEMENT
 * We check for reduced motion FIRST, before setting up any animations.
 * This ensures users who need reduced motion get a good experience immediately.
 *
 * 📐 THE FLOW:
 * 1. Check if user prefers reduced motion
 * 2. If yes → make everything visible immediately, skip animations
 * 3. If no → set up observers to trigger animations on scroll
 */
function initScrollAnimations() {
  /**
   * CHECK FOR REDUCED MOTION PREFERENCE
   *
   * window.matchMedia() is like CSS media queries, but in JavaScript!
   * It returns a MediaQueryList object with a .matches boolean property.
   *
   * This respects the user's OS-level accessibility settings:
   * - macOS: System Preferences → Accessibility → Display → Reduce motion
   * - Windows: Settings → Ease of Access → Display → Show animations
   * - iOS: Settings → Accessibility → Motion → Reduce Motion
   *
   * ⚠️ IMPORTANT: Always check this BEFORE initializing animations!
   */
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (prefersReducedMotion) {
    /**
     * GRACEFUL DEGRADATION FOR REDUCED MOTION
     *
     * Instead of animations, we immediately show all content.
     * Users get the same information, just without the motion.
     *
     * This is NOT about removing features — it's about providing
     * an equivalent experience for users who need it.
     */
    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      el.classList.add("visible");
    });
    document.querySelectorAll("[data-reveal-stagger]").forEach((el) => {
      el.classList.add("revealed");
    });
    return; // Exit early — no observers needed
  }

  /**
   * OBSERVE ELEMENTS FOR SCROLL-TRIGGERED ANIMATIONS
   *
   * querySelectorAll returns a NodeList (array-like).
   * forEach loops through each element and tells the observer to watch it.
   *
   * Once observed, the callback (revealOnScroll) will fire when the
   * element enters the viewport according to our observerOptions.
   */

  // Single element reveals (e.g., headings, paragraphs)
  document.querySelectorAll(".animate-on-scroll").forEach((el) => {
    singleObserver.observe(el);
  });

  // Staggered container reveals (e.g., skill grids, project cards)
  document.querySelectorAll("[data-reveal-stagger]").forEach((el) => {
    staggerObserver.observe(el);
  });
}

// ==========================================================================
// 3. SMOOTH SCROLL FOR ANCHOR LINKS
// ==========================================================================

/**
 * Enhanced smooth scrolling for in-page navigation.
 *
 * 🎓 WHY NOT JUST USE CSS scroll-behavior: smooth?
 * CSS smooth scrolling works great, but it has limitations:
 * 1. Can't account for fixed header height
 * 2. Can't update URL without page jump
 * 3. Less control over timing/easing
 *
 * This JavaScript approach gives us full control while still being simple.
 *
 * 📐 THE PATTERN:
 * 1. Find all links starting with "#" (anchor links)
 * 2. On click, prevent default jump behavior
 * 3. Calculate target position accounting for fixed nav height
 * 4. Smoothly scroll to that position
 * 5. Update URL for bookmarking/sharing
 */
function initSmoothScroll() {
  // Select all anchor links (href starts with "#")
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");

      // Ignore links that are just "#" (often used for JavaScript triggers)
      if (targetId === "#") return;

      const target = document.querySelector(targetId);
      if (target) {
        // Prevent the default "jump to anchor" behavior
        e.preventDefault();

        /**
         * CALCULATE SCROLL POSITION
         *
         * We need to account for the fixed navigation bar, otherwise
         * the target would be hidden behind it.
         *
         * getBoundingClientRect().top = distance from viewport top
         * window.scrollY = how far page is already scrolled
         * navHeight = height of fixed nav to offset
         */
        const navHeight = document.querySelector(".nav")?.offsetHeight || 0;
        const targetPosition =
          target.getBoundingClientRect().top + window.scrollY - navHeight;

        /**
         * SCROLL WITH SMOOTH BEHAVIOR
         *
         * window.scrollTo() with behavior: 'smooth' animates the scroll.
         * This is supported in all modern browsers.
         *
         * Note: CSS scroll-behavior: smooth on <html> provides a fallback
         * for browsers where this JS might fail.
         */
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });

        /**
         * UPDATE URL WITHOUT PAGE RELOAD
         *
         * history.pushState() changes the URL in the address bar
         * without triggering a page reload or scroll jump.
         *
         * This means:
         * - Users can bookmark specific sections
         * - Sharing the URL goes to the right section
         * - Back button works as expected
         */
        history.pushState(null, "", targetId);
      }
    });
  });
}

// ==========================================================================
// 4. ACTIVE NAVIGATION STATE
// ==========================================================================

/**
 * Highlight the nav link corresponding to the currently visible section.
 *
 * 🎓 UX PRINCIPLE: LOCATION AWARENESS
 * Users should always know where they are in the page. Highlighting the
 * active nav link provides this feedback without requiring user action.
 *
 * 📐 THE APPROACH:
 * We use IntersectionObserver again! But with different rootMargin settings
 * that define a "detection zone" in the middle of the viewport.
 *
 * rootMargin: '-50% 0px -50% 0px' means:
 * - Shrink the detection area by 50% from top AND bottom
 * - This creates a narrow band in the middle of the viewport
 * - Only the section crossing this band is considered "active"
 */
function initActiveNav() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");

  const observerOptions = {
    root: null,
    rootMargin: "-50% 0px -50% 0px", // Detect section in middle of viewport
    threshold: 0, // Trigger as soon as ANY part enters
  };

  /**
   * NAV HIGHLIGHT OBSERVER
   *
   * When a section enters our detection zone (middle of viewport),
   * we find the corresponding nav link and highlight it.
   */
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");

        // Update all nav links: highlight matching, reset others
        navLinks.forEach((link) => {
          link.style.color =
            link.getAttribute("href") === `#${id}`
              ? "var(--color-accent)" // Highlighted color
              : ""; // Reset to default (inherits from CSS)
        });
      }
    });
  }, observerOptions);

  // Observe all sections with IDs
  sections.forEach((section) => navObserver.observe(section));
}

// ==========================================================================
// 5. INITIALIZATION
// ==========================================================================

/**
 * DOMContentLoaded: The safe time to run DOM-manipulating JavaScript.
 *
 * 🎓 WHY DOMContentLoaded?
 * - Fires when HTML is fully parsed (DOM is ready)
 * - Doesn't wait for images/stylesheets to load (that's 'load' event)
 * - Safe to query and manipulate DOM elements
 *
 * If your script is in <head> without 'defer', this is essential.
 * If your script is at end of <body> or has 'defer', it's optional but good practice.
 */
document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
  initSmoothScroll();
  initActiveNav();

  console.log("🚀 Grade 1 Demo: Vanilla scroll animations initialized");
  // build project list (order as in DOM) — prefer .card-back IDs, fallback to .see-more
  const backs = Array.from(document.querySelectorAll(".card-back")).map((el) =>
    el.id.replace(/^project-/, "")
  );
  if (backs.length) projectList = backs;
  else
    projectList = Array.from(document.querySelectorAll(".see-more")).map(
      (btn) => btn.getAttribute("data-project-id")
    );
  // compute modal size based on largest project content
  computeModalSize();
  window.addEventListener("resize", computeModalSize);

  // Attach click handlers directly to project cards as a robust fallback
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // ignore clicks on interactive elements inside the card
      if (e.target.closest("a, button, input, textarea, select")) return;

      // try to find a hidden .card-back inside this card
      const contentEl = card.querySelector(".card-back") || null;
      if (contentEl) {
        e.preventDefault();
        console.log("Opening modal from card click (direct):", card);
        openProjectModal(contentEl, card);
        return;
      }

      // fallback: try to resolve by data-project-id on the card
      const id =
        card.getAttribute("data-project-id") ||
        card.querySelector(".see-more")?.getAttribute("data-project-id");
      if (id) {
        const el = document.getElementById(`project-${id}`);
        if (el) {
          e.preventDefault();
          console.log("Opening modal from card click (fallback id):", id);
          openProjectModal(el, card);
        }
      }
    });
  });
});

// Extra fallback: direct card click handler that searches for a .card-back inside the card
// This helps when DOM structure is customized or data attributes are missing.
document.addEventListener("click", (e) => {
  const card = e.target.closest && e.target.closest(".project-card");
  if (!card) return;
  if (e.target.closest("a, button, input, textarea, select")) return;

  // If an existing handler already opened the modal, don't double-handle
  const modalOpen =
    document.getElementById("project-modal")?.getAttribute("aria-hidden") ===
    "false";
  if (modalOpen) return;

  // Look for a .card-back element inside the card (hidden source)
  const embeddedBack = card.querySelector(".card-back");
  if (embeddedBack) {
    e.preventDefault();
    console.debug("Opening modal from embedded .card-back inside card");
    openProjectModal(embeddedBack, card);
    return;
  }

  // Fallback: try to find a project id on card or inside and open matching #project-id
  const id =
    card.getAttribute("data-project-id") ||
    card.querySelector(".see-more")?.getAttribute("data-project-id");
  if (id) {
    const contentEl = document.getElementById(`project-${id}`);
    if (contentEl) {
      e.preventDefault();
      console.debug("Opening modal from fallback id:", id);
      openProjectModal(contentEl, card);
    }
  }
});

function computeModalSize() {
  const panel = document.querySelector(".project-modal-panel");
  if (!panel) return;

  // find all .card-back-inner elements and measure their natural sizes
  const backs = Array.from(
    document.querySelectorAll(".card-back .card-back-inner")
  );
  let maxW = 0;
  let maxH = 0;
  backs.forEach((b) => {
    // clone to measure off-DOM if necessary
    const clone = b.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "-9999px";
    clone.style.visibility = "hidden";
    document.body.appendChild(clone);
    const rect = clone.getBoundingClientRect();
    maxW = Math.max(maxW, rect.width);
    maxH = Math.max(maxH, rect.height);
    clone.remove();
  });

  // apply min dimensions (with some padding)
  const maxPanelW = Math.min(820, Math.floor(window.innerWidth * 0.92));
  if (maxW > 0) panel.style.minWidth = Math.min(maxW + 64, maxPanelW) + "px";
  if (maxH > 0)
    panel.style.minHeight = Math.min(maxH + 64, window.innerHeight - 80) + "px";
}
/* ------------------------------------------------------------------
   Project modal interaction
   - Opens modal centered with content cloned from hidden .card-back
   - Accessible: sets aria-hidden, focuses panel, restores focus on close
   - Close via: backdrop click, close button, ESC key
   ------------------------------------------------------------------ */
const projectModal = document.getElementById("project-modal");
const modalContent = projectModal?.querySelector(".project-modal-content");
let lastFocusedTrigger = null;
let galleryState = {
  images: [],
  index: 0,
};
let projectList = [];
let currentProjectIndex = -1;

function openProjectModal(contentEl, trigger) {
  // Debugging: log presence of key DOM refs and incoming trigger
  console.debug("openProjectModal invoked", {
    projectModal: !!projectModal,
    modalContent: !!modalContent,
    trigger,
  });
  if (!projectModal || !modalContent) {
    console.error(
      "openProjectModal: missing projectModal or modalContent; aborting open."
    );
    return;
  }
  // remember where focus came from
  lastFocusedTrigger = trigger || document.activeElement;

  // clone the node so we can show it in modal
  modalContent.innerHTML = "";
  const clone = contentEl.cloneNode(true);
  clone.removeAttribute("hidden");
  // If there's a .card-back-inner, append its children directly so the
  // .project-modal-content grid can lay out gallery and meta as direct children
  const inner = clone.querySelector(".card-back-inner");
  if (inner) {
    Array.from(inner.children).forEach((child) => {
      modalContent.appendChild(child.cloneNode(true));
    });
  } else {
    modalContent.appendChild(clone);
  }

  projectModal.setAttribute("aria-hidden", "false");

  // prevent background scroll and hide main from assistive tech
  document.body.classList.add("modal-open");
  const mainEl = document.querySelector("main");
  if (mainEl) mainEl.setAttribute("aria-hidden", "true");

  // set focus to modal content for accessibility
  const focusTarget = modalContent.querySelector("[tabindex]") || modalContent;
  focusTarget.focus();

  // initialize gallery if present
  const gallery = modalContent.querySelector("[data-gallery]");
  if (gallery) {
    initModalGallery(gallery);
  }

  // Resolve currentProjectIndex: prefer data-project-id on trigger, fallback to contentEl id
  let resolvedId = null;
  if (trigger && trigger.getAttribute)
    resolvedId = trigger.getAttribute("data-project-id");
  if (!resolvedId && contentEl && contentEl.id) {
    resolvedId = contentEl.id.replace(/^project-/, "");
  }
  if (resolvedId) {
    currentProjectIndex = projectList.indexOf(resolvedId);
  }
  console.debug(
    "openProjectModal resolved currentProjectIndex=",
    currentProjectIndex,
    "resolvedId=",
    resolvedId
  );

  // listen for ESC key
  document.addEventListener("keydown", handleModalKeydown);
}

function closeProjectModal() {
  if (!projectModal || !modalContent) return;
  projectModal.setAttribute("aria-hidden", "true");
  modalContent.innerHTML = "";
  document.removeEventListener("keydown", handleModalKeydown);
  // restore background scroll and aria-hidden
  document.body.classList.remove("modal-open");
  const mainEl = document.querySelector("main");
  if (mainEl) mainEl.removeAttribute("aria-hidden");
  // restore focus
  if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
    lastFocusedTrigger.focus();
  }

  // cleanup gallery state and controls
  galleryState.images = [];
  galleryState.index = 0;
}

function handleModalKeydown(e) {
  if (e.key === "Escape") {
    closeProjectModal();
  } else if (e.key === "ArrowRight") {
    modalNextImage();
  } else if (e.key === "ArrowLeft") {
    modalPrevImage();
  }
}

// Navigate projects in modal
function openProjectByIndex(idx, trigger) {
  if (!projectList.length) return;
  idx = (idx + projectList.length) % projectList.length;
  const id = projectList[idx];
  console.debug("openProjectByIndex called with idx=", idx, "resolved id=", id);
  const contentEl = document.getElementById(`project-${id}`);
  if (!contentEl) return;
  // find the triggering element (if any) in the grid to restore focus later
  const triggerEl = document.querySelector(
    `.see-more[data-project-id="${id}"]`
  );
  openProjectModal(contentEl, triggerEl || trigger);
}

// modal prev/next handlers
document.addEventListener("click", (e) => {
  if (e.target.matches("[data-modal-prev]")) {
    console.debug(
      "modal prev clicked, currentProjectIndex=",
      currentProjectIndex
    );
    // open previous project
    openProjectByIndex(currentProjectIndex - 1);
  }
  if (e.target.matches("[data-modal-next]")) {
    console.debug(
      "modal next clicked, currentProjectIndex=",
      currentProjectIndex
    );
    openProjectByIndex(currentProjectIndex + 1);
  }
});

// Open modal when clicking on a project card (ignore internal links/buttons)
document.addEventListener("click", (e) => {
  const card = e.target.closest && e.target.closest(".project-card");
  if (!card) return;

  // ignore clicks on interactive elements inside the card
  if (e.target.closest("a, button, input, textarea, select")) return;

  // attempt to find a project id on the card; fallback to nearest .see-more data if present
  let id = card.getAttribute("data-project-id");
  if (!id) {
    const btn = card.querySelector(".see-more[data-project-id]");
    if (btn) id = btn.getAttribute("data-project-id");
  }
  if (!id) return;

  const contentEl = document.getElementById(`project-${id}`);
  if (!contentEl) return;

  openProjectModal(contentEl, card);
});

// Close handlers (backdrop and close button)
document.addEventListener("click", (e) => {
  if (e.target.matches("[data-modal-close]")) {
    closeProjectModal();
  }
});

/* -------------------------
   Modal gallery functions
   ------------------------- */
function initModalGallery(galleryEl) {
  // all images inside source gallery (the cloned gallery is already inside modal)
  const imgs = Array.from(galleryEl.querySelectorAll("img"));
  galleryState.images = imgs;
  galleryState.index = 0;

  // wrap images in container and show only the active one
  imgs.forEach((img, i) => {
    img.dataset.galleryIndex = i;
    img.classList.add("gallery-image");
    // ensure all images are visible in the modal grid
    img.style.display = "block";
  });
}

function showImage(i) {
  const imgs = galleryState.images;
  if (!imgs || imgs.length === 0) return;
  i = (i + imgs.length) % imgs.length;
  imgs.forEach((img, idx) => {
    if (idx === i) img.classList.add("gallery-active");
    else img.classList.remove("gallery-active");
  });
  galleryState.index = i;
}

function modalNextImage() {
  showImage(galleryState.index + 1);
}

function modalPrevImage() {
  showImage(galleryState.index - 1);
}

// Prevent focus from escaping (simple trap): focus the panel when tabbing past
projectModal?.addEventListener("keydown", (e) => {
  if (e.key !== "Tab") return;
  const focusable = projectModal.querySelectorAll(
    "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])"
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first) return;

  if (e.shiftKey) {
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// ==========================================================================
// 6. CLEANUP (FOR SPA ENVIRONMENTS)
// ==========================================================================

/**
 * Cleanup function for Single Page Application (SPA) routing.
 *
 * 🎓 WHY IS CLEANUP IMPORTANT?
 * In SPAs (React, Vue, etc.), pages don't fully reload when navigating.
 * If you don't disconnect observers, they keep watching elements that
 * may have been removed, causing memory leaks and bugs.
 *
 * 📐 WHEN TO CALL THIS:
 * - Before navigating away from this page in an SPA
 * - In React: useEffect cleanup function
 * - In Vue: onUnmounted lifecycle hook
 *
 * For traditional multi-page sites, this isn't needed (page reload cleans up).
 */
window.cleanupScrollObservers = () => {
  singleObserver.disconnect(); // Stop observing all elements
  staggerObserver.disconnect();
  console.log("🧹 Observers cleaned up");
};
// ==============================
// Carousel infinito
// ==============================

const track = document.querySelector(".carousel-track");

if (track) {
  const slides = [...track.children];

  slides.forEach((slide) => {
    const clone = slide.cloneNode(true);
    track.appendChild(clone);
  });
}

//ANIMACION TEXTO H1

const title = document.querySelector(".hero-title");
const letters = title.textContent.split("");
title.textContent = ""; // Limpiamos el contenido

letters.forEach((letter) => {
  const span = document.createElement("span");
  span.textContent = letter;
  span.classList.add("letter");
  title.appendChild(span);
});
gsap.from(".letter", {
  opacity: 0,
  y: 50,
  rotation: 360,
  duration: 1,
  stagger: {
    amount: 1,
    from: "random", // hace que las letras aparezcan en orden aleatorio
  },
  ease: "back.out(1.7)",
});
document.querySelectorAll(".letter").forEach((letter) => {
  letter.addEventListener("mouseenter", () => {
    gsap.to(letter, { scale: 1.5, color: "#f7bfd9", duration: 0.3 });
  });
  letter.addEventListener("mouseleave", () => {
    gsap.to(letter, { scale: 1, color: "#000", duration: 0.3 });
  });
});
