import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const UpcomingTrip = () => {
    const [trips, setTrips] = useState([]);
    const { authToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const response = await fetch('http://localhost:5000/trips/newTrip', {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
                const data = await response.json();
                if (response.ok) {
                    setTrips(data);
                } else {
                    console.error('Failed to fetch trips:', data.message);
                }
            } catch (error) {
                console.error('An error occurred while fetching trips:', error);
            }
        };

        fetchTrips();
    }, [authToken]);

    // Function to check if the trip should start based on current date and time
    const isTripStarting = (tripStartDate, tripStartTime) => {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const currentTime = now.toTimeString().slice(0, 5); // Format: HH:mm   
        const tripDate= tripStartDate.split('T')[0];
        console.log("Current ", currentDate, "ctime", currentTime,"---------","tripDate", tripDate, "time", tripStartTime);

        // Check if the current time is after or equal to the trip start time
        return currentDate >=tripDate  && currentTime >=tripStartTime;
    };

    const handleDeleteTrip = async (tripId, index) => {
        try {
            const response = await fetch(`http://localhost:5000/api/trips/upcomingTrip/${tripId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const updatedTrips = trips.filter((_, i) => i !== index);
                setTrips(updatedTrips);
                navigate('/upcomingTrip');
               // alert('Trip deleted successfully!');
            } else {
                const errorData = await response.json();
                alert('Failed to delete trip: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('An error occurred while deleting the trip:', error);
            alert('An error occurred while deleting the trip. Please try again.');
        }
    };

    const handleEditTrip = (trip) => {
        navigate('/newTrip', { state: { trip, isEdit: true } });
    };

    const handleViewTrip = (trip) => {
        navigate('/newTrip', { state: { trip, isReadOnly: true } });
    };

    const handleStartTrip = (trip) => {
        navigate(`/startTrip/${trip._id}`, { state: { trip } });
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-4xl font-extrabold text-center text-green-500 mb-8">Upcoming Trips</h1>

            {trips.length === 0 ? (
                <p className="text-center text-gray-500">No upcoming trips found.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trips.map((trip, index) => (
                        <div
                            key={index}
                            className="bg-white border-2 border-gray-200 p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition"
                            onClick={() => handleViewTrip(trip)} // Navigate to the read-only view
                        >
                            <div className="relative">
                                <h2 className="text-xl font-bold uppercase text-gray-800 mb-4">{trip.tripName}</h2>
                                <p className="text-gray-600"><strong>Trip Budget:</strong> {trip.tripBudget}</p>
                                <p className="text-gray-600"><strong>Start Date:</strong> {trip.tripStartDate}</p>
                                <p className="text-gray-600"><strong>Start Time:</strong> {trip.tripStartTime}</p>
                                <p className="text-gray-600"><strong>Destinations:</strong></p>
                                <ul className="list-disc pl-5 text-gray-600">
                                    {trip.optimizedLocations.map((location, i) => (
                                        <li key={i}>{location}</li>
                                    ))}
                                </ul>
                                {trip.totalDistance && (
                                    <p className="text-gray-600"><strong>Total Distance:</strong> {trip.totalDistance} km</p>
                                )}
                                {trip.totalDuration && (
                                    <p className="text-gray-600"><strong>Estimated Duration:</strong> {trip.totalDuration} minutes</p>
                                )}
                                
                                {/* If the trip is ready to start, show the "Start Trip" button */}
                                {isTripStarting(trip.tripStartDate, trip.tripStartTime) && (
                                    <button
                                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mt-4"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartTrip(trip)
                                        }}
                                    >
                                        Start Trip
                                    </button>
                                )}

                                <div className="absolute top-1 right-4 flex space-x-2">
                                    <button
                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditTrip(trip);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTrip(trip._id, index);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                </div>
            )}
        </div>
    );
};

export default UpcomingTrip;
