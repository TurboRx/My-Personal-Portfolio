document.addEventListener('DOMContentLoaded', () => {
  const username = 'TurboRx';
  const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

  // Set Current Year
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Helper: XSS Sanitization
  const escapeHTML = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Helper: localStorage Cache
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
    } catch (e) {
      // Ignore quota errors
    }
  };

  // Helper: Count-Up Animation
  const animateCount = (element, targetValue) => {
    const duration = 1200;
    const startTime = performance.now();
    const startValue = 0;
    const target = parseInt(targetValue, 10) || 0;

    const step = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentCount = Math.floor(progress * (target - startValue) + startValue);
      element.textContent = currentCount;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = target;
      }
    };
    requestAnimationFrame(step);
  };

  // --- Theme Toggle Logic ---
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

  const getSavedTheme = () => localStorage.getItem('theme') || 'system';
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
      localStorage.setItem('theme', currentSetting);
      applyTheme(currentSetting);
    });
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentSetting === 'system') applyTheme('system');
  });

  // --- Mobile Hamburger Menu Logic ---
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isActive = mobileMenu.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });
    mobileMenu.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  }

  // Close menus on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (themeDropdown && themeDropdown.classList.contains('show')) {
        themeDropdown.classList.remove('show');
        if (themeToggleBtn) themeToggleBtn.setAttribute('aria-expanded', 'false');
      }
      if (mobileMenu && mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
      }
    }
  });

  // --- Scroll Animations (IntersectionObserver) ---
  const observerOptions = { threshold: 0.1 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // --- Fetch GitHub User Data ---
  const cachedUser = getCachedData('user_profile');

  const updateUserUI = (data) => {
    const avatar = document.getElementById('profile-avatar');
    if (avatar && data.avatar_url) {
      avatar.src = data.avatar_url;
      avatar.onload = () => avatar.classList.add('loaded');
    }

    const bioElement = document.getElementById('profile-bio');
    if (bioElement) {
      bioElement.textContent = data.bio || "Building modern, minimal, and fast web experiences.";
    }

    if (data.name) {
      const nameEl = document.getElementById('profile-name');
      if (nameEl) nameEl.textContent = data.name;
    }
    
    // Animate basic user metrics
    const reposEl = document.getElementById('metric-repos');
    const followersEl = document.getElementById('metric-followers');
    if (reposEl) animateCount(reposEl, data.public_repos || 0);
    if (followersEl) animateCount(followersEl, data.followers || 0);
  };

  if (cachedUser) {
    updateUserUI(cachedUser);
  } else {
    fetch(`https://api.github.com/users/${username}`)
      .then(response => {
        if (!response.ok) throw new Error('API Rate Limit or Network Error');
        return response.json();
      })
      .then(data => {
        setCachedData('user_profile', data);
        updateUserUI(data);
      })
      .catch(error => {
        console.error('Error fetching profile:', error);
        const bioElement = document.getElementById('profile-bio');
        if (bioElement) bioElement.textContent = "Full-stack developer building open-source projects.";
      });
  }

  // --- Repositories State & Fetch ---
  let allRepos = [];
  let filteredRepos = [];
  let visibleCount = 8;

  const searchInput = document.getElementById('search-input');
  const languageSelect = document.getElementById('language-select');
  const reposGrid = document.getElementById('repos-grid');
  const showMoreContainer = document.getElementById('show-more-container');
  const showMoreBtn = document.getElementById('show-more-btn');

  const langColors = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#563d7c',
    Python: '#3572A5', Vue: '#41b883', Rust: '#dea584', Go: '#00ADD8', C: '#555555',
    'C++': '#f34b7d', Java: '#b07219', PHP: '#4F5D95', default: '#333333'
  };

  const populateLanguageFilter = (repos) => {
    if (!languageSelect) return;
    const languages = new Set();
    repos.forEach(repo => {
      if (repo.language) languages.add(repo.language);
    });

    languageSelect.innerHTML = '<option value="all">All Languages</option>';
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang;
      languageSelect.appendChild(option);
    });
  };

  const createRepoCard = (repo) => {
    const card = document.createElement('div');
    card.className = 'repo-card';

    const langColor = langColors[repo.language] || langColors.default;
    const topicsHtml = (repo.topics || []).slice(0, 3).map(t => `<span class="topic-badge">#${escapeHTML(t)}</span>`).join('');
    
    const homepageHtml = repo.homepage ? `
      <a href="${escapeHTML(repo.homepage)}" target="_blank" rel="noopener noreferrer" class="demo-btn" title="Live Demo">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        Demo
      </a>
    ` : '';

    card.innerHTML = `
      <div class="repo-header">
        <h3 class="repo-title">
          <svg height="16" viewBox="0 0 16 16" width="16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>
          <a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(repo.name)}</a>
          ${repo.fork ? '<span class="fork-tag">Fork</span>' : ''}
        </h3>
        ${homepageHtml}
      </div>
      <p class="repo-desc">${escapeHTML(repo.description || 'No description provided.')}</p>
      ${topicsHtml ? `<div class="repo-topics">${topicsHtml}</div>` : ''}
      <div class="repo-meta">
        ${repo.language ? `<div class="meta-item"><div class="language-dot" style="background-color: ${langColor}"></div><span>${escapeHTML(repo.language)}</span></div>` : ''}
        <div class="meta-item">
          <svg height="14" viewBox="0 0 16 16" width="14" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
          <span>${repo.stargazers_count}</span>
        </div>
        <div class="meta-item">
          <svg height="14" viewBox="0 0 16 16" width="14" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg>
          <span>${repo.forks_count}</span>
        </div>
      </div>
    `;
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

    if (filteredRepos.length === 0) {
      reposGrid.innerHTML = '<p style="grid-column: 1 / -1; color: var(--fg-secondary); text-align: center; padding: 2rem;">No matching repositories found.</p>';
    }

    if (showMoreContainer) {
      if (filteredRepos.length > visibleCount) {
        showMoreContainer.style.display = 'block';
      } else {
        showMoreContainer.style.display = 'none';
      }
    }
  };

  const filterRepos = () => {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const selectedLang = languageSelect ? languageSelect.value : 'all';

    filteredRepos = allRepos.filter(repo => {
      const matchesSearch = repo.name.toLowerCase().includes(query) || (repo.description && repo.description.toLowerCase().includes(query));
      const matchesLang = selectedLang === 'all' || repo.language === selectedLang;
      return matchesSearch && matchesLang;
    });

    renderGrid(true);
  };

  const handleReposData = (repos) => {
    allRepos = repos;
    filteredRepos = repos;

    let totalStars = 0;
    let forkedCount = 0;
    repos.forEach(repo => {
      totalStars += repo.stargazers_count || 0;
      if (repo.fork) forkedCount += 1;
    });

    const starsEl = document.getElementById('metric-stars');
    const forksEl = document.getElementById('metric-forks');
    if (starsEl) animateCount(starsEl, totalStars);
    if (forksEl) animateCount(forksEl, forkedCount);

    populateLanguageFilter(repos);
    renderGrid(true);
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
          reposGrid.innerHTML = '<p style="grid-column: 1 / -1; color: var(--fg-secondary); text-align: center; padding: 2rem;">Failed to load repositories. Please try again later.</p>';
        }
      });
  }

  // Event Listeners for Filter & Search
  if (searchInput) searchInput.addEventListener('input', filterRepos);
  if (languageSelect) languageSelect.addEventListener('change', filterRepos);

  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      visibleCount += 8;
      renderGrid(false);
    });
  }
});
