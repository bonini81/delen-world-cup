/* ============================================================
   DELENCANTO – GOOOLAZO MUNDIAL
   main.js
   ============================================================ */

/* ── CONFIG ──────────────────────────────────────────────────
   Set SHOW_GANADORES to true in June to reveal the winners section.
   ─────────────────────────────────────────────────────────── */
const SHOW_GANADORES = true; // Set to false to hide winners section until June

/* ============================================================
   CAROUSEL CLASS
   ============================================================ */
class Carousel {
  /**
   * @param {HTMLElement} wrapper     - Element with class *-carousel-wrapper
   * @param {number}      itemsPerSlide - How many cards per slide (desktop=1 since hidden, mobile=1)
   */
  constructor(wrapper, itemsPerSlide = 1) {
    this.wrapper       = wrapper;
    this.track         = wrapper.querySelector('.carousel-track');
    this.slides        = Array.from(wrapper.querySelectorAll('.carousel-slide'));
    this.prevBtn       = wrapper.querySelector('.carousel-btn.prev');
    this.nextBtn       = wrapper.querySelector('.carousel-btn.next');
    this.dotsContainer = wrapper.querySelector('.carousel-dots');
    this.current       = 0;
    this.total         = this.slides.length;

    if (this.total === 0) return;

    this._buildDots();
    this._bindEvents();
    this._update();
  }

  _buildDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';
    this.dots = this.slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(dot);
      return dot;
    });
  }

  _bindEvents() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());

    // Touch / swipe support
    let startX = 0;
    let isDragging = false;

    this.track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    this.track.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        diff > 0 ? this.next() : this.prev();
      }
      isDragging = false;
    }, { passive: true });
  }

  _update() {
    this.track.style.transform = `translateX(-${this.current * 100}%)`;
    if (!this.dots) return;
    this.dots.forEach((dot, i) => dot.classList.toggle('active', i === this.current));
  }

  goTo(index) {
    this.current = (index + this.total) % this.total;
    this._update();
  }

  next() { this.goTo(this.current + 1); }
  prev() { this.goTo(this.current - 1); }
}

/* ============================================================
   WINNERS – FETCH & RENDER
   ============================================================ */
async function loadWinners() {
  const section = document.getElementById('ganadores');
  if (!section) return;

  // Show/hide based on config flag
  if (!SHOW_GANADORES) {
    section.classList.add('hidden');
    // Also remove from nav so users can't jump to it
    document.querySelectorAll('a[href="#ganadores"]').forEach(a => {
      a.closest('li') ? a.closest('li').style.display = 'none' : (a.style.display = 'none');
    });
    return;
  }

  section.classList.remove('hidden');

  let winners = [];
  try {
    const res = await fetch('data/winners.json');
    if (!res.ok) throw new Error('fetch failed');
    winners = await res.json();
  } catch (err) {
    console.warn('Could not load winners.json', err);
    return;
  }

  renderWinnersDesktop(winners);
  renderWinnersMobileCarousel(winners);
}

function renderWinnersDesktop(winners) {
  const grid = document.getElementById('winners-grid');
  if (!grid) return;
  grid.innerHTML = '';
  winners.forEach(w => {
    const row = document.createElement('div');
    row.className = 'winner-row';
    row.innerHTML = `<span class="winner-name">${escapeHtml(w.name)}</span>
                     <span class="winner-city">${escapeHtml(w.city)}</span>`;
    grid.appendChild(row);
  });
}

function renderWinnersMobileCarousel(winners) {
  const track = document.getElementById('winners-carousel-track');
  const dotsEl = document.getElementById('winners-carousel-dots');
  if (!track) return;

  const perSlide = 5; // rows per mobile slide
  const pages = [];
  for (let i = 0; i < winners.length; i += perSlide) {
    pages.push(winners.slice(i, i + perSlide));
  }

  track.innerHTML = '';
  pages.forEach(page => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    page.forEach(w => {
      const row = document.createElement('div');
      row.className = 'winner-row';
      row.innerHTML = `<span class="winner-name">${escapeHtml(w.name)}</span>
                       <span class="winner-city">${escapeHtml(w.city)}</span>`;
      slide.appendChild(row);
    });
    track.appendChild(slide);
  });

  // Re-init carousel after injecting slides
  const wrapper = document.querySelector('.ganadores-carousel-wrapper');
  if (wrapper) new Carousel(wrapper);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   HAMBURGER MENU
   ============================================================ */
function initHamburger() {
  const btn    = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (!btn || !mobileNav) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    mobileNav.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  });

  // Close on nav link click
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      mobileNav.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
    });
  });
}

/* ============================================================
   ACTIVE NAV HIGHLIGHT (IntersectionObserver)
   ============================================================ */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"], .mobile-nav a[href^="#"]');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));
}

/* ============================================================
   INIT CAROUSELS (Mecánica + Premios – static HTML slides)
   ============================================================ */
function initStaticCarousels() {
  const mecanicaWrapper = document.querySelector('.mecanica-carousel-wrapper');
  const premiosWrapper  = document.querySelector('.premios-carousel-wrapper');
  if (mecanicaWrapper) new Carousel(mecanicaWrapper);
  if (premiosWrapper)  new Carousel(premiosWrapper);
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initActiveNav();
  initStaticCarousels();
  loadWinners();
});
