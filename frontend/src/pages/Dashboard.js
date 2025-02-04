import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { Link,useNavigate } from 'react-router-dom';
import MapComponent from '../components/MapComponent'; // Replace with your actual MapComponent path
import ChartComponent from '../components/ChartComponent';
import { useAuth } from '../components/AuthContext';


const Dashboard = () => {

    const navigate=useNavigate();
    const {logoutUser}=useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [places, setPlaces] = useState([]);
    const [error, setError] = useState(null);

    const handleLogout= async ()=> {
         await logoutUser();
         navigate('/login');
    }

    const handleSearch = async () => {
        if (!searchQuery) return;

        try {
            const response = await axios.get(`https://api.deepseek.com/v1/search`, {
                params: {
                    query: searchQuery,
                    apiKey: 'YOUR_DEEPSEEK_API_KEY',  // Replace with your API key
                },
            });

            setPlaces(response.data.results || []);
            setError(null);
        } catch (err) {
            setError("Failed to fetch places. Please try again.");
        }
    };

    
    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-4xl font-bold text-blue-600 text-center flex-grow">
                    Dashboard
                </h1>
                <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => handleLogout()}
                >
                    Logout
                </button>
            </div>


            {/* Link to the Trips Page */}
            <div className='flex justify-center gap-4'>
                <div className="mb-6 text-center ">
                    <Link 
                        to="/trips" 
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-md transition-all"
                    >
                        Completed Trips
                    </Link>
                </div>
                <div className="mb-6 text-center ">
                    <Link 
                        to="/upcomingTrip" 
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-md transition-all"
                    >
                        Upcoming Trips
                    </Link>
                </div>
            </div>

            {/* Interactive Map Section */}
            <div className="mb-8 map-container">
                <h2 className="text-2xl text-center font-bold text-gray-700 ">Interactive Map</h2>
                <MapComponent 
                    markers={[]} // Add logic to fetch or manage markers dynamically
                />
            </div>

            {/* Trip Planning Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Trip Planning</h2>
                <p className="text-gray-600">
                    Plan your trips by selecting multiple destinations. Optimize routes and save them for future reference.
                </p>
                {/* Placeholder for planning UI */}
                <button onClick={()=> navigate("/newTrip")}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md mt-4">
                    Plan a New Trip
                </button>
            </div>

            <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Magic Search</h2>
            <p className="text-gray-600">Enter a location to find famous nearby places</p>

            <div className="flex mt-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter location..."
                    className="border border-gray-300 p-2 rounded-l-md w-full"
                />
                <button
                    onClick={handleSearch}
                    className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
                >
                    Search
                </button>
            </div>

            {error && <p className="text-red-500 mt-2">{error}</p>}

            {/* Display Results */}
            <div className="mt-4">
                {places.length > 0 ? (
                    <ul className="list-disc pl-6 text-gray-600">
                        {places.map((place, index) => (
                            <li key={index} className="border-b py-2">
                                <strong>{place.name}</strong> - {place.address}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No places found.</p>
                )}
            </div>
        </div>

            {/* Weather Information Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Weather Information</h2>
                <p className="text-gray-600">Check current weather conditions for your destinations.</p>
                <div className="mt-4 bg-white border border-gray-300 p-4 rounded-lg shadow-md">
                    <p>Weather for: <strong>New York</strong></p>
                    <p>Temperature: 25°C</p>
                    <p>Condition: Sunny</p>
                </div>
            </div>

            {/* Analytics Dashboard Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Analytics Dashboard</h2>
                <p className="text-gray-600">Analyze your travel habits with these statistics:</p>
                <ul className="list-disc pl-6 text-gray-600">
                    <li>Total distance traveled</li>
                    <li>Expense trends across trips</li>
                    <li>Most visited cities/countries</li>
                </ul>
                <ChartComponent data={[]} type="bar" />
            </div>

            {/* Reviews & Ratings Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Reviews & Ratings</h2>
                <p className="text-gray-600">Share your experiences and see ratings for locations you visited.</p>
                <div className="bg-white border border-gray-300 p-4 rounded-lg shadow-md">
                    <p>Average Rating: 4.5/5</p>
                    <p>Top Reviews:</p>
                    <ul className="list-disc pl-6 text-gray-600">
                        <li>"Amazing place!"</li>
                        <li>"Loved the hospitality."</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
