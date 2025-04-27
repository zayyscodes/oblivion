import React, { useState, useEffect } from "react";
import "../pages/styles.css";
import header from "../assets/header.jpg";
import Creators from "../components/Creators";
import { Link, useNavigate } from "react-router-dom";

function Home() {
  const [showLiner, setShowLiner] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(window.innerWidth >= 1024);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Clear gameId from localStorage when Home mounts
  useEffect(() => {
    console.log("Home component mounted, clearing gameId from localStorage");
    localStorage.removeItem("gameId");
  }, []); // Empty dependency array ensures this runs only on mount

  useEffect(() => {
    setTimeout(() => {
      setShowLiner(true);
    }, 2000);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setShowText(true);
    }, 6000);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsFullScreen(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Start game logic
  const startGame = async () => {
    console.log("Start Game button clicked from Home!");
    try {
      const response = await fetch("http://127.0.0.1:5000/api/start_game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      console.log("Response from /start_game:", JSON.stringify(data, null, 2));

      if (data.status === "success") {
        console.log(
          "Game started successfully:",
          JSON.stringify(data, null, 2)
        );
        // Store gameId in localStorage
        localStorage.setItem("gameId", data.game_id);
        console.log("Stored gameId in localStorage:", data.game_id);
        // Navigate to /gamestory without passing state
        navigate("/gamestory");
      } else {
        console.error("Failed to start game:", data.message);
      }
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  return (
    <div
      className="homepage"
      style={{ paddingBottom: "100px", overflow: "hidden", minHeight: "84vh" }}
    >
      <section
        style={{
          position: "relative",
        }}
      >
        <img src={header} className="header" />
        <div
          style={{
            fontFamily: '"Rubik Glitch"',
            color: "rgb(245, 241, 202)",
            position: "absolute",
            top: "30%",
            left: "11%",
            fontSize: "clamp(60px, 15vw, 220px)", // Scales dynamically
            textAlign: "center",
            textShadow: "3px 3px 5px rgb(0, 0, 0)",
            animation: "slideInDown 2s ease-in-out", // Changed to slideInDown
            whiteSpace: "nowrap",
          }}
        >
          OBLIVION
        </div>

        {/* Delayed Appearing Text */}
        {showLiner && (
          <div className="oneliner-header">
            UNRAVEL THE TRUTH, ONE CLUE AT A TIME...
          </div>
        )}
      </section>

      {showText && (
        <>
          <main className="body-container">
            {!isFullScreen && (
              <section
                style={{
                  animation: "fade 1s",
                }}
              >
                <div className="note">
                  <strong>NOTE:</strong> To ensure better experience, you are
                  ADVISED to play in FULL SCREEN MODE
                </div>
              </section>
            )}
            <section
              style={{
                animation: "fade 1s",
              }}
            >
              <div className="about-heading">ABOUT THE GAME</div>

              <div className="description-container">
                <div className="description-text">
                  <p>
                    <strong>Oblivion</strong> draws you into a world where a
                    single death unravels a web of lies. The host lies dead,
                    six suspects weave conflicting tales, and a hidden weapon
                    waits to be uncovered. Each case twists into a new mystery
                    — no two stories are ever the same.
                  </p>
                  <p>
                    Question suspects,
                    chase alibis through flickering CCTV footage, and weigh AI
                    whispers against your own instincts. Time is slipping away;
                    you have only minutes, a few desperate chances, and the thin
                    thread of truth to find the killer before the case consumes you.
                  </p>

                  <p>Will you uncover the truth — or be lost in the oblivion?</p>
                </div>
              </div>

              {isFullScreen && (
                <div>
                  <Link to="/gamestory">
                    <button className="button" onClick={startGame}>
                      START GAME
                    </button>
                  </Link>
                </div>
              )}
            </section>

            <section>
              <div className="rules-heading">GAME RULES</div>

              <div className="container">
                <div
                  style={{
                    fontFamily: '"Montserrat"',
                    color: "white",
                    maxWidth: "80%",
                    fontSize: "clamp(8px, 2.5vw, 30px)",
                    textAlign: "center",
                    textShadow: "0px 0px 6px rgb(0, 0, 0)",
                  }}
                >
                  <h2 className="game-heading">🔍 Murder Mystery Begins</h2>
                  <ul className="oneliner">
                    <li>
                      <i>
                        A lavish party ends in tragedy—the host found lifeless in a pool,
                        but the truth is far darker than it seems.
                      </i>
                    </li>
                    <li>
                      Six suspects, each with their own hidden secrets, and a web of mysterious clues emerge.
                    </li>
                  </ul>

                  <h2 className="game-heading">🕵️ Investigate the Scene</h2>
                  <ul className="oneliner">
                    <li>Interrogate suspects, chase alibis, and scrutinize every detail—no clue is too small.</li>
                    <li>
                      <i>
                        Beware—some suspects will weave lies to protect themselves.
                      </i>
                    </li>
                  </ul>

                  <h2 className="game-heading">🎯 Make Your Guess</h2>
                  <ul className="oneliner">
                    <li>
                      Pinpoint the murderer and the weapon—
                      <i>trust your instincts, not just the evidence.</i>
                    </li>
                    <li>
                      One wrong move, and the truth stays hidden in the shadows...
                    </li>
                  </ul>

                  <h2 className="game-heading">⚠️ Limited Tries</h2>
                  <ul className="oneliner">
                    <li>
                      You have only three tries and just four minutes—
                      <i>every choice could be your last.</i>
                    </li>
                  </ul>

                  <h2 className="game-heading">💡 Unlock Hints</h2>
                  <ul className="oneliner">
                    <li>
                      Two wrong guesses trigger an essential lifeline—
                      <i>a cryptic hint to help you uncover the truth. </i>
                      The closer you get, the clearer the case becomes.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {!isFullScreen && (
              <section>
                <Link to="/gamestory">
                  <button className="button" onClick={startGame}>
                    START GAME
                  </button>
                </Link>
              </section>
            )}
          </main>

          <Creators />
        </>
      )}
    </div>
  );
}

export default Home;
