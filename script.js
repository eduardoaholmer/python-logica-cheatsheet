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
  initKeyboardShortcuts(); // [9]
  initSectionAnchors();    // [10]
});

// === HEADER HEIGHT ===
// --header-height posiciona a sidebar sticky; --scroll-offset compensa tudo que
// fica fixo no topo (no mobile a faixa de navegação também é sticky).
const compactNavQuery = window.matchMedia('(max-width: 1023px)');

function updateHeaderHeight() {
  const header = document.querySelector('header');
  if (!header) return;
  const headerHeight = header.getBoundingClientRect().height;
  const sidebar = document.querySelector('.sidebar');
  const stripHeight = compactNavQuery.matches && sidebar ? sidebar.getBoundingClientRect().height : 0;

  const root = document.documentElement.style;
  root.setProperty('--header-height', headerHeight + 'px');
  root.setProperty('--scroll-offset', headerHeight + stripHeight + 16 + 'px');
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

  document.querySelectorAll('main pre').forEach(pre => {
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

    // Botão fica no wrapper (não no <pre>) para não rolar junto com o código
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.append(pre, btn);
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

  // Texto pesquisável de cada card, sem o rótulo dos botões injetados ("Copiar")
  const cardText = new Map();
  document.querySelectorAll('main .card').forEach(card => {
    const clone = card.cloneNode(true);
    clone.querySelectorAll('button').forEach(b => b.remove());
    cardText.set(card, clone.textContent);
  });

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
        if (testRegex.test(cardText.get(card) ?? card.textContent)) {
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
  const nav = document.querySelector('nav');
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  const sections = document.querySelectorAll('main section[id]');
  if (!nav || !sections.length) return;

  // Rola só o próprio nav (nunca a janela) para manter o link ativo visível
  function revealInNav(link) {
    const navRect = nav.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    if (compactNavQuery.matches) {
      const delta = linkRect.left - navRect.left - (navRect.width - linkRect.width) / 2;
      nav.scrollBy({ left: delta, behavior: 'smooth' });
    } else {
      const scroller = nav.closest('.sidebar');
      if (!scroller) return;
      const box = scroller.getBoundingClientRect();
      if (linkRect.top < box.top || linkRect.bottom > box.bottom) {
        scroller.scrollBy({ top: linkRect.top - box.top - box.height / 2, behavior: 'smooth' });
      }
    }
  }

  // Seção ativa = a última cujo topo já passou da área fixa do topo
  // (header + faixa de nav no mobile). No fim da página, a última visível.
  let currentId = null;

  function updateActive() {
    const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scroll-offset')) || 0;
    const visible = [...sections].filter(s => !s.classList.contains('hidden'));
    let current = null;

    for (const section of visible) {
      if (section.getBoundingClientRect().top - offset <= 24) current = section;
      else break;
    }

    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (atBottom && visible.length) current = visible[visible.length - 1];

    const id = current ? current.id : null;
    if (id === currentId) return;
    currentId = id;

    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    const activeLink = id && nav.querySelector(`a[href="#${id}"]`);
    if (activeLink) revealInNav(activeLink);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateActive();
    });
  }, { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();
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
