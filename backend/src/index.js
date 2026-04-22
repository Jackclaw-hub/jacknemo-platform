const express = require('express');
const app = express();
const auth = require('./auth');
const axios = require('axios');

app.use(express.json());

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Verify username and password
    const user = { username, password };
    const token = auth.generateToken(user);
    res.json({ token });
});

app.post('/verify', (req, res) => {
    const { token } = req.body;
    const decoded = auth.verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });
    res.json({ message: 'Token is valid' });
});

app.post('/generate-secret', (req, res) => {
    const secret = auth.generateSecret();
    res.json({ secret });
});

app.post('/verify-code', (req, res) => {
    const { user, code } = req.body;
    const verified = auth.verifyCode(user, code);
    if (!verified) return res.status(401).json({ error: 'Invalid code' });
    res.json({ message: 'Code is valid' });
});

const port = 3001;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});