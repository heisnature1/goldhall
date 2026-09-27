// ===== PAGE LOADER =====
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.getElementById('pageLoader').classList.add('hidden');
            }, 1500);
        });

        // ===== HEADER SCROLL EFFECT =====
        const header = document.getElementById('header');
        const backToTop = document.getElementById('backToTop');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
                backToTop.classList.add('visible');
            } else {
                header.classList.remove('scrolled');
                backToTop.classList.remove('visible');
            }
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

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        // ===== COUNTER ANIMATION =====
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counters = entry.target.querySelectorAll('.stat-number');
                    counters.forEach(counter => {
                        const target = parseInt(counter.dataset.count);
                        const duration = 2000;
                        const step = target / (duration / 16);
                        let current = 0;

                        const updateCounter = () => {
                            current += step;
                            if (current < target) {
                                counter.textContent = Math.floor(current).toLocaleString();
                                requestAnimationFrame(updateCounter);
                            } else {
                                counter.textContent = target.toLocaleString() + '+';
                            }
                        };

                        updateCounter();
                    });
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            counterObserver.observe(statsSection);
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
        const sections = document.querySelectorAll('section[id]');

        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 200;
                if (window.scrollY >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });

            document.querySelectorAll('.main-nav a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + current) {
                    link.classList.add('active');
                }
            });
        });

        // ===== PARALLAX EFFECT FOR HERO =====
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const hero = document.querySelector('.hero');
            if (hero && scrolled < window.innerHeight) {
                hero.style.transform = `translateY(${scrolled * 0.3}px)`;
            }
        });
