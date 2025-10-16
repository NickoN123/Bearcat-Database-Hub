/* assets/importer.js */
// Instagram HTML import and parsing
class InstagramImporter {
    constructor() {
        this.parser = new DOMParser();
    }

    async importFiles(files) {
        const htmlFiles = files.filter(f => f.name.endsWith('.html'));
        const posts = [];

        // Process files concurrently with a pool of 3
        const pool = [];
        for (const file of htmlFiles) {
            if (pool.length >= 3) {
                await Promise.race(pool);
                pool.splice(pool.findIndex(p => p.resolved), 1);
            }

            const promise = this.processFile(file);
            promise.resolved = false;
            promise.then(() => { promise.resolved = true; });
            pool.push(promise);
            
            const result = await promise;
            if (result) {
                posts.push(...result);
            }
        }

        // Wait for remaining
        await Promise.all(pool);

        // Deduplicate by shortcode
        const unique = new Map();
        posts.forEach(post => {
            if (!unique.has(post.shortcode)) {
                unique.set(post.shortcode, post);
            }
        });

        return Array.from(unique.values());
    }

    async processFile(file) {
        const content = await this.readFile(file);
        const doc = this.parser.parseFromString(content, 'text/html');

        // Try multiple parsing strategies
        let posts = [];

        // Strategy 1: Look for JSON-LD scripts
        const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
        for (const script of jsonLdScripts) {
            try {
                const data = JSON.parse(script.textContent);
                if (data['@type'] === 'SocialMediaPosting' || data['@type'] === 'ImageObject') {
                    posts.push(this.parseJsonLd(data));
                }
            } catch (e) {
                console.warn('Failed to parse JSON-LD:', e);
            }
        }

        // Strategy 2: Look for window._sharedData
        const scripts = doc.querySelectorAll('script');
        for (const script of scripts) {
            const match = script.textContent.match(/window\._sharedData\s*=\s*({.+});/);
            if (match) {
                try {
                    const data = JSON.parse(match[1]);
                    if (data.entry_data?.PostPage) {
                        const pageData = data.entry_data.PostPage[0];
                        posts.push(...this.parseSharedData(pageData));
                    }
                } catch (e) {
                    console.warn('Failed to parse _sharedData:', e);
                }
            }
        }

        // Strategy 3: Parse HTML structure directly
        if (posts.length === 0) {
            posts = this.parseHtmlStructure(doc);
        }

        return posts;
    }

    parseJsonLd(data) {
        const post = {
            post_id: this.generateId(),
            shortcode: data.identifier || this.extractShortcode(data.url),
            permalink: data.url || '',
            timestamp_iso: data.uploadDate || new Date().toISOString(),
            caption_raw: data.caption || data.description || '',
            caption_clean: this.cleanCaption(data.caption || data.description || ''),
            media_type: this.detectMediaType(data),
            media_url: data.contentUrl || data.image?.url || '',
            thumbnail_url: data.thumbnailUrl || '',
            hashtags: this.extractHashtags(data.caption || ''),
            mentions: this.extractMentions(data.caption || ''),
            likes: data.interactionStatistic?.find(s => s.interactionType === 'LikeAction')?.userInteractionCount || 0,
            comments: data.commentCount || 0
        };

        return this.enrichPost(post);
    }

    parseSharedData(pageData) {
        const posts = [];
        const media = pageData.graphql?.shortcode_media || pageData.media;

        if (media) {
            const post = {
                post_id: media.id || this.generateId(),
                shortcode: media.shortcode || '',
                permalink: `https://instagram.com/p/${media.shortcode}/`,
                timestamp_iso: new Date(media.taken_at_timestamp * 1000).toISOString(),
                caption_raw: media.edge_media_to_caption?.edges[0]?.node?.text || '',
                caption_clean: this.cleanCaption(media.edge_media_to_caption?.edges[0]?.node?.text || ''),
                media_type: media.is_video ? 'Video' : 'Image',
                media_url: media.display_url || media.video_url || '',
                thumbnail_url: media.thumbnail_src || '',
                hashtags: this.extractHashtags(media.edge_media_to_caption?.edges[0]?.node?.text || ''),
                mentions: this.extractMentions(media.edge_media_to_caption?.edges[0]?.node?.text || ''),
                likes: media.edge_media_preview_like?.count || 0,
                comments: media.edge_media_to_comment?.count || 0,
                location_name: media.location?.name || ''
            };

            // Handle carousel
            if (media.edge_sidecar_to_children) {
                post.media_type = 'Carousel';
                post.slides = media.edge_sidecar_to_children.edges.map(edge => ({
                    url: edge.node.display_url,
                    is_video: edge.node.is_video,
                    video_url: edge.node.video_url
                }));
            }

            posts.push(this.enrichPost(post));
        }

        return posts;
    }

    parseHtmlStructure(doc) {
        const posts = [];
        
        // Look for common Instagram HTML patterns
        const articles = doc.querySelectorAll('article');
        
        for (const article of articles) {
            const post = {
                post_id: this.generateId(),
                shortcode: '',
                permalink: '',
                timestamp_iso: new Date().toISOString(),
                caption_raw: '',
                caption_clean: '',
                media_type: 'Image',
                hashtags: [],
                mentions: []
            };

            // Extract image
            const img = article.querySelector('img');
            if (img) {
                post.media_url = img.src;
                post.caption_raw = img.alt || '';
                post.caption_clean = this.cleanCaption(img.alt || '');
            }

            // Extract video
            const video = article.querySelector('video');
            if (video) {
                post.media_type = 'Video';
                post.media_url = video.src;
            }

            // Extract text content
            const textElements = article.querySelectorAll('span, div');
            for (const el of textElements) {
                const text = el.textContent.trim();
                if (text && text.length > 10 && !text.includes('Follow')) {
                    post.caption_raw = text;
                    post.caption_clean = this.cleanCaption(text);
                    post.hashtags = this.extractHashtags(text);
                    post.mentions = this.extractMentions(text);
                    break;
                }
            }

            if (post.media_url) {
                posts.push(this.enrichPost(post));
            }
        }

        return posts;
    }

    enrichPost(post) {
        // Add derived fields
        const date = new Date(post.timestamp_iso);
        post.year = date.getFullYear();
        post.month = date.getMonth() + 1;
        post.weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        
        // Derive tags from caption
        post.derived_tags = this.deriveTags(post.caption_clean);
        
        // Ensure unique ID
        if (!post.post_id) {
            post.post_id = this.generateId();
        }

        return post;
    }

    extractHashtags(text) {
        const matches = text.match(/#\w+/g) || [];
        return matches.map(h => h.substring(1).toLowerCase());
    }

    extractMentions(text) {
        const matches = text.match(/@\w+/g) || [];
        return matches.map(m => m.substring(1));
    }

    extractShortcode(url) {
        const match = url.match(/\/p\/([^\/]+)/);
        return match ? match[1] : '';
    }

    cleanCaption(text) {
        return text
            .replace(/#\w+/g, '')
            .replace(/@\w+/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    deriveTags(text) {
        const tags = [];
        const keywords = {
            'game': ['game', 'match', 'score', 'win', 'victory'],
            'spirit': ['spirit', 'cheer', 'pride', 'rally'],
            'community': ['community', 'campus', 'student', 'together'],
            'event': ['event', 'celebration', 'festival', 'party']
        };

        const lowerText = text.toLowerCase();
        for (const [tag, words] of Object.entries(keywords)) {
            if (words.some(w => lowerText.includes(w))) {
                tags.push(tag);
            }
        }

        return tags;
    }

    detectMediaType(data) {
        if (data['@type'] === 'VideoObject') return 'Video';
        if (data.video) return 'Video';
        if (data.contentUrl?.includes('.mp4')) return 'Video';
        return 'Image';
    }

    generateId() {
        return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}
