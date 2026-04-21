let meals = JSON.parse(localStorage.getItem('meals')) || [];
let currentGoal = localStorage.getItem('goal') || 'loss';

const $ = id => document.getElementById(id);
const goalBtns = document.querySelectorAll('.goal-btn');

const els = {
    totalCals: $('totalCalories'),
    mealCount: $('mealCount'),
    healthScore: $('healthScore'),
    resetBtn: $('resetBtn'),
    foodForm: $('foodForm'),
    mealName: $('mealName'),
    mealCals: $('mealCalories'),
    mealList: $('mealList'),
    goalText: $('currentGoalText'),
    suggestions: $('aiSuggestions'),
    progressFill: $('progressFill'),
    progressText: $('progressText')
};

const aiRules = {
    loss: [
        { name: "Grilled Chicken Salad", desc: "High protein, low calorie — great for fullness.", icon: "fa-carrot", cals: 350 },
        { name: "Zucchini Noodles", desc: "Low carb alternative, very light.", icon: "fa-seedling", cals: 200 },
        { name: "Oatmeal with Berries", desc: "High fiber, keeps you full longer.", icon: "fa-bowl-food", cals: 300 }
    ],
    maintain: [
        { name: "Quinoa Bowl", desc: "Balanced macros with good carbs.", icon: "fa-bowl-rice", cals: 500 },
        { name: "Turkey Wrap", desc: "Lean protein in a whole wheat wrap.", icon: "fa-hotdog", cals: 450 },
        { name: "Salmon & Sweet Potato", desc: "Healthy fats and complex carbs.", icon: "fa-fish", cals: 600 }
    ],
    gain: [
        { name: "Peanut Butter Smoothie", desc: "Calorie dense and high protein.", icon: "fa-glass-water", cals: 700 },
        { name: "Steak and Rice", desc: "High protein, carb heavy for growth.", icon: "fa-drumstick-bite", cals: 850 },
        { name: "Avocado Toast & Eggs", desc: "Healthy fats to boost intake.", icon: "fa-bread-slice", cals: 550 }
    ]
};

const goalLabels = { loss: "Weight Loss", maintain: "Maintain", gain: "Weight Gain" };
const goalTargets = { loss: 1800, maintain: 2200, gain: 2800 };

function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function init() {
    goalBtns.forEach(btn => {
        btn.addEventListener('click', e => {
            const target = e.currentTarget;
            goalBtns.forEach(b => b.classList.remove('active'));
            target.classList.add('active');
            currentGoal = target.dataset.goal;
            localStorage.setItem('goal', currentGoal);
            updateUI();
        });
    });

    els.foodForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = els.mealName.value.trim();
        const cals = parseInt(els.mealCals.value);
        if (!name || !cals || cals < 1) return;

        meals.push({ id: Date.now(), name: sanitize(name), cals });
        localStorage.setItem('meals', JSON.stringify(meals));
        els.mealName.value = '';
        els.mealCals.value = '';
        els.mealName.focus();
        updateUI();
    });

    els.resetBtn.addEventListener('click', () => {
        if (!confirm('Clear today\'s log?')) return;
        meals = [];
        localStorage.setItem('meals', JSON.stringify(meals));
        updateUI();
    });

    updateUI();
}

function deleteMeal(id) {
    meals = meals.filter(m => m.id !== id);
    localStorage.setItem('meals', JSON.stringify(meals));
    updateUI();
}

function computeScore(totalCals, count) {
    if (count === 0) return 0;
    const target = goalTargets[currentGoal];
    const deviation = Math.abs(totalCals - target) / target;
    let score = Math.max(0, 100 - deviation * 100);
    if (count >= 3 && count <= 5) score = Math.min(100, score + 8);
    if (count === 1 && totalCals > target) score = Math.max(score - 10, 0);
    return Math.round(Math.max(0, Math.min(100, score)));
}

function animateNumber(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;
    const diff = target - current;
    const steps = 20;
    const increment = diff / steps;
    let step = 0;
    const timer = setInterval(() => {
        step++;
        el.textContent = Math.round(current + increment * step);
        if (step >= steps) { el.textContent = target; clearInterval(timer); }
    }, 25);
}

function updateUI() {
    goalBtns.forEach(b => b.classList.toggle('active', b.dataset.goal === currentGoal));

    const totalCals = meals.reduce((s, m) => s + m.cals, 0);
    const count = meals.length;
    const score = computeScore(totalCals, count);
    const target = goalTargets[currentGoal];

    animateNumber(els.totalCals, totalCals);
    animateNumber(els.mealCount, count);
    animateNumber(els.healthScore, score);

    // Color-code health score
    const scoreEl = els.healthScore;
    scoreEl.className = '';
    if (score >= 70) scoreEl.classList.add('score-high');
    else if (score >= 40) scoreEl.classList.add('score-mid');
    else scoreEl.classList.add('score-low');

    // Progress bar
    const pct = Math.min((totalCals / target) * 100, 100);
    els.progressFill.style.width = pct + '%';
    els.progressFill.classList.toggle('over', totalCals > target);
    els.progressText.textContent = `${totalCals} / ${target} kcal`;

    // Meal list
    els.mealList.innerHTML = '';
    if (count === 0) {
        els.mealList.innerHTML = '<li class="empty-state">No meals logged yet. Add your first meal above!</li>';
    } else {
        [...meals].reverse().forEach((meal, i) => {
            const li = document.createElement('li');
            li.className = 'meal-item';
            li.style.animationDelay = (i * 0.05) + 's';
            li.innerHTML = `
                <span class="meal-item-name">${meal.name}</span>
                <div class="meal-item-right">
                    <span class="meal-item-cals">${meal.cals} kcal</span>
                    <button class="meal-delete" onclick="deleteMeal(${meal.id})" title="Remove"><i class="fa-solid fa-xmark"></i></button>
                </div>`;
            els.mealList.appendChild(li);
        });
    }

    updateSuggestions();
}

function updateSuggestions() {
    els.goalText.textContent = goalLabels[currentGoal];
    els.suggestions.innerHTML = '';
    aiRules[currentGoal].forEach(item => {
        const div = document.createElement('div');
        div.className = 'suggestion-card';
        div.innerHTML = `
            <div class="suggestion-icon"><i class="fa-solid ${item.icon}"></i></div>
            <div class="suggestion-info">
                <h4>${item.name} <span style="color:var(--muted);font-weight:400;font-size:0.82rem;">${item.cals} kcal</span></h4>
                <p>${item.desc}</p>
            </div>`;
        els.suggestions.appendChild(div);
    });
}

init();
