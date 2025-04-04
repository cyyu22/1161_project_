class TransactionTracker {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Expense form handling
        const expenseForm = document.getElementById('expenseForm');
        expenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Income form handling
        const incomeForm = document.getElementById('incomeForm');
        incomeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addIncome();
        });
    }

    addExpense() {
        const amount = document.getElementById('expenseAmount').value;
        const category = document.getElementById('expenseCategory').value;
        const date = document.getElementById('expenseDate').value;
        const note = document.getElementById('expenseNote').value;

        const expense = {
            id: Date.now(),
            amount: parseFloat(amount),
            category,
            date,
            note
        };

        let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        expenses.push(expense);
        localStorage.setItem('expenses', JSON.stringify(expenses));

        // Check expense limits
        this.checkExpenseLimits(expenses);

        // Reset form
        document.getElementById('expenseForm').reset();
        
        // Update dashboard
        window.app.updateDashboard();

        // Show success message
        this.showMessage('Expense added successfully!');

        // Check if we've exceeded limits
        if (window.settingsManager) {
            window.settingsManager.checkCurrentSpending();
        }
    }

    addIncome() {
        const amount = document.getElementById('incomeAmount').value;
        const source = document.getElementById('incomeSource').value;
        const date = document.getElementById('incomeDate').value;

        const income = {
            id: Date.now(),
            amount: parseFloat(amount),
            source,
            date
        };

        let incomes = JSON.parse(localStorage.getItem('income')) || [];
        incomes.push(income);
        localStorage.setItem('income', JSON.stringify(incomes));

        // Reset form
        document.getElementById('incomeForm').reset();
        
        // Update dashboard
        window.app.updateDashboard();

        // Show success message
        this.showMessage('Income added successfully!');
    }

    checkExpenseLimits(expenses) {
        const limits = JSON.parse(localStorage.getItem('limits')) || {
            daily: 50,
            monthly: 1500
        };

        // Check daily limit - use exact string comparison for today
        const today = new Date().toISOString().split('T')[0];
        const dailyTotal = expenses
            .filter(exp => exp.date === today)
            .reduce((sum, exp) => sum + exp.amount, 0);

        if (dailyTotal >= limits.daily * 0.8) {
            this.showWarning(`Daily expenses (${dailyTotal.toFixed(2)}) are approaching limit (${limits.daily})!`);
        }

        // Check monthly limit - use year/month comparison
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const monthlyTotal = expenses
            .filter(exp => {
                const expDate = new Date(exp.date + 'T00:00:00'); // Add time to avoid timezone issues
                return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonth;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);

        if (monthlyTotal >= limits.monthly * 0.8) {
            this.showWarning(`Monthly expenses (${monthlyTotal.toFixed(2)}) are approaching limit (${limits.monthly})!`);
        }
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
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
            background-color: ${type === 'warning' ? '#ff9800' : '#4CAF50'};
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

// Initialize the tracker
window.tracker = new TransactionTracker();
