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
