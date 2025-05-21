require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB!"))
    .catch(err => console.error("MongoDB connection error:", err));

// Define Schema
const bookingSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    middleName: String,
    lastName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    instructor: { 
        type: String, 
        required: true,
        enum: ['Mary Grace', 'Jhon Bem']
    },
    date: { type: Date, required: true },
    ageAtBooking: Number
}, { timestamps: true });

// Age validation middleware
bookingSchema.pre('save', function(next) {
    const birthDate = new Date(this.birthDate);
    const lessonDate = new Date(this.date);

    const age = lessonDate.getFullYear() - birthDate.getFullYear();
    const m = lessonDate.getMonth() - birthDate.getMonth();
    this.ageAtBooking = (m < 0 || (m === 0 && lessonDate.getDate() < birthDate.getDate())) 
        ? age - 1 
        : age;

    if (this.ageAtBooking < 2 || this.ageAtBooking > 100) {
        return next(new Error('Invalid age for swimming lessons'));
    }

    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

// Middleware
app.use(cors());
app.use(express.json());

// POST Booking (merged version)
app.post("/api/bookings", async (req, res) => {
    try {
        const { firstName, middleName, lastName, birthDate, instructor, date } = req.body;

        if (!firstName || !lastName || !birthDate || !instructor || !date) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const lessonDate = new Date(date);
        const currentDate = new Date();

        if (lessonDate < currentDate) {
            return res.status(400).json({
                success: false,
                message: "Lesson date must be in the future"
            });
        }

        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 5);
        if (lessonDate > maxDate) {
            return res.status(400).json({
                success: false,
                message: "We only accept bookings up to 5 years in advance"
            });
        }

        const newBooking = new Booking({
            firstName,
            middleName,
            lastName,
            birthDate,
            instructor,
            date
        });

        await newBooking.save();

        res.status(201).json({
            success: true,
            message: "Booking successful!",
            booking: newBooking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error saving booking",
            error: error.message
        });
    }
});

// GET Bookings
app.get("/api/bookings", async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 }).limit(10);
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error: error.message
        });
    }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client', 'index.html'));
    });
}

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
