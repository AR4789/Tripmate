import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MapComponent from './MapComponent'; // Assuming MapComponent is implemented
import { useAuth } from './AuthContext'; // Import the custom hook to access auth context


const NewTrip = () => {
    const [destinations, setDestinations] = useState([]);
    const [tripName, setTripName] = useState('');
    const [tripBudget, setTripBudget] = useState('');
    const [optimizedRoute, setOptimizedRoute] = useState([]);
    const [optimizedLocations, setOptimizedLocations] = useState([]);
    const [totalDistance, setTotalDistance] = useState(null);
    const [totalDuration, setTotalDuration] = useState(null);
    const [tripStartDate, setTripStartDate] = useState('');
    const { authToken} = useAuth();
    const [tripStartTime, setTripStartTime] = useState(() => {
        const defaultHour = 10; // 10 AM
        const defaultMinute = 0; // 00 minutes
        const hours = String(defaultHour).padStart(2, '0'); // Format hours to 2 digits
        const minutes = String(defaultMinute).padStart(2, '0'); // Format minutes to 2 digits
        return `${hours}:${minutes}`; // Return in HH:MM format
    });
    const [isEdit, setIsEdit] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isTimeReadOnly, setIsTimeReadOnly] = useState(true); // New state for time input
    const [tripId, setTripId] = useState(null); // New state for trip ID




    const navigate = useNavigate();
    const location = useLocation();


    useEffect(() => {
    if (location.state) {
        const { isEdit: isEditFromState, isReadOnly: isReadOnlyFromState } = location.state;

        setIsEdit(!!isEditFromState);
        setIsReadOnly(!!isReadOnlyFromState);

        if (isEditFromState || isReadOnlyFromState) {
            const { trip } = location.state;
            setTripId(trip._id); // Assuming trip has an id property
            setTripName(trip.tripName);
            setTripStartDate(trip.tripStartDate);
            setTripStartTime(trip.tripStartTime);
            setTripBudget(trip.tripBudget);
            setDestinations(trip.destinations || []);
            setOptimizedLocations(trip.optimizedLocations || []);
            setTotalDistance(trip.totalDistance);
            setTotalDuration(trip.totalDuration);
            setOptimizedRoute(trip.optimizedRoute || []); 
            

        }

    }

    window.scrollTo(0, 0);
}, [location.state]);





    const handleAddDestination = (location) => {
        console.log("Adding destination:", location);

        setDestinations((prevDestinations) => [...prevDestinations, location]);
    };

    const optimizeRoute = async (updatedDestinations) => {
        //const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:5000/optimize/route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ destinations: updatedDestinations }),
            });

            const data = await response.json();

            if (response.ok) {
                setOptimizedRoute(data.optimizedRoute || []);
                setOptimizedLocations(data.optimizedLocations || []);
                setDestinations(data.destinations || []);
                setTotalDistance(data.totalDistance || 'Unknown');
                setTotalDuration(data.totalDuration || 'Unknown');
            } else {
                console.error('Failed to optimize the route:', data.message || 'Unknown error');
            }
        } catch (error) {
            console.error('An error occurred while optimizing the route:', error);
        }
    };

    const handleRemoveDestination = async (index) => {
        setDestinations((prevDestinations) => {
            const updatedDestinations = prevDestinations.filter((_, i) => i !== index);

            if (updatedDestinations.length >= 2) {
                optimizeRoute(updatedDestinations);
            } else {
                setOptimizedRoute([]);
                setOptimizedLocations([]);
                setTotalDistance(null);
                setTotalDuration(null);
            }

            return updatedDestinations;
        });
    };

    const handleSaveTrip = async () => {
        const newTrip = {
            tripName,
            tripBudget,
            tripStartDate,
            tripStartTime,
            destinations,
            optimizedLocations,
            optimizedRoute,
            totalDistance,
            totalDuration,
        };

        try {
            const response = await fetch(isEdit ? `http://localhost:5000/api/trips/upcoming/${tripId}` : 'http://localhost:5000/trips/newTrip', {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify(newTrip),
            });

            if (response.ok) {
                const savedTrip = await response.json();
                navigate('/upcomingTrip'); // Redirect to upcoming trips page
            } else {
                const errorData = await response.json();
                alert('Failed to save trip: ' + (errorData.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('An error occurred while saving the trip:', error);
            alert('An error occurred while saving the trip. Please try again.');
        }
    };
    

    const handleCancelEdit = () => {
        navigate('/upcomingTrip'); // Redirect to upcoming trips page without saving
    };
    

    const handleOptimizeRoute = async () => {
        if (destinations.length < 2) {
            alert('Add at least two destinations to optimize the route.');
            return;
        } else if (destinations.length > 10) {
            alert('Maximum 10 locations are allowed.');
            return;
        }

        //const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:5000/optimize/route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    destinations,
                }),
            });

            const data = await response.json();
            console.log('Optimized route data:', data);

            if (response.ok) {
                setOptimizedRoute(data.optimizedRoute || []);
                setOptimizedLocations(data.optimizedLocations || []);
                setDestinations(data.destinations || []);
                setTotalDistance(data.totalDistance || 'Unknown');
                setTotalDuration(data.totalDuration || 'Unknown');
            } else {
                alert('Failed to optimize the route: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            alert('An error occurred while optimizing the route.');
            console.error(error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 flex flex-col gap-6">
            <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">
            {isEdit && !isReadOnly ? 'Edit Your Trip' : isReadOnly ? 'View Your Trip' : 'Plan Your New Trip'}
            </h1>

            {/* Trip Name */}
            <div className='flex gap-6'>
                <div className='lg:w-1/2 md:w-100%'>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Trip Name</label>
                <input
                    type="text"
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    placeholder="Enter trip name"
                    disabled={isReadOnly} // Disable in edit mode
                />
                </div>
                
                
                {/* Trip Budget */}
                <div className='lg:w-1/2 md:w-100%'>
                 <label className="block text-lg font-semibold text-gray-700 mb-2">Trip Budget</label>
                 <input type="number"
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={tripBudget}
                    onChange={(e) => {
                        const value = e.target.value;
                        if (!/[^0-9]/.test(value)) {  // Allow only digits (0-9)
                            setTripBudget(value);
                        }
                    }}
                    placeholder="Enter trip budget"
                    disabled={isReadOnly} // Disable in view mode
                    onKeyDown={(e) => {
                        if (e.key === 'e' || e.key === '+' || e.key === '-') {
                            e.preventDefault(); // Block e, +, and -
                        }
                    }}
                />

                </div>
            </div>

            {/* Trip Start Date */}
            <div className='flex gap-6'>
                <div className='lg:w-1/2 md:w-100%'>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Trip Start Date</label>
                <input
                    type="date"
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={tripStartDate.split("T")[0]}
                    onChange={(e) => setTripStartDate(e.target.value)}
                    disabled={isReadOnly} // Disable in view mode
                />

                </div>


                <div className="lg:w-1/2 md:w-100%">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-lg font-semibold text-gray-700">
                            Trip Start Time
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsTimeReadOnly(!isTimeReadOnly)} // Toggle time read-only state
                            className={`px-3 py-1 text-sm rounded-lg ${
                                isTimeReadOnly ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                            }`}
                        >
                            {isTimeReadOnly ? 'Enable' : 'Disable'}
                        </button>
                    </div>
                    <input
                        type="time"
                        className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={tripStartTime}
                        onChange={(e) => setTripStartTime(e.target.value)}
                        disabled={isTimeReadOnly} 
                    />
                </div>

            </div>

            {/* Add Destinations */}
            <div >
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Add Destinations</h2>
                <MapComponent 
                    markers={destinations}
                    route={optimizedRoute}
                    onAddMarker={handleAddDestination}
                    disabled={isReadOnly} // Make the map read-only in edit mode
                />
                {destinations.length === 0 && (
                    <p className="text-gray-500 text-center mt-4" disabled={isReadOnly}>
                        Search for a place to add destinations.
                    </p>
                )}
                {console.log(destinations)}
                {destinations.length > 0 && (
                    <ul className="mt-4">
                        {destinations.map((destination, index) => (
                            <li
                                key={index}
                                className="flex justify-between items-center bg-white border-2 border-gray-200 p-4 rounded-lg shadow-sm mb-2"
                            >
                                <span className="text-gray-800">
                                    {destination.name}
                                </span>
                                {!isReadOnly && (
                                    <button
                                        className="text-red-500 hover:text-red-600"
                                        onClick={() => handleRemoveDestination(index)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

        

            {/* Optimize Route Button */}
            <div >

            {!isReadOnly && (<button
                    className={`w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg focus:outline-none ${
                        destinations.length < 2 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={handleOptimizeRoute}
                    disabled={destinations.length < 2 } // Disable in edit mode
                >
                    Optimize Route
                </button> )}
                {destinations.length < 2 && (
                    <p className="text-sm text-gray-500 mt-2 text-center" disabled={isReadOnly}>
                        Add at least two destinations to optimize the route.
                    </p>
                )}
            </div>

            {/* Optimized Route Details */}
            {optimizedLocations && optimizedLocations.length > 0 && (
                <div className="bg-blue-200 p-6 rounded-lg shadow-md flex flex-col gap-2">
                    <h3 className="text-xl font-semibold text-gray-700 ">Optimized Route Details</h3>
                    <ul className="list-disc pl-5">
                        {optimizedLocations.map((location, index) => (
                            <li key={index} className="text-gray-800">
                                {index + 1}. {location}
                            </li>
                        ))}
                    </ul>
                    <p className="text-gray-700 ">
                        <strong>Total Distance:</strong> {totalDistance || 'Unknown'} km
                    </p>
                    <p className="text-gray-700">
                        <strong>Estimated Duration:</strong> {totalDuration || 'Unknown'} minutes
                    </p>
                </div>
            )}

            {/* Save Trip */}
            {console.log("lenghtttttttt", destinations.length)}
            {console.log("dateeeeeeeeeeee", tripStartDate)}



            <div className="flex justify-end">
                {isEdit && (
                    <button
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg focus:outline-none mr-4"
                        onClick={handleCancelEdit}
                    >
                        Cancel Edit
                    </button>
                )}
                <button
                    className={`bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg focus:outline-none ${
                        destinations.length === 0 || !tripName || !tripStartDate || isReadOnly
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                    }`}
                    onClick={handleSaveTrip}
                    disabled={destinations.length === 0 || !tripName || !tripStartDate || isReadOnly}
                >
                    Save Trip
                </button>
            </div>
        </div>
    );
};

export default NewTrip;
