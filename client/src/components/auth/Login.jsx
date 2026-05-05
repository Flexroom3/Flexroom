import React, { useState } from 'react';
import './auth.css';

import LogoImage from '../assets/Flexroom-white.png';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope, FaLock } from 'react-icons/fa';

const API_BASE = process.env.REACT_APP_API_BASE || '';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userRole, setUserRole] = useState('');

    const handleLogin = async (e, nextRole = userRole) => {
        e.preventDefault();

        console.log('LOGIN ATTEMPT:', email, nextRole);

        if (!nextRole) {
            alert('Please select if you are logging in as a Student or Evaluator.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                alert(data.error || 'Login failed.');
                return;
            }

            const roleFromServer = data.user?.role;
            if (roleFromServer && roleFromServer !== nextRole) {
                alert(
                    `This account is registered as an ${roleFromServer}. Please use the matching login button.`,
                );
                return;
            }

            sessionStorage.setItem('flexroom_token', data.token);
            sessionStorage.setItem('flexroom_user', JSON.stringify(data.user));

            try {
                const key =
                    nextRole === 'student'
                        ? 'flexroomDisplayName'
                        : 'flexroomDisplayNameEvaluator';
                if (data.user?.name) {
                    window.localStorage.setItem(key, data.user.name);
                }
            } catch (_) {
                // ignore storage issues in local preview
            }

            navigate(nextRole === 'student' ? '/student' : '/evaluator');
        } catch (err) {
            console.error(err);
            alert('Could not reach the server. Is the API running?');
        }
    };

    return (
        <div className="container-fluid d-flex justify-content-center align-items-center auth-background vh-100">
            <FaArrowLeft className="back-arrow-extreme" onClick={() => navigate('/')} />
            <form className="auth-form p-5 text-center" onSubmit={handleLogin}>
                <h1 className="login-heading mb-5">Login</h1>

                <div className="input-container mb-4">
                    <input
                        type="email"
                        className="auth-input rounded-pill"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <FaEnvelope className="input-icon" />
                </div>

                <div className="input-container mb-3">
                    <input
                        type="password"
                        className="auth-input rounded-pill"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <FaLock className="input-icon" />
                </div>

                <div className="text-start mb-5">
                    <button type="button" className="forgot-password bg-transparent border-0 p-0">
                        Forgot Password?
                    </button>
                </div>

                <div className="d-grid gap-2 mb-5">
                    <button
                        type="submit"
                        className={`btn-auth rounded-pill ${userRole === 'student' ? 'active' : ''}`}
                        onClick={(e) => {
                            setUserRole('student');
                            handleLogin(e, 'student');
                        }}
                    >
                        Login As Student
                    </button>
                    <button
                        type="submit"
                        className={`btn-auth rounded-pill ${userRole === 'evaluator' ? 'active' : ''}`}
                        onClick={(e) => {
                            setUserRole('evaluator');
                            handleLogin(e, 'evaluator');
                        }}
                    >
                        Login As Evaluator
                    </button>
                </div>

                <div className="mt-5">
                    <img src={LogoImage} alt="FlexRoom Logo" className="auth-logo-img" />
                </div>
            </form>
        </div>
    );
};

export default Login;
