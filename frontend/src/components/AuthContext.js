import React, { createContext, useContext, useState, useEffect } from 'react';

// Create AuthContext
const AuthContext = createContext();

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);

// AuthProvider component to wrap the application
export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(() => {
        // Check if token is already stored in localStorage
        const storedToken = localStorage.getItem('authToken');
        return storedToken ? storedToken : null;
    });

    const loginUser = async (email, password) => {
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
    
            const data = await response.json();
            console.log(JSON.stringify(data));
    
            if (response.ok) {
                setAuthToken(data.token); // Store the token in state
                localStorage.setItem('authToken', data.token); // Persist token to localStorage
                return true; // Indicate success
            } else {
                console.error('Login failed:', data.message || 'Unknown error');
                return false; // Indicate failure
            }
        } catch (error) {
            console.error('An error occurred during login:', error);
            return false; // Indicate failure
        }
    };
    
    const logoutUser = () => {
        setAuthToken(null); // Clear the token
        localStorage.removeItem('authToken'); // Remove the token from localStorage
    };

    return (
        <AuthContext.Provider value={{ authToken, setAuthToken, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
};
