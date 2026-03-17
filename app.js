// app.js - Main application module

class UniversityApp {
    constructor() {
        this.universities = [];
        this.courses = [];
        this.filters = { search: '', department: '', level: '' };
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.init();
    }

    init() {
        this.loadUniversities();
        this.setupEventListeners();
        this.renderStats();
    }

    loadUniversities() {
        this.universities = UniversityData.getAll();
        this.courses = CourseData.getAll();
        this.renderUniversityCards();
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        const filterDept = document.getElementById('filterDepartment');
        if (filterDept) {
            filterDept.addEventListener('change', (e) => {
                this.filters.department = e.target.value;
                this.applyFilters();
            });
        }

        const filterLevel = document.getElementById('filterLevel');
        if (filterLevel) {
            filterLevel.addEventListener('change', (e) => {
                this.filters.level = e.target.value;
                this.applyFilters();
            });
        }
    }

    handleSearch(query) {
        this.filters.search = query.toLowerCase();
        this.currentPage = 1;
        this.applyFilters();
    }

    applyFilters() {
        let filtered = this.universities.filter(u => {
            const matchSearch = !this.filters.search ||
                u.name.toLowerCase().includes(this.filters.search) ||
                u.location.toLowerCase().includes(this.filters.search);
            const matchDept = !this.filters.department ||
                u.departments.includes(this.filters.department);
            return matchSearch && matchDept;
        });
        this.renderUniversityCards(filtered);
    }

    renderUniversityCards(data = this.universities) {
        const container = document.getElementById('universityGrid');
        if (!container) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const paginated = data.slice(start, start + this.itemsPerPage);

        container.innerHTML = paginated.map(u => this.createUniversityCard(u)).join('');
        this.renderPagination(data.length);
    }

    createUniversityCard(university) {
        return `
            <div class="university-card" data-id="${university.id}">
                <div class="card-header">
                    <h3>${university.name}</h3>
                    <span class="badge">${university.ranking}</span>
                </div>
                <div class="card-body">
                    <p><i class="icon-location"></i> ${university.location}</p>
                    <p><i class="icon-calendar"></i> Est. ${university.established}</p>
                    <p><i class="icon-students"></i> ${university.students.toLocaleString()} students</p>
                </div>
                <div class="card-footer">
                    <button onclick="app.viewDetails(${university.id})" class="btn-primary">View Details</button>
                    <button onclick="app.compareAdd(${university.id})" class="btn-secondary">Compare</button>
                </div>
            </div>`;
    }

    renderPagination(total) {
        const container = document.getElementById('pagination');
        if (!container) return;

        const pages = Math.ceil(total / this.itemsPerPage);
        let html = '';
        for (let i = 1; i <= pages; i++) {
            html += `<button class="${i === this.currentPage ? 'active' : ''}" 
                        onclick="app.goToPage(${i})">${i}</button>`;
        }
        container.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.applyFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    renderStats() {
        const stats = StatsCalculator.compute(this.universities, this.courses);
        const container = document.getElementById('statsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="stat-item"><span>${stats.totalUniversities}</span><label>Universities</label></div>
            <div class="stat-item"><span>${stats.totalCourses}</span><label>Courses</label></div>
            <div class="stat-item"><span>${stats.avgPlacementRate}%</span><label>Avg Placement</label></div>
            <div class="stat-item"><span>${stats.totalStudents.toLocaleString()}</span><label>Students</label></div>
        `;
    }

    viewDetails(id) {
        const university = this.universities.find(u => u.id === id);
        if (!university) return;
        ModalManager.open('universityModal', university);
    }

    compareAdd(id) {
        CompareManager.add(id, this.universities);
    }
}
