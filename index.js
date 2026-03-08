// index.js (Main folder)

const express = require('express');
const app = express();
const PORT = 5000;

// MUST match exactly what you typed in App.js fetch()
app.get('/api/message', (req, res) => {
    res.json({ text: "Hello from the Flexroom Backend!" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});