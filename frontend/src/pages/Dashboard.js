import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { Link,useNavigate } from 'react-router-dom';
import MapComponent from '../components/MapComponent'; // Replace with your actual MapComponent path
import ChartComponent from '../components/ChartComponent';
import { useAuth } from '../components/AuthContext';
import { GoogleGenerativeAI } from "@google/generative-ai";



const Dashboard = () => {

    const navigate=useNavigate();
    const {logoutUser}=useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [places, setPlaces] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [weatherQuery, setWeatherQuery] = useState("");
    const [weatherData, setWeatherData] = useState(null);
    const [showWeatherSearch, setShowWeatherSearch] = useState(false);



    const handleLogout= async ()=> {
         await logoutUser();
         navigate('/login');
    }

    const genAI = new GoogleGenerativeAI("AIzaSyBZsgn1mqxFV7DHn722G0ZGWYJGYTfZHKc");  // Replace with your actual API Key


    // Function to validate if the input is a proper geographic place
    const validateLocation = async (query) => {
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
            );
            return response.data.length > 0; // True if a valid place
        } catch (error) {
            console.error("Validation error: ", error);
            return false;
        }
    };

    const handleSearch = async () => {
        if (!searchQuery) return;

        setLoading(true);
        setError(null);
        setPlaces([]);

        const isValidLocation = await validateLocation(searchQuery);

        if (!isValidLocation) {
            setError("Place not valid. Please enter a city, state, district, or village.");
            setLoading(false);
            return;
        }

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `List 10 famous tourist attractions in ${searchQuery}. Provide the name, address, and a short description in this format:

            1. **Place Name** - Address
               *Description: Short description of the place (max 20 words)*`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract places using regex
            const placePattern = /\d+\.\s*\*\*(.+?)\*\*\s*-\s*(.+?)\n\s*\*Description:\s*(.+)/g;
            let matches,
                placesList = [];

            while ((matches = placePattern.exec(text)) !== null && placesList.length < 10) {
                placesList.push({
                    name: matches[1].trim(),
                    address: matches[2].trim(),
                    description: matches[3].trim(),
                });
            }

            if (placesList.length === 0) {
                setError("No tourist attractions found.");
            }

            setPlaces(placesList);
            fetchWeather(searchQuery);
        } catch (err) {
            setError("Failed to fetch places. Please try again.");
            console.error("error: ", err);
        } finally {
            setLoading(false);
        }
    };


    const WEATHER_API_KEY = "074f7584496cef1d77df0720692a9427";

    const fetchWeather = async (location) => {
        if (!location) return;
        setLoading(true);
    
        try {
            // Call OpenWeather API for current weather
            const weatherResponse = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${WEATHER_API_KEY}`
            );
    
            // Call OpenWeather API for 10-day forecast
            const forecastResponse = await axios.get(
                `https://api.openweathermap.org/data/2.5/forecast/daily?q=${location}&cnt=10&units=metric&appid=${WEATHER_API_KEY}`
            );
    
            // Extract weather data
            const { temp } = weatherResponse.data.main;
            const { description } = weatherResponse.data.weather[0];
    
            const currentWeather = `Current Weather:
            - Temperature: ${temp}°C
            - Condition: ${description.charAt(0).toUpperCase() + description.slice(1)}`;
    
            let forecastData = "10-day Forecast:\n";
            forecastResponse.data.list.forEach((day, index) => {
                forecastData += `Day ${index + 1}: Temp: ${day.temp.day}°C, Condition: ${day.weather[0].description}\n`;
            });
    
            // Combine results
            setWeatherData(`${currentWeather}\n${forecastData}`);
            setWeatherQuery(location);
            setShowWeatherSearch(false);
            setError(null);
        } catch (err) {
            setError("Failed to fetch weather data. Please check the location.");
            console.error("Weather Fetch Error:", err);
        } finally {
            setLoading(false);
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

           {/* Magic Search */}
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

                {loading && <p className="text-blue-500 mt-2">Loading...</p>}
                {error && <p className="text-red-500 mt-2">{error}</p>}

                {/* Display Results */}
                <div className="mt-4">
                    {places.length > 0 ? (
                        <ul className="list-disc pl-6 text-gray-600">
                            {places.map((place, index) => (
                                <li key={index} className="border-b py-3">
                                    <strong className="text-lg text-gray-800">{place.name}</strong> - {place.address}
                                    <p className="text-gray-500 italic text-sm mt-1">{place.description}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        !loading && !error && <p className="text-gray-500 font-bold">Let The Magic Happen.</p>
                    )}
                </div>
            </div>

           {/* Weather Search Section */}
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Weather Information</h2>
            <p className="text-gray-600">Check current weather conditions for your destination.</p>

            {/* Checkbox to enable weather search */}
            {weatherData && (
                <div className="mb-4 flex items-center">
                    <input
                        type="checkbox"
                        checked={showWeatherSearch}
                        onChange={() => setShowWeatherSearch(!showWeatherSearch)}
                        className="mr-2"
                    />
                    <label className="text-gray-700">Search for another location</label>
                </div>
            )}

            {/* Show weather search bar only if checkbox is checked */}
            {(!weatherData || showWeatherSearch) && (
                <div className="flex mt-4">
                    <input
                        type="text"
                        value={weatherQuery}
                        onChange={(e) => setWeatherQuery(e.target.value)}
                        placeholder="Enter location for weather..."
                        className="border border-gray-300 p-2 rounded-l-md w-full"
                    />
                    <button
                        onClick={() => fetchWeather(weatherQuery)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
                    >
                        Search Weather
                    </button>
                </div>
            )}

            {loading && <p className="text-blue-500 mt-2">Loading...</p>}
            {error && <p className="text-red-500 mt-2">{error}</p>}

            {/* Display Weather Data */}
            {weatherData && (
                <div className="mt-4 bg-white border border-gray-300 p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                        🌍 Weather for: {weatherQuery}
                    </h3>

                    {/* Extract and Display Current Weather */}
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg mb-4">
                        <h4 className="text-lg font-bold text-blue-600">🌤 Current Weather</h4>
                        {weatherData.split("\n").map((line, index) => (
                            line.startsWith("- Temperature") || line.startsWith("- Condition") ? (
                                <p key={index} className="text-gray-700 ml-4">{line}</p>
                            ) : null
                        ))}
                    </div>

                    {/* Extract and Display 10-Day Forecast */}
                    <div className="p-4 bg-gray-50 border-l-4 border-gray-400 rounded-lg">
                        <h4 className="text-lg font-bold text-gray-600">📅 10-Day Forecast</h4>
                        <ul className="list-disc pl-5 text-gray-700">
                            {weatherData.split("\n").map((line, index) => (
                                line.startsWith("Day") ? <li key={index}>{line}</li> : null
                            ))}
                        </ul>
                    </div>
                </div>
            )}
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
