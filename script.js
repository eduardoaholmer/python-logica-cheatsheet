// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderHeight();
  initProgressBar();
  initBackToTop();
  initCopyButtons();       // [4][5] aria-labels únicos + feedback visual
  initSearch();            // [3][7] aria-live + highlight de termos
  initNavActiveState();
  initNavScrollIndicator();
  initThemeToggle();       // [11]
  initSectionLegends();    // [6]
  initKeyboardShortcuts(); // [9]
  initSectionAnchors();    // [10]
});

// === HEADER HEIGHT ===
function updateHeaderHeight() {
  const header = document.querySelector('header');
  if (!header) return;
  const height = header.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--header-height', height + 8 + 'px');
}

window.addEventListener('resize', updateHeaderHeight);

// === PROGRESS BAR ===
function initProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

// === BACK TO TOP ===
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// === [4][5] COPY CODE — aria-labels únicos + feedback visual ===
function initCopyButtons() {
  const iconCopy = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>`;

  const iconCheck = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`;

  document.querySelectorAll('pre').forEach(pre => {
    // [4] Deriva label contextual a partir da .tag mais próxima dentro do card
    const card = pre.closest('.card');
    const tagText = card?.querySelector('.tag')?.textContent?.trim() ?? '';
    const label = tagText ? `Copiar código: ${tagText}` : 'Copiar código do bloco';

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', label);
    btn.innerHTML = iconCopy + '<span>Copiar</span>';

    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code');
      if (!code) return;

      const text = code.textContent;

      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add('success');
        btn.setAttribute('aria-label', label.replace('Copiar', 'Copiado'));
        btn.innerHTML = iconCheck + '<span>Copiado!</span>';
      } catch {
        btn.classList.add('error');
        btn.innerHTML = '<span>Erro</span>';
      }

      setTimeout(() => {
        btn.classList.remove('success', 'error');
        btn.setAttribute('aria-label', label);
        btn.innerHTML = iconCopy + '<span>Copiar</span>';
      }, 2000);
    });

    pre.appendChild(btn);
  });
}

// === [3][7] SEARCH — aria-live + highlight de termos ===
function initSearch() {
  const input = document.getElementById('search-input');
  const clearBtn = document.querySelector('.search-clear');
  const noResults = document.getElementById('no-results');
  const statusEl = document.getElementById('search-status'); // [3]
  const sections = document.querySelectorAll('main section');
  if (!input) return;

  // [9] Atualiza placeholder com dica de atalho
  input.setAttribute('placeholder', 'Buscar... (/ para focar)');

  let debounceTimer = null;

  input.addEventListener('input', () => {
    clearBtn.classList.toggle('visible', input.value.length > 0);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applySearch(input.value.trim()), 150);
  });

  clearBtn.addEventListener('click', clearSearch);

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') clearSearch();
  });

  function clearSearch() {
    input.value = '';
    clearBtn.classList.remove('visible');
    applySearch('');
    input.blur();
    updateHeaderHeight();
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Remove todas as tags <mark> sem tocar em innerHTML (preserva event listeners)
  function removeAllMarks() {
    const marks = document.querySelectorAll('main mark');
    const parents = new Set();
    marks.forEach(mark => {
      parents.add(mark.parentNode);
      mark.parentNode.replaceChild(document.createTextNode(mark.textContent), mark);
    });
    parents.forEach(p => p.normalize());
  }

  // [7] Envolve ocorrências com <mark> usando TreeWalker — nunca toca innerHTML
  function highlightTextNodes(element, regex) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      regex.lastIndex = 0;
      if (!regex.test(text)) return;
      regex.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }
        const mark = document.createElement('mark');
        mark.textContent = match[0];
        frag.appendChild(mark);
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function applySearch(query) {
    removeAllMarks();

    if (!query) {
      sections.forEach(s => s.classList.remove('hidden'));
      document.querySelectorAll('.card').forEach(c => c.classList.remove('hidden'));
      if (noResults) noResults.classList.remove('visible');
      // [3] Limpa anúncio
      if (statusEl) statusEl.textContent = '';
      updateHeaderHeight();
      return;
    }

    const testRegex = new RegExp(escapeRegex(query), 'i');
    let totalVisible = 0;

    sections.forEach(section => {
      const cards = section.querySelectorAll('.card');
      let sectionVisible = 0;

      cards.forEach(card => {
        if (testRegex.test(card.textContent)) {
          card.classList.remove('hidden');
          sectionVisible++;

          const logicEl = card.querySelector('.logic-text');
          const tagEl = card.querySelector('.tag');
          if (logicEl) highlightTextNodes(logicEl, new RegExp(escapeRegex(query), 'gi'));
          if (tagEl) highlightTextNodes(tagEl, new RegExp(escapeRegex(query), 'gi'));
        } else {
          card.classList.add('hidden');
        }
      });

      if (sectionVisible > 0) {
        section.classList.remove('hidden');
        totalVisible += sectionVisible;
      } else {
        section.classList.add('hidden');
      }
    });

    if (noResults) noResults.classList.toggle('visible', totalVisible === 0);

    // [3] Anuncia resultado para leitores de tela
    if (statusEl) {
      if (totalVisible === 0) {
        statusEl.textContent = `Nenhum resultado encontrado para "${query}".`;
      } else {
        statusEl.textContent = `${totalVisible} resultado${totalVisible > 1 ? 's' : ''} encontrado${totalVisible > 1 ? 's' : ''} para "${query}".`;
      }
    }

    updateHeaderHeight();
  }
}

// === NAV ACTIVE STATE ===
function initNavActiveState() {
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  const sections = document.querySelectorAll('main section[id]');
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
          });
          // Scrolla o link ativo para visível na nav
          const activeLink = document.querySelector(`nav a[href="#${entry.target.id}"]`);
          if (activeLink) {
            activeLink.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
          }
        }
      });
    },
    { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
  );

  sections.forEach(s => observer.observe(s));
}

// === NAV SCROLL INDICATOR ===
function initNavScrollIndicator() {
  const wrapper = document.querySelector('.nav-wrapper');
  const nav = document.querySelector('nav');
  if (!wrapper || !nav) return;

  function checkScroll() {
    const atEnd = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 4;
    wrapper.classList.toggle('at-end', atEnd);
  }

  nav.addEventListener('scroll', checkScroll, { passive: true });
  window.addEventListener('resize', checkScroll);
  checkScroll();
}

// === [11] THEME TOGGLE ===
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const STORAGE_KEY = 'preferred-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const isDark = theme === 'dark';
    btn.setAttribute('aria-label', `Alternar para tema ${isDark ? 'claro' : 'escuro'}`);
    btn.setAttribute('title', `Tema ${isDark ? 'claro' : 'escuro'}`);
  }

  // Tema já está no data-theme (definido pelo script inline no <head>)
  // Apenas sincroniza o estado do botão
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current);

  btn.addEventListener('click', () => {
    const now = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = now === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  });

  // Responde a mudança na preferência do sistema (só se o usuário não escolheu manualmente)
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'light' : 'dark');
    }
  });
}

// === [6] LEGENDA COMPACTA POR SEÇÃO ===
function initSectionLegends() {
  document.querySelectorAll('main section').forEach(section => {
    const h2 = section.querySelector('h2');
    if (!h2) return;

    const legend = document.createElement('div');
    legend.className = 'section-legend';
    legend.setAttribute('aria-hidden', 'true');
    legend.innerHTML =
      '<span class="sl-dot logic"></span><span>Lógica — conceito</span>' +
      '<span class="sl-sep">·</span>' +
      '<span class="sl-dot py"></span><span>Python — código</span>';

    h2.insertAdjacentElement('afterend', legend);
  });
}

// === [9] ATALHOS DE TECLADO ===
function initKeyboardShortcuts() {
  const input = document.getElementById('search-input');
  if (!input) return;

  document.addEventListener('keydown', e => {
    // "/" ou Ctrl+K focam o campo de busca
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (!isTyping && e.key === '/') {
      e.preventDefault();
      input.focus();
      input.select();
      return;
    }
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
}

// === [10] ÂNCORAS CLICÁVEIS NOS TÍTULOS DE SEÇÃO ===
function initSectionAnchors() {
  const linkIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>`;

  document.querySelectorAll('section[id] h2').forEach(h2 => {
    const sectionId = h2.closest('section').id;

    const btn = document.createElement('button');
    btn.className = 'anchor-btn';
    btn.setAttribute('aria-label', 'Copiar link desta seção');
    btn.innerHTML = linkIcon;

    btn.addEventListener('click', async () => {
      const url = `${location.origin}${location.pathname}#${sectionId}`;
      try {
        await navigator.clipboard.writeText(url);
        showAnchorTooltip(btn, 'Link copiado!');
      } catch {
        showAnchorTooltip(btn, 'Erro ao copiar');
      }
    });

    h2.appendChild(btn);
  });
}

function showAnchorTooltip(btn, text) {
  // Remove tooltip anterior se houver
  btn.querySelector('.anchor-tooltip')?.remove();

  const tip = document.createElement('span');
  tip.className = 'anchor-tooltip';
  tip.setAttribute('role', 'tooltip');
  tip.textContent = text;
  btn.appendChild(tip);

  setTimeout(() => tip.remove(), 2000);
}
