import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';
import '../styles/Auth.css';

function Register() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Validate inputs
            if (!fullName || !email || !password) {
                throw new Error('All fields are required');
            }

            if (password !== confirmPassword) {
                throw new Error('Password and confirm password do not match');
            }

            console.log('Attempting to register with:', { fullName, email });
            
            // Call the register API to save user data in the "users" collection
            const result = await register({ nama: fullName, email, password });
            console.log('Registration successful, response:', result);
            
            // Redirect to login page with success message
            navigate('/login', { 
                state: { 
                    message: 'Registration successful! Please login with your new account',
                    type: 'success'
                } 
            });
        } catch (err) {
            console.error('Registration error in component:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Rest of the component remains the same

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Register</h2>
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Full Name"
                            required
                        />
                    </div>

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

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Registering...' : 'Register'}
                    </button>
                </form>

                <p className="auth-redirect">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;
