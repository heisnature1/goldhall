// ===== PAGE LOADER =====
        // Same timing as before, but guarded: if the loader is missing (or a
        // page is being rendered without one) this must not throw.
        const dismissLoader = () => {
            const loader = document.getElementById('pageLoader');
            if (!loader) return;
            setTimeout(() => loader.classList.add('hidden'), 1500);
        };
        if (document.readyState === 'complete') {
            dismissLoader();
        } else {
            window.addEventListener('load', dismissLoader, { once: true });
        }
        // Safety net: a stalled asset must never leave the loader covering the page.
        setTimeout(() => {
            const loader = document.getElementById('pageLoader');
            if (loader) loader.classList.add('hidden');
        }, 6000);

        // ===== HEADER SCROLL EFFECT & STICKY NAV OFFSET =====
        const header = document.getElementById('header');
        const backToTop = document.getElementById('backToTop');

        const syncHeaderHeight = () => {
            if (header && header.offsetHeight) {
                document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
            }
        };

        syncHeaderHeight();
        window.addEventListener('load', syncHeaderHeight);
        window.addEventListener('resize', syncHeaderHeight, { passive: true });
        if (header) {
            header.addEventListener('transitionend', syncHeaderHeight);
            if (typeof ResizeObserver !== 'undefined') {
                new ResizeObserver(syncHeaderHeight).observe(header);
            }
        }

        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
                backToTop.classList.add('visible');
            } else {
                header.classList.remove('scrolled');
                backToTop.classList.remove('visible');
            }
            syncHeaderHeight();
        });

        // ===== BACK TO TOP =====
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // ===== MOBILE MENU =====
        const hamburger = document.getElementById('hamburger');
        const navSection = document.getElementById('navSection');
        const mobileOverlay = document.getElementById('mobileOverlay');
        const mobileNavClose = document.getElementById('mobileNavClose');

        function toggleMobileMenu() {
            hamburger.classList.toggle('active');
            navSection.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = navSection.classList.contains('active') ? 'hidden' : '';
        }

        hamburger.addEventListener('click', toggleMobileMenu);
        mobileOverlay.addEventListener('click', toggleMobileMenu);
        mobileNavClose.addEventListener('click', toggleMobileMenu);

        // Close mobile menu when a nav link is clicked
        document.querySelectorAll('.main-nav > li > a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    // Check if it's a dropdown
                    const parent = link.parentElement;
                    if (parent.classList.contains('nav-dropdown')) {
                        parent.classList.toggle('open');
                        return;
                    }
                    toggleMobileMenu();
                }
            });
        });

        // ===== LOGIN BUTTON MENU =====
        const loginMenu = document.querySelector('.login-btn');
        const loginToggle = loginMenu ? loginMenu.querySelector('.btn') : null;

        if (loginMenu && loginToggle) {
            const setLoginOpen = (open) => {
                loginMenu.classList.toggle('open', open);
                loginToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            };

            loginToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                setLoginOpen(!loginMenu.classList.contains('open'));
            });

            document.addEventListener('click', (e) => {
                if (!loginMenu.contains(e.target)) {
                    setLoginOpen(false);
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && loginMenu.classList.contains('open')) {
                    setLoginOpen(false);
                    loginToggle.focus();
                }
            });
        }

        // ===== HERO SLIDER =====
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.hero-dot');
        let currentSlide = 0;
        let slideInterval;

        function showSlide(index) {
            slides.forEach(s => s.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));
            slides[index].classList.add('active');
            dots[index].classList.add('active');
            currentSlide = index;
        }

        function nextSlide() {
            showSlide((currentSlide + 1) % slides.length);
        }

        function startSlider() {
            slideInterval = setInterval(nextSlide, 5000);
        }

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                clearInterval(slideInterval);
                showSlide(parseInt(dot.dataset.slide));
                startSlider();
            });
        });

        startSlider();

        // ===== SCROLL ANIMATIONS =====
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animated');
                        entry.target.style.animation = `fadeInUp 0.8s ease forwards`;
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Elements carrying their own reveal treatment (e.g. the 3D hinge
        // headings) are handled by fx.js; observing them here would fight
        // that animation with an inline fadeInUp.
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            if (el.hasAttribute('data-reveal')) return;
            observer.observe(el);
        });

        // ===== COUNTER ANIMATION =====
        // The markup ships "0" in each .stat-number and the numbers are only
        // ever written by this script, so every path out of here has to leave a
        // real figure on screen: an unobserved section, a missed observer tick
        // (fast scroll, restored scroll position, jump-to-anchor) or reduced
        // motion must not leave four zeros behind.
        const statsSection = document.querySelector('.stats-section');
        const counters = statsSection ? Array.from(statsSection.querySelectorAll('.stat-number')) : [];
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let countersDone = false;

        const finalValue = counter => {
            const target = parseInt(counter.dataset.count, 10);
            return Number.isFinite(target) ? target.toLocaleString() + '+' : counter.textContent;
        };

        // Write the finished numbers straight away. Also the fallback for
        // anything that never starts the animation.
        const showFinalCounts = () => {
            if (countersDone) return;
            countersDone = true;
            counters.forEach(counter => {
                const target = parseInt(counter.dataset.count, 10);
                if (Number.isFinite(target)) counter.textContent = target.toLocaleString() + '+';
            });
        };

        const animateCounters = () => {
            if (countersDone || !counters.length) return;
            countersDone = true;

            if (reduceMotion) {
                counters.forEach(counter => { counter.textContent = finalValue(counter); });
                return;
            }

            counters.forEach(counter => {
                const target = parseInt(counter.dataset.count, 10);
                if (!Number.isFinite(target)) return;

                const duration = 2000;
                const start = performance.now();

                const tick = now => {
                    // Clamp both ends: a timestamp from a different clock (or a
                    // paused tab) must not produce a negative or runaway value.
                    const elapsed = Number.isFinite(now) ? now - start : duration;
                    const progress = Math.max(0, Math.min(elapsed / duration, 1));
                    // easeOutCubic: quick start, gentle landing.
                    const eased = 1 - Math.pow(1 - progress, 3);
                    if (progress < 1) {
                        counter.textContent = Math.round(target * eased).toLocaleString();
                        requestAnimationFrame(tick);
                    } else {
                        counter.textContent = target.toLocaleString() + '+';
                    }
                };

                requestAnimationFrame(tick);
            });
        };

        if (statsSection && counters.length) {
            if (typeof IntersectionObserver === 'function') {
                const counterObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) return;
                        animateCounters();
                        counterObserver.disconnect();
                    });
                }, { threshold: 0.15 });

                counterObserver.observe(statsSection);

                // Already on screen at load? The observer fires on the next
                // frame; if it does not, this catches it.
                setTimeout(() => {
                    if (countersDone) return;
                    const box = statsSection.getBoundingClientRect();
                    if (box.top < window.innerHeight && box.bottom > 0) animateCounters();
                }, 800);
            } else {
                animateCounters();
            }

            // Last resort: whatever happened, real numbers are on screen within
            // a few seconds. Nothing is left at zero.
            setTimeout(showFinalCounts, 6000);
        }

        // ===== LIGHTBOX =====
        function openLightbox(element) {
            const img = element.querySelector('img');
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightboxImg');
            lightboxImg.src = img.src;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            const lightbox = document.getElementById('lightbox');
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        document.getElementById('lightbox').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                closeLightbox();
            }
        });

        // ESC key to close lightbox
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
            }
        });

        // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // ===== ACTIVE NAV LINK ON SCROLL =====
        // Keep exactly one of the six tabs lit: Home by default, and the tab
        // owning the section currently under the header while scrolling.
        const sections = document.querySelectorAll('section[id]');
        const sectionTab = {
            'student-hub': 'student',
            about: 'about',
            events: 'events',
            gallery: 'gallery'
        };

        const syncActiveTab = () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 200;
                if (window.scrollY >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });

            // The Home tab's href is "./" and the others are bare slugs.
            const activeHref = sectionTab[current] || './';
            document.querySelectorAll('.main-nav a').forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === activeHref);
            });
        };

        window.addEventListener('scroll', syncActiveTab, { passive: true });
        syncActiveTab();

        // ===== PARALLAX EFFECT FOR HERO =====
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const hero = document.querySelector('.hero');
            if (hero && scrolled < window.innerHeight) {
                hero.style.transform = `translateY(${scrolled * 0.3}px)`;
            }
        });
