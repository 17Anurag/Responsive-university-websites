// search.js - Advanced search and filter engine

class SearchEngine {
    constructor(data, options = {}) {
        this.data = data;
        this.options = {
            fields: options.fields || [],
            weights: options.weights || {},
            minScore: options.minScore || 0.1,
            maxResults: options.maxResults || 50
        };
        this.index = this.buildIndex();
    }

    buildIndex() {
        const index = new Map();
        this.data.forEach((item, i) => {
            this.options.fields.forEach(field => {
                const value = this.getNestedValue(item, field);
                if (!value) return;
                const tokens = this.tokenize(String(value));
                tokens.forEach(token => {
                    if (!index.has(token)) index.set(token, []);
                    index.get(token).push({ index: i, field, value: String(value) });
                });
            });
        });
        return index;
    }

    getNestedValue(obj, path) {
        return path.split('.').reduce((acc, key) => acc && acc[key], obj);
    }

    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1);
    }

    search(query, filters = {}) {
        if (!query && Object.keys(filters).length === 0) return this.data;

        let results = this.data;

        // Apply filters first
        if (Object.keys(filters).length > 0) {
            results = this.applyFilters(results, filters);
        }

        // Apply text search
        if (query && query.trim()) {
            results = this.textSearch(query, results);
        }

        return results;
    }

    textSearch(query, data) {
        const tokens = this.tokenize(query);
        const scores = new Map();

        tokens.forEach(token => {
            // Exact match
            if (this.index.has(token)) {
                this.index.get(token).forEach(({ index, field }) => {
                    const weight = this.options.weights[field] || 1;
                    scores.set(index, (scores.get(index) || 0) + weight);
                });
            }

            // Partial match
            this.index.forEach((entries, indexedToken) => {
                if (indexedToken.includes(token) && indexedToken !== token) {
                    entries.forEach(({ index, field }) => {
                        const weight = (this.options.weights[field] || 1) * 0.5;
                        scores.set(index, (scores.get(index) || 0) + weight);
                    });
                }
            });
        });

        return Array.from(scores.entries())
            .filter(([, score]) => score >= this.options.minScore)
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.options.maxResults)
            .map(([index]) => data[index])
            .filter(Boolean);
    }

    applyFilters(data, filters) {
        return data.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (!value || value === 'all') return true;
                const itemValue = this.getNestedValue(item, key);
                if (Array.isArray(itemValue)) return itemValue.includes(value);
                if (typeof itemValue === 'string') return itemValue.toLowerCase() === value.toLowerCase();
                return itemValue === value;
            });
        });
    }

    suggest(query, limit = 5) {
        if (!query || query.length < 2) return [];
        const tokens = this.tokenize(query);
        const suggestions = new Set();

        tokens.forEach(token => {
            this.index.forEach((_, indexedToken) => {
                if (indexedToken.startsWith(token) && indexedToken !== token) {
                    suggestions.add(indexedToken);
                }
            });
        });

        return Array.from(suggestions).slice(0, limit);
    }

    reindex(newData) {
        this.data = newData;
        this.index = this.buildIndex();
    }
}

// Autocomplete widget
class AutocompleteWidget {
    constructor(inputId, engine, onSelect) {
        this.input = document.getElementById(inputId);
        this.engine = engine;
        this.onSelect = onSelect;
        this.dropdown = null;
        this.selectedIndex = -1;
        this.debounceTimer = null;

        if (this.input) this.init();
    }

    init() {
        this.dropdown = document.createElement('ul');
        this.dropdown.className = 'autocomplete-dropdown';
        this.dropdown.style.cssText = `
            position: absolute; background: white; border: 1px solid #ddd;
            border-radius: 4px; list-style: none; margin: 0; padding: 0;
            max-height: 200px; overflow-y: auto; z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: none;
            min-width: 200px;
        `;
        this.input.parentNode.style.position = 'relative';
        this.input.parentNode.appendChild(this.dropdown);

        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        document.addEventListener('click', (e) => {
            if (!this.input.contains(e.target)) this.hide();
        });
    }

    handleInput() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const query = this.input.value;
            if (query.length < 2) { this.hide(); return; }
            const suggestions = this.engine.suggest(query);
            this.show(suggestions);
        }, 200);
    }

    handleKeydown(e) {
        const items = this.dropdown.querySelectorAll('li');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
            this.updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
            this.updateSelection(items);
        } else if (e.key === 'Enter' && this.selectedIndex >= 0) {
            e.preventDefault();
            items[this.selectedIndex]?.click();
        } else if (e.key === 'Escape') {
            this.hide();
        }
    }

    updateSelection(items) {
        items.forEach((item, i) => {
            item.style.background = i === this.selectedIndex ? '#f0f4ff' : '';
        });
    }

    show(suggestions) {
        if (suggestions.length === 0) { this.hide(); return; }
        this.selectedIndex = -1;
        this.dropdown.innerHTML = suggestions.map(s =>
            `<li style="padding:8px 12px;cursor:pointer;font-size:14px;" 
                 onmouseover="this.style.background='#f0f4ff'" 
                 onmouseout="this.style.background=''">${s}</li>`
        ).join('');
        this.dropdown.querySelectorAll('li').forEach((li, i) => {
            li.addEventListener('click', () => {
                this.input.value = suggestions[i];
                this.hide();
                if (this.onSelect) this.onSelect(suggestions[i]);
            });
        });
        this.dropdown.style.display = 'block';
    }

    hide() {
        if (this.dropdown) this.dropdown.style.display = 'none';
        this.selectedIndex = -1;
    }
}

// Initialize search engines
let universitySearch, courseSearch;

document.addEventListener('DOMContentLoaded', () => {
    const universities = UniversityData ? UniversityData.getAll() : [];
    const courses = CourseData ? CourseData.getAll() : [];

    universitySearch = new SearchEngine(universities, {
        fields: ['name', 'location', 'departments'],
        weights: { name: 3, location: 1, departments: 2 }
    });

    courseSearch = new SearchEngine(courses, {
        fields: ['name', 'department', 'description', 'level'],
        weights: { name: 3, department: 2, description: 1, level: 1 }
    });

    // Attach autocomplete to search inputs
    if (typeof AutocompleteWidget !== 'undefined') {
        new AutocompleteWidget('searchInput', universitySearch, (val) => {
            const input = document.getElementById('searchInput');
            if (input) { input.value = val; input.dispatchEvent(new Event('input')); }
        });
    }
});
