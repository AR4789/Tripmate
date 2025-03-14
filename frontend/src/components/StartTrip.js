import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import MapComponent from './MapComponent';
import { useAuth } from './AuthContext';

const StartTrip = () => {
    const { authToken } = useAuth();
    const { tripId } = useParams();
    const location = useLocation();
    const [trip, setTrip] = useState(location.state?.trip || null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [loading, setLoading] = useState(!trip);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [userHeading, setUserHeading] = useState(null); // Track direction
    const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0);
    

    useEffect(() => {
        const fetchTrip = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/trips/startTrip/${tripId}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch trip data');
                }

                const tripData = await response.json();
                setTrip(tripData);
            } catch (err) {
                console.error("Error fetching trip data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (!trip && tripId) {
            fetchTrip();
        } else {
            setLoading(false);
        }
    }, [tripId, authToken]);

    const handleStartNavigation = () => {
        setIsNavigating(true);
    
        if (trip && trip.destinations.length > 0) {
            const startLocation = trip.destinations[0]; // First destination as starting point
            setUserLocation({ lat: startLocation.lat, lng: startLocation.lng });
        }
    
        trackUserLocation();
    };
    

    let firstAccuratePosition = false; // Track whether we have a good GPS fix

const trackUserLocation = () => {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy, heading } = position.coords;
                console.log("Raw Position Data =====", position.coords);

                // Ignore inaccurate first readings (accuracy > 50 meters)
                if (accuracy > 50 && !firstAccuratePosition) {
                    console.warn("Skipping inaccurate location...");
                    return; // Skip this update
                }

                firstAccuratePosition = true; // Mark first accurate position
                
                setUserLocation({ lat: latitude, lng: longitude });

                if (heading !== null) {
                    setUserHeading(heading);
                }

                checkIfDestinationReached(latitude, longitude);
            },
            (error) => {
                console.error("Error getting location:", error);
                setError(`Location error: ${error.message}`);
            },
            {
                enableHighAccuracy: true,  // Get the most accurate location possible
                maximumAge: 0,             // Prevent caching of old positions
                timeout: 30000             // Increase timeout to 30 seconds
            }
        );
    } else {
        setError("Geolocation is not supported by this browser.");
    }
};

    const checkIfDestinationReached = (lat, lng) => {
        if (!trip || !trip.destinations.length) return;

        const currentDestination = trip.destinations[currentDestinationIndex];

        const distance = getDistanceFromLatLonInKm(lat, lng, currentDestination.lat, currentDestination.lng);

        console.log(`Distance to ${currentDestination.name}: ${distance} km`);

        if (distance < 0.1) { // If within 100 meters
            alert(`You have reached ${currentDestination.name}`);
            if (currentDestinationIndex < trip.destinations.length - 1) {
                setCurrentDestinationIndex(currentDestinationIndex + 1);
            } else {
                alert("You have reached your final destination!");
                setIsNavigating(false);
            }
        }
    };

    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    const handleExitNavigation = () => {
        setIsNavigating(false);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!trip || !trip.destinations) return <div>No trip data available.</div>;

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-4xl font-extrabold text-center text-green-500 mb-8">Start Your Trip</h1>
            <h2 className="text-2xl font-bold text-black uppercase mb-4">{trip.tripName}</h2>

            <MapComponent
                markers={trip.destinations}
                route={trip.optimizedRoute}
                showSearchBar={false}
                userLocation={userLocation}
                userHeading={userHeading} // Pass heading to MapComponent
            />

            <div className="flex justify-center mt-6">
                {!isNavigating ? (
                    <button className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600" onClick={handleStartNavigation}>
                        Let's Go
                    </button>
                ) : (
                    <button className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600" onClick={handleExitNavigation}>
                        Exit Navigation
                    </button>
                )}
            </div>
        </div>
    );
};

export default StartTrip;
