import { useState, useEffect } from 'react';
import './index.css';
import Desktop from './components/desktop';
import LoginScreen from './components/login';
import SessionTimeoutManager from './components/sessionTimeout/SessionTimeoutManager';
import { AuthProvider, useAuth } from './service/AuthContext';
import { Toast } from './components/Toast';

const AppContent = () => {
    const { isAuthenticated } = useAuth();
    const [apiError, setApiError] = useState<string | null>(null);

    useEffect(() => {
        const handleApiError = (e: Event) => {
            const customEvent = e as CustomEvent<{ message: string }>;
            setApiError(customEvent.detail.message);
        };

        window.addEventListener('api-error', handleApiError);
        return () => window.removeEventListener('api-error', handleApiError);
    }, []);

    return (
        <>
            {isAuthenticated ? (
                <>
                    <SessionTimeoutManager />
                    <Desktop />
                </>
            ) : (
                <LoginScreen />
            )}
            {apiError && (
                <Toast
                    message={apiError}
                    type="error"
                    duration={0}
                    onDismiss={() => setApiError(null)}
                />
            )}
        </>
    );
};

// ... (remaining App function is unchanged but importing React)
function App() {
    return (
        <AuthProvider>
            <div className="App">
                <AppContent />
            </div>
        </AuthProvider>
    );
}

export default App;