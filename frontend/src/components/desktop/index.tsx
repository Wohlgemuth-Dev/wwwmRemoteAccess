import Navbar from "../navbar/Navbar";
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Console from "../console/Console";

const Desktop = () => {
    return (
        <>
            <Navbar />
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<div>desktop/index.tsx</div>} />
                    <Route path="/console" element={<Console />} />
                </Routes>
            </BrowserRouter>
        </>
    );
};

export default Desktop;
