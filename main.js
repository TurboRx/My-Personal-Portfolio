document.addEventListener('DOMContentLoaded', () => {
  const username = 'TurboRx';
  const CACHE_TTL_MS = 10 * 60 * 1000;
  const PAGE_SIZE = 8;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  const escapeHTML = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const sanitizeURL = (url) => {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    try {
      const parsed = new URL(trimmed, window.location.origin);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return parsed.href;
      }
    } catch (e) {}
    return '#';
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const diffInSeconds = Math.max(0, Math.floor((Date.now() - date) / 1000));

    if (diffInSeconds < 60) return 'Updated just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Updated ${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Updated ${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `Updated ${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `Updated ${diffInMonths}mo ago`;
    return `Updated ${Math.floor(diffInMonths / 12)}y ago`;
  };

  const showToast = (message) => {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    while (toastContainer.children.length >= 3) {
      toastContainer.firstElementChild.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${escapeHTML(message)}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const copyText = (text, successMessage) => {
    const fail = () => showToast('Could not copy to the clipboard');
    if (!navigator.clipboard) return fail();
    navigator.clipboard.writeText(text).then(() => showToast(successMessage)).catch(fail);
  };

  const getCachedData = (key) => {
    try {
      const cached = localStorage.getItem(`tr_cache_${key}`);
      if (!cached) return null;
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_TTL_MS) {
        localStorage.removeItem(`tr_cache_${key}`);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  };

  const setCachedData = (key, data) => {
    try {
      localStorage.setItem(`tr_cache_${key}`, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) {}
  };

  const setMetric = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = typeof value === 'number' ? value.toLocaleString() : value;
  };

  /* ------------------------------------------------------------------ */
  /* Theme                                                               */
  /* ------------------------------------------------------------------ */
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeDropdown = document.getElementById('theme-dropdown');
  const themeIconActive = document.getElementById('theme-icon-active');
  const themeOptions = document.querySelectorAll('.theme-option');

  const icons = {
    light: '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>',
    dark: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>',
    system: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>'
  };

  const applyTheme = (theme) => {
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.setAttribute('data-theme', resolved);

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute('content', resolved === 'dark' ? '#0e131c' : '#f4f6f9');

    if (themeIconActive && icons[theme]) themeIconActive.innerHTML = icons[theme];
    themeOptions.forEach(btn => btn.classList.toggle('active', btn.dataset.themeVal === theme));
  };

  const getSavedTheme = () => {
    try { return localStorage.getItem('theme') || 'system'; } catch (e) { return 'system'; }
  };

  let currentSetting = getSavedTheme();
  applyTheme(currentSetting);

  const setTheme = (mode) => {
    currentSetting = mode;
    try { localStorage.setItem('theme', mode); } catch (e) {}
    applyTheme(mode);
  };

  const closeThemeDropdown = () => {
    if (themeDropdown && themeDropdown.classList.contains('show')) {
      themeDropdown.classList.remove('show');
      if (themeToggleBtn) themeToggleBtn.setAttribute('aria-expanded', 'false');
    }
  };

  if (themeToggleBtn && themeDropdown) {
    themeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = themeDropdown.classList.toggle('show');
      themeToggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });
  }
  window.addEventListener('click', closeThemeDropdown);
  themeOptions.forEach(btn => btn.addEventListener('click', () => setTheme(btn.dataset.themeVal)));

  const darkModeMQ = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = () => { if (currentSetting === 'system') applyTheme('system'); };
  if (darkModeMQ.addEventListener) darkModeMQ.addEventListener('change', handleSystemThemeChange);
  else if (darkModeMQ.addListener) darkModeMQ.addListener(handleSystemThemeChange);

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /* ------------------------------------------------------------------ */
  const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  const isMac = /Mac|iPhone|iPad/i.test(platform);
  document.querySelectorAll('#cmd-k-trigger .cmd-k-kbd').forEach(k => { k.textContent = isMac ? '⌘ K' : 'Ctrl K'; });

  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const closeMobileMenu = () => {
    if (!mobileMenu || !hamburger) return;
    mobileMenu.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  };
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = mobileMenu.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });
    mobileMenu.addEventListener('click', closeMobileMenu);
    window.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('active') && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        closeMobileMenu();
      }
    });
  }

  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      backToTopBtn.classList.toggle('visible', window.scrollY > 350);
    }, { passive: true });
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  const sections = document.querySelectorAll('main > section[id]');
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');

  const setActiveLink = (id) => {
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };

  const updateActiveNavLink = () => {
    if (sections.length === 0) return;
    const isAtBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 30);
    if (isAtBottom) {
      setActiveLink(sections[sections.length - 1].getAttribute('id'));
      return;
    }
    const scrollPos = window.scrollY + 120;
    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
        setActiveLink(sec.getAttribute('id'));
      }
    });
  };
  window.addEventListener('scroll', updateActiveNavLink, { passive: true });
  updateActiveNavLink();

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      try {
        const targetEl = document.querySelector(targetId);
        if (!targetEl) return;
        e.preventDefault();
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 56;
        const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
        window.scrollTo({ top: Math.max(0, targetPos), behavior: reducedMotion ? 'auto' : 'smooth' });
      } catch (err) {}
    });
  });

  /* ------------------------------------------------------------------ */
  /* Hero: the name over its ASCII bytes                                 */
  /* ------------------------------------------------------------------ */
  const initHexName = () => {
    const cols = Array.from(document.querySelectorAll('.hx-col'));
    if (cols.length === 0) return;

    const insChar = document.getElementById('ins-char');
    const insHex = document.getElementById('ins-hex');
    const insDec = document.getElementById('ins-dec');
    const insBin = document.getElementById('ins-bin');

    const toBinary = (n) => n.toString(2).padStart(8, '0').replace(/(\d{4})(\d{4})/, '$1 $2');

    const select = (col) => {
      cols.forEach(c => c.classList.toggle('is-selected', c === col));
      const ch = col.querySelector('.hx-char').textContent;
      const code = ch.charCodeAt(0);
      if (insChar) insChar.textContent = ch;
      if (insHex) insHex.textContent = '0x' + code.toString(16).toUpperCase().padStart(2, '0');
      if (insDec) insDec.textContent = String(code);
      if (insBin) insBin.textContent = toBinary(code);
    };

    cols.forEach(col => {
      col.addEventListener('pointerenter', () => select(col));
      col.addEventListener('click', () => select(col));
    });
    select(cols[0]);

    if (reducedMotion) return;

    // One-time reveal: the bytes flicker through random values, then settle left to right.
    const bytes = cols.map(c => c.querySelector('.hx-byte'));
    const finals = bytes.map(b => b.textContent);
    const hexChars = '0123456789ABCDEF';
    const randomByte = () => hexChars[Math.floor(Math.random() * 16)] + hexChars[Math.floor(Math.random() * 16)];
    const BASE_DELAY = 350;
    const STAGGER = 90;
    const FLICKER_MS = 55;
    const start = performance.now();
    let lastFlicker = 0;

    bytes.forEach(b => { b.classList.add('is-scrambling'); b.textContent = randomByte(); });

    const tick = (now) => {
      const elapsed = now - start;
      const flicker = now - lastFlicker >= FLICKER_MS;
      if (flicker) lastFlicker = now;
      let settled = 0;
      bytes.forEach((b, i) => {
        if (elapsed >= BASE_DELAY + i * STAGGER) {
          if (b.classList.contains('is-scrambling')) {
            b.textContent = finals[i];
            b.classList.remove('is-scrambling');
          }
          settled++;
        } else if (flicker) {
          b.textContent = randomByte();
        }
      });
      if (settled < bytes.length) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  initHexName();

  /* ------------------------------------------------------------------ */
  /* Avatar and profile                                                  */
  /* ------------------------------------------------------------------ */
  const avatar = document.getElementById('profile-avatar');
  const avatarContainer = document.getElementById('avatar-container');
  if (avatar) {
    const markLoaded = () => avatar.classList.add('loaded');
    if (avatar.complete && avatar.naturalWidth > 0) markLoaded();
    avatar.addEventListener('load', markLoaded);
    avatar.addEventListener('error', () => { if (avatarContainer) avatarContainer.classList.add('failed'); });
  }

  const updateUserUI = (data) => {
    const fullnameEl = document.getElementById('profile-fullname');
    if (fullnameEl && data.name && data.name.trim().toLowerCase() !== username.toLowerCase()) {
      fullnameEl.textContent = data.name;
      fullnameEl.hidden = false;
    }

    if (data.html_url) {
      const githubLink = document.getElementById('github-link');
      if (githubLink) githubLink.href = sanitizeURL(data.html_url);
    }

    setMetric('metric-repos', data.public_repos || 0);
    setMetric('metric-followers', data.followers || 0);
    if (data.created_at) setMetric('metric-since', String(new Date(data.created_at).getFullYear()));
  };

  const cachedUser = getCachedData('user_profile');
  if (cachedUser) {
    updateUserUI(cachedUser);
  } else {
    fetch(`https://api.github.com/users/${username}`)
      .then(response => {
        if (!response.ok) throw new Error('API rate limit or network error');
        return response.json();
      })
      .then(data => {
        setCachedData('user_profile', data);
        updateUserUI(data);
      })
      .catch(error => console.error('Error fetching profile:', error));
  }

  /* ------------------------------------------------------------------ */
  /* Repositories                                                        */
  /* ------------------------------------------------------------------ */
  let allRepos = [];
  let filteredRepos = [];
  let visibleCount = PAGE_SIZE;
  let renderedCount = 0;

  const searchInput = document.getElementById('search-input');
  const languageSelect = document.getElementById('language-select');
  const sortSelect = document.getElementById('sort-select');
  const reposGrid = document.getElementById('repos-grid');
  const filterCounter = document.getElementById('filter-counter');
  const showMoreContainer = document.getElementById('show-more-container');
  const showMoreBtn = document.getElementById('show-more-btn');

  const langColors = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#563d7c',
    Python: '#3572A5', Vue: '#41b883', Rust: '#dea584', Go: '#00ADD8', C: '#555555',
    'C++': '#f34b7d', Java: '#b07219', PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF',
    Shell: '#89e051', Dockerfile: '#384d54', Ruby: '#701516', Dart: '#00B4AB', 'C#': '#178600',
    Zig: '#ec915c', R: '#198CE7', Elixir: '#6e4a7e', Lua: '#000080', Haskell: '#5e5086',
    Scala: '#c22d40', Assembly: '#6E4C13', Svelte: '#ff3e00', SCSS: '#c6538c'
  };

  const getLanguageColor = (lang) => {
    if (!lang) return '#858585';
    if (langColors[lang]) return langColors[lang];
    let hash = 0;
    for (let i = 0; i < lang.length; i++) hash = lang.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
  };

  const renderLanguageDistribution = (repos) => {
    const container = document.getElementById('language-distribution');
    const bar = document.getElementById('lang-dist-bar');
    const legend = document.getElementById('lang-dist-legend');
    if (!container || !bar || !legend) return;

    const langCounts = {};
    let total = 0;
    repos.forEach(r => {
      if (r.language) {
        langCounts[r.language] = (langCounts[r.language] || 0) + 1;
        total++;
      }
    });

    if (total === 0) { container.hidden = true; return; }

    container.hidden = false;
    bar.innerHTML = '';
    legend.innerHTML = '';

    Object.entries(langCounts).sort((a, b) => b[1] - a[1]).forEach(([lang, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      const color = getLanguageColor(lang);

      const seg = document.createElement('div');
      seg.className = 'lang-segment';
      seg.style.width = `${percentage}%`;
      seg.style.backgroundColor = color;
      seg.title = `${lang}: ${percentage}% (${count} repos)`;
      bar.appendChild(seg);

      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <span class="legend-dot" style="background-color: ${color}"></span>
        <span><span class="legend-lang">${escapeHTML(lang)}</span> ${percentage}%</span>
      `;
      legend.appendChild(item);
    });
  };

  const populateLanguageFilter = (repos) => {
    if (!languageSelect) return;
    const languages = new Set();
    repos.forEach(repo => { if (repo.language) languages.add(repo.language); });

    languageSelect.innerHTML = '<option value="all">All languages</option>';
    Array.from(languages).sort((a, b) => a.localeCompare(b)).forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang;
      languageSelect.appendChild(option);
    });
  };

  const createRepoCard = (repo) => {
    const card = document.createElement('article');
    card.className = 'repo';

    const langColor = getLanguageColor(repo.language);
    const topicsHtml = (repo.topics || []).slice(0, 3).map(t => `<li>#${escapeHTML(t)}</li>`).join('');
    const safeHtmlUrl = sanitizeURL(repo.html_url);
    const safeCloneUrl = sanitizeURL(repo.clone_url || (safeHtmlUrl !== '#' ? safeHtmlUrl + '.git' : ''));
    const cloneCommand = safeCloneUrl !== '#' ? `git clone ${safeCloneUrl}` : '';

    card.innerHTML = `
      <div class="repo-main">
        <h3 class="repo-name">
          <a href="${escapeHTML(safeHtmlUrl)}" target="_blank" rel="noopener noreferrer">${escapeHTML(repo.name)}</a>
          ${repo.fork ? '<span class="fork-tag">fork</span>' : ''}
        </h3>
        <p class="repo-desc">${escapeHTML(repo.description || 'No description provided.')}</p>
        ${topicsHtml ? `<ul class="repo-topics">${topicsHtml}</ul>` : ''}
      </div>
      <div class="repo-meta">
        <div class="repo-stats">
          ${repo.language ? `<span class="meta-item lang"><span class="language-dot" style="background-color: ${langColor}"></span><span class="lang-name">${escapeHTML(repo.language)}</span></span>` : '<span class="meta-item lang"></span>'}
          <span class="meta-item" title="Stars">
            <svg height="13" viewBox="0 0 16 16" width="13" fill="currentColor" aria-hidden="true"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
            <span class="sr-only">Stars:</span>${repo.stargazers_count || 0}
          </span>
          <span class="meta-item" title="Forks">
            <svg height="13" viewBox="0 0 16 16" width="13" fill="currentColor" aria-hidden="true"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg>
            <span class="sr-only">Forks:</span>${repo.forks_count || 0}
          </span>
          ${repo.open_issues_count > 0 ? `
          <span class="meta-item" title="Open issues">
            <svg height="13" viewBox="0 0 16 16" width="13" fill="currentColor" aria-hidden="true"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-.25-6.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5z"></path></svg>
            <span class="sr-only">Open issues:</span>${repo.open_issues_count}
          </span>` : '<span class="meta-item"></span>'}
        </div>
        <span class="time-badge">${escapeHTML(formatRelativeTime(repo.updated_at))}</span>
      </div>
      <button class="icon-btn repo-copy copy-clone-btn" data-clone="${escapeHTML(cloneCommand)}" title="Copy git clone command" aria-label="Copy git clone command for ${escapeHTML(repo.name)}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
      </button>
    `;

    const copyBtn = card.querySelector('.copy-clone-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyText(copyBtn.dataset.clone, `Copied clone command for ${repo.name}`);
      });
    }
    return card;
  };

  const renderGrid = (reset = false) => {
    if (!reposGrid) return;
    if (reset) {
      reposGrid.innerHTML = '';
      visibleCount = PAGE_SIZE;
      renderedCount = 0;
    }

    if (filteredRepos.length === 0) {
      reposGrid.innerHTML = '<p class="state-msg">No repositories match your search. Try a different name, or set the language filter to All languages.</p>';
      if (filterCounter) filterCounter.textContent = 'No matching repositories';
      if (showMoreContainer) showMoreContainer.hidden = true;
      return;
    }

    const nextBatch = filteredRepos.slice(renderedCount, visibleCount);
    nextBatch.forEach(repo => reposGrid.appendChild(createRepoCard(repo)));
    renderedCount += nextBatch.length;

    if (filterCounter) {
      filterCounter.textContent = `Showing ${Math.min(visibleCount, filteredRepos.length)} of ${filteredRepos.length} public repositories`;
    }

    if (showMoreContainer) {
      const remaining = filteredRepos.length - visibleCount;
      showMoreContainer.hidden = remaining <= 0;
      if (remaining > 0 && showMoreBtn) showMoreBtn.textContent = `Show ${Math.min(PAGE_SIZE, remaining)} more`;
    }
  };

  const filterAndSortRepos = () => {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const selectedLang = languageSelect ? languageSelect.value : 'all';
    const sortBy = sortSelect ? sortSelect.value : 'updated';

    const result = allRepos.filter(repo => {
      const matchesSearch = repo.name.toLowerCase().includes(query) ||
        (repo.description && repo.description.toLowerCase().includes(query));
      const matchesLang = selectedLang === 'all' || repo.language === selectedLang;
      return matchesSearch && matchesLang;
    });

    result.sort((a, b) => {
      if (sortBy === 'stars') return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      if (sortBy === 'forks') return (b.forks_count || 0) - (a.forks_count || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    });

    filteredRepos = result;
    renderGrid(true);
  };

  const handleReposData = (repos) => {
    allRepos = repos;

    let totalStars = 0;
    let totalForks = 0;
    repos.forEach(repo => {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
    });
    setMetric('metric-stars', totalStars);
    setMetric('metric-forks', totalForks);

    renderLanguageDistribution(repos);
    populateLanguageFilter(repos);
    filterAndSortRepos();
  };

  const cachedRepos = getCachedData('user_repos');
  if (cachedRepos) {
    handleReposData(cachedRepos);
  } else {
    fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load repos');
        return response.json();
      })
      .then(repos => {
        setCachedData('user_repos', repos);
        handleReposData(repos);
      })
      .catch(error => {
        console.error('Error fetching repos:', error);
        if (reposGrid) {
          reposGrid.innerHTML = `<p class="state-msg">Couldn't load repositories from GitHub. This is usually the API rate limit, so try again in a few minutes, or <a href="https://github.com/${username}" target="_blank" rel="noopener noreferrer">open the profile directly</a>.</p>`;
        }
        if (filterCounter) filterCounter.textContent = 'Repositories unavailable';
      });
  }

  if (searchInput) searchInput.addEventListener('input', filterAndSortRepos);
  if (languageSelect) languageSelect.addEventListener('change', filterAndSortRepos);
  if (sortSelect) sortSelect.addEventListener('change', filterAndSortRepos);
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      renderGrid(false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Command palette                                                     */
  /* ------------------------------------------------------------------ */
  const cmdModal = document.getElementById('cmd-palette-modal');
  const cmdTrigger = document.getElementById('cmd-k-trigger');
  const cmdBackdrop = document.getElementById('cmd-palette-backdrop');
  const cmdInput = document.getElementById('cmd-palette-input');
  const cmdResults = document.getElementById('cmd-palette-results');

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const defaultCommands = [
    { title: 'Go to About', desc: 'Top of the page', action: () => scrollToSection('about') },
    { title: 'Go to Tech stack', desc: 'Languages and tooling', action: () => scrollToSection('skills') },
    { title: 'Go to GitHub', desc: 'Live GitHub numbers', action: () => scrollToSection('stats') },
    { title: 'Go to Repositories', desc: 'Searchable repository list', action: () => scrollToSection('projects') },
    { title: 'Use light theme', desc: 'Set light mode', action: () => setTheme('light') },
    { title: 'Use dark theme', desc: 'Set dark mode', action: () => setTheme('dark') },
    { title: 'Use system theme', desc: 'Follow your device setting', action: () => setTheme('system') },
    { title: 'Copy GitHub profile URL', desc: 'Copy the link to your clipboard', action: () => copyText(`https://github.com/${username}`, 'Copied GitHub profile URL') }
  ];

  let selectedIndex = 0;
  let paletteReturnFocus = null;

  const setPaletteSelection = (index) => {
    const items = cmdResults ? cmdResults.querySelectorAll('.cmd-item') : [];
    if (items.length === 0) return;
    selectedIndex = (index + items.length) % items.length;
    items.forEach((el, i) => {
      el.classList.toggle('selected', i === selectedIndex);
      el.setAttribute('aria-selected', i === selectedIndex ? 'true' : 'false');
    });
    items[selectedIndex].scrollIntoView({ block: 'nearest' });
  };

  const renderCmdResults = (query) => {
    if (!cmdResults) return;
    cmdResults.innerHTML = '';
    selectedIndex = 0;
    const q = query.toLowerCase().trim();

    const items = [];
    defaultCommands.forEach(cmd => {
      if (!q || cmd.title.toLowerCase().includes(q) || cmd.desc.toLowerCase().includes(q)) {
        items.push(cmd);
      }
    });

    if (q) {
      allRepos
        .filter(repo => repo.name.toLowerCase().includes(q) || (repo.description && repo.description.toLowerCase().includes(q)))
        .slice(0, 8)
        .forEach(repo => {
          items.push({
            title: `Repo: ${repo.name}`,
            desc: repo.description || 'GitHub repository',
            action: () => {
              const safeUrl = sanitizeURL(repo.html_url);
              if (safeUrl !== '#') window.open(safeUrl, '_blank', 'noopener,noreferrer');
            }
          });
        });
    }

    if (items.length === 0) {
      cmdResults.innerHTML = '<div class="cmd-empty">No matching commands or repositories.</div>';
      return;
    }

    items.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = `cmd-item${index === 0 ? ' selected' : ''}`;
      el.setAttribute('role', 'option');
      el.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      el.innerHTML = `
        <div class="cmd-item-left"><span>${escapeHTML(item.title)}</span></div>
        <span class="cmd-item-desc">${escapeHTML(item.desc)}</span>
      `;
      el.addEventListener('mouseenter', () => setPaletteSelection(index));
      el.addEventListener('click', () => {
        closeCmdPalette(false);
        item.action();
      });
      cmdResults.appendChild(el);
    });
  };

  const openCmdPalette = () => {
    if (!cmdModal) return;
    paletteReturnFocus = document.activeElement;
    cmdModal.classList.add('show');
    cmdModal.setAttribute('aria-hidden', 'false');
    if (cmdInput) {
      cmdInput.value = '';
      cmdInput.focus();
    }
    renderCmdResults('');
  };

  const closeCmdPalette = (restoreFocus = true) => {
    if (!cmdModal || !cmdModal.classList.contains('show')) return;
    cmdModal.classList.remove('show');
    cmdModal.setAttribute('aria-hidden', 'true');
    if (restoreFocus && paletteReturnFocus && typeof paletteReturnFocus.focus === 'function') {
      paletteReturnFocus.focus();
    }
  };

  if (cmdTrigger) cmdTrigger.addEventListener('click', openCmdPalette);
  if (cmdBackdrop) cmdBackdrop.addEventListener('click', () => closeCmdPalette());

  if (cmdInput) {
    cmdInput.addEventListener('input', (e) => renderCmdResults(e.target.value));
    cmdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') { e.preventDefault(); return; }
      const items = cmdResults.querySelectorAll('.cmd-item');
      if (items.length === 0) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setPaletteSelection(selectedIndex + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setPaletteSelection(selectedIndex - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); items[selectedIndex]?.click(); }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Global shortcuts                                                    */
  /* ------------------------------------------------------------------ */
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdModal && cmdModal.classList.contains('show')) closeCmdPalette();
      else openCmdPalette();
    } else if (e.key === 'Escape') {
      closeCmdPalette();
      closeThemeDropdown();
      closeMobileMenu();
    }
  });
});
