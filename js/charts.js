class ChartManager {
    constructor() {
        this.expenseChart = null;
        this.initializeCharts();
    }

    initializeCharts() {
        const chartCanvas = document.getElementById('expenseChart');
        if (!chartCanvas) return;

        // Destroy existing chart if it exists
        if (this.expenseChart) {
            this.expenseChart.destroy();
        }

        const ctx = chartCanvas.getContext('2d');
        this.expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#0B6E4F', // Primary alpine green
                        '#14A76C', // Lighter alpine green
                        '#3E885B', // Complementary green
                        '#0A5C42', // Darker alpine green
                        '#45B7D1', // Complementary blue
                        '#2C8C99', // Darker blue
                        '#48BF84', // Another green shade
                        '#439775'  // Yet another green shade
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    title: {
                        display: true,
                        text: 'Expense Distribution'
                    }
                },
                animation: {
                    duration: 0 // Disable animations
                }
            }
        });

        this.updateCharts();
    }

    updateCharts() {
        if (!this.expenseChart) return;

        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        
        // Get current month's expenses
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        });

        // Calculate totals by category
        const categoryTotals = monthlyExpenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});

        // Update chart data
        this.expenseChart.data.labels = Object.keys(categoryTotals);
        this.expenseChart.data.datasets[0].data = Object.values(categoryTotals);
        this.expenseChart.update('none'); // Update without animation
    }
}

// Initialize the chart manager
window.chartManager = new ChartManager();
