/* assets/db.js */
// IndexedDB wrapper for posts and ideas storage
class PostDB {
    constructor() {
        this.dbName = 'BearcatIdeasHub';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Posts store
                if (!db.objectStoreNames.contains('posts')) {
                    const postsStore = db.createObjectStore('posts', { keyPath: 'post_id' });
                    postsStore.createIndex('shortcode', 'shortcode', { unique: false });
                    postsStore.createIndex('timestamp', 'timestamp_iso', { unique: false });
                    postsStore.createIndex('year', 'year', { unique: false });
                    postsStore.createIndex('media_type', 'media_type', { unique: false });
                }

                // Ideas store
                if (!db.objectStoreNames.contains('ideas')) {
                    const ideasStore = db.createObjectStore('ideas', { keyPath: 'id' });
                    ideasStore.createIndex('event_type', 'event_type', { unique: false });
                    ideasStore.createIndex('last_used', 'last_used_date', { unique: false });
                }
            };
        });
    }

    async savePost(post) {
        return this.save('posts', post);
    }

    async saveIdea(idea) {
        return this.save('ideas', idea);
    }

    async save(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async bulkSave(storeName, items) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            let count = 0;
            items.forEach(item => {
                const request = store.put(item);
                request.onsuccess = () => {
                    count++;
                    if (count === items.length) {
                        resolve(count);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllPosts() {
        return this.getAll('posts');
    }

    async getAllIdeas() {
        return this.getAll('ideas');
    }

    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async exportToJson() {
        const posts = await this.getAllPosts();
        const ideas = await this.getAllIdeas();
        
        return {
            posts,
            ideas,
            exported: new Date().toISOString()
        };
    }

    async importFromJson(data) {
        if (data.posts) {
            await this.bulkSave('posts', data.posts);
        }
        if (data.ideas) {
            await this.bulkSave('ideas', data.ideas);
        }
    }

    async searchByIndex(storeName, indexName, query) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(query);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}
