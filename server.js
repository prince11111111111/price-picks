require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE (The Gatekeepers)
app.use(cors()); // Allow your frontend (index.html) to talk to this server
app.use(express.json()); // Allow the server to read JSON data

// ROUTES (Test Route)
app.get('/', (req, res) => {
    res.send('✈️ Price-Picks Server is Running!');
});
// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("🍃 MongoDB Connected Successfully"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));
// START SERVER
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});