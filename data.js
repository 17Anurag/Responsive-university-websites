// data.js - University and course data layer

const UniversityData = (() => {
    const universities = [
        {
            id: 1,
            name: 'MIT University',
            location: 'Mumbai, Maharashtra, India',
            established: 1985,
            ranking: 'Top 10 India',
            students: 15000,
            faculty: 800,
            placementRate: 95,
            departments: ['Engineering', 'Management', 'Sciences'],
            accreditation: ['NAAC A+', 'NBA', 'AICTE'],
            facilities: ['Library', 'Labs', 'Hostel', 'Sports Complex', 'Cafeteria'],
            contact: { phone: '+91-22-1234-5678', email: 'admissions@mit.edu.in', website: 'www.mit.edu.in' },
            socialMedia: { facebook: 'MITUniversity', twitter: '@MITUniv', linkedin: 'mit-university' },
            description: 'MIT University is a premier technical institution offering world-class education in engineering, management, and sciences.',
            highlights: ['95% placement rate', 'Industry partnerships', 'Research excellence', 'Global alumni network']
        },
        {
            id: 2,
            name: 'Stanford University',
            location: 'Stanford, California, USA',
            established: 1885,
            ranking: '#2 Globally',
            students: 17000,
            faculty: 2200,
            placementRate: 98,
            departments: ['Engineering', 'Business', 'Law', 'Medicine', 'Humanities'],
            accreditation: ['WASC', 'AACSB', 'ABA'],
            facilities: ['Research Labs', 'Innovation Hub', 'Medical Center', 'Athletics', 'Housing'],
            contact: { phone: '+1-650-723-2300', email: 'admission@stanford.edu', website: 'www.stanford.edu' },
            socialMedia: { facebook: 'Stanford', twitter: '@Stanford', linkedin: 'stanford-university' },
            description: 'Stanford University is one of the world\'s leading research and teaching institutions, located in the heart of Silicon Valley.',
            highlights: ['Silicon Valley connections', 'Nobel laureates', 'Startup ecosystem', 'World-class research']
        }
    ];

    return {
        getAll: () => [...universities],
        getById: (id) => universities.find(u => u.id === id),
        search: (query) => universities.filter(u =>
            u.name.toLowerCase().includes(query.toLowerCase()) ||
            u.location.toLowerCase().includes(query.toLowerCase())
        ),
        getByDepartment: (dept) => universities.filter(u => u.departments.includes(dept)),
        getSortedByRanking: () => [...universities].sort((a, b) => a.id - b.id)
    };
})();

const CourseData = (() => {
    const courses = [
        // MIT Courses
        { id: 101, universityId: 1, name: 'B.Tech Computer Science', department: 'Engineering', level: 'undergraduate', duration: 4, feePerYear: 250000, currency: 'INR', seats: 120, eligibility: '10+2 with PCM, min 60%', description: 'Comprehensive program covering algorithms, data structures, AI, and software engineering.' },
        { id: 102, universityId: 1, name: 'B.Tech Mechanical Engineering', department: 'Engineering', level: 'undergraduate', duration: 4, feePerYear: 225000, currency: 'INR', seats: 90, eligibility: '10+2 with PCM, min 60%', description: 'Covers thermodynamics, fluid mechanics, manufacturing, and design.' },
        { id: 103, universityId: 1, name: 'B.Tech Electrical Engineering', department: 'Engineering', level: 'undergraduate', duration: 4, feePerYear: 225000, currency: 'INR', seats: 90, eligibility: '10+2 with PCM, min 60%', description: 'Focuses on circuits, power systems, electronics, and control systems.' },
        { id: 104, universityId: 1, name: 'MBA', department: 'Management', level: 'postgraduate', duration: 2, feePerYear: 450000, currency: 'INR', seats: 60, eligibility: 'Graduation with min 50%, CAT/MAT score', description: 'Industry-focused MBA with specializations in Finance, Marketing, and HR.' },
        { id: 105, universityId: 1, name: 'M.Tech Computer Science', department: 'Engineering', level: 'postgraduate', duration: 2, feePerYear: 175000, currency: 'INR', seats: 30, eligibility: 'B.Tech/BE with min 60%, GATE score preferred', description: 'Advanced studies in AI, ML, distributed systems, and research.' },
        { id: 106, universityId: 1, name: 'B.Tech Civil Engineering', department: 'Engineering', level: 'undergraduate', duration: 4, feePerYear: 200000, currency: 'INR', seats: 60, eligibility: '10+2 with PCM, min 55%', description: 'Structural engineering, construction management, and urban planning.' },
        // Stanford Courses
        { id: 201, universityId: 2, name: 'BS Computer Science', department: 'Engineering', level: 'undergraduate', duration: 4, feePerYear: 60000, currency: 'USD', seats: 200, eligibility: 'High school diploma, SAT/ACT scores', description: 'World-renowned CS program with focus on theory, systems, and AI.' },
        { id: 202, universityId: 2, name: 'MBA (GSB)', department: 'Business', level: 'postgraduate', duration: 2, feePerYear: 80000, currency: 'USD', seats: 400, eligibility: 'Bachelor\'s degree, GMAT/GRE, work experience', description: 'Top-ranked MBA program with unparalleled Silicon Valley access.' },
        { id: 203, universityId: 2, name: 'MS Artificial Intelligence', department: 'Engineering', level: 'postgraduate', duration: 2, feePerYear: 65000, currency: 'USD', seats: 100, eligibility: 'BS in CS or related field, GRE scores', description: 'Cutting-edge AI research and applications program.' },
        { id: 204, universityId: 2, name: 'BS Data Science', department: 'Engineering', level: 'undergraduate', duration: 4, feePerYear: 58000, currency: 'USD', seats: 150, eligibility: 'High school diploma, strong math background', description: 'Statistics, machine learning, and data engineering fundamentals.' },
        { id: 205, universityId: 2, name: 'JD Law', department: 'Law', level: 'postgraduate', duration: 3, feePerYear: 70000, currency: 'USD', seats: 180, eligibility: 'Bachelor\'s degree, LSAT scores', description: 'Top-ranked law program with focus on technology and policy.' },
        { id: 206, universityId: 2, name: 'MS Entrepreneurship', department: 'Business', level: 'postgraduate', duration: 1, feePerYear: 75000, currency: 'USD', seats: 50, eligibility: 'Bachelor\'s degree, business experience preferred', description: 'Intensive program for aspiring entrepreneurs in the heart of Silicon Valley.' }
    ];

    return {
        getAll: () => [...courses],
        getById: (id) => courses.find(c => c.id === id),
        getByUniversity: (universityId) => courses.filter(c => c.universityId === universityId),
        getByDepartment: (dept) => courses.filter(c => c.department === dept),
        getByLevel: (level) => courses.filter(c => c.level === level),
        search: (query) => courses.filter(c =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.department.toLowerCase().includes(query.toLowerCase())
        ),
        getDepartments: () => [...new Set(courses.map(c => c.department))],
        getLevels: () => [...new Set(courses.map(c => c.level))]
    };
})();
