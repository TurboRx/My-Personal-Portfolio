document.addEventListener('DOMContentLoaded', () => {
  const username = 'TurboRx';
  const CACHE_TTL_MS = 10 * 60 * 1000;

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

  // Helper: Relative Time Formatter
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

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

  // Helper: Toast Notifications System
  const showToast = (message) => {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      <span>${escapeHTML(message)}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
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

  const getSavedTheme = () => {
    try {
      return localStorage.getItem('theme') || 'system';
    } catch (e) {
      return 'system';
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
      } catch (e) {
        // Ignore quota or security errors
      }
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

  // --- Back to Top Button ---
  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- Scroll Animations (IntersectionObserver) ---
  const observerOptions = { threshold: 0.1 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // --- Fetch GitHub User Profile Data ---
  const cachedUser = getCachedData('user_profile');

  const updateUserUI = (data) => {
    const avatar = document.getElementById('profile-avatar');
    if (avatar && data.avatar_url) {
      avatar.src = data.avatar_url;
      avatar.onload = () => avatar.classList.add('loaded');
    }

    const bioElement = document.getElementById('profile-bio');
    if (bioElement) {
      bioElement.textContent = "Hello 👋 I'm TurboRx, a passionate developer who loves exploring new technologies and building innovative projects.";
    }

    if (data.name) {
      const nameEl = document.getElementById('profile-name');
      if (nameEl) nameEl.textContent = data.name;
    }
    
    const reposEl = document.getElementById('metric-repos');
    const followersEl = document.getElementById('metric-followers');
    const sinceEl = document.getElementById('metric-since');
    
    if (reposEl) animateCount(reposEl, data.public_repos || 0);
    if (followersEl) animateCount(followersEl, data.followers || 0);
    
    // Member Since Metric Card
    if (sinceEl && data.created_at) {
      const createdYear = new Date(data.created_at).getFullYear();
      sinceEl.textContent = createdYear;
    }
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
        if (bioElement) bioElement.textContent = "I'm TurboRx, a passionate developer who loves exploring new technologies and building innovative projects.";
      });
  }

  // --- Repositories State, Sorting & Filtering ---
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
    JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#563d7c',
    Python: '#3572A5', Vue: '#41b883', Rust: '#dea584', Go: '#00ADD8', C: '#555555',
    'C++': '#f34b7d', Java: '#b07219', PHP: '#4F5D95', default: '#858585'
  };

  // --- Render Language Distribution Bar ---
  const renderLanguageDistribution = (repos) => {
    const container = document.getElementById('language-distribution');
    const bar = document.getElementById('lang-dist-bar');
    const legend = document.getElementById('lang-dist-legend');
    if (!container || !bar || !legend) return;

    const langCounts = {};
    let totalLangRepos = 0;

    repos.forEach(r => {
      if (r.language) {
        langCounts[r.language] = (langCounts[r.language] || 0) + 1;
        totalLangRepos++;
      }
    });

    if (totalLangRepos === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    bar.innerHTML = '';
    legend.innerHTML = '';

    const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]);

    sortedLangs.forEach(([lang, count]) => {
      const percentage = ((count / totalLangRepos) * 100).toFixed(1);
      const color = langColors[lang] || langColors.default;

      const seg = document.createElement('div');
      seg.className = 'lang-segment';
      seg.style.width = `${percentage}%`;
      seg.style.backgroundColor = color;
      seg.title = `${lang}: ${percentage}% (${count} repos)`;
      bar.appendChild(seg);

      const leg = document.createElement('div');
      leg.className = 'legend-item';
      leg.innerHTML = `
        <div class="legend-dot" style="background-color: ${color}"></div>
        <span><strong>${escapeHTML(lang)}</strong> ${percentage}%</span>
      `;
      legend.appendChild(leg);
    });
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

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });

    const langColor = langColors[repo.language] || langColors.default;
    const topicsHtml = (repo.topics || []).slice(0, 3).map(t => `<span class="topic-badge">#${escapeHTML(t)}</span>`).join('');
    
    const homepageHtml = repo.homepage ? `
      <a href="${escapeHTML(repo.homepage)}" target="_blank" rel="noopener noreferrer" class="demo-btn" title="Live Preview">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        Live Preview
      </a>
    ` : '';

    const cloneCommand = `git clone ${repo.clone_url || repo.html_url + '.git'}`;

    card.innerHTML = `
      <div class="repo-header">
        <h3 class="repo-title">
          <svg height="16" viewBox="0 0 16 16" width="16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>
          <a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(repo.name)}</a>
          ${repo.fork ? '<span class="fork-tag">Fork</span>' : ''}
        </h3>
        <div class="repo-actions-top">
          <button class="icon-btn copy-clone-btn" data-clone="${escapeHTML(cloneCommand)}" title="Copy git clone command" aria-label="Copy clone command">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          ${homepageHtml}
        </div>
      </div>
      <p class="repo-desc">${escapeHTML(repo.description || 'No description provided.')}</p>
      ${topicsHtml ? `<div class="repo-topics">${topicsHtml}</div>` : ''}
      <div class="repo-meta">
        <div class="repo-meta-left">
          ${repo.language ? `<div class="meta-item"><div class="language-dot" style="background-color: ${langColor}"></div><span>${escapeHTML(repo.language)}</span></div>` : ''}
          <div class="meta-item" title="Stars">
            <svg height="13" viewBox="0 0 16 16" width="13" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
            <span>${repo.stargazers_count || 0}</span>
          </div>
          <div class="meta-item" title="Forks">
            <svg height="13" viewBox="0 0 16 16" width="13" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg>
            <span>${repo.forks_count || 0}</span>
          </div>
          <div class="meta-item" title="Watchers">
            <svg height="13" viewBox="0 0 16 16" width="13" fill="currentColor"><path d="M8 2c1.981 0 3.671.992 4.933 2.274 1.26 1.28 2.067 2.892 2.067 4.726 0 1.834-.807 3.446-2.067 4.726C11.671 15.008 9.981 16 8 16c-1.981 0-3.671-.992-4.933-2.274C1.807 12.446 1 10.834 1 9c0-1.834.807-3.446 2.067-4.726C4.329 2.992 6.019 2 8 2ZM8 3.5c-1.481 0-2.829.758-3.867 1.812C3.093 6.368 2.5 7.616 2.5 9c0 1.384.593 2.632 1.633 3.688C5.171 13.742 6.519 14.5 8 14.5c1.481 0 2.829-.758 3.867-1.812C12.907 11.632 13.5 10.384 13.5 9c0-1.384-.593-2.632-1.633-3.688C10.829 4.258 9.481 3.5 8 3.5ZM8 6a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"></path></svg>
            <span>${repo.watchers_count || 0}</span>
          </div>
          ${repo.open_issues_count > 0 ? `
          <div class="meta-item" title="Open Issues">
            <svg height="13" viewBox="0 0 16 16" width="13" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm9 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-.25-6.25a.75.75 0 0 0-1.5 0v3.5a.75.75 0 0 0 1.5 0v-3.5z"></path></svg>
            <span>${repo.open_issues_count}</span>
          </div>
          ` : ''}
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
          .then(() => showToast(`Copied clone command for ${repo.name}`))
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

    // Dynamic Filter Counter Update
    if (filterCounter) {
      const currentlyShowing = Math.min(visibleCount, filteredRepos.length);
      filterCounter.textContent = `Showing ${currentlyShowing} of ${filteredRepos.length} public repositories`;
    }

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
    if (starsEl) animateCount(starsEl, totalStars);
    if (forksEl) animateCount(forksEl, forkedCount);

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
          reposGrid.innerHTML = '<p style="grid-column: 1 / -1; color: var(--fg-secondary); text-align: center; padding: 2rem;">Failed to load repositories. Please try again later.</p>';
        }
      });
  }

  // Event Listeners for Filter, Search & Sort
  if (searchInput) searchInput.addEventListener('input', filterAndSortRepos);
  if (languageSelect) languageSelect.addEventListener('change', filterAndSortRepos);
  if (sortSelect) sortSelect.addEventListener('change', filterAndSortRepos);

  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      visibleCount += 8;
      renderGrid(false);
    });
  }

  // --- Command Palette Modal Logic ---
  const cmdModal = document.getElementById('cmd-palette-modal');
  const cmdTrigger = document.getElementById('cmd-k-trigger');
  const cmdBackdrop = document.getElementById('cmd-palette-backdrop');
  const cmdInput = document.getElementById('cmd-palette-input');
  const cmdResults = document.getElementById('cmd-palette-results');

  const defaultCommands = [
    { title: 'Scroll to About', desc: 'Go to hero section', action: () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) },
    { title: 'Scroll to Skills', desc: 'View tech stack', action: () => document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' }) },
    { title: 'Scroll to Stats', desc: 'View GitHub metrics', action: () => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' }) },
    { title: 'Scroll to Repositories', desc: 'View repository grid', action: () => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }) },
    { title: 'Switch to Light Theme', desc: 'Set light mode', action: () => { applyTheme('light'); localStorage.setItem('theme', 'light'); } },
    { title: 'Switch to Dark Theme', desc: 'Set dark mode', action: () => { applyTheme('dark'); localStorage.setItem('theme', 'dark'); } },
    { title: 'Copy GitHub Profile URL', desc: 'Copy link to clipboard', action: () => { navigator.clipboard.writeText(`https://github.com/${username}`); showToast('Copied GitHub profile URL!'); } },
  ];

  let selectedIndex = 0;

  const openCmdPalette = () => {
    if (!cmdModal) return;
    cmdModal.classList.add('show');
    cmdModal.setAttribute('aria-hidden', 'false');
    if (cmdInput) {
      cmdInput.value = '';
      cmdInput.focus();
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
      cmdResults.innerHTML = '<div style="padding: 1rem; color: var(--fg-secondary); text-align: center;">No matching commands or repositories found.</div>';
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

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (cmdModal && cmdModal.classList.contains('show')) {
        closeCmdPalette();
      } else {
        openCmdPalette();
      }
    } else if (e.key === 'Escape') {
      closeCmdPalette();
    }
  });
});
