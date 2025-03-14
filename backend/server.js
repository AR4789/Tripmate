const express=require("express");
const cors=require("cors");
const mongoose=require("mongoose");
const dotenv=require("dotenv");
const jwt=require("jsonwebtoken");
const axios=require("axios");
const bodyParser = require('body-parser');
const testRoutes = require('./routes/testRoutes');
const authRoutes = require('./routes/authRoutes');
const tripRoutes = require('./routes/tripRoutes');
const TripModel= require('./models/Trip');
const UserModel= require('./models/User');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const cron=require('node-cron');

dotenv.config();
const app=express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '10mb' })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ limit: '10mb' , extended: true }));
app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);


mongoose.connect(process.env.MONGO_URI, {
}).then(()=>console.log("Connected to MongoDB"))
  .catch((err)=>console.error(err));

app.get("/", (req,res)=> res.send("TripMate is running"));


const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1]; // Get token from Authorization header
  if (!token) {
    console.log("No token provided");
    return res.sendStatus(401); // Unauthorized
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("Token verification failed:", err);
      return res.sendStatus(403); // Forbidden
    }
    req.user = user; // Attach user info to request\
    next();
  });
};

app.post("/api/trips/add", authenticateToken, async (req, res) => {
  const { destination, startDate, endDate, expenses, location } = req.body;
  const userId = req.user.userId;
  const status='completed';
 // console.log('Request Body:', req.body);  // Log request body for debugging
  
  try {
    const newTrip = new TripModel({
      userId,
      status,
      destination,
      startDate,
      endDate,
      expenses,
      location: location ? { lat: location.lat, lng: location.lng } : null, // Ensure location is included properly
    });
    await newTrip.save();
    res.status(201).json(newTrip);
  } catch (error) {
    console.error('Error adding trip:', error);
    res.status(500).json({ message: "Error adding trip", error: error.message });
  }
});

app.get('/api/trips/:userId',authenticateToken, async (req, res) => {
  try {
      const trips = await TripModel.find({ userId: req.params.userId });
      
      res.json(trips);
  } catch (error) {
      res.status(500).json({ message: 'Failed to fetch trips', error });
  }
});



function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


app.post('/optimize/route', authenticateToken,async (req, res) => {
  const { destinations } = req.body;




  if (destinations.length < 2) {
      return res.status(400).json({ message: 'At least two destinations are required.' });
  }

  if (destinations.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 locations are allowed.' });
  }
  try {
      const origin = destinations[0];

      // Step 1: Calculate distances from the origin
      const distances = destinations.map((location, index) => ({
          index,
          distance: haversineDistance(origin.lat, origin.lng, location.lat, location.lng),
          location,
      }));

      // Step 2: Sort locations by distance from the origin
      distances.sort((a, b) => a.distance - b.distance);

      // Step 3: Create the sorted route
      const sortedRoute = distances.map((item) => item.location);

      // Step 4: Use OSRM to optimize the sorted route
      const coordinates = sortedRoute
          .map((point) => `${point.lng},${point.lat}`)
          .join(';');
      const response = await axios.get(`http://router.project-osrm.org/route/v1/driving/${coordinates}`, {
          params: {
              overview: 'full',
              geometries: 'geojson',
          },
      });

      if (response.data.routes && response.data.routes.length > 0) {
          const optimizedRoute = response.data.routes[0].geometry.coordinates.map((coord) => ({
              lat: coord[1],
              lng: coord[0],
          }));

          const totalDistance = response.data.routes[0].distance / 1000; // km
          const totalDuration = response.data.routes[0].duration / 60; // minutes

          const TOLERANCE = 0.0001;

          // Match optimized coordinates with the original destinations and get names
         // Step 5: Extract location names by matching coordinates
const coordinatePairs = coordinates.split(';'); // Split coordinates string into an array
const optimizedLocations = coordinatePairs.map((pair) => {
    const [lng, lat] = pair.split(',').map(Number); // Split and parse lng, lat
    const matchingDestination = destinations.find(destination => {
        const latMatch = Math.abs(destination.lat - lat) < TOLERANCE;
        const lngMatch = Math.abs(destination.lng - lng) < TOLERANCE;
        return latMatch && lngMatch;
    });
    return matchingDestination ? matchingDestination.name : null; // Return name or null
}).filter(name => name !== null); // Remove null values

       

          res.json({
              sortedRoute,
              optimizedRoute,
              optimizedLocations,
              destinations,
              totalDistance: totalDistance.toFixed(2),
              totalDuration: totalDuration.toFixed(2),
          });
      } else {
          res.status(500).json({ message: 'Failed to optimize the route.' });
      }
  } catch (error) {
      res.status(500).json({ message: 'An error occurred while optimizing the route.' });
      console.error(error);
  }
});

// Save a trip
app.post('/trips/newTrip', authenticateToken, async (req, res) => {
  try {
      const {
          tripName,
          tripBudget,
          tripStartDate,
          tripStartTime,
          destinations,
          optimizedLocations,
          optimizedRoute,
          totalDistance,
          totalDuration,
      } = req.body;
const status='upcoming';
const userId=req.user.userId;
      // Validate the incoming data

      if (!tripName || !tripBudget || !tripStartDate || !tripStartTime || !destinations) {
          return res.status(400).json({ message: 'All required fields must be provided.' });
      }


      // Create a new Trip object
      const newTrip = new TripModel({
        userId,
          tripName,
          status,
          tripBudget,
          tripStartDate,
          tripStartTime,
          destinations,
          optimizedLocations,
          optimizedRoute,
          totalDistance,
          totalDuration,
      });

      console.log(JSON.stringify(destinations));

      // Save the trip to the database
      const savedTrip = await newTrip.save();
      res.status(201).json(savedTrip);
  } catch (error) {
      console.error('Error saving the trip:', error);
      res.status(500).json({ message: 'Failed to save trip.', error });
  }
});


// Get all trips
app.get('/trips/newTrip', authenticateToken,async (req, res) => {
  try {

      const userId=req.user.userId
      const trips = await TripModel.find({userId:userId}); // Retrieve all trips from the database
      res.status(200).json(trips);
  } catch (error) {
      console.error('Error retrieving trips:', error);
      res.status(500).json({ message: 'Failed to retrieve trips.', error });
  }
});



// Schedule email for a trip
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
      user: 'amanr1871@gmail.com',
      pass: 'owgu bpnt qchj evzy',
  },
});

// Scheduled task (runs every minute)
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const currentTime = now.toTimeString().slice(0, 5); // Format: HH:mm

 // console.log("Date and time", currentDate,"  tt", currentTime);

  try {
      const trips = await TripModel.find({
          tripStartDate: currentDate,
          tripStartTime: currentTime,
          isEmailSent: false,
      });

      trips.forEach(async (trip) => {
          console.log(`Sending email for trip: ${trip.tripName}`);

          const user = await UserModel.findById(trip.userId); // Use findById to get a single document
          if (!user) {
              throw new Error('User not found'); // Handle case where user doesn't exist
          }
          
          const mailOptions = {
              from: 'amanr1871@gmail.com',
              to: user.email, // Ensure userMail exists in the UserModel schema
              subject: 'Your Trip is Starting Soon!',
              text: `Hello ${user.name}, your trip "${trip.tripName}" is starting at ${trip.tripStartTime}. Have a great journey!`,
          };

          transporter.sendMail(mailOptions, async (error, info) => {
              if (error) {
                  console.error('Error sending email:', error);
              } else {
                  console.log('Email sent:', info.response);

                  // Mark the trip as email sent
                  trip.isEmailSent = true;
                  await trip.save();
              }
          });
      });
  } catch (error) {
      console.error('Error fetching trips:', error);
  }
});



const apiKey = "AIzaSyDQIuSgbM1ww8UvtG7BQczqCjQPUifhwSs"; // Replace with your actual API key

app.get("/places", async (req, res) => {
    const { searchType, searchQuery, lat, lng, lowerRange, searchDistance } = req.query;

    console.log(req.query);
    if (!searchType || !searchQuery || !lat || !lng || !searchDistance) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    let placesUrl = "";

    if (searchType === "in") {
        placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=tourist+attractions+in+${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    } else {
        placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${searchDistance * 1000}&type=tourist_attraction&key=${apiKey}`;
    }

    try {
        let allPlaces = [];
        let nextPageToken = null;

        do {
            const response = await axios.get(placesUrl);
            if (response.data.results) {
                allPlaces = allPlaces.concat(response.data.results);
            }

            nextPageToken = response.data.next_page_token;

            // Wait before making the next request (API requires a short delay)
            if (nextPageToken) {
                await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 sec delay
                placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${searchDistance * 1000}&type=tourist_attraction&key=${apiKey}&pagetoken=${nextPageToken}`;
            }

        } while (nextPageToken && allPlaces.length < 60);

        // ✅ **Filter places based on `lowerRange`**
        const filteredPlaces = allPlaces.filter((place) => {
            const placeLat = place.geometry.location.lat;
            const placeLng = place.geometry.location.lng;
            const distance = getDistanceFromLatLonInKm(lat, lng, placeLat, placeLng);
            return distance >= lowerRange && distance <= searchDistance;
        });

        res.json({ results: filteredPlaces });
    } catch (error) {
        console.error("Error fetching places:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch places" });
    }
});



function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}







app.listen(5000, ()=>console.log("Server is running"));