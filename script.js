// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderHeight();
  initProgressBar();
  initBackToTop();
  initCopyButtons();
  initSearch();
  initNavActiveState();
  initNavScrollIndicator();
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

// === COPY CODE ===
function initCopyButtons() {
  const iconCopy = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>`;

  const iconCheck = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`;

  document.querySelectorAll('pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copiar código do bloco');
    btn.innerHTML = iconCopy + '<span>Copiar</span>';

    btn.addEventListener('click', async () => {
      const code = pre.querySelector('code');
      if (!code) return;

      // textContent strips all Prism <span> tags automatically
      const text = code.textContent;

      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add('success');
        btn.innerHTML = iconCheck + '<span>Copiado!</span>';
      } catch {
        btn.classList.add('error');
        btn.innerHTML = '<span>Erro</span>';
      }

      setTimeout(() => {
        btn.classList.remove('success', 'error');
        btn.innerHTML = iconCopy + '<span>Copiar</span>';
      }, 2000);
    });

    pre.appendChild(btn);
  });
}

// === SEARCH ===
function initSearch() {
  const input = document.getElementById('search-input');
  const clearBtn = document.querySelector('.search-clear');
  const noResults = document.getElementById('no-results');
  const sections = document.querySelectorAll('main section');
  if (!input) return;

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

  // Remove all <mark> elements without touching innerHTML (preserves event listeners)
  function removeAllMarks() {
    const marks = document.querySelectorAll('main mark');
    const parents = new Set();
    marks.forEach(mark => {
      parents.add(mark.parentNode);
      mark.parentNode.replaceChild(document.createTextNode(mark.textContent), mark);
    });
    // Merge adjacent text nodes left by the replacements
    parents.forEach(p => p.normalize());
  }

  // Wrap text matches with <mark> using TreeWalker — never touches innerHTML
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

          // Highlight inside logic text and tag (DOM manipulation is safe here)
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
        }
      });
    },
    {
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0,
    }
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
