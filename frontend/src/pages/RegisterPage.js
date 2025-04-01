import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GoogleLogin } from 'react-google-login';
import { Link } from 'react-router-dom';

const clientId = "257209872073-c64mrb08nn0r4d0uj3h239l63t73q8h1.apps.googleusercontent.com"; // Replace with your Google Client ID

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
            alert('Registration successful! Please verify your email.');
            navigate('/login');
        } catch (error) {
            alert(error.response.data.error || 'Registration failed');
        }
    };

    const handleGoogleSuccess = async (response) => {
        try {
            const { tokenId } = response;
            const res = await axios.post('http://localhost:5000/api/auth/google', { tokenId });
            alert('Google Registration Successful!');
            navigate('/dashboard');
        } catch (error) {
            alert('Google Sign-In Failed');
        }
    };

    const handleGoogleFailure = (response) => {
        console.error("Google Sign-In Failed:", response);
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white shadow-lg p-6 md:p-8 rounded-lg w-full max-w-sm mx-4">
                <h1 className="text-2xl font-bold text-center mb-6">Register</h1>
                <form onSubmit={handleRegister} className='flex flex-col gap-4'>
                    <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
                        className="rounded-md border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="rounded-md border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                        className="rounded-md border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-all">Register</button>
                </form>

                <div className="text-center my-4 text-gray-500">OR</div>

                <GoogleLogin
                    clientId={clientId}
                    buttonText="Sign up with Google"
                    onSuccess={handleGoogleSuccess}
                    onFailure={handleGoogleFailure}
                    cookiePolicy={'single_host_origin'}
                    className="w-full flex justify-center"
                />

                <p className="text-center mt-6 text-sm">
                    Already have an account?{' '}
                    <Link to="/" className="text-blue-500 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
