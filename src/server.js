const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const balanceRoute = require('./routes/balanceRoute');
const transactionsRoute = require('./routes/transactionsRoute');
app.use('/',balanceRoute)
app.use('/',transactionsRoute)

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server chạy tại: http://localhost:${port}`);
});
