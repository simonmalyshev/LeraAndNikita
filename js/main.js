/**
 * Wedding invitation site — Tilda-style clone
 * Main JavaScript: artboard scaling, responsive breakpoints, scroll animations,
 * heart pulse, lazy loading, form handling
 *
 * Design: 1200x5943px desktop artboard and 320x4533px mobile artboard.
 * Animations: IntersectionObserver-based reveal + JS pulse
 */

(function () {
    'use strict';

    var DESKTOP_ARTBOARD_WIDTH = 1200;
    var MOBILE_ARTBOARD_WIDTH = 320;

    // ──────────────────────────────────────────────
    // 1. Artboard Responsive Scaling
    // ──────────────────────────────────────────────

    /**
     * Mirrors the Tilda artboard model: desktop uses a 1200px grid, while
     * narrower viewports switch to the 320px responsive grid. We do not scale
     * the desktop artboard down, because that double-scales mobile coordinates.
     */
    function updateArtboardScale() {
        var artboard = document.querySelector('.t396__artboard');
        if (!artboard) return;

        var vw = document.documentElement.clientWidth;
        var isMobile = vw < DESKTOP_ARTBOARD_WIDTH;

        artboard.style.transform = '';
        artboard.style.marginBottom = '';
        artboard.style.transformOrigin = '';

        if (isMobile) {
            var mobileHeight =
                artboard.getAttribute('data-artboard-height-res-320') ||
                artboard.getAttribute('data-artboard-height') ||
                '4533';

            artboard.style.width = '100%';
            artboard.style.height = cleanUnit(mobileHeight) + 'px';
            return;
        }

        artboard.style.width = DESKTOP_ARTBOARD_WIDTH + 'px';
        artboard.style.height =
            cleanUnit(artboard.getAttribute('data-artboard-height') || '5943') + 'px';
    }

    // ──────────────────────────────────────────────
    // 2. Responsive Breakpoint Switching
    // ──────────────────────────────────────────────

    /**
     * Reads the artboard's data-artboard-screens attribute and applies
     * the closest matching breakpoint per-element values (top, left, width,
     * height, fontsize) as inline styles.
     */
    function applyResponsiveBreakpoints() {
        var artboard = document.querySelector('.t396__artboard');
        if (!artboard) return;

        var screensAttr = artboard.getAttribute('data-artboard-screens');
        if (!screensAttr) return;

        var screens = screensAttr.split(',').map(function (s) {
            return parseInt(s, 10);
        }).sort(function (a, b) { return a - b; });

        var vw = document.documentElement.clientWidth;

        // Tilda chooses the largest available screen that is not wider than
        // the current viewport. With screens "320,1200", any width below 1200
        // uses the 320px layout.
        var breakpoint = screens[0];
        for (var i = 0; i < screens.length; i++) {
            if (vw >= screens[i]) {
                breakpoint = screens[i];
            }
        }

        var gridWidth = breakpoint === 320 ? MOBILE_ARTBOARD_WIDTH : DESKTOP_ARTBOARD_WIDTH;
        var gridHalf = gridWidth / 2;
        var elements = document.querySelectorAll('.tn-elem');

        for (var j = 0; j < elements.length; j++) {
            var el = elements[j];
            var posFields = ['top', 'left', 'width', 'height'];

            for (var k = 0; k < posFields.length; k++) {
                var field = posFields[k];
                var value = null;

                // Try breakpoint-specific value first
                if (breakpoint !== null) {
                    var bpAttr = 'data-field-' + field + '-res-' + breakpoint + '-value';
                    value = el.getAttribute(bpAttr);
                }

                // Fall back to default if no breakpoint value
                if (value === null) {
                    value = el.getAttribute('data-field-' + field + '-value');
                }

                if (value !== null) {
                    value = cleanUnit(value);

                    if (field === 'left') {
                        el.style.left = 'calc(50% - ' + gridHalf + 'px + ' + value + 'px)';
                    } else if (field === 'height' && shouldUseAutoHeight(el)) {
                        el.style.height = 'auto';
                    } else {
                        el.style[field] = value + 'px';
                    }
                }
            }

            // Fontsize — apply to .tn-atom[field] child
            var fontValue = null;
            if (breakpoint !== null) {
                fontValue = el.getAttribute('data-field-fontsize-res-' + breakpoint + '-value');
            }
            if (fontValue === null) {
                fontValue = el.getAttribute('data-field-fontsize-value');
            }
            if (fontValue !== null) {
                var atom = el.querySelector('.tn-atom[field]');
                if (atom) {
                    atom.style.fontSize = fontValue + 'px';
                }
            }
        }
    }

    function cleanUnit(value) {
        return String(value).replace('px', '').trim();
    }

    function shouldUseAutoHeight(el) {
        if (el.getAttribute('data-elem-type') === 'shape') return false;
        return el.getAttribute('data-field-heightmode-value') === 'hug' ||
            el.getAttribute('data-field-textfit-value') === 'autoheight';
    }

    // ──────────────────────────────────────────────
    // 3. Scroll-Based Reveal Animations
    // ──────────────────────────────────────────────

    /**
     * Observes all elements with data-animate-style and adds the
     * CSS class `t-animate_started` when they enter the viewport.
     * Respects data-animate-duration, data-animate-delay, and
     * data-animate-mobile attributes.
     */
    function initScrollAnimations() {
        var animElements = document.querySelectorAll('.tn-elem[data-animate-style]');
        if (!animElements.length) return;

        var MOBILE_BREAKPOINT = 640;
        var isMobile = document.documentElement.clientWidth <= MOBILE_BREAKPOINT;

        // Pre-set CSS custom properties so they're available before animation starts
        animElements.forEach(function (el) {
            var distance = el.getAttribute('data-animate-distance');

            if (distance) {
                el.style.setProperty('--anim-distance', distance + 'px');
            }
        });

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;

                    var el = entry.target;
                    var duration = el.getAttribute('data-animate-duration') || '3';
                    var delay = el.getAttribute('data-animate-delay') || '0';

                    // Override CSS hardcoded animation values with data attributes
                    el.style.animationDuration = duration + 's';
                    el.style.animationDelay = delay + 's';

                    // Trigger the CSS animation defined in style.css
                    el.classList.add('t-animate_started');

                    // Stop observing once triggered (one-shot animation)
                    observer.unobserve(el);
                });
            },
            {
                threshold: 0.15,
                rootMargin: '0px 0px -50px 0px',
            }
        );

        animElements.forEach(function (el) {
            // On mobile, only animate elements with data-animate-mobile="y"
            if (isMobile && el.getAttribute('data-animate-mobile') !== 'y') return;
            observer.observe(el);
        });
    }

    // ──────────────────────────────────────────────
    // 4. Heart Pulse Animation (JS-based)
    // ──────────────────────────────────────────────

    /**
     * Starts a continuous pulse animation (scale 1 -> 1.4 -> 1) using
     * requestAnimationFrame when the element enters the viewport.
     */
    function initHeartPulse() {
        var pulseElements = document.querySelectorAll(
            '.tn-elem[data-animate-style="pulse"], .tn-elem[data-animate-sbs-opts]'
        );
        if (!pulseElements.length) return;

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    startPulseAnimation(entry.target);
                    observer.unobserve(entry.target);
                });
            },
            { threshold: 0.15 }
        );

        pulseElements.forEach(function (el) {
            observer.observe(el);
        });
    }

    /**
     * Animates an element with a looping scale pulse via requestAnimationFrame.
     * @param {Element} el - The DOM element to animate.
     */
    function startPulseAnimation(el) {
        var PULSE_DURATION = 2000; // 1000ms grow + 1000ms shrink
        var startTime = null;

        // Ensure the element is visible and transform from center
        el.style.opacity = '1';
        el.style.transformOrigin = 'center center';

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            var elapsed = (timestamp - startTime) % PULSE_DURATION;

            var scale;
            if (elapsed < 1000) {
                // Grow phase: ease-out (cubic)
                var t = elapsed / 1000;
                scale = 1 + 0.4 * (1 - Math.pow(1 - t, 3));
            } else {
                // Shrink phase: ease-in (cubic)
                var t = (elapsed - 1000) / 1000;
                scale = 1.4 - 0.4 * (t * t * t);
            }

            el.style.transform = 'scale(' + scale + ')';

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }

    // ──────────────────────────────────────────────
    // 5. Lazy Loading Images
    // ──────────────────────────────────────────────

    /**
     * For all <img> elements inside .tn-atom with data-original,
     * replaces src with a transparent placeholder until the image
     * enters the viewport, then swaps in the real URL with a
     * smooth opacity transition.
     */
    function initLazyLoading() {
        // Lazy-load images: swap data-original → src on viewport entry
        var imgs = document.querySelectorAll('.tn-atom__img[data-original]');
        if (!imgs.length) return;

        var TRANSPARENT_PIXEL =
            'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        imgs.forEach(function (img) {
            img.src = TRANSPARENT_PIXEL;
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.5s ease';
        });

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;

                    var img = entry.target;
                    var original = img.getAttribute('data-original');
                    if (original) {
                        img.src = original;
                        img.addEventListener('load', function () {
                            img.style.opacity = '1';
                        });
                        img.addEventListener('error', function () {
                            // If image fails to load, still show something
                            img.style.opacity = '1';
                        });
                    }

                    observer.unobserve(img);
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px 100px 0px',
            }
        );

        imgs.forEach(function (img) {
            observer.observe(img);
        });
    }

    // ──────────────────────────────────────────────
    // 6. Form Handling (visual only, no data sent)
    // ──────────────────────────────────────────────

    /**
     * Handles the RSVP form submission — validates required fields
     * and shows the success message, hiding the inputs.
     */
    function initForm() {
        var form = document.querySelector('.js-form-proccess');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Simple validation
            var nameInput = this.querySelector('.t-input[data-tilda-req="1"]');
            var radioChecked = this.querySelector(
                'input[type="radio"][data-tilda-req="1"]:checked'
            );

            // Reset any previous error styling
            if (nameInput) {
                nameInput.style.borderColor = '';
            }

            // Validate name field
            if (nameInput && !nameInput.value.trim()) {
                nameInput.style.borderColor = 'red';
                nameInput.focus();
                return;
            }

            // Validate radio selection
            if (!radioChecked) {
                alert('Пожалуйста, выберите, сможете ли вы присутствовать');
                return;
            }

            // Validation passed — show success message
            var successBox = this.querySelector('.js-successbox');
            var inputsBox = this.querySelector('.t-form__inputsbox');

            if (successBox && inputsBox) {
                inputsBox.style.display = 'none';
                successBox.style.display = 'block';
            }
        });
    }

    // ──────────────────────────────────────────────
    // 7. Initialization
    // ──────────────────────────────────────────────

    document.addEventListener('DOMContentLoaded', function () {
        updateArtboardScale();
        applyResponsiveBreakpoints();
        initScrollAnimations();
        initHeartPulse();
        // Keep local assets eager-loaded. The source uses Tilda lazyload, but
        // hiding below-the-fold images before scroll makes full-page renders
        // diverge and briefly removes important decor such as the calendar heart.
        initForm();
    });

    // ──────────────────────────────────────────────
    // 8. Resize Handler (debounced)
    // ──────────────────────────────────────────────

    var resizeTimeout;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            updateArtboardScale();
            applyResponsiveBreakpoints();
        }, 150);
    });

})();
