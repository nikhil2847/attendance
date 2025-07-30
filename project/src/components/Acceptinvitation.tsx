import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Building2, Lock, User, Eye, EyeOff } from 'lucide-react';

const AcceptInvitation: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const res = await apiService.acceptInvitation({
                token,
                ...form,
            });
            setMessage(res.message || 'Account created! You can now log in.');
            setTimeout(() => navigate('/'), 2000);
        } catch (error: any) {
            setMessage(error.message || 'Failed to accept invitation');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return <div className="p-8 text-center text-red-600">Invalid invitation link.</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="bg-blue-600 p-3 rounded-full">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Accept Invitation
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Set your name and password to join the organization.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="bg-white py-8 px-6 shadow-xl rounded-lg space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                                First Name
                            </label>
                            <div className="mt-1 relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    id="first-name"
                                    name="firstName"
                                    type="text"
                                    required
                                    value={form.firstName}
                                    onChange={handleChange}
                                    className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="John"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                                Last Name
                            </label>
                            <input
                                id="last-name"
                                name="lastName"
                                type="text"
                                required
                                value={form.lastName}
                                onChange={handleChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Doe"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="mt-1 relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={form.password}
                                onChange={handleChange}
                                className="pl-10 pr-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Create a password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Submitting...' : 'Accept Invitation'}
                    </button>
                    {message && <div className="mt-4 text-center text-blue-700">{message}</div>}
                </form>
            </div>
        </div>
    );
};

export default AcceptInvitation;