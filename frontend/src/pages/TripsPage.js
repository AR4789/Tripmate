import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MapComponent from '../components/MapComponent';
import ChartComponent from '../components/ChartComponent';
import TripDetails from '../components/TripDetails';

const TripsPage = () => {
    const [trips, setTrips] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const navigate = useNavigate();

    const handleEdit = (trip) => {
        navigate(`/edit-trip/${trip._id}`, { state: { trip } });
    };

    const handleDelete = async (tripId) => {
        const confirm = window.confirm("Are you sure you want to delete this trip?");
        if (confirm) {
            try {
                await axios.delete(`http://localhost:5000/api/trips/${tripId}`);
                setTrips(trips.filter((trip) => trip._id !== tripId));
            } catch (error) {
                console.error("Failed to delete trip:", error);
            }
        }
    };

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const userId = '6776571f92c0145f1209b6e4'; // Replace with actual user ID
                const response = await axios.get(`http://localhost:5000/api/trips/${userId}`);
                setTrips(response.data);
            } catch (error) {
                console.error('Failed to fetch trips');
            }
        };
        fetchTrips();
    }, []);

    const handleSelectTrip = (trip) => {
        setSelectedTrip(trip);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">Your Trips</h1>
            <button
                onClick={() => navigate("/add-trip")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-all"
            >
                Add Trip
            </button>

            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {trips.map((trip) => (
                    <li
                        key={trip._id}
                        className="bg-white border border-gray-200 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                        onClick={() => handleSelectTrip(trip)} // Select trip on click
                    >
                        <h2 className="text-xl font-semibold text-gray-700">{trip.destination}</h2>
                        <p className="text-gray-500">{trip.startDate} - {trip.endDate}</p>
                        <div className="flex justify-between mt-4">
                            <button
                                onClick={() => handleEdit(trip)}
                                className="text-blue-500 hover:underline"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(trip._id)}
                                className="text-red-500 hover:underline"
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {selectedTrip && (
                <div className="mt-8">
                    <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-md">
                        <TripDetails trip={selectedTrip} />
                    </div>

                    <div className="mt-8 bg-white border border-gray-300 p-6 rounded-lg shadow-md">
                        <MapComponent
                            markers={
                                selectedTrip.location
                                    ? [{ lat: selectedTrip.location.lat, lng: selectedTrip.location.lng }]
                                    : []
                            }
                        />
                    </div>
                </div>
            )}

            {trips.length > 0 && (
                <div className="mt-8 w-1/2 h-">
                    <ChartComponent data={trips} />
                </div>
            )}
        </div>
    );
};

export default TripsPage;
