const express = require('express');
const app = express();
const port = 3001;
const uploadRoutes = require('./routes/uploadRoutes');

app.use('/api', uploadRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});