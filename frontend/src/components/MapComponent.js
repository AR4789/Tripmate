import React, { useState, useEffect } from 'react';
import Script from 'react-load-script';
import PlacesAutocomplete from 'react-places-autocomplete';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import L from 'leaflet';
import locatorIcon from './locator.png';
import userIconImg from './nav-arrow.png'; // Add an arrow icon for navigation

// Helper component to re-center the map
const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 13); // Recenter map to the selected location
    }, [lat, lng, map]);
    return null;
};

const FitBounds = ({ markers }) => {
    const map = useMap();

    useEffect(() => {
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(marker => [marker.lat, marker.lng]));
            map.fitBounds(bounds); // Fit the map to the markers
        }
    }, [markers, map]);

    return null; // This component does not render anything
};

const MapComponent = ({ 
    markers: initialMarkers, 
    onAddMarker, 
    route, 
    disabled = false, 
    showSearchBar = true, 
    userLocation 
}) => {
    const [markers, setMarkers] = useState(initialMarkers || []);
    const [searchLocation, setSearchLocation] = useState('');
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);

    const customMarkerIcon = L.icon({
        iconUrl: locatorIcon,
        iconSize: [40, 61],
        iconAnchor: [20, 50],
        popupAnchor: [0, -41],
    });

    const userIcon = L.icon({
        iconUrl: userIconImg,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
    });

    useEffect(() => {
        setMarkers(initialMarkers);
    }, [initialMarkers]);

    const handleScriptLoad = () => {
        setIsScriptLoaded(true);
    };

    const handleSelect = async (address) => {
        if (disabled) return;

        setSearchLocation(address);
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address }, (results, status) => {
            if (status === "OK" && results[0].geometry) {
                const location = {
                    name: results[0].formatted_address,
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng(),
                };

                setSelectedLocation(location);
                setMarkers((prevMarkers) => [...prevMarkers, location]);
                if (onAddMarker) {
                    onAddMarker(location);
                }
            }
        });
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto space-y-6 p-4">
            {/* Load Google Maps API script dynamically */}
            <Script
                url={`https://maps.googleapis.com/maps/api/js?key=AIzaSyDQIuSgbM1ww8UvtG7BQczqCjQPUifhwSs&libraries=places`}
                onLoad={handleScriptLoad}
            />

            {showSearchBar && !disabled && isScriptLoaded && (
                <PlacesAutocomplete
                    value={searchLocation}
                    onChange={setSearchLocation}
                    onSelect={handleSelect}
                >
                    {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                        <div className="w-full max-w-lg mx-auto">
                            <input
                                {...getInputProps({ placeholder: 'Search for a place' })}
                                className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="bg-white rounded-lg shadow-lg">
                                {loading && <div className="p-2 text-center">Loading...</div>}
                                {suggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        {...getSuggestionItemProps(suggestion)}
                                        className="cursor-pointer p-4 border-b border-gray-300 hover:bg-gray-100"
                                    >
                                        {suggestion.description}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </PlacesAutocomplete>
            )}

            <MapContainer
                center={[51.505, -0.09]}
                zoom={13}
                style={{ width: '100%', height: '400px' }}
                className="rounded-lg shadow-md"
                dragging={!disabled}
                zoomControl={!disabled}
                scrollWheelZoom={!disabled}
                touchZoom={!disabled}
                doubleClickZoom={!disabled}
                onClick={(e) => {
                    if (disabled) return;
                    const newMarker = { lat: e.latlng.lat, lng: e.latlng.lng };
                    setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
                    if (onAddMarker) {
                        onAddMarker(newMarker);
                    }
                }}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {selectedLocation && <RecenterMap lat={selectedLocation.lat} lng={selectedLocation.lng} />}
                
                {markers.map((marker, index) => (
                    <Marker key={index} position={[marker.lat, marker.lng]} icon={customMarkerIcon}>
                        <Popup>{`Marker ${index + 1}`}</Popup>
                    </Marker>
                ))}

                {route && route.length > 0 && (
                    <Polyline
                        positions={route.map((point) => [point.lat, point.lng])}
                        color="blue"
                        weight={5}
                    />
                )}

                {userLocation && (
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                        <Popup>Your Location</Popup>
                    </Marker>
                )}

                <FitBounds markers={markers} />
            </MapContainer>
        </div>
    );
};

export default MapComponent;
