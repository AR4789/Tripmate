import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext'; // Import AuthProvider and useAuth
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TripsPage from './pages/TripsPage';
import AddTrip from "./components/AddTrip";
import EditTrip from "./components/EditTrip";
import Dashboard from './pages/Dashboard';
import NewTrip from './components/Newtrip';
import UpcomingTrip from './components/UpcomingTrip';
import StartTrip from './components/StartTrip';

// Protected Route Component
const ProtectedRoute = ({ element }) => {
    const { authToken } = useAuth(); // Check token from context
    return authToken ? element : <Navigate to="/login" />;
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected Routes */}
                    <Route path="/trips" element={<ProtectedRoute element={<TripsPage />} />} />
                    <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                    <Route path="/add-trip" element={<ProtectedRoute element={<AddTrip />} />} />
                    <Route path="/edit-trip/:id" element={<ProtectedRoute element={<EditTrip />} />} />
                    <Route path="/newTrip" element={<ProtectedRoute element={<NewTrip />} />} />
                    <Route path="/upcomingTrip" element={<ProtectedRoute element={<UpcomingTrip />} />} />
                    <Route path="/startTrip/:tripId" element={<ProtectedRoute element={<StartTrip />} />} />


                    {/* Default Route */}
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
