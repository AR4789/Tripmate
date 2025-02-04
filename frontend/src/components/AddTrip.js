import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MapComponent from '../components/MapComponent'; // Import the MapComponent
import './AddTrip.css';

const AddTrip = () => {
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expenses, setExpenses] = useState('');
    const [location, setLocation] = useState(null); // State to store selected location (latitude and longitude)
    const navigate = useNavigate();

    const handleAddTrip = async (e) => {
        e.preventDefault();

        try {
            const userId = '6776571f92c0145f1209b6e4'; // Replace with actual user ID or retrieve dynamically
            const newTrip = {
                userId,
                destination,
                startDate,
                endDate,
                expenses,
                location: location ? { lat: location.lat, lng: location.lng } : null, // Ensure location is included properly
            };

            const token = localStorage.getItem('token');

            // Make the API request with token in headers
            const response = await axios.post(
                'http://localhost:5000/api/trips/add', 
                newTrip, 
                {
                    headers: {
                        Authorization: `Bearer ${token}` // Include token in Authorization header
                    }
                }
            );

            console.log(response.data);
            alert('Trip added successfully!');
            navigate('/trips'); // Redirect to the trips page after adding the trip
        } catch (error) {
            console.error('Failed to add trip', error);
            alert('Error adding trip. Please try again.');
        }
    };

         

    return (
        <div className="add-trip-page">
            <h1>Add a New Trip</h1>
            <form onSubmit={handleAddTrip}>
                <div>
                    <label>Destination:</label>
                    <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Start Date:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>End Date:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Expenses:</label>
                    <input
                        type="number"
                        value={expenses}
                        onChange={(e) => setExpenses(e.target.value)}
                        required
                    />
                </div>
                <div className="map-container">
                    <label>Select Location on Map:</label>
                    <MapComponent
                        markers={location ? [location] : []} // Show marker if location is selected
                        onMapClick={(loc) => setLocation(loc)} // Update location state when map is clicked
                    />
                </div>
                <button type="submit">Add Trip</button>
            </form>
        </div>
    );
};

export default AddTrip;
