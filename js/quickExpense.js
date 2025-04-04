class QuickExpenseManager {
    constructor() {
        this.dailyLimit = parseFloat(localStorage.getItem('dailyLimit')) || 50.00;
        this.initializeEventListeners();
        this.updateDailySpending();
    }

    initializeEventListeners() {
        // Wait for DOM to be fully loaded
        document.addEventListener('DOMContentLoaded', () => {
            const quickExpenseForm = document.getElementById('quickExpenseForm');
            if (quickExpenseForm) {
                console.log('Quick expense form found, adding listener');
                quickExpenseForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    console.log('Form submitted');
                    this.addQuickExpense();
                });
            } else {
                console.log('Quick expense form not found');
            }
        });
    }

    addQuickExpense() {
        console.log('Adding quick expense');
        const amountInput = document.getElementById('quickAmount');
        const categoryInput = document.getElementById('quickCategory');
        const noteInput = document.getElementById('quickNote');

        if (!amountInput || !categoryInput) {
            console.error('Required input fields not found');
            return;
        }

        const amount = parseFloat(amountInput.value);
        const category = categoryInput.value;
        const note = noteInput ? noteInput.value : '';
        const today = new Date().toISOString().split('T')[0];

        if (isNaN(amount) || amount <= 0) {
            this.showMessage('Please enter a valid amount', 'warning');
            return;
        }

        const expense = {
            id: Date.now(),
            amount: amount,
            category: category,
            date: today,
            note: note
        };

        console.log('New expense:', expense);

        // Get existing expenses
        let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        expenses.push(expense);
        
        // Save to localStorage
        try {
            localStorage.setItem('expenses', JSON.stringify(expenses));
            console.log('Expense saved successfully');
            
            // Reset form
            document.getElementById('quickExpenseForm').reset();

            // Update all relevant displays
            this.updateDailySpending();
            
            if (window.app && typeof window.app.updateDashboard === 'function') {
                window.app.updateDashboard();
            }
            
            if (window.chartManager && typeof window.chartManager.updateCharts === 'function') {
                window.chartManager.updateCharts();
            }

            // Show success message
            this.showMessage('Expense added successfully!', 'success');
        } catch (error) {
            console.error('Error saving expense:', error);
            this.showMessage('Error saving expense', 'warning');
        }
    }

    resetDailyTracker() {
        // Reset the UI elements
        const elements = {
            dailyLimitAmount: document.getElementById('dailyLimitAmount'),
            dailySpentAmount: document.getElementById('dailySpentAmount'),
            dailyRemainingAmount: document.getElementById('dailyRemainingAmount'),
            dailyProgressBar: document.getElementById('dailyProgressBar')
        };

        // Reset amounts
        if (elements.dailyLimitAmount) {
            elements.dailyLimitAmount.textContent = `$${this.dailyLimit.toFixed(2)}`;
        }
        if (elements.dailySpentAmount) {
            elements.dailySpentAmount.textContent = '0.00';
        }
        if (elements.dailyRemainingAmount) {
            elements.dailyRemainingAmount.textContent = this.dailyLimit.toFixed(2);
        }
        
        // Reset progress bar
        if (elements.dailyProgressBar) {
            elements.dailyProgressBar.style.width = '0%';
            elements.dailyProgressBar.className = 'progress-bar';
        }

        // Reset quick expense form if it exists
        const quickExpenseForm = document.getElementById('quickExpenseForm');
        if (quickExpenseForm) {
            quickExpenseForm.reset();
        }

        console.log('Daily spending tracker reset successfully');
    }

    updateDailySpending() {
        console.log('Updating daily spending');
        const today = new Date().toISOString().split('T')[0];
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        
        const dailyTotal = expenses
            .filter(exp => exp.date === today)
            .reduce((sum, exp) => sum + exp.amount, 0);

        console.log('Daily total:', dailyTotal);

        const remaining = this.dailyLimit - dailyTotal;
        const percentage = (dailyTotal / this.dailyLimit) * 100;

        // Update UI elements if they exist
        const elements = {
            dailyLimitAmount: document.getElementById('dailyLimitAmount'),
            dailySpentAmount: document.getElementById('dailySpentAmount'),
            dailyRemainingAmount: document.getElementById('dailyRemainingAmount'),
            dailyProgressBar: document.getElementById('dailyProgressBar')
        };

        if (elements.dailyLimitAmount) {
            elements.dailyLimitAmount.textContent = `$${this.dailyLimit.toFixed(2)}`;
        }
        if (elements.dailySpentAmount) {
            elements.dailySpentAmount.textContent = dailyTotal.toFixed(2);
        }
        if (elements.dailyRemainingAmount) {
            elements.dailyRemainingAmount.textContent = remaining.toFixed(2);
        }
        if (elements.dailyProgressBar) {
            elements.dailyProgressBar.style.width = `${Math.min(percentage, 100)}%`;
            elements.dailyProgressBar.className = 'progress-bar';
            
            if (dailyTotal > this.dailyLimit) {
                elements.dailyProgressBar.classList.add('danger');
                this.showMessage('Daily spending limit exceeded!', 'warning');
            } else if (dailyTotal > this.dailyLimit * 0.8) {
                elements.dailyProgressBar.classList.add('warning');
                this.showMessage('Approaching daily spending limit!', 'warning');
            }
        }
    }

    showMessage(message, type = 'success') {
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
            animation: slideIn 0.3s ease;
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

// Initialize the quick expense manager
window.quickExpenseManager = new QuickExpenseManager(); 