document.addEventListener('DOMContentLoaded', () => {
  const username = 'TurboRx';
  document.getElementById('current-year').textContent = new Date().getFullYear();

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
    
    themeIconActive.innerHTML = icons[theme];
    
    themeOptions.forEach(btn => {
      if(btn.dataset.themeVal === theme) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  };

  const getSavedTheme = () => localStorage.getItem('theme') || 'system';

  let currentSetting = getSavedTheme();
  applyTheme(currentSetting);

  themeToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeDropdown.classList.toggle('show');
  });

  window.addEventListener('click', () => {
    themeDropdown.classList.remove('show');
  });

  themeOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      currentSetting = btn.dataset.themeVal;
      localStorage.setItem('theme', currentSetting);
      applyTheme(currentSetting);
    });
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if(currentSetting === 'system') applyTheme('system');
  });


  // --- Hamburger Menu Logic ---
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
  });
  mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
  });

  // --- Fetch GitHub User Data ---
  fetch(`https://api.github.com/users/${username}`)
    .then(response => response.json())
    .then(data => {
      const avatar = document.getElementById('profile-avatar');
      avatar.src = data.avatar_url;
      avatar.onload = () => avatar.classList.add('loaded');

      const bioElement = document.getElementById('profile-bio');
      bioElement.textContent = data.bio || "Building modern, minimal, and fast web experiences.";

      if (data.name) {
        document.getElementById('profile-name').textContent = data.name;
      }
      
      // Update basic user metrics
      document.getElementById('metric-repos').textContent = data.public_repos || 0;
      document.getElementById('metric-followers').textContent = data.followers || 0;
    })
    .catch(error => console.error('Error fetching profile:', error));

  // --- Fetch all GitHub Repositories (up to 100) ---
  fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`)
    .then(response => response.json())
    .then(repos => {
      
      let totalStars = 0;
      let forkedReposCount = 0;
      
      repos.forEach(repo => {
        totalStars += repo.stargazers_count;
        if (repo.fork) {
          forkedReposCount += 1;
        }
      });
      
      document.getElementById('metric-stars').textContent = totalStars;
      document.getElementById('metric-forks').textContent = forkedReposCount;
      
      // Update the label for Total Forks to be more accurate to what they meant
      const forksLabel = document.querySelector('#metric-forks').previousElementSibling;
      if (forksLabel) {
        forksLabel.textContent = 'Forked Repos';
      }

      // Render Repos Grid
      const grid = document.getElementById('repos-grid');
      grid.innerHTML = '';
      
      let currentVisible = 8;
      
      const renderRepos = () => {
        grid.innerHTML = '';
        const reposToShow = repos.slice(0, currentVisible);
        
        reposToShow.forEach((repo) => {
          const langColors = {
            JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#563d7c', Python: '#3572A5', Vue: '#41b883', default: '#333333'
          };
          const langColor = langColors[repo.language] || langColors.default;

          const card = document.createElement('div');
          card.className = 'repo-card';

          card.innerHTML = `
            <h3 class="repo-title">
              <svg height="16" viewBox="0 0 16 16" width="16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>
              <a href="${repo.html_url}" target="_blank">${repo.name}</a>
              ${repo.fork ? '<span style="font-size:0.7rem; padding: 2px 6px; border: 1px solid var(--border-color); border-radius: 10px; margin-left: 5px;">Fork</span>' : ''}
            </h3>
            <p class="repo-desc">${repo.description || 'No description provided.'}</p>
            <div class="repo-meta">
              ${repo.language ? `<div class="meta-item"><div class="language-dot" style="background-color: ${langColor}"></div><span>${repo.language}</span></div>` : ''}
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
          grid.appendChild(card);
        });

        const showMoreContainer = document.getElementById('show-more-container');
        if (repos.length > currentVisible) {
          showMoreContainer.style.display = 'block';
        } else {
          showMoreContainer.style.display = 'none';
        }
      };

      if (repos.length === 0) {
        grid.innerHTML = '<p>No repositories found.</p>';
      } else {
        renderRepos();
      }

      const showMoreBtn = document.getElementById('show-more-btn');
      if (showMoreBtn) {
        showMoreBtn.addEventListener('click', () => {
          currentVisible += 8;
          renderRepos();
        });
      }
    })
    .catch(error => {
      console.error('Error fetching repos:', error);
      document.getElementById('repos-grid').innerHTML = '<p>Failed to load repositories.</p>';
    });
});
