require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Flight = require('./models/Flight');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const app = express();
const PORT = process.env.PORT || 3000;
const jwt = require('jsonwebtoken');

// MIDDLEWARE (The Gatekeepers)
app.use(cors()); // Allow your frontend (index.html) to talk to this server
app.use(express.json()); // Allow the server to read JSON data
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next(); 

    } catch (error) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

// ROUTES 

app.post('/api/watchlist', verifyToken, async (req, res) => {
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

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({email});

        if (existingUser) {
            return res.status(400).json({ message: "User Already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: req.body.username,
            email: email,
            password: hashedPassword 
        });
        await newUser.save();
        res.status(201).json({ message: "User created successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({email});

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.json({ token, userId: user._id });

    } catch (error) {
        res.status(500).json({ message: "Server Error" });
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