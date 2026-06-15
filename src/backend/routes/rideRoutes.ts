import { Router, Request, Response } from 'express';
import RidePost from '../models/RidePost'; // Clean TypeScript import

const router = Router();

// 1. POST A RIDE (with automatic roll number extraction from IITP email)
router.post('/post-ride', async (req: Request, res: Response): Promise<void> => {
    try {
        const { poster_name, poster_email, phone_number, route_from, route_to, departure_time, available_seats } = req.body;

        // 🛠️ Guard rails to extract roll numbers cleanly without throwing execution index errors
        let extractedRoll = "N/A";
        if (poster_email && poster_email.includes('@') && poster_email.includes('_')) {
            const emailParts = poster_email.split('@')[0].split('_');
            extractedRoll = emailParts[emailParts.length - 1].toUpperCase();
        } else if (poster_email) {
            extractedRoll = poster_email.split('@')[0].toUpperCase(); 
        }

        const newRide = new RidePost({
            poster_name,
            poster_email,
            roll_number: extractedRoll,
            phone_number,
            route_from,
            route_to,
            departure_time: new Date(departure_time),
            available_seats
        });

        await newRide.save();
        res.status(201).json({ message: "Ride posted successfully!", ride: newRide });
    } catch (error) {
        console.error("Error creating ride post:", error);
        res.status(500).json({ error: "Failed to create ride post." });
    }
});

// 2. GET ACTIVE RIDES (Dashboard: Shows rides up to 2 hours post-departure)
router.get('/active-rides', async (req: Request, res: Response): Promise<void> => {
    console.log("📥 [API Request] Received request for active-rides dashboard...");
    try {
        const currentTime = new Date();
        const twoHoursAgo = new Date(currentTime.getTime() - (2 * 60 * 60 * 1000));

        const rides = await RidePost.find({
            departure_time: { $gte: twoHoursAgo },
            status: 'Active'
        }).sort({ departure_time: 1 });

        console.log(`📦 [Database Query] Successfully retrieved ${rides?.length || 0} active listings.`);

        // 🛠️ Standardized output using native Express json parser to avoid stream blocks
        res.status(200).json(rides || []);
        return;
        
    } catch (error) {
        console.error("❌ CRITICAL error inside active-rides fetch handler:", error);
        res.status(500).json({ error: "Failed to fetch active rides.", details: String(error) });
    }
});

// 3. GET USER'S HISTORY ("My Rides" button)
router.get('/my-rides', async (req: Request, res: Response): Promise<void> => {
    try {
        const userEmail = req.query.email as string; 
        
        if (!userEmail) {
            res.status(400).json({ error: "Email query parameter is required." });
            return;
        }

        const userHistory = await RidePost.find({ poster_email: userEmail }).sort({ departure_time: -1 });
        res.status(200).json(userHistory);
    } catch (error) {
        console.error("Error fetching user history:", error);
        res.status(500).json({ error: "Failed to fetch ride history." });
    }
});

// 4. UPDATE A RIDE STATUS (Edit details or mark as Cancelled / Seat Full / Complete)
router.put('/update-ride/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const rideId = req.params.id;
        const updatedRide = await RidePost.findByIdAndUpdate(rideId, req.body, { new: true });
        
        if (!updatedRide) {
            res.status(404).json({ error: "Ride post not found." });
            return;
        }

        res.status(200).json({ message: "Ride updated successfully!", updatedRide });
    } catch (error) {
        console.error("Error updating ride:", error);
        res.status(500).json({ error: "Failed to update ride." });
    }
});

export default router;