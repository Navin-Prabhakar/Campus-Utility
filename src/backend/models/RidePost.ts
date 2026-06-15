import { Schema, model, Document } from 'mongoose';

export interface IRidePost extends Document {
    poster_name: string;
    poster_email: string;
    roll_number: string;
    phone_number: string;
    route_from: string;
    route_to: string;
    departure_time: Date;
    available_seats: number;
    status: 'Active' | 'Seat Full' | 'Complete' | 'Cancelled';
    created_at: Date;
}

const RidePostSchema = new Schema<IRidePost>({
    poster_name: { type: String, required: true },
    poster_email: { type: String, required: true },
    roll_number: { type: String, required: true },
    phone_number: { type: String, required: true },
    route_from: { type: String, required: true },
    route_to: { type: String, required: true },
    departure_time: { type: Date, required: true },
    available_seats: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['Active', 'Seat Full', 'Complete', 'Cancelled'], 
        default: 'Active' 
    },
    created_at: { type: Date, default: Date.now }
});

export default model<IRidePost>('RidePost', RidePostSchema);