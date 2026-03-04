import './index.css'
import Desktop from './components/desktop';
import LoginScreen from './components/login';

const AppContent = () => {
    const isAuthenticated = false;
    if (!isAuthenticated) return <LoginScreen />;
    return (
        <Desktop />
    );
};

function App() {
    return (
        <div className="App">
            <AppContent />
        </div>
    );
}

export default App;