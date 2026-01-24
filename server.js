require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Flight = require('./models/Flight');

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE (The Gatekeepers)
app.use(cors()); // Allow your frontend (index.html) to talk to this server
app.use(express.json()); // Allow the server to read JSON data

// ROUTES 

app.post('/api/watchlist', async (req, res) => {
    try {
        // req.body contains the JSON sent from the frontend
        const newFlight = new Flight(req.body);
        
        // .save() is a Mongoose method to insert into the DB
        const savedFlight = await newFlight.save();

        // 201 = Created Successfully
        res.status(201).json(savedFlight);
        console.log("Flight Saved to DB:", savedFlight._id);
    } catch (error) {
        // 500 = Server Error
        res.status(500).json({ error: "Failed to save flight" });
        console.error("Save Error:", error.message);
    }
});

app.get('/api/watchlist', async (req, res) => {
    try {
        // Mongoose: .find() with no arguments returns everything
        const flights = await Flight.find().sort({ createdAt: -1 }); // Newest first
        res.status(200).json(flights);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch flights" });
    }
});

app.delete('/api/watchlist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Flight.findByIdAndDelete(id);
        res.status(200).json({ message: "Flight deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete flight" });
    }
});

app.put('/api/watchlist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { picked_price } = req.body; // We only expect the new price
        
        // Find by ID and update only the picked_price field
        await Flight.findByIdAndUpdate(id, { picked_price });
        
        res.status(200).json({ message: "Price updated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update price" });
    }
});

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch((err) => console.error("MongoDB Connection Error:", err));

// START SERVER
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});