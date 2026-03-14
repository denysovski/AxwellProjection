(() => {
  const body = document.body;
  body.classList.add('is-loading');

  const menuToggle = document.querySelector('#menuToggle');
  const menuOverlay = document.querySelector('#menuOverlay');
  const menuPanel = document.querySelector('#menuPanel');
  const previewImage = document.querySelector('#menuPreviewImage');
  const previewCaption = document.querySelector('#menuPreviewCaption');
  const menuLinks = document.querySelectorAll('[data-preview]');
  const interactiveTargets = document.querySelectorAll('a, button, .interactive');

  const initLenis = () => {
    const supportsLenis = typeof window.Lenis !== 'undefined';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!supportsLenis || reducedMotion) {
      return;
    }

    const lenis = new window.Lenis({
      duration: 1.2,
      easing: (time) => 1 - Math.pow(1 - time, 3),
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.92,
      normalizeWheel: true,
      anchors: true,
      touchMultiplier: 1.0,
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);
  };

  const setYear = () => {
    const yearNode = document.querySelector('[data-year]');
    if (yearNode) {
      yearNode.textContent = String(new Date().getFullYear());
    }
  };

  const initPageLoadMotion = () => {
    const revealPage = () => {
      window.setTimeout(() => {
        body.classList.remove('is-loading');
        body.classList.add('is-loaded');
      }, 260);
    };

    if (document.readyState === 'complete') {
      revealPage();
      return;
    }

    window.addEventListener('load', revealPage, { once: true });
  };

  const updateHeroScroll = () => {
    const heroStage = document.querySelector('.hero-stage');
    if (!heroStage) {
      document.documentElement.style.setProperty('--social-alpha', '0');
      return;
    }

    const compute = () => {
      const stageRect = heroStage.getBoundingClientRect();
      const maxDistance = Math.max(heroStage.offsetHeight - window.innerHeight, 1);
      const traveled = Math.min(Math.max(-stageRect.top, 0), maxDistance);
      const progress = traveled / maxDistance;
      const socialAlpha = Math.max(0, 1 - progress * 1.7);
      document.documentElement.style.setProperty('--hero-progress', progress.toFixed(4));
      document.documentElement.style.setProperty('--social-alpha', socialAlpha.toFixed(4));
    };

    compute();
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
  };

  const initPipelineFocus = () => {
    const track = document.querySelector('#pipelineTrack');
    const pipelineItems = Array.from(document.querySelectorAll('[data-pipeline-item]'));
    const pipelineLabels = Array.from(document.querySelectorAll('[data-pipeline-label]'));

    if (!track || pipelineItems.length === 0) {
      return;
    }

    const compute = () => {
      const trackRect = track.getBoundingClientRect();
      const maxDistance = Math.max(track.offsetHeight - window.innerHeight, 1);
      const traveled = Math.min(Math.max(-trackRect.top, 0), maxDistance);
      const progress = traveled / maxDistance;
      const normalized = progress * (pipelineItems.length - 1);

      let activeIndex = 0;
      let maxFocus = -1;

      pipelineItems.forEach((item, index) => {
        const distance = Math.abs(index - normalized);
        const focus = Math.max(0, 1 - distance);
        const depth = index - normalized;

        item.style.setProperty('--focus', focus.toFixed(4));
        item.style.setProperty('--depth', depth.toFixed(4));
        item.style.zIndex = String(20 + Math.round(focus * 100));

        if (focus > maxFocus) {
          maxFocus = focus;
          activeIndex = index;
        }
      });

      pipelineLabels.forEach((label, index) => {
        label.classList.toggle('is-active', index === activeIndex);
      });
    };

    compute();
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
  };

  const initStudioInfoAnimation = () => {
    const statsSection = document.querySelector('.stats-asym');
    if (!statsSection) {
      return;
    }

    const counterNodes = Array.from(statsSection.querySelectorAll('[data-counter]'));
    const barNodes = Array.from(statsSection.querySelectorAll('[data-bar-fill]'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animated = false;

    const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

    const animateCounter = (node, index) => {
      const target = Number.parseFloat(node.getAttribute('data-counter-target') || '0');
      const decimals = Number.parseInt(node.getAttribute('data-counter-decimals') || '0', 10);
      const prefix = node.getAttribute('data-counter-prefix') || '';
      const suffix = node.getAttribute('data-counter-suffix') || '';

      if (!Number.isFinite(target)) {
        return;
      }

      if (reducedMotion) {
        node.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
        return;
      }

      const duration = 1500 + index * 220;
      const delay = index * 120;
      const startedAt = performance.now() + delay;

      const render = (now) => {
        if (now < startedAt) {
          requestAnimationFrame(render);
          return;
        }

        const elapsed = now - startedAt;
        const rawProgress = Math.min(elapsed / duration, 1);
        const progress = easeOutCubic(rawProgress);
        const current = target * progress;

        node.textContent = `${prefix}${current.toFixed(decimals)}${suffix}`;

        if (rawProgress < 1) {
          requestAnimationFrame(render);
        }
      };

      requestAnimationFrame(render);
    };

    const animateBars = () => {
      barNodes.forEach((barNode, index) => {
        const target = Number.parseFloat(barNode.getAttribute('data-bar-target') || '0');
        if (!Number.isFinite(target)) {
          return;
        }

        if (reducedMotion) {
          barNode.style.width = `${target}%`;
          return;
        }

        barNode.style.setProperty('--bar-target', target.toString());
        barNode.style.transitionDelay = `${index * 120}ms`;
      });

      statsSection.classList.add('is-animated');
    };

    const run = () => {
      if (animated) {
        return;
      }

      animated = true;
      counterNodes.forEach((node, index) => animateCounter(node, index));
      animateBars();
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          run();
          obs.unobserve(entry.target);
        });
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(statsSection);
  };

  const openMenu = () => {
    body.classList.add('menu-open');
    if (menuPanel) {
      menuPanel.setAttribute('aria-hidden', 'false');
    }
  };

  const closeMenu = () => {
    body.classList.remove('menu-open');
    if (menuPanel) {
      menuPanel.setAttribute('aria-hidden', 'true');
    }
  };

  const initMenu = () => {
    if (!menuToggle || !menuOverlay || !menuPanel) {
      return;
    }

    menuToggle.addEventListener('click', () => {
      const isOpen = body.classList.contains('menu-open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    menuOverlay.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });

    document.querySelectorAll('[data-close-menu]').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    if (menuLinks.length > 0 && previewImage && previewCaption) {
      const applyPreview = (node) => {
        const nextImage = node.getAttribute('data-preview');
        const nextCaption = node.getAttribute('data-caption') || '';
        if (nextImage) {
          previewImage.src = nextImage;
        }
        previewCaption.textContent = nextCaption;
      };

      applyPreview(menuLinks[0]);

      menuLinks.forEach((link) => {
        const update = () => applyPreview(link);
        link.addEventListener('mouseenter', update);
        link.addEventListener('focus', update);
      });
    }
  };

  const initWaveText = () => {
    const waveNodes = document.querySelectorAll('[data-wave]');

    waveNodes.forEach((node) => {
      if (node.dataset.waveReady === 'true') {
        return;
      }

      const originalText = (node.textContent || '').replace(/\s+/g, ' ').trim();
      node.textContent = '';

      let charIndex = 0;
      const words = originalText.split(' ');

      words.forEach((word, wordIndex) => {
        const wordWrapper = document.createElement('span');
        wordWrapper.classList.add('wave-word');

        Array.from(word).forEach((char) => {
          const span = document.createElement('span');
          span.style.setProperty('--char-index', charIndex.toString());
          span.textContent = char;
          wordWrapper.appendChild(span);
          charIndex += 1;
        });

        node.appendChild(wordWrapper);

        if (wordIndex < words.length - 1) {
          const space = document.createElement('span');
          space.classList.add('space');
          space.style.setProperty('--char-index', charIndex.toString());
          space.innerHTML = '&nbsp;';
          node.appendChild(space);
          charIndex += 1;
        }
      });

      node.classList.add('wave-text');
      node.dataset.waveReady = 'true';
    });
  };

  const initScrollReveal = () => {
    const targets = document.querySelectorAll('[data-reveal], [data-wave]');

    if (targets.length === 0) {
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.15,
      }
    );

    targets.forEach((target) => revealObserver.observe(target));

    // Make hero text animate as soon as page settles.
    const primaryWave = document.querySelector('.hero-title[data-wave]');
    if (primaryWave) {
      window.setTimeout(() => {
        requestAnimationFrame(() => {
          primaryWave.classList.add('in-view');
        });
      }, 300);
    }
  };

  const initScrollAtmosphere = () => {
    const sections = Array.from(document.querySelectorAll('.home-page .section'));
    if (sections.length === 0) {
      return;
    }

    const compute = () => {
      const viewport = Math.max(window.innerHeight, 1);

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const progress = (viewport - rect.top) / (viewport + rect.height);
        const clamped = Math.min(Math.max(progress, 0), 1);
        const shift = (clamped - 0.5) * (18 + index * 2.2);
        const glow = 0.12 + clamped * 0.3;

        section.style.setProperty('--section-shift', `${shift.toFixed(2)}px`);
        section.style.setProperty('--section-glow', glow.toFixed(3));
      });
    };

    compute();
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
  };

  const initFaq = () => {
    const items = document.querySelectorAll('.faq-item');

    if (items.length === 0) {
      return;
    }

    const closeAll = () => {
      items.forEach((item) => item.classList.remove('open'));
    };

    if (!Array.from(items).some((item) => item.classList.contains('open'))) {
      items[0].classList.add('open');
    }

    items.forEach((item) => {
      const button = item.querySelector('.faq-question');
      if (!button) {
        return;
      }

      button.addEventListener('click', () => {
        const shouldOpen = !item.classList.contains('open');
        closeAll();
        if (shouldOpen) {
          item.classList.add('open');
        }
      });
    });
  };

  const initPartners = () => {
    const cards = Array.from(document.querySelectorAll('[data-partner]'));

    if (cards.length === 0) {
      return;
    }

    const closeAll = () => {
      cards.forEach((card) => card.classList.remove('open'));
    };

    cards.forEach((card, index) => {
      const trigger = card.querySelector('.partner-trigger');
      if (!trigger) {
        return;
      }

      if (index === 0 && !cards.some((node) => node.classList.contains('open'))) {
        card.classList.add('open');
      }

      trigger.addEventListener('click', () => {
        const shouldOpen = !card.classList.contains('open');
        closeAll();
        if (shouldOpen) {
          card.classList.add('open');
        }
      });
    });
  };

  const initSectionRail = () => {
    const links = Array.from(document.querySelectorAll('[data-rail-link]'));
    if (links.length === 0) {
      return;
    }

    const targets = links
      .map((link) => {
        const hash = link.getAttribute('href');
        if (!hash || !hash.startsWith('#')) {
          return null;
        }
        const section = document.querySelector(hash);
        if (!section) {
          return null;
        }
        return { link, section };
      })
      .filter(Boolean);

    if (targets.length === 0) {
      return;
    }

    const compute = () => {
      const maxScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const pageProgress = Math.min(Math.max(window.scrollY / maxScrollable, 0), 1);
      document.documentElement.style.setProperty('--page-progress', pageProgress.toFixed(4));

      const threshold = window.scrollY + window.innerHeight * 0.34;
      let active = targets[0];

      targets.forEach((entry) => {
        const top = entry.section.getBoundingClientRect().top + window.scrollY;
        if (top <= threshold) {
          active = entry;
        }
      });

      targets.forEach((entry) => {
        entry.link.classList.toggle('is-active', entry === active);
      });
    };

    compute();
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute);
  };

  const initDispatchCards = () => {
    const cards = Array.from(document.querySelectorAll('[data-dispatch-card]'));
    if (cards.length === 0) {
      return;
    }

    const toggleCard = (card) => {
      const shouldOpen = !card.classList.contains('open');
      cards.forEach((item) => {
        item.classList.remove('open');
        item.setAttribute('aria-expanded', 'false');
      });

      if (shouldOpen) {
        card.classList.add('open');
        card.setAttribute('aria-expanded', 'true');
      }
    };

    cards.forEach((card) => {
      card.addEventListener('click', () => toggleCard(card));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleCard(card);
        }
      });
    });
  };

  const initCursor = () => {
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    const supportsCustomCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (!dot || !ring || !supportsCustomCursor) {
      return;
    }

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;

    const sync = () => {
      ringX += (pointerX - ringX) * 0.15;
      ringY += (pointerY - ringY) * 0.15;

      dot.style.left = `${pointerX}px`;
      dot.style.top = `${pointerY}px`;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;

      requestAnimationFrame(sync);
    };

    window.addEventListener('mousemove', (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    });

    interactiveTargets.forEach((node) => {
      node.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      node.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });

    requestAnimationFrame(sync);
  };

  const initContactFormState = () => {
    const form = document.querySelector('.contact-form');
    if (!form) {
      return;
    }

    const focusableSelector = 'input, textarea, select';

    form.addEventListener('focusin', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.matches(focusableSelector)) {
        form.classList.add('is-engaged');
      }
    });

    form.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        const active = document.activeElement;
        const keepState =
          active instanceof HTMLElement &&
          form.contains(active) &&
          active.matches(focusableSelector);

        if (!keepState) {
          form.classList.remove('is-engaged');
        }
      });
    });

    form.addEventListener('pointerdown', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest('label')) {
        form.classList.add('is-engaged');
      }
    });

    form.addEventListener('submit', () => {
      form.classList.add('is-engaged');
    });
  };

  setYear();
  initPageLoadMotion();
  initLenis();
  initMenu();
  initWaveText();
  initScrollReveal();
  updateHeroScroll();
  initScrollAtmosphere();
  initStudioInfoAnimation();
  initPipelineFocus();
  initFaq();
  initPartners();
  initDispatchCards();
  initSectionRail();
  initCursor();
  initContactFormState();
})();
