// charts.js - Canvas-based chart rendering (no external dependencies)

const ChartRenderer = (() => {
    const COLORS = ['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0', '#4895ef', '#560bad', '#480ca8'];

    function getCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        return { canvas, ctx: canvas.getContext('2d') };
    }

    function clearCanvas(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function drawBarChart(canvasId, data, options = {}) {
        const result = getCanvas(canvasId);
        if (!result) return;
        const { canvas, ctx } = result;
        clearCanvas(ctx, canvas);

        const { labels, values } = data;
        const { title = '', color = COLORS[0], padding = 40 } = options;

        const maxVal = Math.max(...values);
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2 - 30;
        const barWidth = (chartWidth / labels.length) * 0.6;
        const gap = (chartWidth / labels.length) * 0.4;

        // Title
        if (title) {
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width / 2, 20);
        }

        // Y-axis gridlines
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + chartHeight - (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();

            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(Math.round((maxVal / 5) * i), padding - 5, y + 4);
        }

        // Bars
        labels.forEach((label, i) => {
            const x = padding + i * (barWidth + gap) + gap / 2;
            const barHeight = (values[i] / maxVal) * chartHeight;
            const y = padding + chartHeight - barHeight;

            ctx.fillStyle = COLORS[i % COLORS.length];
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(x, y, barWidth, barHeight, 4) : ctx.rect(x, y, barWidth, barHeight);
            ctx.fill();

            // Value label
            ctx.fillStyle = '#333';
            ctx.font = '11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(values[i], x + barWidth / 2, y - 5);

            // X label
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText(label.length > 10 ? label.slice(0, 10) + '…' : label, x + barWidth / 2, padding + chartHeight + 15);
        });
    }

    function drawPieChart(canvasId, data, options = {}) {
        const result = getCanvas(canvasId);
        if (!result) return;
        const { canvas, ctx } = result;
        clearCanvas(ctx, canvas);

        const { labels, values } = data;
        const { title = '' } = options;
        const total = values.reduce((a, b) => a + b, 0);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = Math.min(cx, cy) - 60;

        if (title) {
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(title, cx, 20);
        }

        let startAngle = -Math.PI / 2;
        values.forEach((val, i) => {
            const sliceAngle = (val / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = COLORS[i % COLORS.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Label
            const midAngle = startAngle + sliceAngle / 2;
            const lx = cx + (radius * 0.65) * Math.cos(midAngle);
            const ly = cy + (radius * 0.65) * Math.sin(midAngle);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round((val / total) * 100)}%`, lx, ly);

            startAngle += sliceAngle;
        });

        // Legend
        labels.forEach((label, i) => {
            const lx = 10;
            const ly = canvas.height - (labels.length - i) * 18;
            ctx.fillStyle = COLORS[i % COLORS.length];
            ctx.fillRect(lx, ly - 10, 12, 12);
            ctx.fillStyle = '#333';
            ctx.font = '11px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(label, lx + 16, ly);
        });
    }

    function drawLineChart(canvasId, data, options = {}) {
        const result = getCanvas(canvasId);
        if (!result) return;
        const { canvas, ctx } = result;
        clearCanvas(ctx, canvas);

        const { labels, datasets } = data;
        const { title = '', padding = 50 } = options;

        const allValues = datasets.flatMap(d => d.values);
        const maxVal = Math.max(...allValues);
        const minVal = Math.min(...allValues);
        const range = maxVal - minVal || 1;

        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2 - 20;

        if (title) {
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(title, canvas.width / 2, 20);
        }

        // Grid
        ctx.strokeStyle = '#eee';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(canvas.width - padding, y);
            ctx.stroke();
            const val = maxVal - (range / 5) * i;
            ctx.fillStyle = '#999';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(Math.round(val), padding - 5, y + 4);
        }

        // X labels
        labels.forEach((label, i) => {
            const x = padding + (chartWidth / (labels.length - 1)) * i;
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, padding + chartHeight + 15);
        });

        // Lines
        datasets.forEach((dataset, di) => {
            const color = dataset.color || COLORS[di % COLORS.length];
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            dataset.values.forEach((val, i) => {
                const x = padding + (chartWidth / (labels.length - 1)) * i;
                const y = padding + chartHeight - ((val - minVal) / range) * chartHeight;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Dots
            dataset.values.forEach((val, i) => {
                const x = padding + (chartWidth / (labels.length - 1)) * i;
                const y = padding + chartHeight - ((val - minVal) / range) * chartHeight;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });
        });
    }

    function renderDashboard() {
        const courses = CourseData.getAll();
        const universities = UniversityData.getAll();

        // Department distribution pie chart
        const deptBreakdown = StatsCalculator.getDepartmentBreakdown(courses);
        drawPieChart('deptChart', {
            labels: Object.keys(deptBreakdown),
            values: Object.values(deptBreakdown)
        }, { title: 'Courses by Department' });

        // Placement rate bar chart
        drawBarChart('placementChart', {
            labels: universities.map(u => u.name.split(' ')[0]),
            values: universities.map(u => u.placementRate)
        }, { title: 'Placement Rate (%)' });

        // Student enrollment line chart (simulated trend)
        drawLineChart('enrollmentChart', {
            labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
            datasets: universities.map((u, i) => ({
                label: u.name,
                color: COLORS[i],
                values: Array.from({ length: 6 }, (_, j) =>
                    Math.round(u.students * (0.85 + j * 0.03 + Math.random() * 0.02))
                )
            }))
        }, { title: 'Student Enrollment Trend' });
    }

    return { drawBarChart, drawPieChart, drawLineChart, renderDashboard };
})();
