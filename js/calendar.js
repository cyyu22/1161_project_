class CalendarManager {
    constructor() {
        console.log('CalendarManager initializing...'); // Debug log
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        // Don't initialize calendar immediately
        this.initialized = false;
    }

    initializeCalendar() {
        if (!this.initialized) {
            this.initializeEventListeners();
            this.initialized = true;
        }
        this.updateCalendarHeader();
        this.renderCalendar();
        this.updateMonthSummary();
    }

    initializeEventListeners() {
        console.log('Setting up event listeners...'); // Debug log
        const prevButton = document.getElementById('prevMonth');
        const nextButton = document.getElementById('nextMonth');

        if (prevButton && nextButton) {
            prevButton.addEventListener('click', () => {
                console.log('Previous month clicked'); // Debug log
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.initializeCalendar();
            });

            nextButton.addEventListener('click', () => {
                console.log('Next month clicked'); // Debug log
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.initializeCalendar();
            });
        } else {
            console.error('Navigation buttons not found!'); // Debug log
        }

        // Auto-cleanup old data (older than 1 year)
        this.cleanupOldData();
    }

    updateCalendarHeader() {
        console.log('Updating calendar header...'); // Debug log
        const currentMonth = this.monthNames[this.currentDate.getMonth()];
        const currentYear = this.currentDate.getFullYear();
        const headerText = `${currentMonth} ${currentYear}`;
        console.log('Header text:', headerText); // Debug log

        const headerElement = document.getElementById('currentMonthYear');
        if (headerElement) {
            headerElement.textContent = headerText;
        } else {
            console.error('Header element not found!'); // Debug log
        }
    }

    renderCalendar() {
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';

        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startingDay = firstDay.getDay();

        // Create empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }

        // Create cells for each day of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            
            const dateStr = this.formatDate(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day));
            const dayData = this.getDayData(dateStr);
            
            dayCell.innerHTML = `
                <div class="day-number">${day}</div>
                ${dayData.hasTransactions ? `
                    <div class="day-summary">
                        <div class="income ${dayData.income > 0 ? 'positive' : ''}">${dayData.income > 0 ? '+' + dayData.income.toFixed(2) : ''}</div>
                        <div class="expenses ${dayData.expenses > 0 ? 'negative' : ''}">${dayData.expenses > 0 ? '-' + dayData.expenses.toFixed(2) : ''}</div>
                    </div>
                ` : ''}
            `;

            if (dayData.hasTransactions) {
                dayCell.classList.add('has-transactions');
            }

            dayCell.addEventListener('click', () => this.showDayDetails(dateStr));
            calendarDays.appendChild(dayCell);
        }
    }

    getDayData(dateStr) {
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        const income = JSON.parse(localStorage.getItem('income')) || [];

        // Exact string match for the date
        const dayExpenses = expenses
            .filter(exp => exp.date === dateStr)
            .reduce((sum, exp) => sum + exp.amount, 0);

        const dayIncome = income
            .filter(inc => inc.date === dateStr)
            .reduce((sum, inc) => sum + inc.amount, 0);

        return {
            hasTransactions: dayExpenses > 0 || dayIncome > 0,
            expenses: dayExpenses,
            income: dayIncome
        };
    }

    showDayDetails(dateStr) {
        const dayDetails = document.getElementById('dayDetails');
        const dayTransactions = document.getElementById('dayTransactions');
        dayTransactions.innerHTML = '';

        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        const income = JSON.parse(localStorage.getItem('income')) || [];

        const dayExpenses = expenses.filter(exp => exp.date === dateStr);
        const dayIncome = income.filter(inc => inc.date === dateStr);

        if (dayExpenses.length === 0 && dayIncome.length === 0) {
            dayTransactions.innerHTML = '<p>No transactions for this day</p>';
        } else {
            // Show income
            if (dayIncome.length > 0) {
                dayTransactions.innerHTML += '<h4>Income</h4>';
                dayIncome.forEach(inc => {
                    dayTransactions.innerHTML += `
                        <div class="transaction income">
                            <span class="amount">+$${inc.amount.toFixed(2)}</span>
                            <span class="source">${inc.source}</span>
                        </div>
                    `;
                });
            }

            // Show expenses
            if (dayExpenses.length > 0) {
                dayTransactions.innerHTML += '<h4>Expenses</h4>';
                dayExpenses.forEach(exp => {
                    dayTransactions.innerHTML += `
                        <div class="transaction expense">
                            <span class="amount">-$${exp.amount.toFixed(2)}</span>
                            <span class="category">${exp.category}</span>
                            ${exp.note ? `<span class="note">${exp.note}</span>` : ''}
                        </div>
                    `;
                });
            }
        }

        dayDetails.classList.remove('hidden');
    }

    updateMonthSummary() {
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        const income = JSON.parse(localStorage.getItem('income')) || [];

        // Year and month for comparison
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Filter by checking the year and month components of each date
        const monthExpenses = expenses
            .filter(exp => {
                const expDate = new Date(exp.date + 'T00:00:00'); // Add time to avoid timezone issues
                return expDate.getFullYear() === year && expDate.getMonth() === month;
            })
            .reduce((sum, exp) => sum + exp.amount, 0);

        const monthIncome = income
            .filter(inc => {
                const incDate = new Date(inc.date + 'T00:00:00'); // Add time to avoid timezone issues
                return incDate.getFullYear() === year && incDate.getMonth() === month;
            })
            .reduce((sum, inc) => sum + inc.amount, 0);

        const balance = monthIncome - monthExpenses;

        document.getElementById('calendarIncome').textContent = `$${monthIncome.toFixed(2)}`;
        document.getElementById('calendarExpenses').textContent = `$${monthExpenses.toFixed(2)}`;
        document.getElementById('calendarBalance').textContent = `$${balance.toFixed(2)}`;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    cleanupOldData() {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        const income = JSON.parse(localStorage.getItem('income')) || [];

        // Filter out old transactions
        const currentExpenses = expenses.filter(exp => new Date(exp.date) > oneYearAgo);
        const currentIncome = income.filter(inc => new Date(inc.date) > oneYearAgo);

        // Save filtered data
        localStorage.setItem('expenses', JSON.stringify(currentExpenses));
        localStorage.setItem('income', JSON.stringify(currentIncome));
    }
}

// Initialize the calendar manager but don't render yet
window.calendarManager = new CalendarManager();

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing CalendarManager...'); // Debug log
    window.calendarManager.initializeCalendar();
});

// Temporary test code - add this at the end of calendar.js
setTimeout(() => {
    const calendarSection = document.getElementById('calendar');
    if (calendarSection) {
        document.querySelectorAll('.section').forEach(section => section.classList.add('hidden'));
        calendarSection.classList.remove('hidden');
        console.log('Forced calendar visibility');
    } else {
        console.error('Calendar section not found');
    }
}, 1000); 
