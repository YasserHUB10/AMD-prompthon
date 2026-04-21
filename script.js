// Application State
let meals = JSON.parse(localStorage.getItem('meals')) || [];
let currentGoal = localStorage.getItem('goal') || 'loss';

// DOM Elements Selection
const goalBtns = document.querySelectorAll('.goal-btn');
const totalCaloriesEl = document.getElementById('totalCalories');
const mealCountEl = document.getElementById('mealCount');
const healthScoreEl = document.getElementById('healthScore');
const resetBtn = document.getElementById('resetBtn');
const foodForm = document.getElementById('foodForm');
const mealNameInput = document.getElementById('mealName');
const mealCaloriesInput = document.getElementById('mealCalories');
const mealList = document.getElementById('mealList');
const currentGoalText = document.getElementById('currentGoalText');
const aiSuggestions = document.getElementById('aiSuggestions');

// AI Logic Rules based on Fitness Goals
const aiRules = {
    loss: [
        { name: "Grilled Chicken Salad", desc: "High protein, low calorie. Great for fullness.", icon: "fa-carrot", cals: 350 },
        { name: "Zucchini Noodles", desc: "Low carb alternative, very low calorie.", icon: "fa-seedling", cals: 200 },
        { name: "Oatmeal with Berries", desc: "High fiber, keeps you full longer.", icon: "fa-bowl-food", cals: 300 }
    ],
    maintain: [
        { name: "Quinoa Bowl", desc: "Balanced macro profile with good carbs.", icon: "fa-bowl-rice", cals: 500 },
        { name: "Turkey Wrap", desc: "Lean protein with whole wheat wrap.", icon: "fa-hotdog", cals: 450 },
        { name: "Salmon & Sweet Potato", desc: "Healthy fats and complex carbs.", icon: "fa-fish", cals: 600 }
    ],
    gain: [
        { name: "Peanut Butter Smoothie", desc: "Calorie dense and high protein.", icon: "fa-glass-water", cals: 700 },
        { name: "Steak and Rice", desc: "High protein and carb heavy for growth.", icon: "fa-drumstick-bite", cals: 850 },
        { name: "Avocado Toast & Eggs", desc: "Healthy fats to boost calorie intake.", icon: "fa-bread-slice", cals: 550 }
    ]
};

const goalLabels = {
    loss: "Weight Loss",
    maintain: "Maintain",
    gain: "Weight Gain"
};

// Application Initialization
function init() {
    setupEventListeners();
    updateUI();
}

function setupEventListeners() {
    // Goal Selection
    goalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            goalBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentGoal = e.target.getAttribute('data-goal');
            localStorage.setItem('goal', currentGoal);
            updateUI(); // Complete UI refresh needed for goal change
        });
    });

    // Form Submission
    foodForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = mealNameInput.value.trim();
        const cals = parseInt(mealCaloriesInput.value);

        if (name && cals > 0) {
            const newMeal = {
                id: Date.now(),
                name: name,
                cals: cals
            };
            meals.push(newMeal);
            localStorage.setItem('meals', JSON.stringify(meals));
            
            // Clear inputs
            mealNameInput.value = '';
            mealCaloriesInput.value = '';
            
            updateUI();
        }
    });

    // Reset Today's Log
    resetBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to clear today\'s log?')){
            meals = [];
            localStorage.setItem('meals', JSON.stringify(meals));
            updateUI();
        }
    });
}

function updateUI() {
    // 1. Update goal button highlight state
    goalBtns.forEach(b => {
        if(b.getAttribute('data-goal') === currentGoal) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    // 2. Compute Dashboard Metrics
    const totalCals = meals.reduce((sum, meal) => sum + meal.cals, 0);
    const count = meals.length;

    // AI Health Score Engine (Simplified algorithm)
    let score = 100;
    
    if (count === 0) {
        score = 0; // Fresh slate, no score yet
    } else {
        // Penalty logic based on deviation from goal calories
        if (currentGoal === 'loss' && totalCals > 2000) {
            score -= (totalCals - 2000) / 10;
        } else if (currentGoal === 'gain' && totalCals < 2500 && count >= 3) {
            score -= (2500 - totalCals) / 15;
        } else if (currentGoal === 'maintain' && (totalCals < 1500 || totalCals > 2500) && count >= 2) {
            score -= 15;
        }
        
        // Reward consistency
        if (count >= 3 && count <= 5) score += 5;
    }
    
    // Bounds check
    score = Math.max(0, Math.min(100, Math.round(score)));

    // 3. Render Dashboard text
    totalCaloriesEl.textContent = totalCals;
    mealCountEl.textContent = count;
    healthScoreEl.textContent = score;

    // 4. Render Meal List
    mealList.innerHTML = '';
    if (meals.length === 0) {
        mealList.innerHTML = '<li class="meal-item" style="justify-content:center; color: var(--text-muted);">No meals logged yet.</li>';
    } else {
        // Render in reverse chronological order
        [...meals].reverse().forEach(meal => {
            const li = document.createElement('li');
            li.className = 'meal-item';
            li.innerHTML = `
                <span class="meal-item-name">${meal.name}</span>
                <span class="meal-item-cals">${meal.cals} kcal</span>
            `;
            mealList.appendChild(li);
        });
    }

    // 5. Update AI Suggestions Block
    updateSuggestions();
}

function updateSuggestions() {
    currentGoalText.textContent = goalLabels[currentGoal];
    const suggestions = aiRules[currentGoal];
    
    aiSuggestions.innerHTML = '';
    suggestions.forEach(item => {
        const div = document.createElement('div');
        div.className = 'suggestion-card';
        div.innerHTML = `
            <div class="suggestion-icon"><i class="fa-solid ${item.icon}"></i></div>
            <div class="suggestion-info">
                <h4>${item.name} (${item.cals} kcal)</h4>
                <p>${item.desc}</p>
            </div>
        `;
        aiSuggestions.appendChild(div);
    });
}

// Start the app natively
init();
