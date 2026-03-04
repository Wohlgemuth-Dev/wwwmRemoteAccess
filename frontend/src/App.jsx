import './index.css'
import Desktop from './components/desktop';
import LoginScreen from './components/login';
import { AuthProvider, useAuth } from './service/AuthContext';

const AppContent = () => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <LoginScreen />;
    return (
        <Desktop />
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