(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem('te:' + k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('te:' + k, JSON.stringify(v)); } catch {} },
  };
  const toast = (msg) => {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1800);
  };

  /* Theme */
  const theme = store.get('theme', null);
  if (theme) document.documentElement.dataset.theme = theme;
  $('#themeBtn').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; store.set('theme', next);
  });
  $('#printBtn').addEventListener('click', () => print());

  /* Mobile menu */
  const toc = $('#toc'), scrim = $('#scrim'), menuBtn = $('#menuBtn');
  const setMenu = (open) => {
    toc.classList.toggle('open', open); scrim.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open);
  };
  menuBtn.addEventListener('click', () => setMenu(!toc.classList.contains('open')));
  scrim.addEventListener('click', () => setMenu(false));
  $$('.toc a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* Scrollspy */
  const links = new Map($$('.toc a').map(a => [a.hash.slice(1), a]));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        links.get(e.target.id)?.classList.add('active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  /* Checklists */
  const checks = store.get('checks', {});
  const refreshProgress = () => {
    $$('.checklist').forEach(list => {
      const items = $$('li', list), d = items.filter(i => i.classList.contains('checked')).length;
      const p = $(`.sec-progress[data-for="${list.dataset.list}"]`);
      if (p) { p.textContent = `${d}/${items.length} done`; p.classList.toggle('done', d === items.length); }
    });
  };
  $$('.checklist').forEach(list => {
    $$('li', list).forEach((li, i) => {
      const key = `${list.dataset.list}-${i}`;
      li.innerHTML = `<span class="box" aria-hidden="true"></span><span class="txt">${li.innerHTML}</span>`;
      li.setAttribute('role', 'checkbox'); li.tabIndex = 0;
      const apply = () => { li.classList.toggle('checked', !!checks[key]); li.setAttribute('aria-checked', !!checks[key]); };
      const toggle = () => { checks[key] = !checks[key]; store.set('checks', checks); apply(); refreshProgress(); };
      li.addEventListener('click', toggle);
      li.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); } });
      apply();
    });
  });
  refreshProgress();
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all checklist ticks?')) return;
    Object.keys(checks).forEach(k => delete checks[k]); store.set('checks', checks);
    $$('.checklist li').forEach(li => { li.classList.remove('checked'); li.setAttribute('aria-checked', false); });
    refreshProgress(); toast('Checklists reset');
  });

  /* Example question */
  $$('.options button').forEach(b => b.addEventListener('click', () => {
    $$('.options button').forEach(x => { x.classList.remove('chosen'); x.setAttribute('aria-checked', false); });
    b.classList.add('chosen'); b.setAttribute('aria-checked', true);
    $('#exampleHint').innerHTML = `If a student chooses <strong>${b.dataset.opt}</strong>, they should clearly circle the letter ${b.dataset.opt}.`;
  }));

  /* Read-aloud presenter */
  const dlg = $('#presenter'), pBody = $('#presenterBody');
  let pf = store.get('pf', 30);
  const setPf = (n) => { pf = Math.min(64, Math.max(18, n)); pBody.style.setProperty('--pf', pf + 'px'); store.set('pf', pf); };
  $('#presentBtn').addEventListener('click', () => { pBody.innerHTML = $('#scriptText').innerHTML; setPf(pf); dlg.showModal(); });
  $('#closePresenter').addEventListener('click', () => dlg.close());
  $('#fontUp').addEventListener('click', () => setPf(pf + 4));
  $('#fontDown').addEventListener('click', () => setPf(pf - 4));
})();
