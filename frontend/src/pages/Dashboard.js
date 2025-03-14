import React from 'react';
import { useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import MapComponent from '../components/MapComponent'; // Replace with your actual MapComponent path
import ChartComponent from '../components/ChartComponent';
import { useAuth } from '../components/AuthContext';
import { GoogleGenerativeAI } from "@google/generative-ai";
import L from "leaflet";
import "leaflet/dist/leaflet.css";


const Dashboard = () => {

    const navigate = useNavigate();
    const { logoutUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [weatherQuery, setWeatherQuery] = useState("");
    const [weatherData, setWeatherData] = useState(null);
    const [showWeatherSearch, setShowWeatherSearch] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [searchError, setSearchError] = useState(null);  // For Magic Search
    const [weatherError, setWeatherError] = useState(null);  // For Weather Search
    const [searchType, setSearchType] = useState("in"); // Default: Search in the place
    const [searchDistance, setSearchDistance] = useState(5); // Default: 100 km







    const handleLogout = async () => {
        await logoutUser();
        navigate('/login');
    }



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

  //  const genAI = new GoogleGenerativeAI("AIzaSyBZsgn1mqxFV7DHn722G0ZGWYJGYTfZHKc");  // Replace with your actual API Key

    
  const handleSearch = async () => {
    if (!searchQuery) return;

    setLoading(true);
    setSearchError(null);
    setPlaces([]);

    const isValidLocation = await validateLocation(searchQuery);
    if (!isValidLocation) {
        setSearchError("Place not valid. Please enter a city, state, district, or village.");
        setLoading(false);
        return;
    }

    try {
        const apiKey = "AIzaSyDQIuSgbM1ww8UvtG7BQczqCjQPUifhwSs"; // Ensure this is valid
        const searchDistances = [5, 10, 25, 50, 100, 200, 300, 400, 500, 750, 1000];
        const selectedIndex = searchDistances.indexOf(Number(searchDistance));
        const lowerRange = selectedIndex > 0 ? searchDistances[selectedIndex - 1] : 0;

        // Get location coordinates
        const geoResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${apiKey}`
        );
        const geoData = await geoResponse.json();

        if (!geoData.results.length) {
            setSearchError("Location not found.");
            setLoading(false);
            return;
        }

        const { lat, lng } = geoData.results[0].geometry.location;

        const placesResponse = await fetch(
            `http://localhost:5000/places?searchType=${encodeURIComponent(searchType)}&searchQuery=${encodeURIComponent(searchQuery)}&lat=${lat}&lng=${lng}&lowerRange=${lowerRange}&searchDistance=${searchDistance}`
        );

        const placesData = await placesResponse.json();

        console.log(placesData);

        if (!placesData.results || placesData.results.length === 0) {
            setSearchError("No tourist attractions found in the given range.");
            setLoading(false);
            return;
        }

        // Further processing...
    } catch (err) {
        setSearchError("Failed to fetch places. Please try again.");
        console.error("Error:", err);
    } finally {
        setLoading(false);
    }
};








    const WEATHER_API_KEY = "96371f64c49fce1c310a814018d95ec6";

    const fetchWeather = async (location) => {
        if (!location) return;
        setLoading(true);
        setWeatherError(null);

        try {
            // ✅ Get Current Weather from OpenWeatherMap
            const currentWeatherResponse = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${WEATHER_API_KEY}`
            );

            if (currentWeatherResponse.status !== 200 || !currentWeatherResponse.data) {
                throw new Error("Current weather data not found.");
            }

            const { temp } = currentWeatherResponse.data.main;
            const { description } = currentWeatherResponse.data.weather[0];

            // ✅ Get 5-Day Forecast
            const forecastResponse = await axios.get(
                `https://api.openweathermap.org/data/2.5/forecast?q=${location}&units=metric&appid=${WEATHER_API_KEY}`
            );

            if (!forecastResponse.data || !forecastResponse.data.list) {
                throw new Error("Weather forecast data not found.");
            }

            // ✅ Extract Forecast for the Next 5 Days
            const dailyForecast = {};
            forecastResponse.data.list.forEach((entry) => {
                const date = new Date(entry.dt_txt).toLocaleDateString();
                if (!dailyForecast[date]) {
                    dailyForecast[date] = {
                        temp: entry.main.temp,
                        condition: entry.weather[0].description
                    };
                }
            });

            // Convert object to array (get only 5 days)
            const forecastData = Object.keys(dailyForecast).slice(0, 5).map((date) => {
                const dateObj = new Date(date);
                console.log(dateObj);
                const weekdayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

                return {
                    day: `${weekdayName} (${date})`, // Shows "Monday (YYYY-MM-DD)", "Tuesday (YYYY-MM-DD)"
                    temp: dailyForecast[date].temp,
                    condition: dailyForecast[date].condition
                };
            });


            // ✅ Set Weather Data State
            setWeatherData({
                location,
                currentTemp: temp,
                currentCondition: description,
                forecast: forecastData
            });

            setWeatherQuery(location);
            setShowWeatherSearch(false);
        } catch (err) {
            setWeatherError("Failed to fetch weather data. Please check the location.");
            console.error("Weather Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="container mx-auto p-4">
            <div className="container mx-auto p-6 bg-white shadow-lg rounded-2xl border border-gray-200 flex flex-col gap-6">
                {/* Header Section */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600 text-center flex-grow">
                        🚀 Dashboard
                    </h1>
                    <button
                        className="bg-red-500 text-white px-3 py-1 rounded-md shadow-sm hover:bg-red-600 hover:scale-105 transition-all"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex justify-center gap-4 mt-3">
                    <Link
                        to="/trips"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:scale-105"
                    >
                        ✅ Completed Trips
                    </Link>
                    <Link
                        to="/upcomingTrip"
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:scale-105"
                    >
                        🚗 Upcoming Trips
                    </Link>
                </div>

                {/* Interactive Map Section */}

                <button
                    onClick={() => setShowMap(true)}
                    className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg"
                >
                    🗺️ Open Map
                </button>

                {/* Fullscreen Map Modal */}
                {showMap && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-3/4 max-w-lg relative">
                            {/* Close Button INSIDE the Card */}
                            <button
                                onClick={() => setShowMap(false)}
                                className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl"
                            >
                                ❌
                            </button>

                            {/* Title */}
                            <h2 className="text-xl text-center font-bold text-gray-800 mb-2">🗺️ Interactive Map</h2>

                            {/* Map Container - Properly Sized */}
                            <div className="w-full h-85 rounded-lg overflow-hidden border">
                                <MapComponent markers={[]} />
                            </div>
                        </div>
                    </div>
                )}





                {/* Trip Planning Section */}
                <div className="p-4 bg-white rounded-xl shadow-md border border-gray-300">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">📍 Trip Planning</h2>
                    <p className="text-gray-600 text-sm">
                        Plan your trips by selecting multiple destinations. Optimize routes and save them for future reference.
                    </p>
                    <button
                        onClick={() => navigate("/newTrip")}
                        className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white px-4 py-2 rounded-md shadow-md mt-3 text-sm transition-transform hover:scale-105"
                    >
                        ✈️ Plan a New Trip
                    </button>
                </div>

                {/* Magic Search */}
                <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center">
                        🔮 Magic Search
                    </h2>
                    <p className="text-gray-600 text-sm">Enter a location to find famous nearby places.</p>


                    <div className="flex items-center space-x-3 mt-3">
                        {/* Select Search Type: In the Place or Near the Place */}
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="p-2 text-sm bg-gray-100 rounded-md border border-gray-300 focus:outline-none"
                        >
                            <option value="in">Search neaby placen in </option>
                            <option value="near">Search nearby places within </option>
                        </select>

                        {/* Select Distance (only enabled if searching "near" the place) */}
                        <select
                            value={searchDistance}
                            onChange={(e) => setSearchDistance(e.target.value)}
                            disabled={searchType === "in"}
                            className="p-2 text-sm bg-gray-100 rounded-md border border-gray-300 focus:outline-none disabled:opacity-50"
                        >
                            {[
                                5, 10, 25, 50, 100, 200, 300, 400, 500, 750, 1000
                            ].map((distance, i) => (
                                <option key={i} value={distance}>{distance} km</option>
                            ))}
                        </select>
                    </div>




                    <div className="flex items-center mt-3 bg-gray-100 rounded-md overflow-hidden shadow-sm">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter location..."
                            className="border-none outline-none bg-transparent p-2 w-full text-gray-700 placeholder-gray-400 text-sm"
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 text-sm font-bold transition-all hover:scale-105 hover:shadow-md"
                        >
                            🔍 Search
                        </button>
                    </div>
                    {loading && <p className="text-blue-500 font-medium mt-2 animate-pulse text-sm">⏳ Searching...</p>}
                    {searchError && <p className="text-red-500 font-medium mt-2 text-sm">⚠️ {searchError}</p>}
                    <div className="mt-4">
                        {places.length > 0 ? (
                            <ul className="space-y-3">
                                {places.map((place, index) => (
                                    <li key={index} className="p-3 bg-gray-50 rounded-md shadow-sm hover:shadow-md transition">
                                        <h3 className="text-md font-semibold text-gray-800 flex items-center">📍 {place.name}</h3>
                                        <p className="text-gray-500 text-sm">{place.address}</p>
                                        <p className="text-gray-600 italic text-sm mt-1">{place.description}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            !loading && !searchError && (
                                <p className="text-gray-500 font-semibold text-sm text-center mt-3 animate-fade-in">✨ Let The Magic Happen ✨</p>
                            )
                        )}
                    </div>
                </div>

                {/* Weather Search Section */}
                <div className="p-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg shadow-md text-white">
                    <h2 className="text-lg font-bold mb-2">🌦 Weather Info</h2>
                    <p className="text-white text-sm">Check current and upcoming weather conditions.</p>
                    {weatherData && (
                        <div className="mb-2 flex items-center">
                            <input type="checkbox" checked={showWeatherSearch} onChange={() => setShowWeatherSearch(!showWeatherSearch)} className="mr-2" />
                            <label className="text-white text-sm">Search for another location</label>
                        </div>
                    )}
                    {(!weatherData || showWeatherSearch) && (
                        <div className="flex mt-3">
                            <input type="text" value={weatherQuery} onChange={(e) => setWeatherQuery(e.target.value)} placeholder="Enter location..." className="border border-gray-300 p-2 rounded-l-md w-full text-black text-sm" />
                            <button onClick={() => fetchWeather(weatherQuery)} className="bg-yellow-400 text-black px-3 py-2 rounded-r-md hover:bg-yellow-500 transition text-sm">🔍 Search</button>
                        </div>
                    )}
                    {loading && <p className="text-yellow-300 mt-2 animate-pulse text-sm">Fetching weather data...</p>}
                    {weatherError && <p className="text-red-500 mt-2 text-sm">⚠️ {weatherError}</p>}
                    {weatherData && (
                        <div className="mt-4 bg-white text-black border border-gray-300 p-3 rounded-md shadow-sm">
                            <h3 className="text-sm font-bold mb-1">🌍 Weather for {weatherData.location}</h3>

                            {/* Current Weather */}
                            <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md mb-3">
                                <h4 className="text-md font-bold text-blue-600">🌤 Current Weather</h4>
                                <p className="text-gray-700 ml-2 text-sm">🌡 Temp: {weatherData.currentTemp}°C</p>
                                <p className="text-gray-700 ml-2 text-sm">🌎 Condition: {weatherData.currentCondition}</p>
                            </div>

                            {/* 5-Day Forecast */}
                            <h4 className="text-sm font-bold text-gray-800 mb-2">📅 5-Day Forecast</h4>
                            <ul className="space-y-2">
                                {weatherData.forecast.map((day, index) => (
                                    <li key={index} className="p-2 bg-gray-50 rounded-md shadow-sm border border-gray-200">
                                        <p className="text-gray-800 font-semibold">{day.day}</p> {/* Now shows "Monday", "Tuesday", etc. */}
                                        <p className="text-gray-600 text-sm">🌡 Temp: {day.temp}°C</p>
                                        <p className="text-gray-600 text-sm">🌤 Condition: {day.condition}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );

};

export default Dashboard;
