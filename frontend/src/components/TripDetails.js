import React from 'react';

const TripDetails = ({ trip }) => {
    return (
        <div>
            <h2>Trip to {trip.destination}</h2>
            <p>Start Date: {trip.startDate}</p>
            <p>End Date: {trip.endDate}</p>
            <p>Expenses: ${trip.expenses}</p>
        </div>
    );
};

export default TripDetails;
