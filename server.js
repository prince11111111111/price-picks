require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Flight = require('./models/Flight');
const app = express();
const PORT = process.env.PORT || 3000;
const authRoutes = require('./routes/authRoutes');
const verifyToken = require('./middleware/authMiddleware');
// MIDDLEWARE (The Gatekeepers)
app.use(cors()); // Allow your frontend (index.html) to talk to this server
app.use(express.json()); // Allow the server to read JSON data

// ROUTES 
app.post('/api/watchlist', verifyToken, async (req, res) => {
    try {
        const newFlight = new Flight({
            ...req.body,
            user: req.user.userId
        });
        
        const savedFlight = await newFlight.save();
        res.status(201).json(savedFlight);
    } catch (error) {
        res.status(500).json({ error: "Failed to save flight" });
    }
});

app.get('/api/watchlist', verifyToken, async (req, res) => {
    try {
        const flights = await Flight.find({ user: req.user.userId }).sort({ createdAt: -1 });
        
        res.status(200).json(flights);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch flights" });
    }
});

app.delete('/api/watchlist/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        await Flight.findByIdAndDelete(id);
        res.status(200).json({ message: "Flight deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete flight" });
    }
});

app.put('/api/watchlist/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { picked_price } = req.body; 
        
        await Flight.findByIdAndUpdate(id, { picked_price });
        
        res.status(200).json({ message: "Price updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update price" });
    }
});

app.use('/api/auth', authRoutes);

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch((err) => console.error("MongoDB Connection Error:", err));

// START SERVER
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});