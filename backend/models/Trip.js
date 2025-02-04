const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    destination: {type: String},
            
    tripStartDate: {type: Date},
    tripStartTime: {type: String},
    tripName: {type: String},
    startDate: {type: Date},
    endDate: {type: Date,},
    expenses: { type: Number,default: 0,},
    tripBudget: {type: Number,default: 0,},
    destinations: [
        {
          name: { type: String},
          lat: { type: Number },
          lng: { type: Number}
        }
      ],     optimizedLocations: { type: [String], default: [] },
    totalDistance: { type: Number, default: null }, // In kilometers
    totalDuration: { type: Number, default: null }, // In minutes
    optimizedRoute: [{
        lat: Number,
        lng: Number,
    }],
        isEmailSent: {type: Boolean, default: false},
    status: String, // 'upcoming' or 'completed'
    createdAt: Date, // Timestamp for when the trip was created
    location: {
        lat: { type: Number,min: -90,
            max: 90, },
        lng: { type: Number, min: -180,
            max: 180, },
    },
});

// Optional: Create a geospatial index if needed for querying nearby trips

module.exports = mongoose.model('Trip', tripSchema);
