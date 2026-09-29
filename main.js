document.addEventListener('DOMContentLoaded', () => {
  const username = 'TurboRx';
  const CACHE_TTL_MS = 15 * 60 * 1000;

  try {
    localStorage.removeItem('tr_cache_user');
    localStorage.removeItem('tr_cache_user_profile');
  } catch (e) {}

  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const escapeHTML = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffInSeconds = Math.max(0, Math.floor((now - date) / 1000));

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    return `${Math.floor(diffInMonths / 12)}y ago`;
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
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${escapeHTML(message)}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
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
      localStorage.setItem(`tr_cache_${key}`, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch (e) {}
  };

  const animateCount = (element, targetValue) => {
    const duration = 1000;
    const startTime = performance.now();
    const startValue = 0;
    const target = parseInt(targetValue, 10) || 0;

    const step = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(ease * (target - startValue) + startValue);
      element.textContent = currentCount;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = target;
      }
    };
    requestAnimationFrame(step);
  };

  // --- Theme Management ---
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
    if (theme === 'system') {
      const systemPref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', systemPref);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    if (themeIconActive && icons[theme]) {
      themeIconActive.innerHTML = icons[theme];
    }
    
    themeOptions.forEach(btn => {
      if (btn.dataset.themeVal === theme) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  };

  const getSavedTheme = () => {
    try {
      return localStorage.getItem('theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  };
  let currentSetting = getSavedTheme();
  applyTheme(currentSetting);

  if (themeToggleBtn && themeDropdown) {
    themeToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = themeDropdown.classList.toggle('show');
      themeToggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });
  }

  window.addEventListener('click', () => {
    if (themeDropdown && themeDropdown.classList.contains('show')) {
      themeDropdown.classList.remove('show');
      if (themeToggleBtn) themeToggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  themeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      currentSetting = btn.dataset.themeVal;
      try {
        localStorage.setItem('theme', currentSetting);
      } catch (e) {}
      applyTheme(currentSetting);
    });
  });

  const darkModeMQ = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemThemeChange = () => {
    if (currentSetting === 'system') applyTheme('system');
  };
  if (darkModeMQ.addEventListener) {
    darkModeMQ.addEventListener('change', handleSystemThemeChange);
  } else if (darkModeMQ.addListener) {
    darkModeMQ.addListener(handleSystemThemeChange);
  }

  // --- Mobile Navigation ---
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = mobileMenu.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });
    mobileMenu.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    });
    window.addEventListener('click', (e) => {
      if (mobileMenu.classList.contains('active') && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        mobileMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --- Back to Top ---
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 350) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Scroll Spy Nav Highlighting ---
  const sections = document.querySelectorAll('main > section[id]');
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');

  const updateActiveNavLink = () => {
    const isAtBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 30);
    if (isAtBottom && sections.length > 0) {
      const lastId = sections[sections.length - 1].getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${lastId}`);
      });
      return;
    }

    const scrollPos = window.scrollY + 120;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  };
  window.addEventListener('scroll', updateActiveNavLink, { passive: true });
  updateActiveNavLink();

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId && targetId !== '#') {
        try {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            if (currentPortfolioMode === 'terminal') {
              setPortfolioMode('gui', false, true);
            }
            const navHeight = document.querySelector('.navbar')?.offsetHeight || 60;
            const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight - 16;
            window.scrollTo({ top: targetPos, behavior: 'smooth' });
          }
        } catch (err) {}
      }
    });
  });

  // --- Reveal Animations & Intersection Observer ---
  document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));

  // --- Cursor Spotlight Tracking ---
  document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.spotlight-card, .repo-card, .matrix-card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  }, { passive: true });

  // --- Profile Data & Fallback Cache (Current Latest from README) ---
  const LATEST_BIO_HTML = `I'm building toward being one of the best in <strong>AI/ML</strong> and <strong>Cybersecurity</strong>, full stop. On the security side, I go deep into offensive security: <strong>reverse engineering</strong> binaries to understand exactly how software behaves, and <strong>bug hunting</strong> to find what everyone else missed.<br><br>No formal courses, no shortcuts. Everything I know, I taught myself by building, breaking, and digging until it clicked. That's the foundation I'm stacking real skill on top of.`;

  const FALLBACK_PROFILE = {
    login: 'TurboRx',
    name: 'TurboRx',
    avatar_url: 'https://github.com/TurboRx.png',
    html_url: 'https://github.com/TurboRx',
    public_repos: 31,
    followers: 5,
    created_at: '2024-11-05T04:48:13Z',
    bio: "I'm building toward being one of the best in AI/ML and Cybersecurity, full stop. On the security side, I go deep into offensive security: reverse engineering binaries to understand exactly how software behaves, and bug hunting to find what everyone else missed."
  };

  // --- Monospace Typewriter Tagline Animation ---
  const typingEl = document.getElementById('hero-typing-text');
  if (typingEl) {
    const PHRASES = [
      'AI/ML + Cybersecurity',
      'Offensive Security + Bug Hunting',
      'Reverse Engineering',
      'Chasing GOAT status, one exploit at a time'
    ];
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    const typeSpeed = 65;
    const deleteSpeed = 30;
    const pauseTime = 1900;

    const tickType = () => {
      const currentPhrase = PHRASES[phraseIdx];
      if (isDeleting) {
        charIdx--;
        typingEl.textContent = currentPhrase.substring(0, charIdx);
        if (charIdx <= 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % PHRASES.length;
          setTimeout(tickType, 280);
          return;
        }
        setTimeout(tickType, deleteSpeed);
      } else {
        charIdx++;
        typingEl.textContent = currentPhrase.substring(0, charIdx);
        if (charIdx === currentPhrase.length) {
          isDeleting = true;
          setTimeout(tickType, pauseTime);
          return;
        }
        setTimeout(tickType, typeSpeed);
      }
    };
    setTimeout(tickType, 800);
  }

  const updateUserUI = (data) => {
    const avatar = document.getElementById('profile-avatar');
    if (avatar && data.avatar_url) {
      avatar.src = data.avatar_url;
      avatar.onload = () => avatar.classList.add('loaded');
    }

    const bioElement = document.getElementById('profile-bio');
    if (bioElement) {
      // Preserve rich HTML latest README bio
      bioElement.innerHTML = LATEST_BIO_HTML;
    }

    const nameEl = document.getElementById('profile-name');
    if (nameEl && data.name) {
      nameEl.textContent = data.name;
    }

    const githubLink = document.getElementById('github-link');
    if (githubLink && data.html_url) {
      githubLink.href = data.html_url;
    }
    
    const reposEl = document.getElementById('metric-repos');
    const followersEl = document.getElementById('metric-followers');
    const sinceEl = document.getElementById('metric-since');
    
    if (reposEl) animateCount(reposEl, data.public_repos || 31);
    if (followersEl) animateCount(followersEl, data.followers || 5);
    
    if (sinceEl && data.created_at) {
      const createdYear = new Date(data.created_at).getFullYear();
      sinceEl.textContent = createdYear || '2024';
    }
  };

  // Immediate render from fallback or cache
  const cachedUser = getCachedData('user_profile') || FALLBACK_PROFILE;
  updateUserUI(cachedUser);

  // Background fetch to refresh profile data
  fetch(`https://api.github.com/users/${username}`)
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(data => {
      setCachedData('user_profile', data);
      updateUserUI(data);
    })
    .catch(() => {});

  // --- Repositories Data & Handling ---
  let allRepos = [];
  let filteredRepos = [];
  let visibleCount = 8;

  const searchInput = document.getElementById('search-input');
  const languageSelect = document.getElementById('language-select');
  const sortSelect = document.getElementById('sort-select');
  const reposGrid = document.getElementById('repos-grid');
  const filterCounter = document.getElementById('filter-counter');
  const showMoreContainer = document.getElementById('show-more-container');
  const showMoreBtn = document.getElementById('show-more-btn');

  const langColors = {
    Rust: '#dea584',
    C: '#555555',
    'C++': '#f34b7d',
    Go: '#00ADD8',
    Python: '#3572A5',
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Dockerfile: '#384d54'
  };

  const getLanguageColor = (lang) => {
    if (!lang) return '#858585';
    if (langColors[lang]) return langColors[lang];
    let hash = 0;
    for (let i = 0; i < lang.length; i++) {
      hash = lang.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
  };

  const renderLanguageDistribution = (repos) => {
    const langDistContainer = document.getElementById('language-distribution');
    const langDistBar = document.getElementById('lang-dist-bar');
    const langDistLegend = document.getElementById('lang-dist-legend');
    if (!langDistContainer || !langDistBar || !langDistLegend) return;

    const counts = {};
    let total = 0;
    repos.forEach(repo => {
      if (repo.language) {
        counts[repo.language] = (counts[repo.language] || 0) + 1;
        total++;
      }
    });

    if (total === 0) {
      langDistContainer.style.display = 'none';
      return;
    }

    langDistBar.innerHTML = '';
    langDistLegend.innerHTML = '';

    const sortedLangs = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    sortedLangs.slice(0, 6).forEach(([lang, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      const color = getLanguageColor(lang);

      const segment = document.createElement('div');
      segment.className = 'lang-segment';
      segment.style.width = `${pct}%`;
      segment.style.backgroundColor = color;
      segment.title = `${lang}: ${pct}% (${count} repos)`;
      langDistBar.appendChild(segment);

      const legend = document.createElement('div');
      legend.className = 'legend-item';
      legend.innerHTML = `
        <span class="legend-dot" style="background-color: ${color}"></span>
        <span>${escapeHTML(lang)} <strong>${pct}%</strong></span>
      `;
      langDistLegend.appendChild(legend);
    });

    langDistContainer.style.display = 'block';
  };

  const populateLanguageFilter = (repos) => {
    if (!languageSelect) return;
    const currentVal = languageSelect.value;
    const langs = new Set();
    repos.forEach(repo => {
      if (repo.language) langs.add(repo.language);
    });

    languageSelect.innerHTML = '<option value="all">All Languages</option>';
    Array.from(langs).sort().forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang;
      opt.textContent = lang;
      if (lang === currentVal) opt.selected = true;
      languageSelect.appendChild(opt);
    });
  };

  const createRepoCard = (repo) => {
    const card = document.createElement('div');
    card.className = 'repo-card spotlight-card';

    const langColor = getLanguageColor(repo.language);
    const cloneUrl = `git clone ${repo.html_url}.git`;

    card.innerHTML = `
      <div class="repo-header">
        <div class="repo-title">
          <svg height="15" viewBox="0 0 16 16" width="15" fill="currentColor" style="color: var(--fg-muted); flex-shrink: 0;"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${escapeHTML(repo.name)}</a>
          ${repo.fork ? '<span class="fork-tag">Fork</span>' : ''}
        </div>
        <div class="repo-actions-top">
          <button class="icon-btn copy-clone-btn" data-clone="${cloneUrl}" title="Copy clone command" aria-label="Copy clone command">
            <svg height="13" viewBox="0 0 16 16" width="13" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>
          </button>
          ${repo.homepage ? `
          <a href="${repo.homepage}" target="_blank" rel="noopener noreferrer" class="icon-btn" title="Live Preview" aria-label="Open live demo">
            <svg height="13" viewBox="0 0 16 16" width="13" fill="currentColor"><path d="M4.75 3.5a.75.75 0 0 0 0 1.5h4.19L2.22 11.72a.75.75 0 1 0 1.06 1.06L10 6.06v4.19a.75.75 0 0 0 1.5 0v-6a.75.75 0 0 0-.75-.75h-6Z"></path></svg>
          </a>` : ''}
        </div>
      </div>
      <p class="repo-desc">${escapeHTML(repo.description || 'Systems code and architecture development.')}</p>
      ${repo.topics && repo.topics.length > 0 ? `
      <div class="repo-topics">
        ${repo.topics.slice(0, 4).map(t => `<span class="topic-badge">#${escapeHTML(t)}</span>`).join('')}
      </div>` : ''}
      <div class="repo-meta">
        <div class="repo-meta-left">
          ${repo.language ? `
          <div class="meta-item">
            <span class="language-dot" style="background-color: ${langColor};"></span>
            <span>${escapeHTML(repo.language)}</span>
          </div>` : ''}
          <div class="meta-item" title="Stars">
            <svg height="12" viewBox="0 0 16 16" width="12" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
            <span>${repo.stargazers_count || 0}</span>
          </div>
          <div class="meta-item" title="Forks">
            <svg height="12" viewBox="0 0 16 16" width="12" fill="currentColor"><path d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878Zm3.75 7.378a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm3-8.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"></path></svg>
            <span>${repo.forks_count || 0}</span>
          </div>
        </div>
        <span class="time-badge">${formatRelativeTime(repo.updated_at)}</span>
      </div>
    `;

    const copyBtn = card.querySelector('.copy-clone-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const textToCopy = copyBtn.dataset.clone;
        navigator.clipboard.writeText(textToCopy)
          .then(() => showToast(`Copied: ${textToCopy}`))
          .catch(() => showToast('Failed to copy to clipboard'));
      });
    }

    return card;
  };

  const renderGrid = (reset = false) => {
    if (!reposGrid) return;
    if (reset) {
      reposGrid.innerHTML = '';
      visibleCount = 8;
    }

    const currentCardsCount = reposGrid.children.length;
    const nextBatch = filteredRepos.slice(currentCardsCount, visibleCount);

    nextBatch.forEach(repo => {
      reposGrid.appendChild(createRepoCard(repo));
    });

    if (filterCounter) {
      const currentlyShowing = Math.min(visibleCount, filteredRepos.length);
      filterCounter.textContent = `Displaying ${currentlyShowing} of ${filteredRepos.length} public engineering repositories`;
    }

    if (filteredRepos.length === 0) {
      reposGrid.innerHTML = '<p style="grid-column: 1 / -1; color: var(--fg-secondary); text-align: center; padding: 3rem; font-family: var(--font-mono);">No matching repositories found.</p>';
    }

    if (showMoreContainer) {
      showMoreContainer.style.display = filteredRepos.length > visibleCount ? 'block' : 'none';
    }
  };

  const filterAndSortRepos = () => {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const selectedLang = languageSelect ? languageSelect.value : 'all';
    const sortBy = sortSelect ? sortSelect.value : 'updated';

    let result = allRepos.filter(repo => {
      const matchesSearch = repo.name.toLowerCase().includes(query) || (repo.description && repo.description.toLowerCase().includes(query));
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
    let forkedCount = 0;
    repos.forEach(repo => {
      totalStars += repo.stargazers_count || 0;
      if (repo.forks_count) forkedCount += repo.forks_count;
    });

    const starsEl = document.getElementById('metric-stars');
    const forksEl = document.getElementById('metric-forks');
    if (starsEl) animateCount(starsEl, Math.max(totalStars, 8));
    if (forksEl) animateCount(forksEl, Math.max(forkedCount, 3));

    renderLanguageDistribution(repos);
    populateLanguageFilter(repos);
    filterAndSortRepos();
  };

  // Immediate render from fallback or cache
  const FALLBACK_REPOS = [
    {
      name: 'safe-agent',
      description: 'Linux security sandbox for AI agent execution using Landlock LSM and seccomp-bpf in C.',
      html_url: 'https://github.com/TurboRx/safe-agent',
      homepage: null,
      stargazers_count: 2,
      forks_count: 0,
      watchers_count: 2,
      open_issues_count: 0,
      language: 'C',
      topics: ['security', 'sandbox', 'landlock', 'seccomp', 'linux-kernel'],
      updated_at: '2026-09-03T10:19:06Z',
      fork: false
    },
    {
      name: 'Turbo-Gravity',
      description: 'Discord Bot built in Rust featuring high-concurrency event loops, an axum dashboard, and Tokio runtime.',
      html_url: 'https://github.com/TurboRx/Turbo-Gravity',
      homepage: '',
      stargazers_count: 1,
      forks_count: 0,
      watchers_count: 1,
      open_issues_count: 0,
      language: 'Rust',
      topics: ['rust', 'serenity-rs', 'tokio', 'axum', 'discord-bot'],
      updated_at: '2026-09-27T18:03:34Z',
      fork: false
    },
    {
      name: 'GhostHaze-Thinker',
      description: 'High-performance Pokémon Showdown battle engine, heuristic minimax evaluator, and client library in Go.',
      html_url: 'https://github.com/TurboRx/GhostHaze-Thinker',
      homepage: '',
      stargazers_count: 1,
      forks_count: 0,
      watchers_count: 1,
      open_issues_count: 1,
      language: 'Go',
      topics: ['golang', 'pokemon-showdown', 'minimax', 'battle-engine'],
      updated_at: '2026-09-17T09:23:45Z',
      fork: false
    },
    {
      name: 'Evo-Learn',
      description: 'Automated ML tool leveraging TPOT for efficient genetic model selection and hyperparameter optimization.',
      html_url: 'https://github.com/TurboRx/Evo-Learn',
      homepage: '',
      stargazers_count: 1,
      forks_count: 0,
      watchers_count: 1,
      open_issues_count: 0,
      language: 'Python',
      topics: ['automl', 'machine-learning', 'python', 'scikit-learn', 'tpot'],
      updated_at: '2026-09-24T19:34:49Z',
      fork: false
    },
    {
      name: 'colab-mcp',
      description: 'Model Context Protocol (MCP) server for Google Colab, remote Jupyter kernels, and AI code agents.',
      html_url: 'https://github.com/TurboRx/colab-mcp',
      homepage: '',
      stargazers_count: 1,
      forks_count: 0,
      watchers_count: 1,
      open_issues_count: 0,
      language: 'Python',
      topics: ['mcp', 'colab', 'ai-agents', 'model-context-protocol'],
      updated_at: '2026-09-25T14:19:00Z',
      fork: false
    },
    {
      name: 'protobuf',
      description: 'Protocol Buffers — Google data interchange format with high-throughput zero-copy serializer.',
      html_url: 'https://github.com/TurboRx/protobuf',
      homepage: 'https://protobuf.dev',
      stargazers_count: 0,
      forks_count: 0,
      watchers_count: 0,
      open_issues_count: 0,
      language: 'C++',
      topics: ['protobuf', 'serialization', 'rpc', 'c-plus-plus'],
      updated_at: '2026-09-18T08:09:29Z',
      fork: true
    },
    {
      name: 'foul-play',
      description: 'Autonomous reinforcement learning & heuristics battle AI for Pokémon Showdown.',
      html_url: 'https://github.com/TurboRx/foul-play',
      homepage: '',
      stargazers_count: 0,
      forks_count: 0,
      watchers_count: 0,
      open_issues_count: 0,
      language: 'Python',
      topics: ['python', 'pokemon-ai', 'simulation'],
      updated_at: '2026-09-10T13:14:22Z',
      fork: true
    },
    {
      name: 'rustmail',
      description: 'A Rust Discord bot for ticket management with self-hosted web dashboard included.',
      html_url: 'https://github.com/TurboRx/rustmail',
      homepage: 'https://rustmail.rs',
      stargazers_count: 0,
      forks_count: 0,
      watchers_count: 0,
      open_issues_count: 0,
      language: 'Rust',
      topics: ['rust', 'discord-bot', 'actix-web'],
      updated_at: '2026-08-28T15:28:45Z',
      fork: true
    }
  ];

  const cachedRepos = getCachedData('user_repos');
  if (cachedRepos && cachedRepos.length > 0) {
    handleReposData(cachedRepos);
  } else {
    handleReposData(FALLBACK_REPOS);
  }

  // Refresh repos in background
  fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`)
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(repos => {
      if (Array.isArray(repos) && repos.length > 0) {
        setCachedData('user_repos', repos);
        handleReposData(repos);
      }
    })
    .catch(() => {});

  if (searchInput) searchInput.addEventListener('input', filterAndSortRepos);
  if (languageSelect) languageSelect.addEventListener('change', filterAndSortRepos);
  if (sortSelect) sortSelect.addEventListener('change', filterAndSortRepos);

  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      visibleCount += 8;
      renderGrid(false);
    });
  }

  // --- Command Palette ---
  const cmdModal = document.getElementById('cmd-palette-modal');
  const cmdTrigger = document.getElementById('cmd-k-trigger');
  const cmdBackdrop = document.getElementById('cmd-palette-backdrop');
  const cmdInput = document.getElementById('cmd-palette-input');
  const cmdResults = document.getElementById('cmd-palette-results');

  const defaultCommands = [
    { title: 'Switch to CLI Terminal Mode', desc: 'Transform entire portfolio into interactive zsh terminal', action: () => setPortfolioMode('terminal') },
    { title: 'Switch to GUI Mode', desc: 'Return to graphical portfolio view', action: () => setPortfolioMode('gui') },
    { title: 'Scroll to About', desc: 'Go to hero section', action: () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) },
    { title: 'Scroll to Tech Matrix', desc: 'View systems & tooling matrix', action: () => document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' }) },
    { title: 'Scroll to Analytics', desc: 'View GitHub metrics & impact', action: () => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' }) },
    { title: 'Scroll to Repositories', desc: 'View codebases and repos', action: () => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }) },
    { title: 'Theme: Warm Light', desc: 'Switch to warm paper ivory mode', action: () => { applyTheme('light'); try { localStorage.setItem('theme', 'light'); } catch(e){} showToast('Theme: Warm Light'); } },
    { title: 'Theme: Obsidian Dark', desc: 'Switch to high-performance slate mode', action: () => { applyTheme('dark'); try { localStorage.setItem('theme', 'dark'); } catch(e){} showToast('Theme: Obsidian Dark'); } },
    { title: 'Theme: System Adaptive', desc: 'Follow OS preference', action: () => { applyTheme('system'); try { localStorage.setItem('theme', 'system'); } catch(e){} showToast('Theme: System'); } },
    { title: 'Copy GitHub Profile URL', desc: 'https://github.com/TurboRx', action: () => { navigator.clipboard.writeText(`https://github.com/${username}`); showToast('Copied GitHub profile URL!'); } }
  ];

  let selectedIndex = 0;

  const openCmdPalette = () => {
    if (!cmdModal) return;
    cmdModal.classList.add('show');
    cmdModal.setAttribute('aria-hidden', 'false');
    if (cmdInput) {
      cmdInput.value = '';
      setTimeout(() => cmdInput.focus(), 40);
    }
    renderCmdResults('');
  };

  const closeCmdPalette = () => {
    if (!cmdModal) return;
    cmdModal.classList.remove('show');
    cmdModal.setAttribute('aria-hidden', 'true');
  };

  const renderCmdResults = (query) => {
    if (!cmdResults) return;
    cmdResults.innerHTML = '';
    selectedIndex = 0;
    const q = query.toLowerCase().trim();

    const items = [];

    defaultCommands.forEach(cmd => {
      if (!q || cmd.title.toLowerCase().includes(q) || cmd.desc.toLowerCase().includes(q)) {
        items.push({ type: 'cmd', ...cmd });
      }
    });

    allRepos.forEach(repo => {
      if (q && (repo.name.toLowerCase().includes(q) || (repo.description && repo.description.toLowerCase().includes(q)))) {
        items.push({
          type: 'repo',
          title: `Repo: ${repo.name}`,
          desc: repo.description || 'GitHub Repository',
          action: () => window.open(repo.html_url, '_blank')
        });
      }
    });

    if (items.length === 0) {
      cmdResults.innerHTML = '<div style="padding: 1.5rem; color: var(--fg-secondary); text-align: center; font-family: var(--font-mono); font-size: 0.85rem;">No matching commands or repositories found.</div>';
      return;
    }

    items.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = `cmd-item ${index === 0 ? 'selected' : ''}`;
      el.dataset.index = index;

      el.innerHTML = `
        <div class="cmd-item-left">
          <span>${escapeHTML(item.title)}</span>
        </div>
        <span class="cmd-item-desc">${escapeHTML(item.desc)}</span>
      `;

      el.addEventListener('mouseenter', () => {
        const allItems = cmdResults.querySelectorAll('.cmd-item');
        allItems.forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
        selectedIndex = index;
      });

      el.addEventListener('click', () => {
        item.action();
        closeCmdPalette();
      });

      cmdResults.appendChild(el);
    });
  };

  if (cmdTrigger) cmdTrigger.addEventListener('click', openCmdPalette);
  if (cmdBackdrop) cmdBackdrop.addEventListener('click', closeCmdPalette);

  if (cmdInput) {
    cmdInput.addEventListener('input', (e) => renderCmdResults(e.target.value));
    cmdInput.addEventListener('keydown', (e) => {
      const items = cmdResults.querySelectorAll('.cmd-item');
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[selectedIndex]?.classList.remove('selected');
        selectedIndex = (selectedIndex + 1) % items.length;
        items[selectedIndex]?.classList.add('selected');
        items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[selectedIndex]?.classList.remove('selected');
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        items[selectedIndex]?.classList.add('selected');
        items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        items[selectedIndex]?.click();
      }
    });
  }

  // --- Interactive Terminal Emulator (CLI Mode) ---
  const terminalModal = document.getElementById('terminal-modal');
  const terminalTrigger = document.getElementById('terminal-trigger');
  const terminalCloseBtn = document.getElementById('terminal-close-btn');
  const terminalBackdrop = document.getElementById('terminal-backdrop');
  const terminalInput = document.getElementById('terminal-input');
  const terminalOutput = document.getElementById('terminal-output');
  const terminalBody = document.getElementById('terminal-body');
  const modeGuiBtn = document.getElementById('mode-gui-btn');
  const termReturnGuiBtn = document.getElementById('term-return-gui-btn');
  const termClearDot = document.getElementById('terminal-clear-dot');
  const termFullscreenDot = document.getElementById('terminal-fullscreen-dot');
  const smoothOverlay = document.getElementById('smooth-transition-overlay');

  let currentPortfolioMode = 'gui';
  const termHistory = [];
  let termHistoryIndex = -1;

  const validCommands = [
    'help', 'about', 'bio', 'skills', 'stats', 'repos', 'projects',
    'ls', 'dir', 'cat', 'neofetch', 'whoami', 'contact', 'social',
    'date', 'echo', 'sudo', 'matrix', 'theme', 'history', 'clear', 'cls', 'gui', 'exit', 'quit'
  ];

  const triggerSmoothTransition = (callback) => {
    if (!smoothOverlay) {
      if (callback) callback();
      return;
    }

    const loaderBar = smoothOverlay.querySelector('.smooth-loader-bar');
    if (loaderBar) loaderBar.style.width = '0%';

    smoothOverlay.classList.add('active');

    requestAnimationFrame(() => {
      if (loaderBar) loaderBar.style.width = '70%';
    });

    setTimeout(() => {
      if (loaderBar) loaderBar.style.width = '100%';
      if (callback) callback();
    }, 140);

    setTimeout(() => {
      smoothOverlay.classList.remove('active');
      setTimeout(() => {
        if (loaderBar) loaderBar.style.width = '0%';
      }, 200);
    }, 280);
  };

  const setPortfolioMode = (mode, notify = true, animate = true) => {
    const applyMode = () => {
      currentPortfolioMode = mode;

      if (mode === 'terminal') {
        document.body.classList.add('terminal-mode-active');
        if (terminalModal) {
          terminalModal.classList.add('show');
          terminalModal.setAttribute('aria-hidden', 'false');
        }
        if (modeGuiBtn) {
          modeGuiBtn.classList.remove('active');
          modeGuiBtn.setAttribute('aria-checked', 'false');
        }
        if (terminalTrigger) {
          terminalTrigger.classList.add('active');
          terminalTrigger.setAttribute('aria-checked', 'true');
        }
        setTimeout(() => {
          if (terminalInput) terminalInput.focus();
          if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
        }, 50);
        if (notify) showToast('Switched to Terminal Mode');
      } else {
        document.body.classList.remove('terminal-mode-active');
        if (terminalModal) {
          terminalModal.classList.remove('show');
          terminalModal.setAttribute('aria-hidden', 'true');
        }
        if (modeGuiBtn) {
          modeGuiBtn.classList.add('active');
          modeGuiBtn.setAttribute('aria-checked', 'true');
        }
        if (terminalTrigger) {
          terminalTrigger.classList.remove('active');
          terminalTrigger.setAttribute('aria-checked', 'false');
        }
        if (window.location.hash === '#terminal') {
          history.replaceState(null, null, ' ');
        }
        if (notify) showToast('Switched to GUI Mode');
      }
    };

    if (animate) {
      triggerSmoothTransition(applyMode);
    } else {
      applyMode();
    }
  };

  if (modeGuiBtn) modeGuiBtn.addEventListener('click', () => setPortfolioMode('gui'));
  if (terminalTrigger) terminalTrigger.addEventListener('click', () => setPortfolioMode('terminal'));
  if (termReturnGuiBtn) termReturnGuiBtn.addEventListener('click', () => setPortfolioMode('gui'));
  if (terminalCloseBtn) terminalCloseBtn.addEventListener('click', () => setPortfolioMode('gui'));
  if (terminalBackdrop) terminalBackdrop.addEventListener('click', () => setPortfolioMode('gui'));

  if (termClearDot) {
    termClearDot.addEventListener('click', () => {
      if (terminalOutput) terminalOutput.innerHTML = '';
      if (terminalInput) terminalInput.focus();
      showToast('Terminal cleared');
    });
  }

  if (termFullscreenDot) {
    termFullscreenDot.addEventListener('click', () => {
      document.body.classList.toggle('terminal-mode-active');
      if (terminalInput) terminalInput.focus();
    });
  }

  if (window.location.hash === '#terminal') {
    setPortfolioMode('terminal', false, false);
  }

  if (terminalBody) {
    terminalBody.addEventListener('click', (e) => {
      if (window.getSelection().toString() || e.target.closest('a') || e.target.closest('button')) return;
      if (terminalInput) terminalInput.focus();
    });
  }

  const scrollTerminalToBottom = () => {
    if (!terminalBody) return;
    requestAnimationFrame(() => {
      terminalBody.scrollTop = terminalBody.scrollHeight;
      const inputLine = document.getElementById('terminal-input-line');
      if (inputLine) {
        inputLine.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      if (terminalInput) terminalInput.focus();
    });
  };

  const printTermOutput = (cmdText, resultHTML, isError = false) => {
    if (!terminalOutput) return;
    const entry = document.createElement('div');
    entry.style.marginBottom = '0.75rem';
    entry.innerHTML = `
      <div><span class="term-prompt"><span class="term-prompt-user">turborx</span><span class="term-prompt-at">@</span><span class="term-prompt-host">portfolio</span>:<span class="term-prompt-path">~</span>$</span> <span class="term-cmd">${escapeHTML(cmdText)}</span></div>
      <div class="${isError ? 'term-error' : 'term-out'}">${resultHTML}</div>
    `;
    terminalOutput.appendChild(entry);
    scrollTerminalToBottom();
  };

  const handleTerminalCommand = (rawInput) => {
    const input = rawInput.trim();
    if (!input) return;

    termHistory.push(input);
    termHistoryIndex = termHistory.length;

    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (cmd === 'clear' || cmd === 'cls') {
      if (terminalOutput) terminalOutput.innerHTML = '';
      if (terminalBody) terminalBody.scrollTop = 0;
      if (terminalInput) terminalInput.focus();
      return;
    }

    if (cmd === 'exit' || cmd === 'quit' || cmd === 'gui') {
      setPortfolioMode('gui');
      return;
    }

    if (cmd === 'ls' || cmd === 'dir') {
      const target = args[0]?.toLowerCase();
      if (!target || target === '.' || target === './') {
        printTermOutput(input, `
<span class="term-highlight">about.md</span>       <span class="term-highlight">matrix.txt</span>     <span class="term-success">projects/</span>      <span class="term-highlight">stats.json</span>     <span class="term-highlight">contact.md</span>
        `);
        return;
      }
      if (target === 'projects' || target === 'projects/' || target === './projects') {
        if (allRepos.length === 0) {
          printTermOutput(input, 'projects/ is empty or still fetching from GitHub API.');
          return;
        }
        const repoList = allRepos.map(r => `  <span class="term-success">${escapeHTML(r.name)}/</span> (${r.language || 'Code'})`).join('\n');
        printTermOutput(input, `projects/ contents:\n${repoList}`);
        return;
      }
      printTermOutput(input, `ls: cannot access '${escapeHTML(target)}': No such file or directory`, true);
      return;
    }

    if (cmd === 'cat') {
      const file = args[0]?.toLowerCase();
      if (!file) {
        printTermOutput(input, `Usage: cat &lt;filename&gt; (e.g. cat about.md, cat matrix.txt, cat stats.json, cat contact.md)`, true);
        return;
      }
      if (file === 'about.md' || file === 'about') {
        printTermOutput(input, `
# TurboRx — AI/ML & Cybersecurity
I'm building toward being one of the best in AI/ML and Cybersecurity, full stop.
On the security side, I go deep into offensive security: reverse engineering binaries to understand exactly how software behaves, and bug hunting to find what everyone else missed.

No formal courses, no shortcuts. Everything I know, I taught myself by building, breaking, and digging until it clicked. That's the foundation I'm stacking real skill on top of.

- Focus:     AI/ML, Offensive Security, Reverse Engineering, Bug Hunting
- GitHub:    <a href="https://github.com/TurboRx" target="_blank" class="term-link">https://github.com/TurboRx</a>
- Portfolio: <a href="https://turborx.pages.dev/" target="_blank" class="term-link">https://turborx.pages.dev/</a>
        `);
        return;
      }
      if (file === 'matrix.txt' || file === 'skills.txt' || file === 'skills') {
        printTermOutput(input, `
Technical Stack & Architecture Matrix:
======================================
[Offensive Security] Binary Disassembly, Ghidra, IDA Pro, Radare2, GDB/Valgrind, Exploits
[Bug Hunting & R&D]  Source Code Auditing, AST Analysis, Fuzzing (ASan), CVE POCs
[AI/ML & Tooling]    Model Context Protocol (MCP), PyTorch, Autonomous Agents, TPOT
[Systems & Core]     C (C23), Rust (2024), Linux Kernel, Landlock LSM, Protobuf, Docker
        `);
        return;
      }
      if (file === 'stats.json' || file === 'stats') {
        const stars = document.getElementById('metric-stars')?.textContent || '0';
        const repos = document.getElementById('metric-repos')?.textContent || '0';
        const followers = document.getElementById('metric-followers')?.textContent || '0';
        const forks = document.getElementById('metric-forks')?.textContent || '0';
        const since = document.getElementById('metric-since')?.textContent || '-';
        printTermOutput(input, `
{
  "developer": "TurboRx",
  "focus": "AI/ML & Cybersecurity",
  "total_stars": ${JSON.stringify(stars)},
  "public_repositories": ${JSON.stringify(repos)},
  "followers": ${JSON.stringify(followers)},
  "total_forks": ${JSON.stringify(forks)},
  "member_since": ${JSON.stringify(since)}
}
        `);
        return;
      }
      if (file === 'contact.md' || file === 'contact') {
        printTermOutput(input, `
Contact & Profiles:
- GitHub:    <a href="https://github.com/TurboRx" target="_blank" class="term-link">https://github.com/TurboRx</a>
- Website:   <a href="https://turborx.pages.dev/" target="_blank" class="term-link">https://turborx.pages.dev/</a>
- Developer: TurboRx
        `);
        return;
      }
      printTermOutput(input, `cat: ${escapeHTML(file)}: No such file`, true);
      return;
    }

    if (cmd === 'help' || cmd === 'commands') {
      printTermOutput(input, `
Available Commands:
  <span class="term-highlight">help</span>              - Display command catalog
  <span class="term-highlight">about</span>             - Developer bio & intro
  <span class="term-highlight">skills / matrix</span>   - Core systems & web technical stack
  <span class="term-highlight">projects / repos</span>  - List GitHub projects with clickable links
  <span class="term-highlight">stats</span>             - Live GitHub analytics & metrics
  <span class="term-highlight">contact</span>           - Contact info & profile links
  <span class="term-highlight">ls</span>                - List virtual directories and documents
  <span class="term-highlight">cat &lt;file&gt;</span>        - Read file (e.g. cat about.md, cat matrix.txt)
  <span class="term-highlight">neofetch</span>          - System architecture overview
  <span class="term-highlight">theme &lt;mode&gt;</span>      - Switch UI theme (light | dark | system)
  <span class="term-highlight">history</span>           - Show recent command history
  <span class="term-highlight">whoami</span>            - Current user identity
  <span class="term-highlight">date</span>              - Output current timestamp
  <span class="term-highlight">matrix</span>            - Digital matrix stream
  <span class="term-highlight">clear / cls</span>        - Clear terminal screen
  <span class="term-highlight">gui / exit</span>        - Return to standard Graphical Portfolio view

Navigation: Press [Esc] or click 'Return to GUI' in the Mode Bar anytime.
      `);
      return;
    }

    if (cmd === 'about' || cmd === 'bio') {
      printTermOutput(input, `
TurboRx — AI/ML & Cybersecurity
Building toward being one of the best in AI/ML and Cybersecurity.
Deep focus on offensive security, binary reverse engineering, and bug hunting.
GitHub: <a href="https://github.com/TurboRx" target="_blank" class="term-link">https://github.com/TurboRx</a>
Website: <a href="https://turborx.pages.dev/" target="_blank" class="term-link">https://turborx.pages.dev/</a>
      `);
      return;
    }

    if (cmd === 'skills') {
      printTermOutput(input, `
Technical Stack & Tooling:
  [Offensive Security]   Binary Disassembly, Ghidra, IDA Pro, Radare2, GDB/Valgrind
  [Bug Hunting & R&D]    Code Audits, AST Analysis, Fuzzing (ASan), CVE POCs
  [AI/ML & Tooling]      Model Context Protocol (MCP), PyTorch, Autonomous Agents
  [Systems & Low-Level]  C (C23), Rust (2024), Linux Kernel, POSIX, Landlock LSM
      `);
      return;
    }

    if (cmd === 'stats') {
      const stars = document.getElementById('metric-stars')?.textContent || '0';
      const repos = document.getElementById('metric-repos')?.textContent || '0';
      const followers = document.getElementById('metric-followers')?.textContent || '0';
      const forks = document.getElementById('metric-forks')?.textContent || '0';
      const since = document.getElementById('metric-since')?.textContent || '-';
      printTermOutput(input, `
GitHub Analytics Metrics:
  Total Stars:   ${stars}
  Public Repos:  ${repos}
  Followers:     ${followers}
  Total Forks:   ${forks}
  Member Since:  ${since}
      `);
      return;
    }

    if (cmd === 'repos' || cmd === 'projects') {
      if (allRepos.length === 0) {
        printTermOutput(input, 'No repositories loaded. Visit <a href="https://github.com/TurboRx" target="_blank" class="term-link">https://github.com/TurboRx</a>.');
        return;
      }
      const repoList = allRepos.slice(0, 10).map((r, i) => `  [${i + 1}] <a href="${r.html_url}" target="_blank" class="term-link">${escapeHTML(r.name)}</a> (${r.language || 'Code'}) ★ ${r.stargazers_count}\n      ${escapeHTML(r.description || 'No description provided')}`).join('\n\n');
      printTermOutput(input, `Showing top repositories (click to open):\n\n${repoList}`);
      return;
    }

    if (cmd === 'history') {
      if (termHistory.length === 0) {
        printTermOutput(input, 'No commands in history.');
        return;
      }
      const histList = termHistory.map((h, i) => `  ${i + 1}  ${escapeHTML(h)}`).join('\n');
      printTermOutput(input, `Command History:\n${histList}`);
      return;
    }

    if (cmd === 'neofetch' || cmd === 'fetch') {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      printTermOutput(input, `
<span class="term-highlight">       .-.      </span>  <span class="term-success">turborx@portfolio</span>
<span class="term-highlight">      (   )     </span>  ------------------
<span class="term-highlight">     .-' '-------</span>  <span class="term-highlight">OS:</span> Linux (Kernel Internals &amp; POSIX)
<span class="term-highlight">    (           )</span> <span class="term-highlight">Focus:</span> AI/ML &amp; Cybersecurity (Offensive)
<span class="term-highlight">     '-. .-------</span> <span class="term-highlight">Specialty:</span> Reverse Engineering &amp; Bug Hunting
<span class="term-highlight">      (   )     </span>  <span class="term-highlight">Languages:</span> C (C23), Rust, Python, Go
<span class="term-highlight">       '-'      </span>  <span class="term-highlight">Shell:</span> zsh (Interactive Mode)
                  <span class="term-highlight">Theme:</span> ${currentTheme === 'light' ? 'Warm Light' : 'Obsidian Dark'}
                  <span class="term-highlight">Focus:</span> AI/ML &amp; Cybersecurity
      `);
      return;
    }

    if (cmd === 'whoami') {
      printTermOutput(input, `turborx (AI/ML &amp; Cybersecurity Researcher)`);
      return;
    }

    if (cmd === 'contact' || cmd === 'social') {
      printTermOutput(input, `
Contact & Links:
  GitHub:    <a href="https://github.com/TurboRx" target="_blank" class="term-link">https://github.com/TurboRx</a>
      `);
      return;
    }

    if (cmd === 'date') {
      printTermOutput(input, new Date().toString());
      return;
    }

    if (cmd === 'echo') {
      printTermOutput(input, escapeHTML(args.join(' ')));
      return;
    }

    if (cmd === 'sudo') {
      printTermOutput(input, `Permission denied: TurboRx is the root administrator.`, true);
      return;
    }

    if (cmd === 'matrix') {
      printTermOutput(input, `<span class="term-success">01010100 01110101 01110010 01100010 01101111 01010010 01111000<br/>Wake up, Neo... The Matrix has you.</span>`);
      return;
    }

    if (cmd === 'theme') {
      const mode = args[0]?.toLowerCase();
      if (['light', 'dark', 'system'].includes(mode)) {
        currentSetting = mode;
        applyTheme(mode);
        try { localStorage.setItem('theme', mode); } catch (e) {}
        printTermOutput(input, `<span class="term-success">Theme updated to ${mode} mode.</span>`);
      } else {
        printTermOutput(input, `Usage: theme [light | dark | system]`, true);
      }
      return;
    }

    printTermOutput(input, `Command not found: '${escapeHTML(cmd)}'. Type <span class="term-highlight">'help'</span> for available commands, or <span class="term-highlight">'gui'</span> to return to graphical view.`, true);
  };

  let isQuickTyping = false;

  const typeAndExecuteCommand = (cmd) => {
    if (!cmd || isQuickTyping) return;
    isQuickTyping = true;

    const chips = document.querySelectorAll('.term-chip');
    chips.forEach(c => c.setAttribute('disabled', 'true'));

    if (terminalInput) {
      terminalInput.value = '';
      terminalInput.focus();
    }

    let i = 0;
    const typeNextChar = () => {
      if (i < cmd.length) {
        if (terminalInput) {
          terminalInput.value += cmd.charAt(i);
          scrollTerminalToBottom();
        }
        i++;
        setTimeout(typeNextChar, 25 + Math.random() * 20);
      } else {
        setTimeout(() => {
          if (terminalInput) terminalInput.value = '';
          handleTerminalCommand(cmd);
          chips.forEach(c => c.removeAttribute('disabled'));
          isQuickTyping = false;
        }, 80);
      }
    };

    typeNextChar();
  };

  document.querySelectorAll('.term-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const cmd = chip.getAttribute('data-cmd');
      if (cmd) {
        typeAndExecuteCommand(cmd);
      }
    });
  });

  if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      if (isQuickTyping) {
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter') {
        const val = terminalInput.value;
        terminalInput.value = '';
        handleTerminalCommand(val);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (termHistory.length > 0 && termHistoryIndex > 0) {
          termHistoryIndex--;
          terminalInput.value = termHistory[termHistoryIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (termHistoryIndex < termHistory.length - 1) {
          termHistoryIndex++;
          terminalInput.value = termHistory[termHistoryIndex] || '';
        } else {
          termHistoryIndex = termHistory.length;
          terminalInput.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const current = terminalInput.value.trim().toLowerCase();
        if (!current) return;

        if (current.startsWith('cat ')) {
          const catArg = current.slice(4).trim();
          const virtualFiles = ['about.md', 'matrix.txt', 'skills.txt', 'stats.json', 'contact.md'];
          const fileMatches = virtualFiles.filter(f => f.startsWith(catArg));
          if (fileMatches.length === 1) {
            terminalInput.value = `cat ${fileMatches[0]}`;
          } else if (fileMatches.length > 1) {
            printTermOutput(current, `Possible files:\n  ${fileMatches.join('  ')}`);
          }
          return;
        }

        if (current.startsWith('theme ')) {
          const themeArg = current.slice(6).trim();
          const themeOpts = ['light', 'dark', 'system'];
          const themeMatches = themeOpts.filter(t => t.startsWith(themeArg));
          if (themeMatches.length === 1) {
            terminalInput.value = `theme ${themeMatches[0]}`;
          } else if (themeMatches.length > 1) {
            printTermOutput(current, `Possible themes:\n  ${themeMatches.join('  ')}`);
          }
          return;
        }

        const matches = validCommands.filter(c => c.startsWith(current));
        if (matches.length === 1) {
          terminalInput.value = matches[0];
        } else if (matches.length > 1) {
          printTermOutput(current, `Possible completions:\n  ${matches.join('  ')}`);
        }
      }
    });
  }

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Quick / key to focus search box when not typing
    if (e.key === '/' && document.activeElement !== searchInput && !cmdModal?.classList.contains('show') && !terminalModal?.classList.contains('show') && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      searchInput?.focus();
      searchInput?.select();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdModal && cmdModal.classList.contains('show')) {
        closeCmdPalette();
      } else {
        openCmdPalette();
      }
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      setPortfolioMode(currentPortfolioMode === 'terminal' ? 'gui' : 'terminal');
    } else if (e.key === 'Escape') {
      closeCmdPalette();
      if (themeDropdown && themeDropdown.classList.contains('show')) {
        themeDropdown.classList.remove('show');
        if (themeToggleBtn) themeToggleBtn.setAttribute('aria-expanded', 'false');
      }
      if (mobileMenu && mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
      }
      if (currentPortfolioMode === 'terminal' || (terminalModal && terminalModal.classList.contains('show'))) {
        setPortfolioMode('gui');
      }
    }
  });
});
