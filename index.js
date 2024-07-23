const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

app.use(bodyParser.json());

const users = [
  {
    id: 1,
    username: 'alexnjuguna',
    passwordHash: '$2b$10$WZ7U6...', 
  },
];

const expenses = [
  {
    id: 1,
    userId: 1,
    description: 'Groceries',
    amount: 50,
  },
];

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, '42201215', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token or token expired' });
    }
    req.user = user;
    next();
  });
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  bcrypt.compare(password, user.passwordHash, (err, result) => {
    if (err || !result) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, 'your-secret-key', { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  });
});

app.get('/api/expenses', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const userExpenses = expenses.filter((exp) => exp.userId === userId);
  const totalExpense = userExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  res.json({ totalExpense });
});

app.post('/api/expenses', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { description, amount } = req.body;
  const newExpense = { id: expenses.length + 1, userId, description, amount };
  expenses.push(newExpense);
  res.json({ message: 'Expense added successfully', expense: newExpense });
});

app.put('/api/expenses/:id', authenticateToken, (req, res) => {
  const expenseId = parseInt(req.params.id);
  const { description, amount } = req.body;

  const existingExpense = expenses.find((exp) => exp.id === expenseId);
  if (!existingExpense) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  existingExpense.description = description;
  existingExpense.amount = amount;
  res.json({ message: 'Expense updated successfully', expense: existingExpense });
});

app.delete('/api/expenses/:id', authenticateToken, (req, res) => {
  const expenseId = parseInt(req.params.id);
  const index = expenses.findIndex((exp) => exp.id === expenseId);

  if (index === -1) {
    return res.status(404).json({ message: 'Expense not found' });
  }

  expenses.splice(index, 1);
  res.json({ message: 'Expense deleted successfully' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
