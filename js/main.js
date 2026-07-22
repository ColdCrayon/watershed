/* =============================================================
   WATERSHED TECHNOLOGIES — main.js
   Vanilla JS only. No framework dependencies.
   ============================================================= */

// Reduced-motion gate — respected by parallax, flow autoplay, etc.
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Theme toggle — persists user choice; falls back to prefers-color-scheme.
// The initial <html data-theme=...> is set by an inline script in <head>
// to prevent FOUC. This IIFE only handles the toggle button.
(() => {
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;

  const sync = () => {
    const t = document.documentElement.getAttribute('data-theme') || 'light';
    btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  };
  sync();

  let clearTimer = null;
  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    // Add the crossfade class so all color-adjacent properties transition
    // together for the duration of the switch, then remove it so normal
    // hover/focus transitions run at their usual speed.
    if (!prefersReducedMotion()) {
      document.documentElement.classList.add('theme-transitioning');
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 620);
    }
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (_) {}
    sync();
  });
})();

// Scroll reveal — [data-reveal] elements fade + rise on enter
(() => {
  // If the user prefers reduced motion, show everything immediately.
  if (prefersReducedMotion()) {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-in'));
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    return;
  }
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
  if (prefersReducedMotion()) return; // already unhidden above
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

// Hero parallax depth field — mouse + scroll driven, rAF-throttled.
// Disabled under prefers-reduced-motion.
(() => {
  const depth = document.getElementById('depth');
  if (!depth || prefersReducedMotion()) return;
  const layers = depth.querySelectorAll('.layer');
  let mx = 0, my = 0, sy = 0, queued = false;

  function apply() {
    queued = false;
    layers.forEach(l => {
      const d = parseFloat(l.dataset.depth || '10');
      l.style.transform = `translate3d(${mx * d}px, ${my * d + sy * (d * 0.6)}px, 0)`;
    });
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  }
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
    schedule();
  }, { passive: true });
  window.addEventListener('scroll', () => {
    sy = Math.min(window.scrollY / 800, 1);
    schedule();
  }, { passive: true });
  apply();
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
      // Play once through, then rest at the last step. User can hit Reset or click a step.
      if (idx < steps.length - 1) {
        setStep(idx + 1);
        timer = setTimeout(tick, 2600);
      } else {
        pause();
      }
    };
    timer = setTimeout(tick, 2600);
  }

  function pause() {
    playing = false;
    if (playBtn) { playBtn.textContent = '▶ Play sequence'; playBtn.classList.remove('is-on'); }
    if (timer) { clearTimeout(timer); timer = null; }
  }

  if (playBtn)  playBtn.addEventListener('click',  () => {
    if (playing) { pause(); return; }
    // Re-clicking Play after the sequence finished starts over.
    if (idx >= steps.length - 1) setStep(0);
    play();
  });
  if (resetBtn) resetBtn.addEventListener('click', () => { pause(); userPaused = true; setStep(0); });
  steps.forEach((s, i) => s.addEventListener('click', () => { pause(); userPaused = true; setStep(i); }));

  requestAnimationFrame(() => setStep(0));
  window.addEventListener('resize', () => setStep(idx));

  // Auto-play once when the flow row enters the viewport (respect reduced motion)
  if (!prefersReducedMotion()) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !playing && !userPaused) play();
      });
    }, { threshold: 0.4 });
    const flowNode = document.getElementById('flow');
    if (flowNode) obs.observe(flowNode);
  }
})();

// Active nav link — highlights whichever section is at the top of the viewport
// and slides the shared underline indicator to match.
(() => {
  const nav       = document.querySelector('.nav-links');
  const links     = Array.from(document.querySelectorAll('.nav-links a'));
  const indicator = document.querySelector('.nav-indicator');
  const map = links
    .map(a => ({ link: a, target: document.querySelector(a.getAttribute('href')) }))
    .filter(x => x.target);
  if (!map.length) return;
  const navH = 80;
  let queued = false;

  function moveIndicator(el) {
    if (!indicator || !nav || !el) return;
    // Only run on desktop layout — mobile hides the indicator via CSS.
    if (window.innerWidth <= 640) return;
    const navRect = nav.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x = r.left - navRect.left;
    indicator.style.transform = `translateX(${x}px)`;
    indicator.style.width     = r.width + 'px';
    indicator.classList.add('is-ready');
  }

  function update() {
    queued = false;
    const y = window.scrollY + navH + 4;
    let bestIdx = 0;
    for (let i = 0; i < map.length; i++) {
      if (map[i].target.getBoundingClientRect().top + window.scrollY <= y) bestIdx = i;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      bestIdx = map.length - 1;
    }
    map.forEach((m, i) => m.link.classList.toggle('active', i === bestIdx));
    moveIndicator(map[bestIdx].link);
  }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  // Hover preview — indicator eases toward the hovered link
  links.forEach(link => {
    link.addEventListener('mouseenter', () => moveIndicator(link));
    link.addEventListener('mouseleave', () => {
      const active = map.find(m => m.link.classList.contains('active'));
      if (active) moveIndicator(active.link);
    });
  });

  update();
  // Delay one frame so fonts have settled before we measure widths
  requestAnimationFrame(update);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
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
