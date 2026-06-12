/* ===================================================
   GONEX INNOVATION HUB — script.js
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Lucide icons ---- */
  if (typeof lucide !== 'undefined') lucide.createIcons();

  /* ---- Scroll progress bar ---- */
  const bar = document.createElement('div');
  bar.id = 'scroll-progress';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = total > 0 ? (scrolled / total * 100) + '%' : '0%';
  }, { passive: true });

  /* ---- Sticky navbar shadow ---- */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.style.boxShadow = window.scrollY > 10
        ? '0 2px 16px rgba(35,31,32,.12)'
        : '0 2px 8px rgba(35,31,32,.07)';
    }, { passive: true });
  }

  /* ---- Mobile hamburger ---- */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.nav-mobile');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
      });
    });
  }

  /* ---- Active nav link ---- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ---- Intersection Observer fade-ins ---- */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  /* ---- Counter animation ---- */
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const isFloat = String(target).includes('.');
    const duration = 1800;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = target * ease;
      el.textContent = prefix + (isFloat ? current.toFixed(1) : Math.round(current).toLocaleString()) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.dataset.counted) {
        e.target.dataset.counted = '1';
        animateCounter(e.target);
        counterObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

  /* ---- Contact form ---- */
  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const name    = contactForm.querySelector('[name="name"]').value.trim();
      const email   = contactForm.querySelector('[name="email"]').value.trim();
      const message = contactForm.querySelector('[name="message"]').value.trim();
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!name || !email || !message) {
        alert('Please fill in your name, email, and message.');
        return;
      }
      if (!emailRe.test(email)) {
        alert('Please enter a valid email address.');
        return;
      }

      const btn = contactForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sending…';

      setTimeout(() => {
        contactForm.reset();
        btn.disabled = false;
        btn.textContent = 'Send message';
        if (formSuccess) {
          formSuccess.style.display = 'block';
          setTimeout(() => { formSuccess.style.display = 'none'; }, 6000);
        }
      }, 1400);
    });
  }

  /* ---- Newsletter form ---- */
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      if (!input.value.trim()) return;
      input.value = '';
      const btn = newsletterForm.querySelector('button');
      const orig = btn.textContent;
      btn.textContent = 'Subscribed!';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 3000);
    });
  }

  /* ---- Smooth scroll for anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

});

/* ============================================================
   GALLERY — filter, per-event lightbox slideshow, share, deep-link
   ============================================================ */
(function () {
  const grid = document.querySelector('.gallery-grid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.gallery-card'));
  const pills = document.querySelectorAll('.filter-pill');
  const emptyState = document.querySelector('.gallery-empty');

  /* Per-event slideshow state */
  let currentCard = null;
  let currentEventImages = [];
  let currentImageIndex = 0;

  /* ---------- helpers ---------- */
  function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = '<span class="toast-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span><span class="toast-msg"></span>';
      document.body.appendChild(toast);
    }
    toast.querySelector('.toast-msg').textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  /* ---------- filter ---------- */
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const cat = pill.dataset.filter;
      let visible = 0;
      cards.forEach(card => {
        const match = cat === 'all' || card.dataset.category === cat;
        card.classList.toggle('hidden', !match);
        if (match) visible++;
      });
      if (emptyState) emptyState.classList.toggle('visible', visible === 0);
    });
  });

  /* ---------- lightbox ---------- */
  const lb = document.getElementById('gallery-lightbox');
  if (!lb) return;
  const lbImg        = lb.querySelector('.lightbox-img');
  const lbImgPh      = lb.querySelector('.lightbox-img-ph');
  const lbTitle      = lb.querySelector('.lightbox-title');
  const lbDate       = lb.querySelector('.lightbox-date-chip');
  const lbCat        = lb.querySelector('.lightbox-cat-chip');
  const lbDesc       = lb.querySelector('.lightbox-desc');
  const lbDetails    = lb.querySelector('.lightbox-details');
  const lbDetailsTxt = lb.querySelector('.lightbox-details-inner p');
  const lbCounter    = lb.querySelector('.lightbox-counter');
  const btnClose     = lb.querySelector('.lightbox-btn-close');
  const btnPrev      = lb.querySelector('.lightbox-btn-prev');
  const btnNext      = lb.querySelector('.lightbox-btn-next');
  const btnReadMore  = lb.querySelector('.lightbox-btn-readmore');
  const btnShare     = lb.querySelector('.lightbox-btn-share');

  function renderImage(imgIndex) {
    if (!currentCard || !currentEventImages.length) return;
    currentImageIndex = (imgIndex + currentEventImages.length) % currentEventImages.length;
    const src = currentEventImages[currentImageIndex];

    if (src) {
      lbImg.src = src;
      lbImg.alt = currentCard.dataset.title || '';
      lbImg.style.display = 'block';
      if (lbImgPh) lbImgPh.style.display = 'none';
    } else {
      lbImg.style.display = 'none';
      if (lbImgPh) lbImgPh.style.display = 'flex';
    }
    if (lbCounter) lbCounter.textContent = (currentImageIndex + 1) + ' / ' + currentEventImages.length;
    history.replaceState(null, '', '#' + currentCard.dataset.id + '-' + currentImageIndex);
  }

  function openLightbox(card, imgIndex) {
    currentCard = card;
    try { currentEventImages = JSON.parse(card.dataset.images || '[]'); } catch(e) { currentEventImages = []; }

    const title = card.dataset.title || '';
    const date  = card.dataset.date  || '';
    const cat   = card.dataset.category || '';
    const desc  = card.dataset.desc  || '';
    const full  = card.dataset.full  || '';

    if (lbTitle) lbTitle.textContent = title;
    if (lbDate)  lbDate.textContent  = date;
    if (lbCat)   { lbCat.textContent = cat.replace('-', ' '); lbCat.style.display = cat ? '' : 'none'; }
    if (lbDesc)  lbDesc.textContent  = desc;
    if (lbDetailsTxt) lbDetailsTxt.textContent = full || desc;
    if (lbDetails)  lbDetails.classList.remove('open');
    if (btnReadMore) btnReadMore.textContent = 'Read More';

    renderImage(imgIndex || 0);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    history.replaceState(null, '', window.location.pathname);
  }

  cards.forEach(card => card.addEventListener('click', () => openLightbox(card, 0)));

  if (btnClose) btnClose.addEventListener('click', closeLightbox);
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  if (btnPrev) btnPrev.addEventListener('click', () => renderImage(currentImageIndex - 1));
  if (btnNext) btnNext.addEventListener('click', () => renderImage(currentImageIndex + 1));

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   renderImage(currentImageIndex - 1);
    if (e.key === 'ArrowRight')  renderImage(currentImageIndex + 1);
  });

  if (btnReadMore) {
    btnReadMore.addEventListener('click', () => {
      const open = lbDetails.classList.toggle('open');
      btnReadMore.textContent = open ? 'Show Less' : 'Read More';
    });
  }

  if (btnShare) {
    btnShare.addEventListener('click', () => {
      const url = window.location.origin + window.location.pathname + '#' +
                  (currentCard ? currentCard.dataset.id : '') + '-' + currentImageIndex;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => showToast('Link copied to clipboard'));
      } else {
        const ta = document.createElement('textarea');
        ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Link copied to clipboard');
      }
    });
  }

  /* ---------- highlight strip "View Photos" ---------- */
  document.querySelectorAll('[data-filter-trigger]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const cat = btn.dataset.filterTrigger;
      const targetPill = document.querySelector('.filter-pill[data-filter="' + cat + '"]');
      if (targetPill) {
        targetPill.click();
        document.getElementById('gallery-grid-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- deep-link on load ---------- */
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const parts = hash.split('-');
    const imgIdx = parseInt(parts[parts.length - 1], 10);
    const cardId = isNaN(imgIdx) ? hash : parts.slice(0, -1).join('-');
    const target = grid.querySelector('[data-id="' + cardId + '"]');
    if (target) openLightbox(target, isNaN(imgIdx) ? 0 : imgIdx);
  }
}());
