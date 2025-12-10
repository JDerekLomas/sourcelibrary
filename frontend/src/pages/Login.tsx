import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

import Button from '../components/ui/Buttons/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { usePaths } from '../hooks/usePaths';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth() || {};
    const navigate = useNavigate();
    const paths = usePaths();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Prevents reloading the page

        if (loading || !login) return;

        setLoading(true);
        try {
            await login(username, password);
            navigate(paths.home);
        } catch {
            alert('Login or registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
                {/* Left Column - Form */}
                <div className="flex items-center justify-center p-8">
                    <div className="w-full max-w-md space-y-8">
                        {/* Header */}
                        <div className="text-center">
                            <h1 className="text-4xl font-serif font-bold text-gray-900">Source Library</h1>
                            <p className="text-lg text-gray-600 font-serif font-light">Classical texts accessible through AI</p>
                        </div>

                        {/* Login Form */}
                        <div className="card p-8 rounded-none">
                            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6 text-center">Sign In</h2>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <Input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    icon={<UserIcon className="h-5 w-5 text-gray-400" />}
                                    name="username"
                                    id="username"
                                    autoComplete="username"
                                    required
                                    className='rounded-none'
                                />

                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    icon={<LockClosedIcon className="h-5 w-5 text-gray-400" />}
                                    name="password"
                                    id="password"
                                    autoComplete="current-password"
                                    required
                                    className='rounded-none'
                                />

                                <Button
                                    className="w-full"
                                    size="lg"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Logging in…' : 'Login'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Right Column - Image */}
                <div className="hidden lg:block relative">
                    <img
                        src="books.jpg"
                        alt="Books"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
            </div>
        </div>
    );
};

export default Login;