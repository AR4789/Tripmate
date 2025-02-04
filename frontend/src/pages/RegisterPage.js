import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {Link} from 'react-router-dom';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate= useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
            alert('Registration successful! You can now log in.');
            navigate('/login');
        } catch (error) {
            alert('Registration failed');
        }
    };

    return (
        <div>
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="bg-white shadow-lg p-6 md:p-8 rounded-lg w-full max-w-sm mx-4">

                    <h1 className="text-2xl font-bold text-center mb-6">Register</h1>
                    <form onSubmit={handleRegister} className='flex flex-col gap-4'>
                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            className="rounded-md border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            className="rounded-md border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            className="rounded-md border p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button type="submit"
                            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-all">Register</button>
                    </form>
                    <p className="text-center mt-6 text-sm">
                    Already have an account?{' '}
                    <Link to="/" className="text-blue-500 hover:underline">
                        Login
                    </Link>
                </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
