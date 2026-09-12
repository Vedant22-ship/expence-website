const form = document.getElementById('expense-form');
const titleInput = document.getElementById('title');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const expenseList = document.getElementById('expense-list');
const totalAmountDisplay = document.getElementById('total-amount');

let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

function updateUI() {
  expenseList.innerHTML = '';
  let total = 0;

  expenses.forEach((item, index) => {
    total += parseFloat(item.amount);

    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <span class="cat">${item.category}</span>
      </div>
      <div>
        <span>₹${parseFloat(item.amount).toFixed(2)}</span>
        <button class="delete-btn" onclick="removeExpense(${index})">X</button>
      </div>
    `;
    expenseList.appendChild(li);
  });

  totalAmountDisplay.textContent = `₹${total.toFixed(2)}`;
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const newExpense = {
    title: titleInput.value,
    amount: amountInput.value,
    category: categoryInput.value
  };

  expenses.push(newExpense);
  updateUI();

  titleInput.value = '';
  amountInput.value = '';
});

function removeExpense(index) {
  expenses.splice(index, 1);
  updateUI();
}

updateUI();