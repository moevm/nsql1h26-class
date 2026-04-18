const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('API Node.js работает');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${port}`);
});
