import { Routes, Route } from "react-router-dom";
import './index.css';
import Home from "./pages/Home";
import GamePlay from "./pages/GamePlay";


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/startgame" element={<GamePlay />} />
    </Routes>
  );
};

export default AppRoutes;