import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rideRoutes from './routes/rideRoutes'; // Pure TypeScript import

// 🛠️ Look for cloud platform native variables first, gracefully checks local environment next
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ==========================================
// 🛠️ CRITICAL MIDDLEWARE ORDER (DO NOT MOVE)
// ==========================================

// 🛠️ Configured to securely bridge local environments and your live production Vercel site
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://campus-utility-cw41.vercel.app' 
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // Allows system tools or headless routing tests
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS policy, bro!'));
        }
    },
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

// Separated database connection handler to ensure stability across serverless containers
mongoose.connect(mongoUri)
    .then(() => {
        console.log('🚀 Connected to Integrated Campus Utility Database (Cloud Atlas)!');
    })
    .catch((err) => {
        console.error('❌ Database connection error:', err);
    });

// Start listening immediately
app.listen(PORT, () => {
    console.log(`🌍 Server running on port ${PORT}`);
});

export default app;