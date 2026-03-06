const express = require('express');
const app = express();
const PORT = 5000;

// This is a "Route". When you visit http://localhost:5000, you'll see this.
app.get('/', (req, res) => {
    res.send('Flexroom Backend is officially up and running!');
});

app.listen(PORT, () => {
    console.log(`Server is live at http://localhost:${PORT}`);
});