import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rideRoutes from './routes/rideRoutes'; // Pure TypeScript import

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 5001;

// ==========================================
// 🛠️ CRITICAL MIDDLEWARE ORDER (DO NOT MOVE)
// ==========================================
app.use(cors({
    origin: true, // Automatically mirrors whatever local port your frontend is running on
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); // Must be BEFORE app.use('/api', ...)
app.use(express.urlencoded({ extended: true }));

// Simple diagnostic route to test browser-to-server connection without DB interference
app.get('/health', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify({ status: "Backend is totally alive, bro!" }));
});

// Link your ride sharing routes matching the "/api" prefix
app.use('/api', rideRoutes);

// Database connection logic
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus-utility';

mongoose.connect(mongoUri)
    .then(() => {
        console.log('🚀 Connected to Integrated Campus Utility Database!');
        app.listen(PORT, () => {
            console.log(`🌍 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ Database connection error:', err);
    });