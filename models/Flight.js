const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
    user: {type:mongoose.Schema.Types.ObjectId, ref:"User", required:true},
    airline: { type: String, required: true },
    departure_airport: { type: String, required: true },
    arrival_airport: { type: String, required: true },
    departure_time: { type: String, required: true },
    arrival_time: { type: String, required: true },
    flight_length: { type: String, required: true },
    stops: { type: Number, required: true },
    date: { type: String, required: true },
    price: { type: Number, required: true },
    picked_price: { type: Number, required: true },
    lowest_price: { type: Number, default: 0},
},{ timestamps: true });

const Flight = mongoose.model('Flight', flightSchema);

module.exports = Flight;