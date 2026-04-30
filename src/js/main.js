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
  }, { threshold: 0.2, rootMargin: '0px 0px -18% 0px' });

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
