import { Router, Request, Response } from 'express';
import RidePost from '../models/RidePost'; // Clean TypeScript import

const router = Router();

// 1. POST A RIDE (with robust validation, type casting, and explicit status fallback)
router.post('/post-ride', async (req: Request, res: Response): Promise<void> => {
    console.log("📤 [API Request] Incoming payload to /post-ride:", req.body);
    try {
        const { poster_name, poster_email, phone_number, route_from, route_to, departure_time, available_seats } = req.body;

        // 🛠️ Guard rails: If any vital field is blank, reject it before it hits MongoDB rules
        if (!poster_email || !phone_number || !route_from || !route_to || !departure_time) {
            console.error("❌ Validation Failed: Missing mandatory payload fields.");
            res.status(400).json({ error: "Please fill out all required fields, bro!" });
            return;
        }

        // 🛠️ Highly resilient roll number extraction from IITP email
        let extractedRoll = "STUDENT";
        if (poster_email && poster_email.includes('@')) {
            const emailPrefix = poster_email.split('@')[0];
            if (emailPrefix.includes('_')) {
                const emailParts = emailPrefix.split('_');
                extractedRoll = emailParts[emailParts.length - 1].toUpperCase();
            } else {
                extractedRoll = emailPrefix.toUpperCase();
            }
        }

        // 🛠️ Robust Date parsing validation to stop "Invalid Date" MongoDB crashes
        const parsedDate = new Date(departure_time);
        if (isNaN(parsedDate.getTime())) {
            console.error(`❌ Date Parsing Failed for value: ${departure_time}`);
            res.status(400).json({ error: "Invalid departure time format signature." });
            return; // 👈 Fixed: Safely cuts off execution path if format is garbage
        }

        // 🛠️ Creating document with STRICT primitive casting for Cloud Atlas
        const newRide = new RidePost({
            poster_name: poster_name || "IITP Student",
            poster_email,
            roll_number: extractedRoll,
            phone_number: String(phone_number).trim(),
            route_from,
            route_to,
            departure_time: parsedDate,
            available_seats: Number(available_seats) || 1, 
            status: 'Active' 
        });

        await newRide.save();
        console.log("🚀 [Database Success] New ride post successfully synchronized!");
        res.status(201).json({ message: "Ride posted successfully!", ride: newRide });
    } catch (error) {
        console.error("❌ CRITICAL Schema Validation / Save failure inside post-ride:", error);
        res.status(400).json({ error: "Failed to create ride post due to database schema rules.", details: String(error) });
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
        
        const updateData = { ...req.body };
        if (updateData.available_seats) updateData.available_seats = Number(updateData.available_seats);

        const updatedRide = await RidePost.findByIdAndUpdate(rideId, updateData, { new: true });
        
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

// 5. 🗑️ PERMANENTLY EVICT/DELETE A RIDE POST FROM THE DATABASE
router.delete('/delete-ride/:id', async (req: Request, res: Response): Promise<void> => {
    console.log(`🗑️ [API Request] Received global deletion command for Ride ID: ${req.params.id}`);
    try {
        const rideId = req.params.id;
        const cleanRideId = String(rideId);

        // 🛡️ Safety check: Ensure the string fits standard MongoDB ObjectId 24-character hex requirements
        if (!cleanRideId.match(/^[0-9a-fA-F]{24}$/)) {
            console.error("❌ Deletion Stopped: Malformed ObjectId payload structure.");
            res.status(400).json({ error: "Malformed document ID reference parameter structure." });
            return;
        }

        const deletedRide = await RidePost.findByIdAndDelete(cleanRideId);

        if (!deletedRide) {
            console.warn(`⚠️ [Database Warning] Ride ID ${cleanRideId} not found in collection (may have already been deleted).`);
            res.status(404).json({ error: "Ride post not found or already cleared, bro." });
            return;
        }

        console.log(`✅ [Database Success] Ride ID ${cleanRideId} completely wiped from cloud cluster.`);
        res.status(200).json({ success: true, message: "Ride request completely removed from database." });
    } catch (error) {
        console.error("❌ CRITICAL error inside delete-ride handler:", error);
        res.status(500).json({ error: "Internal database failure handling record deletion.", details: String(error) });
    }
});

export default router;