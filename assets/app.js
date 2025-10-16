/* assets/app.js */
// Main Application Controller
class BearcatApp {
    constructor() {
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
        this.db = new PostDB();
        this.search = new PostSearch();
        this.importer = new InstagramImporter();
        this.generator = new IdeaGenerator();
        this.init();
    }

    async init() {
        // Initialize database
        await this.db.init();
        
        // Load initial data
        await this.loadData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup theme
        this.setupTheme();
        
        // Initial render
        this.applyFilters();
        
        // Setup infinite scroll
        this.setupInfiniteScroll();
    }

    async loadData() {
        // Try to get from IndexedDB first
        let posts = await this.db.getAllPosts();
        
        if (!posts || posts.length === 0) {
            // Load from JSON file
            try {
                const response = await fetch('data/posts.json');
                const data = await response.json();
                posts = data.posts || [];
                
                // Save to IndexedDB
                for (const post of posts) {
                    await this.db.savePost(post);
                }
            } catch (error) {
                console.error('Error loading posts:', error);
                posts = [];
            }
        }
        
        this.posts = posts;
        this.search.buildIndex(posts);
        this.updateYearFilter();
        this.updateEventFilter();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('search-input');
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.filters.search = e.target.value;
                this.applyFilters();
            }, 250);
        });

        // Filter chips
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const filter = chip.dataset.filter;
                const value = chip.dataset.value;
                
                if (chip.classList.contains('active')) {
                    chip.classList.remove('active');
                    this.filters[filter] = null;
                } else {
                    // Remove active from siblings
                    document.querySelectorAll(`.chip[data-filter="${filter}"]`)
                        .forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    this.filters[filter] = value;
                }
                
                this.applyFilters();
                this.updateURL();
            });
        });

        // Year filter
        document.getElementById('year-filter').addEventListener('change', (e) => {
            this.filters.year = e.target.value ? parseInt(e.target.value) : null;
            this.applyFilters();
            this.updateURL();
        });

        // Event filter
        document.getElementById('event-filter').addEventListener('change', (e) => {
            this.filters.event_type = e.target.value || null;
            this.applyFilters();
            this.updateURL();
        });

        // Modal close
        document.querySelectorAll('[data-close]').forEach(el => {
            el.addEventListener('click', () => this.closeModal());
        });

        // Escape key for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            document.body.classList.toggle('dark');
            localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        });

        // Import handlers
        this.setupImportHandlers();
        
        // Generator handlers
        this.setupGeneratorHandlers();
        
        // Load filters from URL
        this.loadFiltersFromURL();
    }

    setupImportHandlers() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const exportBtn = document.getElementById('export-btn');

        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            await this.handleImport(files);
        });

        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            await this.handleImport(files);
        });

        exportBtn.addEventListener('click', async () => {
            await this.exportData();
        });
    }

    async handleImport(files) {
        const status = document.getElementById('import-status');
        const exportBtn = document.getElementById('export-btn');
        
        status.textContent = 'Importing...';
        
        try {
            const newPosts = await this.importer.importFiles(files);
            
            // Merge with existing posts
            for (const post of newPosts) {
                const exists = this.posts.find(p => 
                    p.shortcode === post.shortcode || p.permalink === post.permalink
                );
                
                if (!exists) {
                    this.posts.push(post);
                    await this.db.savePost(post);
                }
            }
            
            // Rebuild search index
            this.search.buildIndex(this.posts);
            
            // Update UI
            this.applyFilters();
            this.updateYearFilter();
            
            status.textContent = `Imported ${newPosts.length} posts successfully!`;
            exportBtn.hidden = false;
        } catch (error) {
            console.error('Import error:', error);
            status.textContent = 'Import failed. Please check the file format.';
        }
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
        const generateBtn = document.getElementById('generate-btn');
        const eventSelect = document.getElementById('gen-event');
        
        // Populate event types
        const events = [
            'Football', 'Basketball', 'Volleyball', 'Soccer', 
            'Baseball', 'Pep_Rally', 'Community_Event', 'Campus_Activation', 'Other'
        ];
        
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event;
            option.textContent = event.replace(/_/g, ' ');
            eventSelect.appendChild(option);
        });
        
        generateBtn.addEventListener('click', () => {
            const event = document.getElementById('gen-event').value;
            const location = document.getElementById('gen-location').value;
            const theme = document.getElementById('gen-theme').value;
            
            if (!event || !location) {
                alert('Please select event type and location');
                return;
            }
            
            const ideas = this.generator.generate(event, location, theme);
            this.renderIdeas(ideas);
        });
    }

    renderIdeas(ideas) {
        const output = document.getElementById('ideas-output');
        
        output.innerHTML = ideas.map((idea, i) => `
            <div class="idea-card">
                <h3>${idea.idea_title}</h3>
                <span class="idea-status ${idea.status.toLowerCase()}">${idea.status}</span>
                <p><strong>Summary:</strong> ${idea.summary}</p>
                <p><strong>Props:</strong> ${idea.props_list}</p>
                <p><strong>Costume:</strong> ${idea.costume_notes}</p>
                <p><strong>Crowd:</strong> ${idea.crowd_callouts}</p>
                ${idea.originality_notes ? `<p><small>${idea.originality_notes}</small></p>` : ''}
            </div>
        `).join('');
    }

    applyFilters() {
        let filtered = [...this.posts];
        
        // Apply search
        if (this.filters.search) {
            const searchResults = this.search.search(this.filters.search);
            const ids = new Set(searchResults.map(r => r.item.post_id));
            filtered = filtered.filter(p => ids.has(p.post_id));
        }
        
        // Apply other filters
        if (this.filters.media_type) {
            filtered = filtered.filter(p => p.media_type === this.filters.media_type);
        }
        
        if (this.filters.year) {
            filtered = filtered.filter(p => p.year === this.filters.year);
        }
        
        if (this.filters.event_type) {
            filtered = filtered.filter(p => p.event_type === this.filters.event_type);
        }
        
        this.filteredPosts = filtered;
        this.currentPage = 0;
        this.renderResults();
        this.updateResultCount();
    }

    renderResults() {
        const grid = document.getElementById('results-grid');
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
        
        // Lazy load images
        this.lazyLoadImages();
    }

    createPostCard(post) {
        const card = document.createElement('article');
        card.className = 'post-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View post from ${post.timestamp_iso}`);
        
        const mediaUrl = post.media_url || post.thumbnail_url || '';
        const mediaType = post.media_type || 'Image';
        
        card.innerHTML = `
            <div class="media">
                ${mediaType === 'Video' || mediaType === 'Reel' ? 
                    `<video src="${mediaUrl}" loading="lazy" muted></video>` :
                    `<img src="${mediaUrl}" alt="${post.caption_clean?.substring(0, 100) || 'Post image'}" loading="lazy">`
                }
                <span class="media-type">${mediaType}</span>
            </div>
            <div class="content">
                <p class="caption">${post.caption_clean || 'No caption'}</p>
                <div class="meta">
                    <span>${new Date(post.timestamp_iso).toLocaleDateString()}</span>
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
        const modal = document.getElementById('viewer-modal');
        const body = document.getElementById('modal-body');
        
        body.innerHTML = `
            <div class="post-detail">
                ${post.media_type === 'Video' || post.media_type === 'Reel' ?
                    `<video src="${post.media_url}" controls autoplay></video>` :
                    post.media_type === 'Carousel' && post.slides ?
                        `<div class="carousel">
                            ${post.slides.map(slide => 
                                `<img src="${slide.url}" alt="${slide.alt || 'Slide image'}">`
                            ).join('')}
                        </div>` :
                    `<img src="${post.media_url || post.thumbnail_url}" alt="Post image">`
                }
                <div class="post-info">
                    <p><strong>Date:</strong> ${new Date(post.timestamp_iso).toLocaleString()}</p>
                    <p><strong>Caption:</strong> ${post.caption_raw || 'No caption'}</p>
                    ${post.hashtags?.length ? `<p><strong>Hashtags:</strong> ${post.hashtags.map(h => `#${h}`).join(' ')}</p>` : ''}
                    ${post.location_name ? `<p><strong>Location:</strong> ${post.location_name}</p>` : ''}
                    <p><a href="${post.permalink}" target="_blank" rel="noopener">View on Instagram →</a></p>
                </div>
            </div>
        `;
        
        modal.hidden = false;
        modal.focus();
    }

    closeModal() {
        const modal = document.getElementById('viewer-modal');
        modal.hidden = true;
    }

    setupInfiniteScroll() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadMore();
                }
            });
        });
        
        observer.observe(document.getElementById('load-more'));
    }

    loadMore() {
        const totalPages = Math.ceil(this.filteredPosts.length / this.pageSize);
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.renderResults();
        }
    }

    lazyLoadImages() {
        const images = document.querySelectorAll('img[loading="lazy"], video[loading="lazy"]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    if (el.dataset.src) {
                        el.src = el.dataset.src;
                        delete el.dataset.src;
                    }
                    imageObserver.unobserve(el);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }

    updateResultCount() {
        const count = document.getElementById('result-count');
        count.textContent = `${this.filteredPosts.length} posts found`;
    }

    updateYearFilter() {
        const select = document.getElementById('year-filter');
        const years = [...new Set(this.posts.map(p => p.year))].sort((a, b) => b - a);
        
        select.innerHTML = '<option value="">All Years</option>';
        years.forEach(year => {
            if (year) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                select.appendChild(option);
            }
        });
    }

    updateEventFilter() {
        // This would be populated from actual data
        const select = document.getElementById('event-filter');
        const events = ['Football', 'Basketball', 'Community_Event'];
        
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event;
            option.textContent = event.replace(/_/g, ' ');
            select.appendChild(option);
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
        }
    }

    updateURL() {
        const params = new URLSearchParams();
        Object.keys(this.filters).forEach(key => {
            if (this.filters[key]) {
                params.set(key, this.filters[key]);
            }
        });
        history.pushState(null, '', '?' + params.toString());
    }

    loadFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        params.forEach((value, key) => {
            if (key in this.filters) {
                this.filters[key] = value;
                
                // Update UI
                if (key === 'media_type') {
                    const chip = document.querySelector(`.chip[data-value="${value}"]`);
                    if (chip) chip.classList.add('active');
                } else if (key === 'year') {
                    document.getElementById('year-filter').value = value;
                } else if (key === 'search') {
                    document.getElementById('search-input').value = value;
                }
            }
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BearcatApp();
});
