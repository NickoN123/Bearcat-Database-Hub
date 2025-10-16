/* assets/search.js */
// Fuse.js search configuration and helpers
class PostSearch {
    constructor() {
        this.fuse = null;
        this.posts = [];
    }

    buildIndex(posts) {
        this.posts = posts;
        
        // Configure Fuse.js
        const options = {
            keys: [
                { name: 'caption_clean', weight: 0.3 },
                { name: 'hashtags', weight: 0.2 },
                { name: 'derived_tags', weight: 0.2 },
                { name: 'idea_title', weight: 0.5 },
                { name: 'location_name', weight: 0.1 }
            ],
            threshold: 0.3,
            includeScore: true,
            ignoreLocation: true,
            minMatchCharLength: 2
        };

        this.fuse = new Fuse(posts, options);
    }

    search(query, filters = {}) {
        if (!query || !this.fuse) {
            return this.posts;
        }

        // Perform fuzzy search
        const results = this.fuse.search(query);
        
        // Apply additional filters if needed
        let filtered = results;
        
        if (filters.media_type) {
            filtered = filtered.filter(r => r.item.media_type === filters.media_type);
        }
        
        if (filters.year) {
            filtered = filtered.filter(r => r.item.year === parseInt(filters.year));
        }
        
        if (filters.event_type) {
            filtered = filtered.filter(r => r.item.event_type === filters.event_type);
        }

        return filtered;
    }

    searchByTags(tags) {
        if (!tags || tags.length === 0) {
            return this.posts;
        }

        return this.posts.filter(post => {
            const postTags = [...(post.hashtags || []), ...(post.derived_tags || [])];
            return tags.some(tag => postTags.includes(tag.toLowerCase()));
        });
    }

    searchByDateRange(startDate, endDate) {
        return this.posts.filter(post => {
            const postDate = new Date(post.timestamp_iso);
            return postDate >= startDate && postDate <= endDate;
        });
    }

    getRelatedPosts(post, limit = 5) {
        if (!post || !this.fuse) {
            return [];
        }

        // Search using the post's caption and tags
        const searchTerms = [
            post.caption_clean,
            ...(post.hashtags || []),
            ...(post.derived_tags || [])
        ].filter(Boolean).join(' ');

        const results = this.fuse.search(searchTerms);
        
        // Filter out the original post and limit results
        return results
            .filter(r => r.item.post_id !== post.post_id)
            .slice(0, limit)
            .map(r => r.item);
    }
}
