import './index.css'
import Desktop from './components/desktop';
import LoginScreen from './components/login';
import SessionTimeoutManager from './components/sessionTimeout/SessionTimeoutManager';
import { AuthProvider, useAuth } from './service/AuthContext';

const AppContent = () => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <LoginScreen />;
    return (
        <>
            <SessionTimeoutManager />
            <Desktop />
        </>
    );
};

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