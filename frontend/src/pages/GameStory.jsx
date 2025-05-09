import React, { useState, useEffect } from "react";
import "./GameStory.css";
import "./styles.css";
import { Link, useNavigate } from "react-router-dom";
import anchor from "../assets/IMG_0970.PNG";
import victim from "../assets/victim.png";
import pool from "../assets/pool_body.jpg";
import intro from "../assets/intro.JPG";
import chris from "../assets/Wherethis.jpg";
import jason from "../assets/Something2.jpg";
import kate from "../assets/Whythis.jpg";
import poppy from "../assets/Whatthis.jpg";
import violet from "../assets/Whothis.jpg";
import zehab from "../assets/Something1.jpg";
import house from "../assets/IMG_0985.JPG";
import map from "../assets/map.PNG";
import detective from "../assets/detective.jpg";
import spinner from "../assets/spinner-solid.svg";

const dialogues = [
  "Good evening, I'm Tom Sanders from Clue News.",
  "We interrupt this broadcast to bring you breaking news on a shocking and tragic event that has gripped the nation.",
  "Authorities have confirmed the brutal murder of renowned supermodel, Sierra Rose.",
  "Sierra's body was discovered floating in the pool of her luxurious Pasadena Mansion early this morning.",
  "The circumstances surrounding her death remain unclear, as investigators have yet to determine the exact weapon or method used in the crime.",
  "Initial forensic reports suggest no immediate signs of struggle.",
  "And, given the nature of her death, authorities are exploring multiple possibilities—including foul play and staged drowning.",
  "In a shocking development, police have identified six key suspects.",
  "All of whom were either present at a private gathering in Rose's mansion or had known conflicts with her in recent weeks.",
  "Our first suspect is Chris Blaine, a powerful and influential CEO. Known for his business empire, Blaine had strong financial ties with Sierra Rose.",
  "Sources reveal that Sierra was planning to pull out of a lucrative endorsement deal with his company—a decision that could have cost him millions. Was this enough for Blaine to silence her forever?",
  "Next, we have Jason Blue, a chart-topping singer and frequent guest at Sierra's exclusive parties. The two were once close, even rumored to be romantically involved.",
  "But recently, Sierra had been avoiding him. Was there a falling out? And could it have turned deadly?",
  "Kate Ivory, Sierra’s ex-husband and a respected banker, also finds himself under suspicion. Their divorce was messy, with allegations of betrayal and financial disputes.",
  "Despite their public civility, could lingering resentment have driven him to take revenge?",
  "Poppy Green, a rising star in the modeling industry, had everything to gain from Sierra’s downfall.",
  "Rumors suggest a bitter rivalry between them, with Poppy often being overshadowed by Sierra’s success. Was this just a competition gone too far?",
  "Violet Riley, a schoolteacher with no apparent ties to the glamour world, raises more questions than answers. But insiders whisper that Violet and Sierra shared a history—one filled with buried secrets.",
  "What was she hiding, and why was she at the mansion that night?",
  "Finally, we have Zehab Rose, a celebrated writer and Sierra’s own stepsister. Their father’s inheritance had long been a point of contention between them.",
  "With deep-seated family tensions and a past riddled with resentment, could blood ties have turned into betrayal?",
  "The police have taken them into custody.",
  "The police department also conducted a thorough search of Miss Rose's mansion for any clues.",
  "Six suspected evidences were also retrieved and sent to forensic for any further clues.",
  "With the case gaining national attention, the town's Sheriff has advised higher ups to appoint renowned detective Alexander Graves to lead the investigation.",
  "We only hope the Detective is able to catch the murderer, and bring us the questions we deserve.",
];

function GameStory() {
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [image, setImage] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [text, setText] = useState(false);
  const [exit, setExit] = useState(false);
  const [fadeIn, setFadeIn] = useState(true); // New state for fade-in

  const navigate = useNavigate();

  // Handle fade-in completion
  useEffect(() => {
    const timeout = setTimeout(() => {
      setFadeIn(false); // Remove fade-in class after animation
    }, 1000); // Match the CSS animation duration

    return () => clearTimeout(timeout);
  }, []);

  // Handle navigation after fade-out
  useEffect(() => {
    if (exit) {
      const timeout = setTimeout(() => {
        navigate("/startgame");
      }, 1000); // Wait for fade-out animation to complete

      return () => clearTimeout(timeout);
    }
  }, [exit, navigate]);

  // Handle text appearance during fade-out
  useEffect(() => {
    if (fadeOut) {
      const timeout = setTimeout(() => {
        setText(true);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [fadeOut]);

  // Handle exit after fade-out
  useEffect(() => {
    if (fadeOut) {
      const timeout = setTimeout(() => {
        setExit(true);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [fadeOut]);

  const handleKeyPress = (event) => {
    if (fadeOut) return;

    if (event.code === "Space" || event.code === "ArrowRight") {
      if (dialogueIndex < dialogues.length - 1) {
        setDialogueIndex((prevIndex) => prevIndex + 1);
        setImage((prevIndex) => prevIndex + 1);
      } else {
        setFadeOut(true); // Trigger fade out
      }
    }

    if (event.code === "ArrowLeft") {
      if (dialogueIndex > 0) {
        setDialogueIndex((prevIndex) => prevIndex - 1);
        setImage((prevIndex) => prevIndex - 1);
      }
    }
  };

  // Skip to "STARTING GAME" screen
  const handleSkip = () => {
    setFadeOut(true);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [dialogueIndex, fadeOut]);

  return (
    <div
      className={`${exit ? "fade-leave" : ""} ${fadeIn ? "fade-in" : ""}`}
      style={{ overflow: "hidden", maxHeight: "84vh" }}
    >
      <main>
        <img
          src={map}
          style={{
            position: "fixed",
            width: "80%",
            zIndex: 0,
            top: 0,
            left: "10%",
            right: 0,
            bottom: 0,
            opacity: 0.5,
          }}
        />
        <img src={anchor} className="anchor-image" />

        <div className="breaking-news">
          <p className="headlines">BREAKING NEWS | MODEL FOUND DEAD</p>
        </div>

        <div
          className="dialogue-box"
          style={{
            left: dialogueIndex >= 9 && dialogueIndex <= 20 ? "55%" : "8%",
            bottom:
              dialogueIndex >= 9 && dialogueIndex <= 20 ? "auto" : "130px",
            top: dialogueIndex >= 9 && dialogueIndex <= 20 ? "30%" : "auto",
          }}
        >
          <p>{dialogues[dialogueIndex]}</p>
        </div>

        {dialogueIndex >= 1 && dialogueIndex <= 2 && (
          <img src={intro} className="report-img" />
        )}
        {dialogueIndex >= 3 && dialogueIndex <= 6 && (
          <img src={pool} className="report-img" />
        )}
        {dialogueIndex >= 7 && dialogueIndex <= 8 && (
          <img src={victim} className="report-img" />
        )}

        {dialogueIndex >= 9 && dialogueIndex <= 10 && (
          <>
            <div className="story-overlay" />
            <img src={chris} className="suspect-img" />
          </>
        )}

        {dialogueIndex >= 11 && dialogueIndex <= 12 && (
          <>
            <div className="story-overlay"/>
            <img src={jason} className="suspect-img" />
          </>
        )}

        {dialogueIndex >= 13 && dialogueIndex <= 14 && (
          <>
            <div className="story-overlay" />
            <img src={kate} className="suspect-img" />
          </>
        )}

        {dialogueIndex >= 15 && dialogueIndex <= 16 && (
          <>
            <div className="story-overlay" />
            <img src={poppy} className="suspect-img" />
          </>
        )}

        {dialogueIndex >= 17 && dialogueIndex <= 18 && (
          <>
            <div className="story-overlay" />
            <img src={violet} className="suspect-img" />
          </>
        )}

        {dialogueIndex >= 19 && dialogueIndex <= 20 && (
          <>
            <div className="story-overlay" />
            <img src={zehab} className="suspect-img" />
          </>
        )}

        {dialogueIndex >= 22 && dialogueIndex <= 23 && (
          <>
            <img
              src={house}
              className="report-img"
              style={{
                width: "35%",
              }}
            />
          </>
        )}

        {dialogueIndex >= 24 && dialogueIndex <= 25 && (
          <>
            <img src={detective} className="report-img" />
          </>
        )}

        {/* Skip Button */}
        {!fadeOut && (
          <button
            onClick={handleSkip}
            style={{
              position: "fixed",
              bottom: "20%",
              right: "40px",
              padding: "10px 20px",
              fontFamily: "'Press Start 2P', cursive",
              fontSize: "20px",
              color: "white",
              backgroundColor: "rgb(238, 6, 6)",
              border: "3px dashed rgb(132, 4, 4)",
              borderRadius: "5px",
              cursor: "pointer",
              textShadow: "0px 0px 5px #000",
              zIndex: 10,
            }}
            onMouseEnter = {(e) => {
             ( e.target.style.border = "3px dashed rgb(238, 6, 6)"),
             ( e.target.style.backgroundColor = "rgb(132, 4, 4)");
            }}
            onMouseLeave={(e) => {
              (e.target.style.border = "3px dashed rgb(132, 4, 4)"),
              (e.target.style.backgroundColor = "rgb(238, 6, 6)");
            }}
          >
            SKIP
          </button>
        )}
      </main>

      {fadeOut && (
        <div className="fade-out-screen">
          {text && (
            <>
              <img
                src={spinner}
                style={{
                  width: "45%",
                  position: "fixed",
                  top: "3%",
                  left: "25%",
                  animation: "spin 5s linear infinite",
                }}
              />

              <div
                style={{
                  position: "fixed",
                  fontFamily: "'Press Start 2P'",
                  color: "white",
                  top: "40%",
                  left: "5%",
                  fontSize: "7vw",
                  textAlign: "center",
                  textShadow: "0px 0px 10px rgb(255, 164, 8)",
                }}
              >
                STARTING GAME
              </div>

              <div
                className="headlines"
                style={{
                  position: "fixed",
                  top: "75%",
                  fontSize: " 30px",
                }}
              >
                GUESS THE MURDERER AND THE MURDER WEAPON
              </div>

              <div
                className="headlines"
                style={{
                  position: "fixed",
                  top: "65%",
                  fontSize: "30px",
                }}
              >
                THREE LIVES. FOUR MINUTES.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GameStory;