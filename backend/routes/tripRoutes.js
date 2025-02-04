const express = require('express');
const Trip = require('../models/Trip');
const router = express.Router();

// Add a new trip
// router.post('/add', async (req, res) => {
//     const { userId, destination, startDate, endDate, expenses } = req.body;

//     try {
//         const newTrip = new Trip({ userId, destination, startDate, endDate, expenses });
//         await newTrip.save();

//         res.status(201).json({ message: 'Trip added successfully', trip: newTrip });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to add trip' });
//     }
// });

// Get trips for a user
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const trips = await Trip.find({ userId });
        res.status(200).json(trips);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
});

// Update a trip
router.put('/completed/:tripId', async (req, res) => {
    const { tripId } = req.params;
    const { destination, startDate, endDate, expenses } = req.body;
  
    try {
        const updatedTrip = await Trip.findByIdAndUpdate(
            tripId,
            { destination, startDate, endDate, expenses },
            { new: true }
        );
        res.status(200).json(updatedTrip);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update trip' });
    }
  });
  
  // Delete a trip
  router.delete('/:tripId', async (req, res) => {
    const { tripId } = req.params;
  
    try {
        await Trip.findByIdAndDelete(tripId);
        res.status(200).json({ message: 'Trip deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete trip' });
    }
  });
  

  router.delete('/upcomingTrip/:id', async (req, res) => {
    try {
        const { id } = req.params;
  
        const deletedTrip = await Trip.findByIdAndDelete(id); // Deletes the trip by its ID
  
        if (!deletedTrip) {
            return res.status(404).json({ message: 'Trip not found.' });
        }
  
        res.status(200).json({ message: 'Trip deleted successfully.' });
    } catch (error) {
        console.error('Error deleting the trip:', error);
        res.status(500).json({ message: 'Failed to delete the trip.', error });
    }
  });


  router.get('/startTrip/:tripId', async (req, res) => {
    try {
        const { tripId } = req.params;
        const trip = await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        res.json(trip);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/upcoming/:tripId', async (req, res) => {
    const { tripId } = req.params;
    const { tripName, tripBudget, tripStartDate, tripStartTime, destinations, optimizedLocations, optimizedRoute, totalDistance, totalDuration } = req.body;

    try {
        const updatedTrip = await Trip.findByIdAndUpdate(
            tripId,
            {
                tripName,
                tripBudget,
                tripStartDate,
                tripStartTime,
                destinations,
                optimizedLocations,
                optimizedRoute,
                totalDistance,
                totalDuration
            },
            { new: true } // Return the updated document
        );

        if (!updatedTrip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        res.status(200).json(updatedTrip);
    } catch (error) {
        console.error('Error updating trip:', error);
        res.status(500).json({ error: 'Failed to update trip' });
    }
});


module.exports = router;
