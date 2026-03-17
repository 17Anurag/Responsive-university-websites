// api-client.js - HTTP client with interceptors, caching, and request management

class ApiClient {
    constructor(baseUrl = '', options = {}) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = { 'Content-Type': 'application/json', ...options.headers };
        this.timeout = options.timeout || 15000;
        this.retries = options.retries || 3;
        this.cache = new RequestCache(options.cacheTTL || 60000);
        this.interceptors = { request: [], response: [], error: [] };
        this.pendingRequests = new Map();
    }

    // Interceptor registration
    addRequestInterceptor(fn) { this.interceptors.request.push(fn); return this; }
    addResponseInterceptor(fn) { this.interceptors.response.push(fn); return this; }
    addErrorInterceptor(fn) { this.interceptors.error.push(fn); return this; }

    async request(method, path, options = {}) {
        const url = this.buildUrl(path, options.params);
        const cacheKey = `${method}:${url}`;

        // Return cached GET responses
        if (method === 'GET' && !options.noCache) {
            const cached = this.cache.get(cacheKey);
            if (cached) return cached;
        }

        // Deduplicate in-flight GET requests
        if (method === 'GET' && this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        let config = {
            method,
            headers: { ...this.defaultHeaders, ...options.headers },
            body: options.body ? JSON.stringify(options.body) : undefined
        };

        // Run request interceptors
        for (const interceptor of this.interceptors.request) {
            config = await interceptor(config) || config;
        }

        const promise = this.executeWithRetry(url, config, this.retries);

        if (method === 'GET') {
            this.pendingRequests.set(cacheKey, promise);
            promise.finally(() => this.pendingRequests.delete(cacheKey));
        }

        try {
            let response = await promise;

            // Run response interceptors
            for (const interceptor of this.interceptors.response) {
                response = await interceptor(response) || response;
            }

            if (method === 'GET' && !options.noCache) {
                this.cache.set(cacheKey, response);
            }

            return response;
        } catch (error) {
            for (const interceptor of this.interceptors.error) {
                await interceptor(error);
            }
            throw error;
        }
    }

    async executeWithRetry(url, config, retriesLeft) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, { ...config, signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status >= 500 && retriesLeft > 0) {
                    await this.delay(this.getBackoffDelay(this.retries - retriesLeft));
                    return this.executeWithRetry(url, config, retriesLeft - 1);
                }
                const errorBody = await response.text();
                throw new ApiError(response.status, response.statusText, errorBody);
            }

            const contentType = response.headers.get('content-type');
            return contentType && contentType.includes('application/json')
                ? response.json()
                : response.text();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') throw new ApiError(408, 'Request Timeout', 'The request timed out.');
            if (retriesLeft > 0 && !(error instanceof ApiError && error.status < 500)) {
                await this.delay(this.getBackoffDelay(this.retries - retriesLeft));
                return this.executeWithRetry(url, config, retriesLeft - 1);
            }
            throw error;
        }
    }

    buildUrl(path, params) {
        const url = new URL(path.startsWith('http') ? path : this.baseUrl + path, window.location.origin);
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                if (v !== undefined && v !== null) url.searchParams.set(k, v);
            });
        }
        return url.toString();
    }

    getBackoffDelay(attempt) {
        return Math.min(1000 * Math.pow(2, attempt), 10000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Convenience methods
    get(path, options = {}) { return this.request('GET', path, options); }
    post(path, body, options = {}) { return this.request('POST', path, { ...options, body }); }
    put(path, body, options = {}) { return this.request('PUT', path, { ...options, body }); }
    patch(path, body, options = {}) { return this.request('PATCH', path, { ...options, body }); }
    delete(path, options = {}) { return this.request('DELETE', path, options); }

    clearCache() { this.cache.clear(); }
}

class ApiError extends Error {
    constructor(status, statusText, body) {
        super(`HTTP ${status}: ${statusText}`);
        this.name = 'ApiError';
        this.status = status;
        this.statusText = statusText;
        this.body = body;
    }
}

class RequestCache {
    constructor(ttl = 60000) {
        this.ttl = ttl;
        this.store = new Map();
    }

    set(key, value) {
        this.store.set(key, { value, expires: Date.now() + this.ttl });
    }

    get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expires) { this.store.delete(key); return null; }
        return entry.value;
    }

    has(key) { return this.get(key) !== null; }
    delete(key) { this.store.delete(key); }
    clear() { this.store.clear(); }

    cleanup() {
        const now = Date.now();
        this.store.forEach((entry, key) => {
            if (now > entry.expires) this.store.delete(key);
        });
    }
}

// Singleton API client instance
const apiClient = new ApiClient('', {
    timeout: 10000,
    retries: 3,
    cacheTTL: 30000
});

// Add default interceptors
apiClient.addRequestInterceptor((config) => {
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['X-Timestamp'] = new Date().toISOString();
    return config;
});

apiClient.addErrorInterceptor((error) => {
    console.error('[ApiClient Error]', error.message);
    if (typeof Analytics !== 'undefined') {
        Analytics.track('api_error', { message: error.message, status: error.status });
    }
});
