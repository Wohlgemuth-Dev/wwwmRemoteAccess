import './index.css';

const LoginScreen = () => {
    return (
        <>
            <div>login/index.tsx</div>
            <div className="loginWindow">
                <h1>Login</h1>
                <input type="text" placeholder="Username" />
                <input type="password" placeholder="Password" />
                <button>Login</button>
            </div>
        </>
    );
};

export default LoginScreen;
