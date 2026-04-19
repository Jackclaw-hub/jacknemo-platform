const express = require('express');
const app = express();
const foundersRouter = require('./routes/founders');

app.use('/api/founders', foundersRouter);

module.exports = app;