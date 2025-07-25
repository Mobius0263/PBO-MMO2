import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            error: error,
            errorInfo: errorInfo || {} // Pastikan errorInfo tidak null
        });
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#f5f5f5',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <h1 style={{ color: '#d32f2f', marginBottom: '20px' }}>
                        Something went wrong
                    </h1>
                    <p style={{ marginBottom: '20px', color: '#666' }}>
                        The application has encountered an error. Please try refreshing the page.
                    </p>
                    <details style={{
                        whiteSpace: 'pre-wrap',
                        backgroundColor: '#fff',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        marginBottom: '20px',
                        textAlign: 'left',
                        maxWidth: '80%'
                    }}>
                        <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                            Click to see error details
                        </summary>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack ? (
                            this.state.errorInfo.componentStack
                        ) : (
                            "No component stack available"
                        )}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
