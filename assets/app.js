/* assets/app.js */
/* global PostDB, PostSearch, InstagramImporter, IdeaGenerator */

class BearcatApp {
  constructor() {
    // state
    this.posts = [];
    this.filteredPosts = [];
    this.currentPage = 0;
    this.pageSize = 30;
    this.filters = {
      search: '',
      media_type: null,
      event_type: null,
      year: null,
      indoor_outdoor: null
    };

    // services
    this.db = new PostDB();
    this.search = new PostSearch();
    this.importer = new InstagramImporter();
    this.generator = new IdeaGenerator();

    // observers
    this._io = null;
    this._scrollObserver = null;

    // init
    this.init();
  }

  async init() {
    await this.db.init();
    await this.loadData();
    this.setupTheme();
    this.setupEventListeners();
    this.updateYearFilter();
    this.updateEventFilterFromData();
    this.loadFiltersFromURL();   // makes UI reflect URL and calls applyFilters
    this.setupInfiniteScroll();
  }

  async loadData() {
    let posts = await this.db.getAllPosts();
    if (!posts || posts.length === 0) {
      try {
        const response = await fetch('data/posts.json', { cache: 'no-store' });
        const data = await response.json();
        posts = data.posts || [];
        for (const post of posts) {
          await this.db.savePost(post);
        }
      } catch (err) {
        console.error('Error loading posts:', err);
        posts = [];
      }
    }

    // normalize fields so filters and search are consistent
    this.posts = posts.map((p, i) => {
      const ts = p.timestamp_iso ? new Date(p.timestamp_iso) : null;
      const yearFromTs = ts && !isNaN(ts) ? ts.getFullYear() : null;
      return {
        post_id: p.post_id || p.id || p.shortcode || `post_${i}_${p.timestamp_iso || ''}`,
        ...p,
        year: p.year ? parseInt(p.year, 10) : yearFromTs,
        media_type: p.media_type || 'Image',
        caption_clean: p.caption_clean || p.caption || '',
        caption_raw: p.caption_raw || p.caption || '',
        timestamp_iso: p.timestamp_iso || p.taken_at || p.timestamp || null
      };
    });

    this.search.buildIndex(this.posts);
  }

  // utility
  $(sel) { return document.querySelector(sel); }
  $all(sel) { return Array.from(document.querySelectorAll(sel)); }

  debounce(fn, wait = 250) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  setupEventListeners() {
    // search
    const searchInput = this.$('#search-input');
    if (searchInput) {
      const onSearch = this.debounce((e) => {
        this.filters.search = e.target.value || '';
        this.applyFilters();
        this.updateURL();
      }, 250);
      searchInput.addEventListener('input', onSearch);
    }

    // chips
    this.$all('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const filter = chip.dataset.filter;
        const value = chip.dataset.value;
        if (!filter) return;

        if (chip.classList.contains('active')) {
          chip.classList.remove('active');
          this.filters[filter] = null;
        } else {
          this.$all(`.chip[data-filter="${filter}"]`).forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.filters[filter] = value || null;
        }

        this.applyFilters();
        this.updateURL();
      });
    });

    // year filter
    const yearSelect = this.$('#year-filter');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        const v = e.target.value;
        this.filters.year = v ? parseInt(v, 10) : null;
        this.applyFilters();
        this.updateURL();
      });
    }

    // event filter
    const eventSelect = this.$('#event-filter');
    if (eventSelect) {
      eventSelect.addEventListener('change', (e) => {
        this.filters.event_type = e.target.value || null;
        this.applyFilters();
        this.updateURL();
      });
    }

    // theme toggle
    const themeToggle = this.$('#theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
      });
    }

    // modal close elements
    this.$all('[data-close]').forEach(el => {
      el.addEventListener('click', () => this.closeModal());
    });

    // modal escape and backdrop click
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
    const modal = this.$('#viewer-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    // import handlers
    this.setupImportHandlers();

    // generator handlers
    this.setupGeneratorHandlers();
  }

  setupImportHandlers() {
    const dropZone = this.$('#drop-zone');
    const fileInput = this.$('#file-input');
    const exportBtn = this.$('#export-btn');
    const status = this.$('#import-status');

    if (dropZone && fileInput) {
      dropZone.addEventListener('click', () => fileInput.click());
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
      dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files || []);
        await this.handleImport(files);
      });

      fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []);
        await this.handleImport(files);
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        await this.exportData();
      });
    }

    // helper reference for status updates
    this._importStatusEl = status || null;
    this._exportBtnEl = exportBtn || null;
  }

  async handleImport(files) {
    if (!files || files.length === 0) return;
    if (this._importStatusEl) this._importStatusEl.textContent = 'Importing...';

    try {
      const newPosts = await this.importer.importFiles(files);

      for (const raw of newPosts) {
        const post = this.normalizeImportedPost(raw);
        const exists = this.posts.find(p =>
          (post.shortcode && p.shortcode === post.shortcode) ||
          (post.permalink && p.permalink === post.permalink) ||
          (post.post_id && p.post_id === post.post_id)
        );
        if (!exists) {
          this.posts.push(post);
          await this.db.savePost(post);
        }
      }

      this.search.buildIndex(this.posts);
      this.updateYearFilter();
      this.updateEventFilterFromData();
      this.applyFilters();

      if (this._importStatusEl) this._importStatusEl.textContent = `Imported ${newPosts.length} posts successfully`;
      if (this._exportBtnEl) this._exportBtnEl.hidden = false;
    } catch (err) {
      console.error('Import error:', err);
      if (this._importStatusEl) this._importStatusEl.textContent = 'Import failed. Please check the file format.';
    }
  }

  normalizeImportedPost(p) {
    const ts = p.timestamp_iso ? new Date(p.timestamp_iso) : (p.taken_at ? new Date(p.taken_at) : null);
    const year = ts && !isNaN(ts) ? ts.getFullYear() : (p.year ? parseInt(p.year, 10) : null);
    return {
      post_id: p.post_id || p.id || p.shortcode || `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...p,
      year,
      media_type: p.media_type || 'Image',
      caption_clean: p.caption_clean || p.caption || '',
      caption_raw: p.caption_raw || p.caption || '',
      timestamp_iso: p.timestamp_iso || p.taken_at || p.timestamp || null
    };
  }

  async exportData() {
    const data = {
      posts: this.posts,
      exported: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'posts.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  setupGeneratorHandlers() {
    const generateBtn = this.$('#generate-btn');
    const eventSelect = this.$('#gen-event');

    if (eventSelect && eventSelect.options.length === 0) {
      [
        'Football', 'Basketball', 'Volleyball', 'Soccer',
        'Baseball', 'Pep_Rally', 'Community_Event', 'Campus_Activation', 'Other'
      ].forEach(event => {
        const option = document.createElement('option');
        option.value = event;
        option.textContent = event.replace(/_/g, ' ');
        eventSelect.appendChild(option);
      });
    }

    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        const event = this.$('#gen-event')?.value;
        const location = this.$('#gen-location')?.value;
        const theme = this.$('#gen-theme')?.value;

        if (!event || !location) {
          alert('Please select event type and location');
          return;
        }

        const ideas = this.generator.generate(event, location, theme);
        this.renderIdeas(ideas);
      });
    }
  }

  renderIdeas(ideas) {
    const output = this.$('#ideas-output');
    if (!output) return;

    output.innerHTML = ideas.map(idea => `
      <div class="idea-card">
        <h3>${idea.idea_title}</h3>
        <span class="idea-status ${idea.status?.toLowerCase() || ''}">${idea.status || ''}</span>
        <p><strong>Summary:</strong> ${idea.summary || ''}</p>
        <p><strong>Props:</strong> ${idea.props_list || ''}</p>
        <p><strong>Costume:</strong> ${idea.costume_notes || ''}</p>
        <p><strong>Crowd:</strong> ${idea.crowd_callouts || ''}</p>
        ${idea.originality_notes ? `<p><small>${idea.originality_notes}</small></p>` : ''}
      </div>
    `).join('');
  }

  applyFilters() {
    let filtered = [...this.posts];

    // search
    if (this.filters.search) {
      const results = this.search.search(this.filters.search);
      const ids = new Set(results.map(r => r.item.post_id));
      filtered = filtered.filter(p => ids.has(p.post_id));
    }

    // media type
    if (this.filters.media_type) {
      filtered = filtered.filter(p => p.media_type === this.filters.media_type);
    }

    // year
    if (this.filters.year) {
      const y = parseInt(this.filters.year, 10);
      filtered = filtered.filter(p => p.year === y);
    }

    // event type
    if (this.filters.event_type) {
      filtered = filtered.filter(p => p.event_type === this.filters.event_type);
    }

    // future filter example for indoor_outdoor if your data has it
    if (this.filters.indoor_outdoor) {
      filtered = filtered.filter(p => p.indoor_outdoor === this.filters.indoor_outdoor);
    }

    this.filteredPosts = filtered;
    this.currentPage = 0;
    this.renderResults();
    this.updateResultCount();
  }

  renderResults() {
    const grid = this.$('#results-grid');
    if (!grid) return;

    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    const posts = this.filteredPosts.slice(start, end);

    if (this.currentPage === 0) {
      grid.innerHTML = '';
    }

    posts.forEach(post => {
      const card = this.createPostCard(post);
      grid.appendChild(card);
    });

    // ensure lazy load is bound
    this.lazyLoadAssets();
  }

  createPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View post from ${post.timestamp_iso || ''}`);

    const mediaUrl = post.media_url || post.thumbnail_url || '';
    const mediaType = post.media_type || 'Image';
    const poster = post.thumbnail_url || '';

    const mediaHtml = (mediaType === 'Video' || mediaType === 'Reel')
      ? `<video data-src="${mediaUrl}" ${poster ? `poster="${poster}"` : ''} muted playsinline preload="none"></video>`
      : `<img data-src="${mediaUrl}" alt="${post.caption_clean?.substring(0, 100) || 'Post image'}">`;

    card.innerHTML = `
      <div class="media">
        ${mediaHtml}
        <span class="media-type" aria-hidden="true">${mediaType}</span>
      </div>
      <div class="content">
        <p class="caption">${post.caption_clean || 'No caption'}</p>
        <div class="meta">
          <span>${post.timestamp_iso ? new Date(post.timestamp_iso).toLocaleDateString() : ''}</span>
          <div class="stats">
            ${post.likes ? `<span>❤️ ${post.likes}</span>` : ''}
            ${post.comments ? `<span>💬 ${post.comments}</span>` : ''}
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => this.openPost(post));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.openPost(post);
      }
    });

    return card;
  }

  openPost(post) {
    const modal = this.$('#viewer-modal');
    const body = this.$('#modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
      <div class="post-detail">
        ${
          post.media_type === 'Video' || post.media_type === 'Reel'
            ? `<video src="${post.media_url || ''}" controls playsinline></video>`
            : post.media_type === 'Carousel' && Array.isArray(post.slides)
              ? `<div class="carousel">
                  ${post.slides.map(slide => `<img data-src="${slide.url}" alt="${slide.alt || 'Slide image'}">`).join('')}
                </div>`
              : `<img data-src="${post.media_url || post.thumbnail_url || ''}" alt="Post image">`
        }
        <div class="post-info">
          <p><strong>Date:</strong> ${post.timestamp_iso ? new Date(post.timestamp_iso).toLocaleString() : 'Unknown'}</p>
          <p><strong>Caption:</strong> ${post.caption_raw || 'No caption'}</p>
          ${post.hashtags?.length ? `<p><strong>Hashtags:</strong> ${post.hashtags.map(h => `#${h}`).join(' ')}</p>` : ''}
          ${post.location_name ? `<p><strong>Location:</strong> ${post.location_name}</p>` : ''}
          ${post.permalink ? `<p><a href="${post.permalink}" target="_blank" rel="noopener">View on Instagram →</a></p>` : ''}
        </div>
      </div>
    `;

    modal.hidden = false;
    if (!modal.hasAttribute('tabindex')) modal.setAttribute('tabindex', '-1');
    modal.focus();

    // load any images placed with data-src in modal
    this.lazyLoadAssets();
  }

  closeModal() {
    const modal = this.$('#viewer-modal');
    if (!modal) return;
    modal.querySelectorAll('video').forEach(v => { try { v.pause(); } catch(e){} });
    modal.hidden = true;
  }

  setupInfiniteScroll() {
    // ensure sentinel exists
    let sentinel = this.$('#load-more');
    const grid = this.$('#results-grid');
    if (!sentinel && grid) {
      sentinel = document.createElement('div');
      sentinel.id = 'load-more';
      sentinel.setAttribute('aria-hidden', 'true');
      grid.after(sentinel);
    }
    if (!sentinel) return;

    if (!this._scrollObserver) {
      this._scrollObserver = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) {
          this.loadMore();
        }
      }, { rootMargin: '800px 0px' });
    }
    this._scrollObserver.observe(sentinel);
  }

  loadMore() {
    const totalPages = Math.ceil(this.filteredPosts.length / this.pageSize);
    if (this.currentPage < totalPages - 1) {
      this.currentPage += 1;
      this.renderResults();
    }
  }

  lazyLoadAssets() {
    if (!this._io) {
      this._io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const src = el.dataset.src;
          if (src) {
            el.src = src;
            delete el.dataset.src;
          }
          this._io.unobserve(el);
        });
      }, { rootMargin: '200px 0px' });
    }
    this.$all('img[data-src], video[data-src]').forEach(el => this._io.observe(el));
  }

  updateResultCount() {
    const count = this.$('#result-count');
    if (count) count.textContent = `${this.filteredPosts.length} posts found`;
  }

  updateYearFilter() {
    const select = this.$('#year-filter');
    if (!select) return;
    const years = [...new Set(this.posts.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);
    select.innerHTML = '<option value="">All Years</option>';
    years.forEach(y => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      select.appendChild(opt);
    });
  }

  updateEventFilterFromData() {
    const select = this.$('#event-filter');
    if (!select) return;
    const events = [...new Set(this.posts.map(p => p.event_type).filter(Boolean))].sort();
    select.innerHTML = '<option value="">All Events</option>';
    events.forEach(ev => {
      const opt = document.createElement('option');
      opt.value = ev;
      opt.textContent = String(ev).replace(/_/g, ' ');
      select.appendChild(opt);
    });
  }

  setupTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') document.body.classList.add('dark');
  }

  updateURL() {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(this.filters)) {
      if (v !== null && v !== '' && v !== undefined) params.set(k, v);
    }
    const qs = params.toString();
    const url = qs ? `?${qs}` : location.pathname;
    history.replaceState(null, '', url);
  }

  loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    params.forEach((value, key) => {
      if (!(key in this.filters)) return;

      if (key === 'year') {
        this.filters.year = value ? parseInt(value, 10) : null;
        const yf = this.$('#year-filter');
        if (yf) yf.value = value;
      } else {
        this.filters[key] = value;

        if (key === 'media_type') {
          const chip = document.querySelector(`.chip[data-filter="media_type"][data-value="${value}"]`);
          if (chip) chip.classList.add('active');
        } else if (key === 'search') {
          const si = this.$('#search-input');
          if (si) si.value = value;
        } else if (key === 'event_type') {
          const ef = this.$('#event-filter');
          if (ef) ef.value = value;
        }
      }
    });

    // now render based on URL
    this.applyFilters();
  }
}

// boot
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BearcatApp();
});
