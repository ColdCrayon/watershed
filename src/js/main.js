/* =============================================================
   WATERSHED TECHNOLOGIES — main.js
   Vanilla JS only. No framework dependencies.
   ============================================================= */

// Scroll reveal — [data-reveal] elements fade + rise on enter
(() => {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

  // Auto-stagger direct children that carry [data-reveal]
  const stagger = (selector, step = 80) => {
    document.querySelectorAll(selector).forEach(parent => {
      parent.querySelectorAll(':scope > [data-reveal]').forEach((k, i) => {
        if (!k.style.getPropertyValue('--reveal-delay')) {
          k.style.setProperty('--reveal-delay', (i * step) + 'ms');
        }
      });
    });
  };
  stagger('.pillars', 90);
  stagger('.stats',   70);
  stagger('.compare', 100);
  stagger('.audience', 90);

  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
})();

// Scroll reveal — .reveal class variant (hero headline)
(() => {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

// Hero parallax depth field — responds to mouse + scroll
(() => {
  const depth = document.getElementById('depth');
  if (!depth) return;
  const layers = depth.querySelectorAll('.layer');
  let mx = 0, my = 0, sy = 0;

  function apply() {
    layers.forEach(l => {
      const d = parseFloat(l.dataset.depth || '10');
      l.style.transform = `translate3d(${mx * d}px, ${my * d + sy * (d * 0.6)}px, 0)`;
    });
  }
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
    apply();
  }, { passive: true });
  window.addEventListener('scroll', () => {
    sy = Math.min(window.scrollY / 800, 1);
    apply();
  }, { passive: true });
  apply();
})();

// Magnetic buttons — subtle cursor-follow on hover
(() => {
  document.querySelectorAll('.btn, .cta-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * 0.25;
      const y = (e.clientY - r.top  - r.height / 2) * 0.25;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
})();

// Hero data panel — deterministic order-ladder bars
(() => {
  const ladder = document.getElementById('ladder');
  if (!ladder) return;
  const heights   = [22, 38, 56, 78, 92, 64, 30];
  const accentIdx = 4;
  heights.forEach((h, i) => {
    const col = document.createElement('div');
    col.style.cssText = [
      `background: ${i === accentIdx ? 'var(--accent)' : 'var(--ink)'}`,
      `opacity: ${i === accentIdx ? '1' : '0.18'}`,
      `height: ${h}%`,
      'border-radius: 2px',
      'position: relative',
    ].join(';');
    if (i === accentIdx) {
      const pip = document.createElement('div');
      pip.style.cssText = [
        'position: absolute',
        'left: 50%', 'top: -10px',
        'transform: translateX(-50%)',
        'width: 6px', 'height: 6px',
        'border-radius: 50%',
        'background: var(--accent)',
        'box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 30%, transparent)',
      ].join(';');
      col.appendChild(pip);
    }
    ladder.appendChild(col);
  });
})();

// Flow sequence player — 5-step order lifecycle diagram
(() => {
  const steps     = Array.from(document.querySelectorAll('#flow .step'));
  const fill      = document.getElementById('trackFill');
  const packet    = document.getElementById('flowPacket');
  const elapsedEl = document.getElementById('elapsed');
  const playBtn   = document.getElementById('playBtn');
  const resetBtn  = document.getElementById('resetBtn');
  const copyPanes = Array.from(document.querySelectorAll('.sd-pane'));
  const visPanes  = Array.from(document.querySelectorAll('.sd-vis-pane'));
  const times     = [0, 3, 8, 12, 15];
  let idx = 0, timer = null, playing = false, userPaused = false;

  function setStep(i) {
    idx = i;
    steps.forEach((s, k) => {
      const on = k === i;
      s.classList.toggle('is-active', on);
      s.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    copyPanes.forEach((p, k) => p.classList.toggle('is-on', k === i));
    visPanes.forEach( (p, k) => p.classList.toggle('is-on', k === i));

    const flowEl = document.getElementById('flow');
    if (flowEl && steps[i] && fill && packet) {
      const flowRect  = flowEl.getBoundingClientRect();
      const stepRect  = steps[i].getBoundingClientRect();
      const firstRect = steps[0].getBoundingClientRect();
      const startX = firstRect.left + firstRect.width / 2 - flowRect.left;
      const curX   = stepRect.left  + stepRect.width  / 2 - flowRect.left;
      fill.style.left  = startX + 'px';
      fill.style.width = Math.max(0, curX - startX) + 'px';
      packet.style.left = curX + 'px';
    }
    if (elapsedEl) elapsedEl.textContent = String(times[i]).padStart(2, '0') + '\u2009ms';
  }

  function play() {
    if (playing) return;
    playing = true;
    if (playBtn) { playBtn.textContent = '❚❚ Pause'; playBtn.classList.add('is-on'); }
    const tick = () => {
      setStep(idx < steps.length - 1 ? idx + 1 : 0);
      timer = setTimeout(tick, 2400);
    };
    timer = setTimeout(tick, 2400);
  }

  function pause() {
    playing = false;
    if (playBtn) { playBtn.textContent = '▶ Play sequence'; playBtn.classList.remove('is-on'); }
    if (timer) { clearTimeout(timer); timer = null; }
  }

  if (playBtn)  playBtn.addEventListener('click',  () => playing ? pause() : play());
  if (resetBtn) resetBtn.addEventListener('click', () => { pause(); userPaused = true; setStep(0); });
  steps.forEach((s, i) => s.addEventListener('click', () => { pause(); userPaused = true; setStep(i); }));

  requestAnimationFrame(() => setStep(0));
  window.addEventListener('resize', () => setStep(idx));

  // Auto-play when the flow row enters the viewport
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !playing && !userPaused) play();
    });
  }, { threshold: 0.4 });
  const flowNode = document.getElementById('flow');
  if (flowNode) obs.observe(flowNode);
})();

// Active nav link — highlights whichever section is at the top of the viewport
(() => {
  const links = Array.from(document.querySelectorAll('.nav-links a'));
  const map = links
    .map(a => ({ link: a, target: document.querySelector(a.getAttribute('href')) }))
    .filter(x => x.target);
  if (!map.length) return;
  const navH = 80;

  function update() {
    const y = window.scrollY + navH + 4;
    let bestIdx = 0;
    for (let i = 0; i < map.length; i++) {
      if (map[i].target.getBoundingClientRect().top + window.scrollY <= y) bestIdx = i;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      bestIdx = map.length - 1;
    }
    map.forEach((m, i) => m.link.classList.toggle('active', i === bestIdx));
  }
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
})();

// Mobile hamburger nav toggle
(() => {
  const btn  = document.querySelector('.nav-hamburger');
  const menu = document.querySelector('.nav-links');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
    // Prevent body scroll when menu is open on mobile
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close when a nav link is clicked
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close if viewport grows past the mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 640) {
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
})();

// Contact / onboarding modal form
(() => {
  const backdrop    = document.getElementById('modalBackdrop');
  const closeBtn    = document.getElementById('modalClose');
  const form        = document.getElementById('contactForm');
  const titleEl     = document.getElementById('modalTitle');
  const eyebrowEl   = document.getElementById('modalEyebrow');
  const descEl      = document.getElementById('modalDesc');
  const submitLabel = document.getElementById('modalSubmitLabel');
  if (!backdrop) return;

  const MODES = {
    contact: {
      eyebrow: 'Get in touch',
      title:   'Contact Watershed',
      desc:    "Fill in your details and we'll reach out to discuss how Watershed fits your trading workflow.",
      submit:  'Send inquiry',
      subject: '[Watershed ATS] Inquiry',
    },
    onboarding: {
      eyebrow: 'Start the conversation',
      title:   'Schedule Onboarding',
      desc:    'Share a few details and our team will follow up to walk you through ATS connectivity and integration.',
      submit:  'Request onboarding',
      subject: '[Watershed ATS] Onboarding Request',
    },
  };

  let mode = 'contact';
  let prevFocus = null;
  let submitting = false;

  function openModal(m) {
    mode = m;
    submitting = false;
    const cfg = MODES[m] || MODES.contact;
    eyebrowEl.textContent   = cfg.eyebrow;
    titleEl.textContent     = cfg.title;
    descEl.textContent      = cfg.desc;
    submitLabel.textContent = cfg.submit;
    form.reset();
    form.hidden = false;
    const success = backdrop.querySelector('.modal-success');
    if (success) success.remove();
    // Re-enable submit button in case a previous session disabled it
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = false;

    prevFocus = document.activeElement;
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    backdrop.hidden = true;
    document.body.style.overflow = '';
    if (prevFocus) prevFocus.focus();
  }

  // Trigger elements
  document.querySelectorAll('[data-modal]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      openModal(el.dataset.modal);
    });
  });

  // Close affordances
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !backdrop.hidden) closeModal();
  });

  // Focus trap — only consider elements not inside a hidden ancestor
  function visibleFocusable() {
    return Array.from(backdrop.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.closest('[hidden]') === null);
  }

  backdrop.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const els   = visibleFocusable();
    const first = els[0];
    const last  = els[els.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });

  // Submit — validate, guard against re-submission, build mailto, show success state
  // Validation — check required fields before composing the mailto URL
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function clearErrors() {
    form.querySelectorAll('.field-error').forEach(el => el.remove());
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  }

  function fieldError(inputId, msg) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.setAttribute('aria-invalid', 'true');
    const span = document.createElement('span');
    span.className = 'field-error';
    span.setAttribute('role', 'alert');
    span.textContent = msg;
    input.parentNode.appendChild(span);
  }

  function validate(data) {
    clearErrors();
    let ok = true;
    if (!data.name.trim())                      { fieldError('f-name',  'Required');            ok = false; }
    if (!data.firm.trim())                      { fieldError('f-firm',  'Required');            ok = false; }
    if (!data.title.trim())                     { fieldError('f-title', 'Required');            ok = false; }
    if (!data.email.trim())                     { fieldError('f-email', 'Required');            ok = false; }
    else if (!EMAIL_RE.test(data.email.trim())) { fieldError('f-email', 'Enter a valid email'); ok = false; }
    if (!data.type)                             { fieldError('f-type',  'Required');            ok = false; }
    return ok;
  }

  // Clear a field's error as soon as the user starts correcting it
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => {
      el.removeAttribute('aria-invalid');
      const err = el.parentNode.querySelector('.field-error');
      if (err) err.remove();
    });
  });

  // Submit — validate, guard against re-submission, build mailto, show success state
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (submitting) return;

    const data = Object.fromEntries(new FormData(form));

    if (!validate(data)) {
      form.querySelector('[aria-invalid]').focus();
      return;
    }

    // All valid — lock out re-submission and disable button
    submitting = true;
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const cfg     = MODES[mode] || MODES.contact;
    const subject = encodeURIComponent(`${cfg.subject} — ${data.firm.trim()}`);
    const bodyText = [
      `Name:              ${data.name.trim()}`,
      `Firm:              ${data.firm.trim()}`,
      `Title:             ${data.title.trim()}`,
      `Email:             ${data.email.trim()}`,
      `Phone:             ${data.phone.trim() || 'Not provided'}`,
      `Participant type:  ${data.type  || 'Not specified'}`,
      '',
      data.message.trim() ? `Notes:\n${data.message.trim()}` : 'No additional notes.',
    ].join('\n');
    const body = encodeURIComponent(bodyText);

    window.location.href = `mailto:info@watershedtech.us?subject=${subject}&body=${body}`;

    // Success state
    form.hidden = true;
    const div = document.createElement('div');
    div.className = 'modal-success';
    div.innerHTML = `
      <div class="success-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 10l4 4 8-8" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3>Your email client should open now.</h3>
      <p>Review the pre-filled message and send it to complete your inquiry.</p>
      <button class="form-submit" id="modalDoneBtn" type="button">Done</button>
    `;
    form.parentNode.appendChild(div);
    document.getElementById('modalDoneBtn').addEventListener('click', closeModal);
  });
})();
