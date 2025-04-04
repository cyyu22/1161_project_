// Main application logic
class MoneyTracker {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.income = JSON.parse(localStorage.getItem('income')) || [];
        this.goals = JSON.parse(localStorage.getItem('goals')) || [];
        
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        // Explicitly hide all non-dashboard sections
        document.querySelectorAll('.section').forEach(section => {
            if (section.id !== 'dashboard') {
                section.classList.add('hidden');
                section.style.display = 'none';
            }
        });

        // Ensure dashboard is visible
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');
            dashboard.style.display = 'block';
        }

        this.initializeEventListeners();
        this.updateDashboard();

        // Set initial active state
        const dashboardLink = document.querySelector('nav a[href="#dashboard"]');
        if (dashboardLink) {
            dashboardLink.classList.add('active');
        }
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = e.target.getAttribute('href').substring(1);
                this.showSection(sectionId);
            });
        });

        // Forms
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        document.getElementById('incomeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addIncome();
        });

        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGoal();
        });
    }

    showSection(sectionId) {
        // First hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
            section.style.display = 'none';
        });

        // Then show the selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.classList.remove('hidden');
            selectedSection.style.display = 'block';

            // Handle specific section initializations
            if (sectionId === 'dashboard') {
                this.updateDashboard();
                if (window.chartManager) {
                    window.chartManager.updateCharts();
                }
            } else if (sectionId === 'calendar' && window.calendarManager) {
                window.calendarManager.initializeCalendar();
            }
        }

        // Update active nav link
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
    }

    updateDashboard() {
        // Fetch latest data from localStorage
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.income = JSON.parse(localStorage.getItem('income')) || [];

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Calculate monthly totals using year/month comparison
        const monthlyIncome = this.income
            .filter(inc => {
                const incDate = new Date(inc.date + 'T00:00:00'); // Add time to avoid timezone issues
                return incDate.getFullYear() === currentYear && incDate.getMonth() === currentMonth;
            })
            .reduce((sum, inc) => sum + parseFloat(inc.amount), 0);

        const monthlyExpenses = this.expenses
            .filter(exp => {
                const expDate = new Date(exp.date + 'T00:00:00'); // Add time to avoid timezone issues
                return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
            })
            .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        const monthlyBalance = monthlyIncome - monthlyExpenses;

        // Update UI
        document.getElementById('monthlyIncome').textContent = monthlyIncome.toFixed(2);
        document.getElementById('monthlyExpenses').textContent = monthlyExpenses.toFixed(2);
        document.getElementById('monthlyBalance').textContent = monthlyBalance.toFixed(2);

        // Update charts
        if (window.chartManager) {
            window.chartManager.updateCharts();
        }

        // Update the expense limit indicator if it exists
        if (window.settingsManager) {
            window.settingsManager.updateLimitIndicator();
        }
    }

    calculateMonthlyTotal(transactions, month, year) {
        return transactions
            .filter(t => {
                const date = new Date(t.date);
                // JavaScript months are 0-based (0 = January, 1 = February, etc.)
                // But our displayed months are 1-based 
                return date.getMonth() === month && date.getFullYear() === year;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    }
}

// Initialize the application
window.app = new MoneyTracker();
