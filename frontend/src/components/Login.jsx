import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login } from '../services/authService';
import { AuthContext } from '../context/AuthContext';
import '../styles/Auth.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [debugInfo, setDebugInfo] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { loginUser } = useContext(AuthContext);

    // Check for redirect messages (e.g., after successful registration)
    useEffect(() => {
        if (location.state?.message) {
            setSuccess(location.state.message);
            // Clear location state to avoid showing the message again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        setDebugInfo(null);

        try {
            // Validate inputs
            if (!email || !password) {
                throw new Error('All fields must be filled');
            }

            console.log(`Attempting login for ${email}...`);
            const response = await login({ email, password });
            console.log('Login successful, response:', response);
            
            loginUser(response.user);
            setSuccess('Login successful!');
            
            // Wait a moment to show success message
            setTimeout(() => {
                navigate('/dashboard');
            }, 500);
            
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed. Please try again.');
            setDebugInfo({
                message: err.message,
                stack: err.stack
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Login</h2>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Login'}
                    </button>
                </form>

                <p className="auth-redirect">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
                
                {debugInfo && (
                    <div className="debug-info" style={{marginTop: '20px', fontSize: '12px', color: '#666'}}>
                        <h4>Debug Info (Development Only):</h4>
                        <pre style={{overflowX: 'auto'}}>{JSON.stringify(debugInfo, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Login;