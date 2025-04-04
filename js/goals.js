class GoalManager {
    constructor() {
        this.goals = JSON.parse(localStorage.getItem('goals')) || [];
        this.initializeEventListeners();
        this.renderGoals();
    }

    initializeEventListeners() {
        const goalForm = document.getElementById('goalForm');
        goalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addGoal();
        });
    }

    addGoal() {
        const name = document.getElementById('goalName').value;
        const amount = document.getElementById('goalAmount').value;
        const deadline = document.getElementById('goalDeadline').value;

        const goal = {
            id: Date.now(),
            name,
            amount: parseFloat(amount),
            deadline,
            progress: 0,
            completed: false
        };

        this.goals.push(goal);
        localStorage.setItem('goals', JSON.stringify(this.goals));

        // Reset form and update display
        document.getElementById('goalForm').reset();
        this.renderGoals();
    }

    updateGoalProgress(goalId, progress) {
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.progress = progress;
            goal.completed = progress >= goal.amount;
            localStorage.setItem('goals', JSON.stringify(this.goals));
            this.renderGoals();
        }
    }

    renderGoals() {
        const goalsList = document.getElementById('goalsList');
        goalsList.innerHTML = '';

        this.goals.forEach(goal => {
            const goalElement = document.createElement('div');
            goalElement.className = 'goal-card';
            
            const progressPercentage = Math.min((goal.progress / goal.amount) * 100, 100);
            const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

            goalElement.innerHTML = `
                <div class="goal-header">
                    <h3>${goal.name}</h3>
                    <span class="goal-deadline">${daysLeft} days left</span>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="progress-stats">
                        <span>$${goal.progress.toFixed(2)} / $${goal.amount.toFixed(2)}</span>
                        <span>${progressPercentage.toFixed(1)}%</span>
                    </div>
                </div>
                <div class="goal-actions">
                    <button onclick="goalManager.updateGoalProgress(${goal.id}, ${goal.progress + 100})">
                        Add Progress
                    </button>
                    <button class="delete-goal" onclick="goalManager.deleteGoal(${goal.id})">
                        Delete
                    </button>
                </div>
            `;

            goalsList.appendChild(goalElement);
        });
    }

    deleteGoal(goalId) {
        this.goals = this.goals.filter(goal => goal.id !== goalId);
        localStorage.setItem('goals', JSON.stringify(this.goals));
        this.renderGoals();
    }
}

// Initialize the goal manager
const goalManager = new GoalManager();
