class SettingsManager {
    constructor() {
        this.limits = JSON.parse(localStorage.getItem('limits')) || {
            daily: 50,
            monthly: 1500
        };
        this.initializeEventListeners();
        this.updateLimitDisplay();
    }

    initializeEventListeners() {
        // Reset data button
        const resetBtn = document.getElementById('resetDataBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.showResetConfirmation();
            });
        }

        // Expense limits form
        const limitsForm = document.getElementById('limitsForm');
        if (limitsForm) {
            limitsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveLimits();
            });
        }

        // When the settings tab is shown, load current limits
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                if (e.target.getAttribute('href') === '#settings') {
                    this.loadCurrentLimits();
                }
            });
        });
    }

    loadCurrentLimits() {
        const dailyLimit = document.getElementById('dailyLimit');
        const monthlyLimit = document.getElementById('monthlyLimit');
        
        if (dailyLimit && monthlyLimit) {
            dailyLimit.value = this.limits.daily;
            monthlyLimit.value = this.limits.monthly;
        }
    }

    saveLimits() {
        const dailyLimit = parseFloat(document.getElementById('dailyLimit').value);
        const monthlyLimit = parseFloat(document.getElementById('monthlyLimit').value);
        
        this.limits = {
            daily: dailyLimit,
            monthly: monthlyLimit
        };
        
        localStorage.setItem('limits', JSON.stringify(this.limits));
        this.showSuccessMessage('Spending limits saved successfully!');
        
        // Update dashboard to reflect new limits
        if (window.app) {
            window.app.updateDashboard();
        }

        // Check current spending against new limits
        this.checkCurrentSpending();
    }

    checkCurrentSpending() {
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        
        // Check monthly limit
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const monthlyTotal = expenses
            .filter(exp => {
                const expDate = new Date(exp.date + 'T00:00:00');
                return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        const monthlyPercentage = (monthlyTotal / this.limits.monthly) * 100;
        
        if (monthlyPercentage >= 100) {
            this.showWarning(`You've exceeded your monthly spending limit of $${this.limits.monthly.toFixed(2)}!`);
        } else if (monthlyPercentage >= 80) {
            this.showWarning(`You're approaching your monthly spending limit (${monthlyPercentage.toFixed(1)}%)!`);
        }
    }

    updateLimitDisplay() {
        // Add a limit indicator to the dashboard if it doesn't exist
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            let limitIndicator = document.getElementById('limitIndicator');
            
            if (!limitIndicator) {
                limitIndicator = document.createElement('div');
                limitIndicator.id = 'limitIndicator';
                limitIndicator.className = 'limit-indicator';
                dashboard.querySelector('.charts').before(limitIndicator);
            }
            
            this.updateLimitIndicator();
        }
    }

    updateLimitIndicator() {
        const limitIndicator = document.getElementById('limitIndicator');
        if (!limitIndicator) return;
        
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        
        // Calculate current month's total
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const monthlyTotal = expenses
            .filter(exp => {
                const expDate = new Date(exp.date + 'T00:00:00');
                return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        const monthlyPercentage = Math.min((monthlyTotal / this.limits.monthly) * 100, 100);
        let progressClass = '';
        
        if (monthlyPercentage >= 90) {
            progressClass = 'danger';
        } else if (monthlyPercentage >= 75) {
            progressClass = 'warning';
        }
        
        limitIndicator.innerHTML = `
            <h3>Monthly Spending Limit</h3>
            <p>$${monthlyTotal.toFixed(2)} of $${this.limits.monthly.toFixed(2)} (${monthlyPercentage.toFixed(1)}%)</p>
            <div class="progress-container">
                <div class="progress-bar ${progressClass}" style="width: ${monthlyPercentage}%"></div>
            </div>
        `;
    }

    showResetConfirmation() {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Reset All Data</h3>
                <p>Are you sure you want to reset all your financial data? This action cannot be undone.</p>
                <div class="modal-buttons">
                    <button id="confirmResetBtn" class="danger-btn">Yes, Reset All Data</button>
                    <button id="cancelResetBtn" class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        // Add to body
        document.body.appendChild(modal);
        modal.style.display = 'block';

        // Add event listeners
        document.getElementById('confirmResetBtn').addEventListener('click', () => {
            this.resetAllData();
            modal.style.display = 'none';
            setTimeout(() => {
                modal.remove();
                this.showSuccessMessage('All data has been reset successfully!');
            }, 300);
        });

        document.getElementById('cancelResetBtn').addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        });
    }

    resetAllData() {
        // Keep the limits but reset everything else
        localStorage.removeItem('expenses');
        localStorage.removeItem('income');
        localStorage.removeItem('goals');

        // Refresh dashboard and charts
        if (window.app) {
            window.app.updateDashboard();
        }
        
        if (window.chartManager) {
            window.chartManager.updateCharts();
        }
        
        if (window.calendarManager) {
            window.calendarManager.initializeCalendar();
        }
        
        if (window.goalManager) {
            window.goalManager.goals = [];
            window.goalManager.renderGoals();
        }
        
        this.updateLimitIndicator();
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showWarning(message) {
        this.showMessage(message, 'warning');
    }

    showMessage(message, type = 'success') {
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            background-color: ${type === 'warning' ? '#f39c12' : '#27ae60'};
            color: white;
        `;
        messageElement.textContent = message;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            margin-left: 10px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        `;
        messageElement.appendChild(closeBtn);

        // Add to document
        document.body.appendChild(messageElement);

        // Remove after 5 seconds or on click
        closeBtn.onclick = () => messageElement.remove();
        setTimeout(() => messageElement.remove(), 5000);
    }
}

// Initialize the settings manager
window.settingsManager = new SettingsManager(); 