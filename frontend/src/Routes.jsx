import { Routes, Route } from "react-router-dom";
import './index.css';
import Home from "./pages/Home";
import GameStory from "./pages/GameStory";
import GamePlay from "./pages/GamePlay";


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/gamestory" element={<GameStory />} />
      <Route path="/startgame" element={<GamePlay />} />

    </Routes>
  );
};

export default AppRoutes;