/**
 * Wedding invitation site — Tilda-style clone
 * Main JavaScript: artboard scaling, responsive breakpoints, scroll animations,
 * heart pulse, lazy loading, form handling
 *
 * Design: 1200x7250px desktop artboard and 320x5740px mobile artboard.
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
                '5740';

            artboard.style.width = '100%';
            artboard.style.height = cleanUnit(mobileHeight) + 'px';
            return;
        }

        artboard.style.width = DESKTOP_ARTBOARD_WIDTH + 'px';
        artboard.style.height =
            cleanUnit(artboard.getAttribute('data-artboard-height') || '7250') + 'px';
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

        var viewportWidth = document.documentElement.clientWidth;
        var MOBILE_BREAKPOINT = 640;
        var isMobile = viewportWidth <= MOBILE_BREAKPOINT;
        var usesMobileArtboard = viewportWidth < DESKTOP_ARTBOARD_WIDTH;

        // Pre-set CSS custom properties so they're available before animation starts
        animElements.forEach(function (el) {
            var distance = usesMobileArtboard
                ? el.getAttribute('data-animate-distance-res-320') || el.getAttribute('data-animate-distance')
                : el.getAttribute('data-animate-distance');

            if (distance) {
                el.style.setProperty('--anim-distance', distance + 'px');
            }
        });

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;

                    var el = entry.target;
                    var groupName = el.getAttribute('data-animate-group');
                    var revealElements = groupName
                        ? document.querySelectorAll('.tn-elem[data-animate-group="' + groupName + '"]')
                        : [el];

                    revealElements.forEach(function (revealEl) {
                        var duration = revealEl.getAttribute('data-animate-duration') || '1';
                        var delay = usesMobileArtboard
                            ? revealEl.getAttribute('data-animate-delay-res-320') || revealEl.getAttribute('data-animate-delay') || '0'
                            : revealEl.getAttribute('data-animate-delay') || '0';

                        revealEl.style.transitionDuration = duration + 's';
                        revealEl.style.transitionDelay = (parseFloat(delay) + 0.25) + 's';
                        revealEl.classList.add('t-animate_started');
                        observer.unobserve(revealEl);
                    });
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
    // 6. RSVP form submission
    // ──────────────────────────────────────────────

    // Dedicated unified function for this site. The production function currently
    // used by Invintation remains unchanged.
    var RSVP_ENDPOINT = 'https://functions.yandexcloud.net/d4e9i19l0j4qjmotejt6';

    function initForm() {
        var form = document.querySelector('.js-form-proccess');
        if (!form) return;

        var feedback = form.querySelector('.js-form-feedback');
        var submitButton = form.querySelector('button[type="submit"]');
        var nameInput = form.querySelector('input[name="guest_names"]');

        function showFeedback(message, type) {
            feedback.textContent = message;
            feedback.className = 'js-form-feedback t-form__feedback t-form__feedback--' + type;
            feedback.hidden = false;
            requestAnimationFrame(function () {
                feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }

        function setPending(isPending) {
            submitButton.disabled = isPending;
            submitButton.setAttribute('aria-busy', String(isPending));
            submitButton.textContent = isPending
                ? submitButton.getAttribute('data-pending-text')
                : submitButton.getAttribute('data-idle-text');
        }

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var radioChecked = this.querySelector('input[name="attendance"]:checked');
            nameInput.classList.remove('t-input--error');
            feedback.hidden = true;

            if (!nameInput.value.trim()) {
                nameInput.classList.add('t-input--error');
                showFeedback('Пожалуйста, укажите ваше имя.', 'error');
                nameInput.focus();
                return;
            }

            if (!radioChecked) {
                showFeedback('Пожалуйста, выберите, сможете ли вы присутствовать.', 'error');
                return;
            }

            var drinks = Array.prototype.map.call(
                this.querySelectorAll('input[name="drinks"]:checked'),
                function (input) { return input.value; }
            );

            var payload = {
                site: 'lera-and-nikita',
                guest_names: nameInput.value.trim(),
                attendance: radioChecked.value,
                drinks: drinks,
                favorite_track: this.querySelector('input[name="favorite_track"]').value.trim(),
                website: this.querySelector('input[name="website"]').value
            };

            if (!/^https:\/\/functions\.yandexcloud\.net\/[A-Za-z0-9_-]+$/.test(RSVP_ENDPOINT)) {
                console.error('RSVP endpoint is not configured');
                showFeedback('Форма временно не настроена. Пожалуйста, сообщите об этом организаторам.', 'error');
                return;
            }

            setPending(true);
            showFeedback('Отправляем ваш ответ…', 'pending');

            var controller = new AbortController();
            var requestTimeout = setTimeout(function () { controller.abort(); }, 20000);

            try {
                var response = await fetch(RSVP_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
                var result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Request failed');
                }

                form.reset();
                showFeedback('Спасибо! Ваши данные отправлены.', 'success');
            } catch (error) {
                console.error('RSVP submission failed:', error);
                showFeedback('Не удалось отправить данные. Проверьте интернет и попробуйте ещё раз.', 'error');
            } finally {
                clearTimeout(requestTimeout);
                setPending(false);
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
        document.documentElement.classList.add('animations-ready');
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
