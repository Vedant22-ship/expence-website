// --- INITIAL DATA ARCHITECTURE ---
const ADMIN_CREDENTIALS = { username: "ADMIN1829", pass: "987654321" };

let currentUser = JSON.parse(localStorage.getItem("expensetrack_current_user")) || null;
let users = JSON.parse(localStorage.getItem("expensetrack_users")) || [];
let expenses = JSON.parse(localStorage.getItem("expensetrack_expenses")) || [];
let chartInstance = null;

// Initialize Admin User if missing
if (!users.some(u => u.username === ADMIN_CREDENTIALS.username)) {
    users.push({
        id: "usr_admin",
        name: "System Administrator",
        username: ADMIN_CREDENTIALS.username,
        email: "admin@expensetracker.local",
        password: ADMIN_CREDENTIALS.pass,
        role: "admin",
        createdAt: new Date().toISOString(),
        lastLogin: "N/A",
        loginCount: 0
    });
    localStorage.setItem("expensetrack_users", JSON.stringify(users));
}

// --- DOM ELEMENTS ---
const authScreen = document.getElementById("authScreen");
const userDashboard = document.getElementById("userDashboard");
const adminDashboard = document.getElementById("adminDashboard");
const navAuthSection = document.getElementById("navAuthSection");
const alertContainer = document.getElementById("alertContainer");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");

const expenseForm = document.getElementById("expenseForm");
const expenseTableBody = document.getElementById("expenseTableBody");
const adminUsersTableBody = document.getElementById("adminUsersTableBody");
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");
const exportCsvBtn = document.getElementById("exportCsvBtn");

// Initialize Lucide Icons
lucide.createIcons();

// --- APP INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("expDate").value = new Date().toISOString().split("T")[0];
    setupTheme();
    updateUI();
});

// --- THEME MANAGEMENT ---
function setupTheme() {
    const savedTheme = localStorage.getItem("expensetrack_theme") || "light";
    if (savedTheme === "dark") document.documentElement.classList.add("dark");

    document.getElementById("themeToggleBtn").addEventListener("click", () => {
        document.documentElement.classList.toggle("dark");
        const isDark = document.documentElement.classList.contains("dark");
        localStorage.setItem("expensetrack_theme", isDark ? "dark" : "light");
    });
}

// --- ALERT NOTIFICATIONS ---
function showAlert(message, type = "info") {
    const colorMap = {
        success: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300",
        error: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300",
        info: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300"
    };
    alertContainer.innerHTML = `
        <div class="p-4 rounded-xl border ${colorMap[type]} flex justify-between items-center text-sm shadow-sm">
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" class="font-bold opacity-60 hover:opacity-100">&times;</button>
        </div>
    `;
    setTimeout(() => { alertContainer.innerHTML = ""; }, 4000);
}

// --- TAB SWITCHING ---
tabLogin.addEventListener("click", () => {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    tabLogin.className = "flex-1 pb-3 text-center font-semibold text-brand-600 border-b-2 border-brand-600";
    tabRegister.className = "flex-1 pb-3 text-center font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200";
});

tabRegister.addEventListener("click", () => {
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    tabRegister.className = "flex-1 pb-3 text-center font-semibold text-brand-600 border-b-2 border-brand-600";
    tabLogin.className = "flex-1 pb-3 text-center font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200";
});

// --- AUTHENTICATION ---
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const userIn = document.getElementById("loginUsername").value.trim();
    const passIn = document.getElementById("loginPassword").value;

    const user = users.find(u => (u.username === userIn || u.email === userIn) && u.password === passIn);

    if (user) {
        user.lastLogin = new Date().toLocaleString();
        user.loginCount = (user.loginCount || 0) + 1;
        saveData();

        currentUser = user;
        localStorage.setItem("expensetrack_current_user", JSON.stringify(currentUser));
        loginForm.reset();
        showAlert(`Welcome back, ${user.name}!`, "success");
        updateUI();
    } else {
        showAlert("Invalid username or password credentials.", "error");
    }
});

registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const username = document.getElementById("regUsername").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;

    if (username === ADMIN_CREDENTIALS.username) {
        showAlert("Cannot register with restricted system administrative username.", "error");
        return;
    }

    if (users.some(u => u.username === username || u.email === email)) {
        showAlert("Username or Email is already registered.", "error");
        return;
    }

    const newUser = {
        id: "usr_" + Date.now(),
        name,
        username,
        email,
        password,
        role: "user",
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toLocaleString(),
        loginCount: 1
    };

    users.push(newUser);
    currentUser = newUser;

    localStorage.setItem("expensetrack_users", JSON.stringify(users));
    localStorage.setItem("expensetrack_current_user", JSON.stringify(currentUser));

    registerForm.reset();
    showAlert("Account successfully created! You are now logged in.", "success");
    updateUI();
});

function logout() {
    currentUser = null;
    localStorage.removeItem("expensetrack_current_user");
    updateUI();
    showAlert("Logged out successfully.", "info");
}

// --- UI ROUTING & RENDERING ---
function updateUI() {
    if (!currentUser) {
        authScreen.classList.remove("hidden");
        userDashboard.classList.add("hidden");
        adminDashboard.classList.add("hidden");
        navAuthSection.innerHTML = "";
        return;
    }

    authScreen.classList.add("hidden");
    navAuthSection.innerHTML = `
        <span class="text-sm font-medium hidden sm:inline">${currentUser.name} (${currentUser.role})</span>
        <button onclick="logout()" class="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded-lg flex items-center space-x-1">
            <i data-lucide="log-out" class="w-4 h-4"></i>
            <span>Logout</span>
        </button>
    `;
    lucide.createIcons();

    if (currentUser.role === "admin") {
        adminDashboard.classList.remove("hidden");
        userDashboard.classList.add("hidden");
        renderAdminPanel();
    } else {
        userDashboard.classList.remove("hidden");
        adminDashboard.classList.add("hidden");
        renderUserDashboard();
    }
}

// --- USER DASHBOARD LOGIC ---
expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("expAmount").value);
    const category = document.getElementById("expCategory").value;
    const date = document.getElementById("expDate").value;
    const description = document.getElementById("expDesc").value.trim() || category;

    const newExpense = {
        id: "exp_" + Date.now(),
        userId: currentUser.id,
        amount,
        category,
        date,
        description
    };

    expenses.push(newExpense);
    saveData();
    expenseForm.reset();
    document.getElementById("expDate").value = new Date().toISOString().split("T")[0];
    showAlert("Expense entry recorded successfully.", "success");
    renderUserDashboard();
});

function renderUserDashboard() {
    const userExpenses = expenses.filter(e => e.userId === currentUser.id);

    // Calculate Summary Metrics
    const totalSpent = userExpenses.reduce((sum, e) => sum + e.amount, 0);
    document.getElementById("statTotalExpenses").textContent = `₹${totalSpent.toFixed(2)}`;
    document.getElementById("statTotalEntries").textContent = userExpenses.length;

    // Calculate Top Category
    const catMap = {};
    userExpenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
    const topCat = Object.keys(catMap).reduce((a, b) => catMap[a] > catMap[b] ? a : b, "N/A");
    document.getElementById("statTopCategory").textContent = topCat;

    // Render Table
    renderExpensesTable(userExpenses);

    // Render Chart
    renderChart(catMap);
}

function renderExpensesTable(dataList) {
    const query = searchInput.value.toLowerCase();
    const selectedCat = filterCategory.value;

    const filtered = dataList.filter(e => {
        const matchesSearch = e.description.toLowerCase().includes(query) || e.category.toLowerCase().includes(query);
        const matchesCat = selectedCat === "ALL" || e.category === selectedCat;
        return matchesSearch && matchesCat;
    });

    expenseTableBody.innerHTML = filtered.length === 0 
        ? `<tr><td colspan="5" class="p-4 text-center text-gray-400">No expenses recorded yet.</td></tr>`
        : filtered.map(e => `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="p-3">${e.date}</td>
                <td class="p-3"><span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-semibold">${e.category}</span></td>
                <td class="p-3">${e.description}</td>
                <td class="p-3 font-semibold text-red-600 dark:text-red-400">₹${e.amount.toFixed(2)}</td>
                <td class="p-3 text-right">
                    <button onclick="deleteExpense('${e.id}')" class="text-red-500 hover:text-red-700 p-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join("");

    lucide.createIcons();
}

searchInput.addEventListener("input", () => renderUserDashboard());
filterCategory.addEventListener("change", () => renderUserDashboard());

function deleteExpense(expId) {
    expenses = expenses.filter(e => e.id !== expId);
    saveData();
    renderUserDashboard();
    showAlert("Expense entry removed.", "info");
}

function renderChart(catMap) {
    const ctx = document.getElementById("expenseChart").getContext("2d");
    if (chartInstance) chartInstance.destroy();

    const labels = Object.keys(catMap);
    const data = Object.values(catMap);

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ["No Data"],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// Export CSV
exportCsvBtn.addEventListener("click", () => {
    const userExpenses = expenses.filter(e => e.userId === currentUser.id);
    if (!userExpenses.length) return showAlert("No data available to export.", "error");

    let csv = "ID,Date,Category,Description,Amount\n";
    userExpenses.forEach(e => {
        csv += `"${e.id}","${e.date}","${e.category}","${e.description}",${e.amount}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${currentUser.username}.csv`;
    a.click();
});

// --- ADMIN PANEL LOGIC ---
function renderAdminPanel() {
    adminUsersTableBody.innerHTML = users.map(u => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
            <td class="p-3 text-xs font-mono">${u.id}</td>
            <td class="p-3 font-medium">${u.name}</td>
            <td class="p-3">${u.username}</td>
            <td class="p-3">${u.email}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded text-xs ${u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}">${u.role}</span></td>
            <td class="p-3 text-xs">${u.lastLogin || 'Never'}</td>
            <td class="p-3 font-semibold">${u.loginCount || 0}</td>
        </tr>
    `).join("");
}

// --- DATA PERSISTENCE HELPER ---
function saveData() {
    localStorage.setItem("expensetrack_users", JSON.stringify(users));
    localStorage.setItem("expensetrack_expenses", JSON.stringify(expenses));
}