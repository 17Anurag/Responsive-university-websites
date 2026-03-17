// utils.js - Utility functions and helpers

const StatsCalculator = {
    compute(universities, courses) {
        return {
            totalUniversities: universities.length,
            totalCourses: courses.length,
            avgPlacementRate: Math.round(
                universities.reduce((sum, u) => sum + u.placementRate, 0) / universities.length
            ),
            totalStudents: universities.reduce((sum, u) => sum + u.students, 0),
            totalFaculty: universities.reduce((sum, u) => sum + u.faculty, 0),
            departmentBreakdown: this.getDepartmentBreakdown(courses),
            levelBreakdown: this.getLevelBreakdown(courses)
        };
    },

    getDepartmentBreakdown(courses) {
        return courses.reduce((acc, course) => {
            acc[course.department] = (acc[course.department] || 0) + 1;
            return acc;
        }, {});
    },

    getLevelBreakdown(courses) {
        return courses.reduce((acc, course) => {
            acc[course.level] = (acc[course.level] || 0) + 1;
            return acc;
        }, {});
    }
};

const ModalManager = {
    open(modalId, data) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        this.populate(modal, data);
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.close(modalId);
        });
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.style.display = 'none';
        document.body.style.overflow = '';
    },

    populate(modal, data) {
        const title = modal.querySelector('.modal-title');
        const body = modal.querySelector('.modal-body');
        if (title) title.textContent = data.name || '';
        if (body) body.innerHTML = this.buildContent(data);
    },

    buildContent(data) {
        if (!data.departments) return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        return `
            <div class="modal-university">
                <p class="description">${data.description}</p>
                <div class="info-grid">
                    <div><strong>Location:</strong> ${data.location}</div>
                    <div><strong>Established:</strong> ${data.established}</div>
                    <div><strong>Students:</strong> ${data.students.toLocaleString()}</div>
                    <div><strong>Placement Rate:</strong> ${data.placementRate}%</div>
                    <div><strong>Faculty:</strong> ${data.faculty}</div>
                    <div><strong>Ranking:</strong> ${data.ranking}</div>
                </div>
                <div class="highlights">
                    <h4>Highlights</h4>
                    <ul>${data.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
                </div>
                <div class="accreditation">
                    <h4>Accreditation</h4>
                    <div class="tags">${data.accreditation.map(a => `<span class="tag">${a}</span>`).join('')}</div>
                </div>
                <div class="contact-info">
                    <h4>Contact</h4>
                    <p>Phone: ${data.contact.phone}</p>
                    <p>Email: ${data.contact.email}</p>
                    <p>Website: ${data.contact.website}</p>
                </div>
            </div>`;
    }
};

const CompareManager = {
    list: [],
    maxItems: 3,

    add(id, universities) {
        if (this.list.includes(id)) {
            this.remove(id);
            return;
        }
        if (this.list.length >= this.maxItems) {
            NotificationManager.show(`You can compare up to ${this.maxItems} universities at a time.`, 'warning');
            return;
        }
        this.list.push(id);
        this.updateUI(universities);
        NotificationManager.show('Added to comparison.', 'info');
    },

    remove(id) {
        this.list = this.list.filter(i => i !== id);
        this.updateUI(UniversityData.getAll());
    },

    clear() {
        this.list = [];
        this.updateUI(UniversityData.getAll());
    },

    updateUI(universities) {
        const bar = document.getElementById('compareBar');
        if (!bar) return;
        if (this.list.length === 0) {
            bar.style.display = 'none';
            return;
        }
        bar.style.display = 'flex';
        const names = this.list.map(id => {
            const u = universities.find(u => u.id === id);
            return u ? `<span class="compare-item">${u.name} <button onclick="CompareManager.remove(${id})">×</button></span>` : '';
        }).join('');
        bar.innerHTML = `${names}<button onclick="CompareManager.showComparison()" class="btn-compare">Compare Now</button><button onclick="CompareManager.clear()" class="btn-clear">Clear</button>`;
    },

    showComparison() {
        const universities = this.list.map(id => UniversityData.getById(id)).filter(Boolean);
        if (universities.length < 2) {
            NotificationManager.show('Select at least 2 universities to compare.', 'warning');
            return;
        }
        const table = this.buildComparisonTable(universities);
        ModalManager.open('compareModal', { name: 'University Comparison', _table: table });
    },

    buildComparisonTable(universities) {
        const fields = [
            { key: 'location', label: 'Location' },
            { key: 'established', label: 'Established' },
            { key: 'students', label: 'Students', format: v => v.toLocaleString() },
            { key: 'faculty', label: 'Faculty' },
            { key: 'placementRate', label: 'Placement Rate', format: v => `${v}%` },
            { key: 'ranking', label: 'Ranking' }
        ];
        const headers = universities.map(u => `<th>${u.name}</th>`).join('');
        const rows = fields.map(f => {
            const cells = universities.map(u => {
                const val = f.format ? f.format(u[f.key]) : u[f.key];
                return `<td>${val}</td>`;
            }).join('');
            return `<tr><td><strong>${f.label}</strong></td>${cells}</tr>`;
        }).join('');
        return `<table class="compare-table"><thead><tr><th>Feature</th>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    }
};

const NotificationManager = {
    queue: [],
    isShowing: false,

    show(message, type = 'info', duration = 3000) {
        this.queue.push({ message, type, duration });
        if (!this.isShowing) this.processQueue();
    },

    processQueue() {
        if (this.queue.length === 0) {
            this.isShowing = false;
            return;
        }
        this.isShowing = true;
        const { message, type, duration } = this.queue.shift();
        this.render(message, type);
        setTimeout(() => {
            this.dismiss();
            setTimeout(() => this.processQueue(), 300);
        }, duration);
    },

    render(message, type) {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';
            document.body.appendChild(container);
        }
        const el = document.createElement('div');
        el.className = `notification notification-${type}`;
        el.style.cssText = `
            background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white; padding: 12px 20px; border-radius: 6px; margin-bottom: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2); animation: slideIn 0.3s ease;
            max-width: 320px; font-size: 14px;
        `;
        el.textContent = message;
        container.appendChild(el);
        this._current = el;
    },

    dismiss() {
        if (this._current) {
            this._current.style.opacity = '0';
            this._current.style.transition = 'opacity 0.3s';
            setTimeout(() => this._current && this._current.remove(), 300);
        }
    }
};

const FormValidator = {
    rules: {
        required: (val) => val && val.trim() !== '' ? null : 'This field is required.',
        email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : 'Enter a valid email address.',
        phone: (val) => /^\d{10}$/.test(val) ? null : 'Enter a valid 10-digit phone number.',
        minLength: (min) => (val) => val && val.length >= min ? null : `Minimum ${min} characters required.`,
        maxLength: (max) => (val) => val && val.length <= max ? null : `Maximum ${max} characters allowed.`
    },

    validate(formData, schema) {
        const errors = {};
        for (const [field, fieldRules] of Object.entries(schema)) {
            for (const rule of fieldRules) {
                const error = typeof rule === 'function'
                    ? rule(formData[field])
                    : this.rules[rule]?.(formData[field]);
                if (error) {
                    errors[field] = error;
                    break;
                }
            }
        }
        return { valid: Object.keys(errors).length === 0, errors };
    },

    showErrors(errors) {
        // Clear previous errors
        document.querySelectorAll('.field-error').forEach(el => el.remove());
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

        for (const [field, message] of Object.entries(errors)) {
            const input = document.getElementById(field) || document.querySelector(`[name="${field}"]`);
            if (!input) continue;
            input.classList.add('input-error');
            const errorEl = document.createElement('span');
            errorEl.className = 'field-error';
            errorEl.style.cssText = 'color:#f44336;font-size:12px;display:block;margin-top:4px;';
            errorEl.textContent = message;
            input.parentNode.insertBefore(errorEl, input.nextSibling);
        }
    }
};

const StorageManager = {
    prefix: 'uniapp_',

    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Storage write failed:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('Storage read failed:', e);
            return defaultValue;
        }
    },

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    },

    clear() {
        Object.keys(localStorage)
            .filter(k => k.startsWith(this.prefix))
            .forEach(k => localStorage.removeItem(k));
    }
};

const DateUtils = {
    format(date, pattern = 'DD/MM/YYYY') {
        const d = new Date(date);
        const map = {
            DD: String(d.getDate()).padStart(2, '0'),
            MM: String(d.getMonth() + 1).padStart(2, '0'),
            YYYY: d.getFullYear(),
            HH: String(d.getHours()).padStart(2, '0'),
            mm: String(d.getMinutes()).padStart(2, '0'),
            ss: String(d.getSeconds()).padStart(2, '0')
        };
        return pattern.replace(/DD|MM|YYYY|HH|mm|ss/g, match => map[match]);
    },

    timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 }
        ];
        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
        }
        return 'just now';
    }
};

const StringUtils = {
    capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),
    titleCase: (str) => str.split(' ').map(w => StringUtils.capitalize(w)).join(' '),
    truncate: (str, max = 100, suffix = '...') => str.length > max ? str.slice(0, max) + suffix : str,
    slugify: (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    stripHtml: (html) => html.replace(/<[^>]*>/g, ''),
    escapeHtml: (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
};

const NumberUtils = {
    formatCurrency: (amount, currency = 'INR') => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
    },
    formatNumber: (num) => new Intl.NumberFormat('en-IN').format(num),
    clamp: (val, min, max) => Math.min(Math.max(val, min), max),
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    percentage: (part, total) => total === 0 ? 0 : Math.round((part / total) * 100)
};
