import React, { useState, useEffect } from "react";
import "../pages/styles.css";
import header from "../assets/header.jpg";
import { Link } from "react-router-dom";
import Creators from "../components/Creators";

function Home() {
  const [showLiner, setShowLiner] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(window.innerWidth >= 1024);

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
  

  return (
    <div
      style={{ paddingBottom: "100px", overflow: "hidden", minHeight: "84vh" }}
    >
      <section
        style={{
          position: "relative",
        }}
      >
        <img
          src={header}
          className="header"
        />
        <div
          style={{
            fontFamily: '"Rubik Glitch"',
            color: "rgb(245, 239, 187)",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "clamp(60px, 12vw, 200px)", // Scales dynamically
            textAlign: "center",
            textShadow: "3px 3px 1px rgb(0, 0, 0)",
            animation: "fadeIn 2s ease-in-out",
            whiteSpace: "nowrap",
          }}
        >
          OBLIVION
        </div>

        {/* Delayed Appearing Text */}
        {showLiner && (
          <div
            className="oneliner-header"
          >
            UNRAVEL THE TRUTH, ONE CLUE AT A TIME...
          </div>
        )}
      </section>

      {showText && (
        <>
          <main className="body-container">
            <section
              style={{
                animation: "fade 1s",
              }}
            >
              <div className="about-heading">ABOUT THE GAME</div>

              <div className="description-container">
                <div className="description-text">
                  <p>
                    <strong>Oblivion</strong> is an interactive murder mystery
                    where your deduction skills are put to the test. A host has
                    been found dead, and six suspects each hold a piece of the
                    puzzle.
                  </p>
                  <p>
                    Investigate the scene, analyze deceptive clues, and use
                    logic to pinpoint the murderer. With only four chances to
                    solve the case and the option to unlock hints after two
                    wrong guesses, every decision counts.
                  </p>

                  <p>Can you piece together the truth before it's too late?</p>
                </div>
              </div>

              {isFullScreen && (
                <div>
                  <Link to="/startgame">
                  <button className="button">
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
                        A lavish party turns deadly— the host is found lifeless
                        in a locked room.
                      </i>
                    </li>
                    <li>
                      Six suspects, each hiding secrets, and a trail of cryptic
                      clues emerge.
                    </li>
                  </ul>

                  <h2 className="game-heading">🕵️ Investigate the Scene</h2>
                  <ul className="oneliner">
                    <li>Scrutinize each clue—every detail matters.</li>
                    <li>
                      <i>
                        But beware—some clues are red herrings, leading you
                        astray.
                      </i>
                    </li>
                  </ul>

                  <h2 className="game-heading">🎯 Make Your Guess</h2>
                  <ul className="oneliner">
                    <li>
                      Decide the murderer’s identity and the weapon used—
                      <i>trust your instincts.</i>
                    </li>
                    <li>
                      A wrong guess won't reveal your mistake, leaving you in
                      the dark...
                    </li>
                  </ul>

                  <h2 className="game-heading">⚠️ Limited Tries</h2>
                  <ul className="oneliner">
                    <li>
                      Four attempts stand between you and the truth—
                      <i>use them wisely.</i>
                    </li>
                  </ul>

                  <h2 className="game-heading">💡 Unlock Hints</h2>
                  <ul className="oneliner">
                    <li>
                      Two missteps trigger a <i>lifeline</i>—a clue that may
                      turn the case around.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {!isFullScreen && (
                <section>
                  <Link to="/startgame">
                  <button className="button">
                    START GAME
                  </button>
                  </Link>
                </section>
              )}
          </main>

          <Creators/>
        </>
      )}
    </div>
  );
}

export default Home;
