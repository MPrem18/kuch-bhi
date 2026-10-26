(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Login / Sign up switching ---------- */
  const form = $('#form'), tabs = $('.tabs'), pw = $('#password');
  const copy = {
    login:  { title: 'Welcome back', sub: 'Log in to pick up where you left off.', btn: 'Log in', ask: 'New to Orbit?', link: 'Create an account', auto: 'current-password', done: 'Logged in' },
    signup: { title: 'Create your account', sub: 'Start planning with Orbit in under a minute.', btn: 'Create account', ask: 'Already have an account?', link: 'Log in', auto: 'new-password', done: 'Account created' }
  };
  let mode = 'login';

  function setMode(next) {
    mode = next;
    const c = copy[mode];
    form.dataset.mode = mode;
    tabs.dataset.mode = mode;
    $$('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.mode === mode));
    $('#title').textContent = c.title;
    $('#subtitle').textContent = c.sub;
    $('#submit-text').textContent = c.btn;
    $('#switch-text').textContent = c.ask;
    $('#switch-btn').textContent = c.link;
    pw.autocomplete = c.auto;
    $$('.field').forEach(clearError);
  }
  $$('.tabs button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('#switch-btn').addEventListener('click', () => setMode(mode === 'login' ? 'signup' : 'login'));

  /* ---------- Show / hide password ---------- */
  const toggle = $('#toggle');
  toggle.addEventListener('click', () => {
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', show);
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  /* ---------- Password strength ---------- */
  const meter = $('.meter'), meterText = $('#meter-text');
  const labels = ['Use 8+ characters', 'Weak', 'Okay', 'Good', 'Strong'];
  pw.addEventListener('input', () => {
    const v = pw.value;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
    if (/\d/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v) || v.length >= 14) s++;
    if (!v) s = 0;
    meter.dataset.s = s;
    meterText.textContent = labels[s];
  });

  /* ---------- Validation ---------- */
  function setError(input, msg) {
    const f = input.closest('.field');
    f.classList.add('invalid');
    $('.err', f).textContent = msg;
    input.setAttribute('aria-invalid', 'true');
  }
  function clearError(f) {
    f.classList.remove('invalid');
    $('.err', f).textContent = '';
    $('input', f).removeAttribute('aria-invalid');
  }
  $$('.field input').forEach(i => i.addEventListener('input', () => clearError(i.closest('.field'))));

  function validate() {
    const name = $('#name'), email = $('#email');
    let first = null;
    const fail = (el, msg) => { setError(el, msg); first = first || el; };

    if (mode === 'signup' && name.value.trim().length < 2) fail(name, 'Enter your full name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) fail(email, 'Enter a valid email, like you@example.com.');
    if (pw.value.length < 8) fail(pw, 'Password must be at least 8 characters.');
    if (first) first.focus();
    return !first;
  }

  /* ---------- Submit ---------- */
  const submit = $('.submit'), toast = $('#toast');
  let toastTimer;
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;
    submit.classList.add('loading');
    setTimeout(() => {               // replace with your real API call
      submit.classList.remove('loading');
      toast.textContent = copy[mode].done;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
      form.reset();
      meter.dataset.s = 0;
      meterText.textContent = labels[0];
    }, 1200);
  });

  /* ---------- Tile spotlight follows cursor ---------- */
  $$('.tile').forEach(t => t.addEventListener('pointermove', e => {
    const r = t.getBoundingClientRect();
    t.style.setProperty('--mx', e.clientX - r.left + 'px');
    t.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  /* ---------- Stat count-up ---------- */
  const num = $('[data-count]'), target = +num.dataset.count;
  if (reduce) num.textContent = target;
  else {
    const t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / 1200, 1);
      num.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ---------- Particle background ---------- */
  const cv = $('#bg'), ctx = cv.getContext('2d');
  const mouse = { x: -999, y: -999 };
  let w, h, dots = [];

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(90, Math.floor((w * h) / 16000));
    dots = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
      r: Math.random() * 1.4 + .6
    }));
    if (reduce) draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < dots.length; i++) {
      const a = dots[i];
      if (!reduce) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
      }
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, 6.283);
      ctx.fillStyle = 'rgba(180,170,255,.55)';
      ctx.fill();
      for (let j = i + 1; j < dots.length; j++) {
        const b = dots[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 120) line(a, b, (1 - d / 120) * .22);
      }
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (dm < 160) line(a, mouse, (1 - dm / 160) * .5, '255,179,107');
    }
  }
  function line(a, b, alpha, rgb = '139,124,255') {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(${rgb},${alpha})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  function loop() { draw(); requestAnimationFrame(loop); }

  addEventListener('resize', resize);
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  resize();
  if (!reduce) loop();
})();