import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CountdownTimer from "../components/timer";

import "./styles.css";
import "./GamePlay.css";

import background from "../assets/Something9.png";
import inspector from "../assets/Something8.png";
import detective from "../assets/Something3.png";
import left from "../assets/arrow-left-solid.svg";
import down from "../assets/arrow-down-solid.svg";

// SUSPECTS
import chris from "../assets/chris.JPEG";
import jason from "../assets/jason.JPEG";
import kate from "../assets/kate.JPEG";
import poppy from "../assets/poppy.JPEG";
import violet from "../assets/violet.JPEG";
import zehab from "../assets/zehab.JPEG";

import int_chris from "../assets/Wherethis.jpg";
import int_jason from "../assets/Something2.jpg";
import int_kate from "../assets/Whythis.jpg";
import int_poppy from "../assets/Whatthis.jpg";
import int_violet from "../assets/Whothis.jpg";
import int_zehab from "../assets/Something1.jpg";

// WEAPONS
import wrench from "../assets/wrench.JPEG";
import rope from "../assets/rope.JPEG";
import revolver from "../assets/revolver.JPEG";
import pipe from "../assets/pipe.JPEG";
import knife from "../assets/knife.JPEG";
import candle from "../assets/candle.JPEG";

import dialogues from "../pages/dialogues";

function GamePlay() {
  const navigate = useNavigate();

  // Retrieve gameId from localStorage
  const initialGameId = localStorage.getItem("gameId");
  console.log("GamePlay loaded with initialGameId from localStorage:", initialGameId);

  // State
  const [gameId, setGameId] = useState(initialGameId);
  const [step, setStep] = useState(initialGameId ? 1 : 0);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [currentSuspectIndex, setCurrentSuspectIndex] = useState(0);
  const [currentWeapon, setCurrentWeapon] = useState(0);
  const [suspectsOpen, setSuspectsOpen] = useState(false);
  const [weaponsOpen, setWeaponsOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [suspectDialogues, setSuspectDialogues] = useState({});
  const [alibiClaims, setAlibiClaims] = useState({});
  const [stage3Dialogues, setStage3Dialogues] = useState({});
  const [stage4Dialogues, setStage4Dialogues] = useState([]); // Dynamic dialogues for Stage 4
  const [selectedSuspect, setSelectedSuspect] = useState("");
  const [showDialogue, setShowDialogue] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes = 180 seconds
  const [timerStarted, setTimerStarted] = useState(false); // Tracks if timer has started
  const [verifiedSuspects, setVerifiedSuspects] = useState(new Set()); // Tracks verified suspects in Stage 4
  const [aiSuggestion, setAiSuggestion] = useState(""); // AI suggestion for next suspect to verify
  const [hasSetAiSuggestion, setHasSetAiSuggestion] = useState(false); // Tracks if AI suggestion has been set

  // Debug step state
  console.log("Current step state:", step);

  // Prevent duplicate API calls during double rendering
  const hasFetchedInitialData = useRef(false);
  const hasFetchedAlibis = useRef(false);
  const hasStartedGame = useRef(false); // New ref to prevent duplicate startNewGame calls

  // Timer Logic (consolidated)
  useEffect(() => {
    // Start timer when step >= 3 and timer hasn't started yet
    if (step >= 3 && !timerStarted && timeLeft > 0) {
      setTimerStarted(true);
    }

    if (!timerStarted || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          console.log("Time is up! Game Over.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval); // Cleanup on unmount or when timer stops
  }, [timerStarted, timeLeft, step]);

  // Format time for display
  const formatTime = (seconds) => {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  // Start a new game by calling /api/start_game
  const startNewGame = async () => {
    try {
      const options = {
        method: "POST",
      };
      console.log("Fetching http://127.0.0.1:5000/api/start_game with method POST");
      const res = await fetch("http://127.0.0.1:5000/api/start_game", options);

      if (!res.ok) {
        console.log(`HTTP error! Status: ${res.status}, Status Text: ${res.statusText}`);
        const errorData = await res.json().catch(() => ({}));
        console.log("Error response from /start_game:", errorData);
        throw new Error(`HTTP error! Status: ${res.status}, Message: ${errorData.message || res.statusText}`);
      }

      const data = await res.json();
      console.log("Response from /start_game:", data);

      if (data.status === "error") {
        console.log(`Backend error: ${data.message}`);
        setError(data.message);
        return false;
      }

      console.log("Started new game with gameId:", data.game_id);
      localStorage.setItem("gameId", data.game_id);
      console.log("Updated localStorage gameId:", localStorage.getItem("gameId"));
      setGameId(data.game_id);
      setStep(1);
      return true;
    } catch (e) {
      console.log("Fetch error for /start_game:", e.message);
      setError("Failed to start a new game. Please try again.");
      return false;
    }
  };

  // Fallback: Fetch gameId if not found in localStorage
  useEffect(() => {
    if (!gameId && !hasStartedGame.current) {
      console.log("No gameId in localStorage or state, attempting to start a new game...");
      hasStartedGame.current = true; // Prevent duplicate calls
      startNewGame();
    }
  }, [gameId]); // Dependency on gameId ensures this runs only when gameId changes

  // Fetch initial data for Stage 2 (Round 1 Interview)
  const fetchInitialData = async (retryCount = 0) => {
    const maxRetries = 3;
    if (!gameId) {
      console.log("No gameId available for fetchInitialData, aborting...");
      return;
    }

    try {
      const url = `http://127.0.0.1:5000/api/round1_interview?game_id=${gameId}`;
      console.log(`Fetching ${url} with method GET (Attempt ${retryCount + 1}/${maxRetries})`);
      const res = await fetch(url, {
        method: "GET",
      });

      if (!res.ok) {
        console.log(`HTTP error! Status: ${res.status}, Status Text: ${res.statusText}`);
        const errorData = await res.json().catch(() => ({}));
        console.log("Error response from /round1_interview:", errorData);

        // If the game_id is invalid, start a new game
        if (res.status === 400 && errorData.message?.includes("Invalid or missing game_id")) {
          console.log("Invalid game_id detected, clearing localStorage and starting a new game...");
          localStorage.removeItem("gameId");
          setGameId(null);
          hasStartedGame.current = false; // Allow starting a new game
          const started = await startNewGame();
          if (started) {
            // Retry fetching with the new gameId
            const retryUrl = `http://127.0.0.1:5000/api/round1_interview?game_id=${localStorage.getItem("gameId")}`;
            console.log(`Retrying fetch with new gameId: ${retryUrl}`);
            const retryRes = await fetch(retryUrl, {
              method: "GET",
            });

            if (!retryRes.ok) {
              throw new Error(`Retry HTTP error! Status: ${retryRes.status}`);
            }

            const retryData = await retryRes.json();
            console.log("Retry response from /round1_interview:", retryData);

            if (retryData.status === "error") {
              setError(retryData.message);
              return;
            }

            setSuspectDialogues(retryData.suspect_dialogues);
          }
          return;
        }

        throw new Error(`HTTP error! Status: ${res.status}, Message: ${errorData.message || res.statusText}`);
      }

      const data = await res.json();
      console.log("Response from /round1_interview:", data);

      if (data.status === "error") {
        console.log(`Backend error: ${data.message}`);
        setError(data.message);
        return;
      }

      console.log("Successfully fetched suspect dialogues:", data.suspect_dialogues);
      setSuspectDialogues(data.suspect_dialogues);
    } catch (e) {
      console.log("Fetch error for /round1_interview:", e.message);
      if (retryCount < maxRetries - 1) {
        console.log(`Retrying fetch (Attempt ${retryCount + 2}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        await fetchInitialData(retryCount + 1);
      } else {
        setError("Failed to fetch suspect dialogues after multiple attempts. Please ensure the backend is running and try again.");
      }
    }
  };

  // Fetch initial data only after gameId is set and stable
  useEffect(() => {
    if (gameId && !hasFetchedInitialData.current) {
      hasFetchedInitialData.current = true;
      console.log("Fetching initial data for gameId:", gameId);
      fetchInitialData();
    }
  }, [gameId]); // Dependency on gameId ensures this runs only when gameId changes

  // Fetch alibis for Stage 3 (Round 2 Alibis)
  const fetchAlibis = async () => {
    try {
      const url = `http://127.0.0.1:5000/api/round2_alibis?game_id=${gameId}`;
      console.log(`Fetching ${url} with method GET`);
      const res = await fetch(url, {
        method: "GET",
      });

      if (!res.ok) {
        console.log(`HTTP error! Status: ${res.status}, Status Text: ${res.statusText}`);
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Response from /round2_alibis:", data);

      if (data.status === "error") {
        console.log(`Backend error: ${data.message}`);
        setError(data.message);
        return;
      }

      setAlibiClaims(data.alibi_claims);
      const stage3 = buildStage3(data.alibi_claims);
      setStage3Dialogues(stage3);
    } catch (e) {
      console.log("Fetch error for /round2_alibis:", e.message);
      setError("Failed to fetch alibis. Please try again.");
    }
  };

  useEffect(() => {
    if (step === 3 && !hasFetchedAlibis.current) {
      hasFetchedAlibis.current = true;
      fetchAlibis();
    }
  }, [step, gameId]);

  // Verify alibi for Stage 4 (Round 3 Verify Alibi)
  const verifyAlibi = async (suspectName) => {
    try {
      const url = `http://127.0.0.1:5000/api/round3_verify_alibi`;
      console.log(`Fetching ${url} with method POST for suspect: ${suspectName}`);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ suspect_name: suspectName }),
      });

      if (!res.ok) {
        console.log(`HTTP error! Status: ${res.status}, Status Text: ${res.statusText}`);
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Response from /round3_verify_alibi:", data);

      if (data.status === "error") {
        console.log(`Backend error: ${data.message}`);
        setError(data.message);
        return;
      }

      // Add suspect to verified list
      setVerifiedSuspects((prev) => new Set(prev).add(suspectName));

      // Build dialogues dynamically using the backend response
      const stage4 = buildStage4(data);
      setStage4Dialogues(stage4);

      // Set AI suggestion only on the first verification
      if (!hasSetAiSuggestion && data.most_suspected_suggestion) {
        const suggestionFrontendName = Object.keys(SUSPECT_NAME_MAPPING).find(
          (key) => SUSPECT_NAME_MAPPING[key] === data.most_suspected_suggestion
        );
        setAiSuggestion(`The AI suggests checking ${suggestionFrontendName}'s alibi.`);
        setHasSetAiSuggestion(true);
      } else if (!hasSetAiSuggestion && !data.most_suspected_suggestion) {
        setAiSuggestion("All suspects have been verified.");
        setHasSetAiSuggestion(true);
      }

      setShowDialogue(true);
    } catch (e) {
      console.log("Fetch error for /round3_verify_alibi:", e.message);
      setError("Failed to verify alibi. Please try again.");
    }
  };

  // Handle keypress for dialogues
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (step === 1 || step === 2 || (step === 3 && showDialogue) || (step === 4 && showDialogue)) {
        const dialogueSet = getDialogueSet();
        if (event.code === "Space" || event.code === "ArrowRight") {
          setDialogueIndex((prev) =>
            prev < dialogueSet.length - 1 ? prev + 1 : prev
          );
        }
        if (event.code === "ArrowLeft") {
          setDialogueIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [step, dialogueIndex, showDialogue]);

  const suspect_cards = [
    { id: 1, name: "chris", image: chris, displayName: "Chris Blaine" },
    { id: 2, name: "jason", image: jason, displayName: "Jason Blue" },
    { id: 3, name: "kate", image: kate, displayName: "Kate Ivory" },
    { id: 4, name: "poppy", image: poppy, displayName: "Poppy Green" },
    { id: 5, name: "violet", image: violet, displayName: "Violet Riley" },
    { id: 6, name: "zehab", image: zehab, displayName: "Zehab Rose" },
  ];

  const weapon_cards = [
    { id: 1, name: "wrench", image: wrench, displayName: "Wrench" },
    { id: 2, name: "pipe", image: pipe, displayName: "Pipe" },
    { id: 3, name: "revolver", image: revolver, displayName: "Revolver" },
    { id: 4, name: "rope", image: rope, displayName: "Rope" },
    { id: 5, name: "candlestick", image: candle, displayName: "Candlestick" },
    { id: 6, name: "knife", image: knife, displayName: "Knife" },
  ];

  const weaponImages = {
    candlestick: candle,
    wrench: wrench,
    rope: rope,
    pipe: pipe,
    revolver: revolver,
    knife: knife,
  };

  const suspectImages = {
    chris: int_chris,
    jason: int_jason,
    kate: int_kate,
    poppy: int_poppy,
    violet: int_violet,
    zehab: int_zehab,
  };

  const suspectNames = suspect_cards.map((s) => s.name);

  const SUSPECT_NAME_MAPPING = {
    chris: "Chris Blaine",
    jason: "Jason Blue",
    kate: "Kate Ivory",
    poppy: "Poppy Green",
    violet: "Violet Riley",
    zehab: "Zehab Rose",
  };

  const buildStage3 = (alibiClaims) => {
    const phrases = [
      (t, l) => `I saw ${t} near the ${l}.`,
      (t, l) => `${t}? Think they were by the ${l}.`,
      (t, l) => `Pretty sure ${t} was at the ${l}.`,
      (t, l) => `I think I saw ${t} around the ${l}.`,
      (t, l) => `${t} was hanging near the ${l}, I believe.`,
    ];

    const stage3 = {};
    for (const [suspect, claims] of Object.entries(alibiClaims)) {
      const dialogue = [
        { char: "detective", text: "Where was everyone when it happened?" },
      ];
      for (const [target, location] of Object.entries(claims)) {
        const targetName = suspect_cards.find((s) => s.displayName === target)?.name || target.toLowerCase();
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
        dialogue.push({
          char: suspect,
          text: randomPhrase(targetName, location),
        });
      }
      stage3[suspect] = dialogue;
    }
    return stage3;
  };

  const buildStage4 = (data) => {
    const verification = data.verification;
    const othersStatements = data.others_statements;

    // Initial dialogue to start the verification
    const dialogue = [
      { char: "detective", text: `Let's verify ${verification.suspect}'s alibi.` },
      {
        char: "detective",
        text: `${verification.suspect} claimed to be at the ${verification.claimed_location}.`,
      },
      {
        char: "detective",
        text: `Alibi is ${verification.is_alibi_valid ? "valid" : "invalid"}.`,
      },
    ];

    // Add statements from other suspects
    othersStatements.forEach((statement) => {
      const accuserFrontendName = Object.keys(SUSPECT_NAME_MAPPING).find(
        (key) => SUSPECT_NAME_MAPPING[key] === statement.accuser
      );
      dialogue.push({
        char: "detective",
        text: `${accuserFrontendName} said ${verification.suspect} was at the ${statement.claimed_location}. This statement is ${statement.is_correct ? "correct" : "incorrect"}.`,
      });
    });

    return dialogue;
  };

  const getDialogueSet = () => {
    if (step === 1) {
      if (!dialogues || !dialogues.stage1) {
        console.error("dialogues.stage1 is undefined, using fallback");
        return [
          { char: "inspector", text: "A murder has occurred. Let's investigate.", id: "candlestick" },
          { char: "detective", text: "Understood. What did you find?" },
          { char: "inspector", text: "The weapon appears to be a candlestick.", id: "candlestick" },
        ];
      }
      return dialogues.stage1;
    }
    if (step === 2) {
      const suspectName = suspectNames[currentSuspectIndex];
      return suspectDialogues[suspectName] || [];
    }
    if (step === 3) {
      return stage3Dialogues[selectedSuspect] || [];
    }
    if (step === 4 && showDialogue) {
      return stage4Dialogues;
    }
    return [];
  };

  const currentDialogue = getDialogueSet();
  console.log("Current dialogue set:", currentDialogue);

  const nextStep = () => {
    setFadeOut(true);
    setTimeout(() => {
      setStep((prev) => (prev < 6 ? prev + 1 : prev));
      setFadeOut(false);
      setDialogueIndex(0);
      setCurrentSuspectIndex(0);
      setSelectedSuspect("");
      setShowDialogue(false);
      setStage4Dialogues([]); // Reset Stage 4 dialogues when moving to next stage
      setAiSuggestion(""); // Reset AI suggestion
      setHasSetAiSuggestion(false); // Reset AI suggestion flag
    }, 500);
  };

  const nextSuspect = () => {
    setCurrentSuspectIndex((prev) => (prev + 1) % suspect_cards.length);
    setDialogueIndex(0);
  };

  const prevSuspect = () => {
    setCurrentSuspectIndex((prev) => (prev - 1 + suspect_cards.length) % suspect_cards.length);
    setDialogueIndex(0);
  };

  const nextWeapon = () => {
    setCurrentWeapon((prev) => (prev + 1) % weapon_cards.length);
  };

  const prevWeapon = () => {
    setCurrentWeapon((prev) => (prev - 1 + weapon_cards.length) % weapon_cards.length);
  };

  // Clear gameId from localStorage when navigating to home
  const navigateToHome = () => {
    console.log("Clearing gameId from localStorage");
    localStorage.removeItem("gameId");
    navigate("/");
  };

  // No gameId fallback
  if (!gameId) {
    return (
      <div className="game-play">
        <h1>No active game found</h1>
        <button onClick={navigateToHome}>Go to Home</button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        maxHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "black",
      }}
    >
      {error && <p style={{ color: "red", textAlign: "center" }}>Error: {error}</p>}

      <img src={background} className="background" alt="background" />

      {/* Stage 1: Inspector's Findings */}
      <div className={`fade-container ${fadeOut ? "fade-out" : ""}`}>
        {step === 1 && (
          <div style={{ display: "grid", gridTemplateRows: "1fr 8fr" }}>
            <div className="section-header">
              <p style={{ margin: 0 }}>STAGE 1: INSPECTOR'S FINDINGS</p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 6fr",
                columnGap: "1%",
                padding: "0 3.6vw 0 3vw",
                height: "100vh",
              }}
            >
              <div style={{ padding: "1rem" }}>
                <button className="analyse-buttons" onClick={() => setWeaponsOpen(true)}>
                  WEAPONS
                </button>
                <div className="proceed-option">
                  <button className="proceed-buttons" onClick={nextStep}>
                    PROCEED
                  </button>
                  <p className="warning">⚠️THERE IS NO GOING BACK</p>
                </div>
              </div>

              <div className="game-box">
                <div>
                  <img
                    src={inspector}
                    style={{
                      width: "25%",
                      marginLeft: "0%",
                      padding: 0,
                      zIndex: "1200",
                    }}
                    alt="Inspector"
                  />
                </div>

                <div style={{ borderTop: "dashed 2px white" }}>
                  <img
                    src={detective}
                    style={{
                      width: "22%",
                      marginTop: "20px",
                      marginLeft: "75%",
                      zIndex: "1200",
                    }}
                    alt="Detective"
                  />
                </div>

                {currentDialogue[dialogueIndex] ? (
                  <>
                    <p
                      className={
                        currentDialogue[dialogueIndex].char === "inspector"
                          ? "inspector-dialogue-box"
                          : "detective-dialogue-box"
                      }
                    >
                      {currentDialogue[dialogueIndex].text}
                    </p>

                    {currentDialogue[dialogueIndex].id &&
                      currentDialogue[dialogueIndex].id !== "N/A" &&
                      currentDialogue[dialogueIndex].id !== "weapons" &&
                      weaponImages[currentDialogue[dialogueIndex].id] && (
                        <img
                          src={weaponImages[currentDialogue[dialogueIndex].id]}
                          className="appear-card"
                          style={{ left: "3%" }}
                          alt="Weapon"
                        />
                      )}

                    {dialogueIndex === currentDialogue.length - 1 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          position: "absolute",
                          top: "73%",
                          zIndex: "1400",
                          left: "8%",
                        }}
                      >
                        <img src={down} style={{ width: "8%" }} alt="Down Arrow" />
                        <div
                          className="warning"
                          style={{
                            margin: "0",
                            width: "155px",
                            textShadow: "2px 2px 2px grey",
                          }}
                        >
                          PROCEED TO NEXT STAGE
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ color: "red", textAlign: "center" }}>
                    Error: Dialogue data is missing for Stage 1
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage 2: Interrogate Suspects (Integrated with Round 1 Interview) */}
      <div className={`fade-container ${fadeOut ? "fade-out" : ""}`}>
        {step === 2 && (
          <div style={{ display: "grid", gridTemplateRows: "1fr 8fr" }}>
            <div className="section-header">
              <p style={{ margin: 0 }}>STAGE 2: INTERROGATE SUSPECTS</p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 6fr",
                columnGap: "1%",
                padding: "0 3.6vw 0 3vw",
                height: "100vh",
              }}
            >
              <div style={{ padding: "1rem", zIndex: "110" }}>
                <button className="analyse-buttons" onClick={() => setWeaponsOpen(true)}>
                  WEAPONS
                </button>

                <div className="proceed-option">
                  <button className="proceed-buttons" onClick={nextStep}>
                    PROCEED
                  </button>
                  <p className="warning">⚠️THERE IS NO GOING BACK</p>
                </div>
              </div>

              <div className="game-box">
                <div>
                  <img
                    src={suspectImages[suspectNames[currentSuspectIndex]]}
                    style={{
                      width: "20%",
                      marginLeft: "0%",
                      padding: "0",
                      zIndex: "1400",
                    }}
                    alt="Suspect"
                  />

                  <button
                    className="next-button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      if (currentSuspectIndex < suspectNames.length - 1) {
                        setCurrentSuspectIndex(currentSuspectIndex + 1);
                        setDialogueIndex(0);
                      }
                    }}
                  >
                    CHANGE SUSPECT
                  </button>
                </div>

                <div style={{ borderTop: "dashed 2px white" }}>
                  <img
                    src={detective}
                    style={{
                      width: "22%",
                      marginTop: "20px",
                      marginLeft: "75%",
                      zIndex: "1200",
                    }}
                    alt="Detective"
                  />
                </div>

                <p
                  className={
                    currentDialogue[dialogueIndex].char !== "detective"
                      ? "suspect-dialogue-box"
                      : "detective-dialogue-box"
                  }
                >
                  {currentDialogue[dialogueIndex].text}
                </p>

                {dialogueIndex === currentDialogue.length - 1 &&
                  currentSuspectIndex !== suspectNames.length - 1 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        position: "absolute",
                        top: "49%",
                        zIndex: "1400",
                        left: "40%",
                      }}
                    >
                      <img src={left} style={{ width: "8%" }} alt="Left Arrow" />
                      <div
                        className="warning"
                        style={{
                          margin: 0,
                          width: "155px",
                          textShadow: "2px 2px 2px grey",
                        }}
                      >
                        PROCEED TO NEXT SUSPECT
                      </div>
                    </div>
                  )}

                {dialogueIndex === currentDialogue.length - 1 &&
                  currentSuspectIndex === suspectNames.length - 1 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        position: "absolute",
                        top: "73%",
                        zIndex: "1400",
                        left: "8%",
                      }}
                    >
                      <img src={down} style={{ width: "8%" }} alt="Down Arrow" />
                      <div
                        className="warning"
                        style={{
                          margin: 0,
                          width: "155px",
                          textShadow: "2px 2px 2px grey",
                        }}
                      >
                        PROCEED TO NEXT STAGE
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage 3: Suspects' Theories (Integrated with Round 2 Alibis) */}
      <div className={`fade-container ${fadeOut ? "fade-out" : ""}`}>
        {step === 3 && (
          <div style={{ display: "grid", gridTemplateRows: "1fr 8fr" }}>
            <div className="section-header">
              <p style={{ margin: 0 }}>STAGE 3: SUSPECTS' THEORIES</p>
            </div>

            <CountdownTimer time={formatTime(timeLeft)} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 6fr",
                columnGap: "1%",
                padding: "0 3.6vw 0 3vw",
                height: "100vh",
              }}
            >
              <div style={{ padding: "1rem", zIndex: "110" }}>
                <button className="analyse-buttons" onClick={() => setWeaponsOpen(true)}>
                  WEAPONS
                </button>

                <button className="analyse-buttons" onClick={() => setSuspectsOpen(true)}>
                  SUSPECTS
                </button>

                <div className="proceed-option">
                  <button className="proceed-buttons" onClick={nextStep}>
                    PROCEED
                  </button>
                  <p className="warning">⚠️THERE IS NO GOING BACK</p>
                </div>
              </div>

              <div className="game-box">
                <div>
                  {showDialogue && (
                    <>
                      <div>
                        <img
                          src={suspectImages[selectedSuspect]}
                          style={{
                            width: "20%",
                            marginLeft: "0%",
                            padding: "0",
                            zIndex: "1400",
                          }}
                          alt="Suspect"
                        />

                        <button
                          className="next-button"
                          onClick={(e) => {
                            e.currentTarget.blur();
                            setShowDialogue(false);
                            setDialogueIndex(0);
                            setSelectedSuspect("");
                          }}
                        >
                          CHANGE SUSPECT
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div style={{ borderTop: "dashed 2px white", position: "relative" }}>
                  <img
                    src={detective}
                    style={{
                      width: "22%",
                      marginTop: "20px",
                      marginLeft: "75%",
                      zIndex: "1200",
                    }}
                    alt="Detective"
                  />

                  {!showDialogue && (
                    <>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateRows: "15% 80%",
                          position: "absolute",
                          padding: "5px",
                          left: "20px",
                          top: "20px",
                          right: "30%",
                          bottom: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            textShadow: "2px 2px 1px rgb(14, 42, 121)",
                            fontFamily: "'Press Start 2P'",
                            fontSize: "15px",
                            color: "white",
                          }}
                        >
                          WHO DO YOU WANT TO QUESTION FURTHER?
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            columnGap: "15px",
                            rowGap: "10px",
                          }}
                        >
                          {suspectNames.map((suspect) => (
                            <button
                              key={suspect}
                              className="suspect-button"
                              style={{
                                backgroundColor:
                                  suspect === "chris"
                                    ? "rgb(236, 224, 121)"
                                    : suspect === "jason"
                                    ? "rgb(139, 216, 239)"
                                    : suspect === "kate"
                                    ? "rgb(190, 190, 190)"
                                    : suspect === "poppy"
                                    ? "rgb(119, 207, 136)"
                                    : suspect === "violet"
                                    ? "rgb(171, 121, 236)"
                                    : "rgb(238, 142, 216)",
                                color: "black",
                                borderColor:
                                  suspect === "chris"
                                    ? "rgb(255, 196, 0)"
                                    : suspect === "jason"
                                    ? "rgb(2, 3, 80)"
                                    : suspect === "kate"
                                    ? "rgb(73, 73, 73)"
                                    : suspect === "poppy"
                                    ? "rgb(27, 120, 38)"
                                    : suspect === "violet"
                                    ? "rgb(77, 2, 138)"
                                    : "rgb(203, 0, 132)",
                              }}
                              onClick={() => {
                                setSelectedSuspect(suspect);
                                setDialogueIndex(0);
                                setShowDialogue(true);
                              }}
                            >
                              {suspect.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {showDialogue && (
                  <p
                    className={
                      currentDialogue[dialogueIndex].char !== "detective"
                        ? "suspect-dialogue-box"
                        : "detective-dialogue-box"
                    }
                  >
                    {currentDialogue[dialogueIndex].text}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage 4: Alibi Verification (Integrated with Round 3 Verify Alibi) */}
      <div className={`fade-container ${fadeOut ? "fade-out" : ""}`}>
        {step === 4 && (
          <div style={{ display: "grid", gridTemplateRows: "1fr 8fr" }}>
            <div className="section-header">
              <p style={{ margin: 0 }}>STAGE 4: ALIBI VERIFICATION</p>
            </div>

            <CountdownTimer time={formatTime(timeLeft)} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 6fr",
                columnGap: "1%",
                padding: "0 3.6vw 0 3vw",
                height: "100vh",
              }}
            >
              <div style={{ padding: "1rem" }}>
                <button className="analyse-buttons" onClick={() => setWeaponsOpen(true)}>
                  WEAPONS
                </button>

                <button className="analyse-buttons" onClick={() => setSuspectsOpen(true)}>
                  SUSPECTS
                </button>

                <div className="proceed-option">
                  <button className="proceed-buttons" onClick={nextStep}>
                    PROCEED
                  </button>
                  <p className="warning">⚠️THERE IS NO GOING BACK</p>
                </div>
              </div>

              <div className="game-box">
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      padding: "5px",
                      left: "10px",
                      top: "10px",
                      right: "10px",
                      bottom: "20px",
                      borderRadius: "20px",
                      display: "grid",
                      gridTemplateColumns: "10% 1fr",
                      zIndex: "100",
                    }}
                  >
                    <div
                      style={{
                        padding: "0 1rem",
                        fontFamily: "'Press Start 2P'",
                        textAlign: "center",
                        backgroundColor: "rgb(24, 2, 56)",
                        color: "white",
                        fontSize: "15px",
                        boxShadow: "4px 0px 5px rgb(0, 0, 0)",
                        textShadow: "4px 0px 5px rgb(0, 0, 0)",
                        display: "flex",
                        flexDirection: "column",
                        rowGap: 0,
                      }}
                    >
                      <p>C</p>
                      <p>C</p>
                      <p>T</p>
                      <p>V</p>
                    </div>

                    <div
                      style={{
                        padding: "0 1rem",
                        fontFamily: "'Press Start 2P'",
                        textAlign: "center",
                        backgroundColor: "rgb(57, 48, 72)",
                        color: "white",
                        fontSize: "12px",
                        zIndex: "99",
                      }}
                    >
                      {showDialogue && dialogueIndex >= 2 && stage4Dialogues.length > 2 ? (
                        <p style={{ margin: "0", color: "#FFD700" }}>
                          {stage4Dialogues[2].text}
                        </p>
                      ) : (
                        <p style={{ margin: "0", color: "#FFD700" }}>
                          {showDialogue ? "Verifying alibi..." : "Select a suspect to verify their alibi."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "dashed 2px white", position: "relative" }}>
                  <img
                    src={detective}
                    style={{
                      width: "22%",
                      marginTop: "20px",
                      marginLeft: "75%",
                      zIndex: "1200",
                    }}
                    alt="Detective"
                  />

                  {!showDialogue && (
                    <>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateRows: "15% 80%",
                          position: "absolute",
                          padding: "5px",
                          left: "20px",
                          top: "20px",
                          right: "30%",
                          bottom: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            textShadow: "2px 2px 1px rgb(14, 42, 121)",
                            fontFamily: "'Press Start 2P'",
                            fontSize: "15px",
                            color: "white",
                          }}
                        >
                          WHOSE ALIBI DO YOU WANT TO VERIFY?
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            columnGap: "15px",
                            rowGap: "10px",
                          }}
                        >
                          {suspectNames.map((suspect) => (
                            <button
                              key={suspect}
                              className="suspect-button"
                              style={{
                                backgroundColor:
                                  suspect === "chris"
                                    ? "rgb(236, 224, 121)"
                                    : suspect === "jason"
                                    ? "rgb(139, 216, 239)"
                                    : suspect === "kate"
                                    ? "rgb(190, 190, 190)"
                                    : suspect === "poppy"
                                    ? "rgb(119, 207, 136)"
                                    : suspect === "violet"
                                    ? "rgb(171, 121, 236)"
                                    : "rgb(238, 142, 216)",
                                color: "black",
                                borderColor:
                                  suspect === "chris"
                                    ? "rgb(255, 196, 0)"
                                    : suspect === "jason"
                                    ? "rgb(2, 3, 80)"
                                    : suspect === "kate"
                                    ? "rgb(73, 73, 73)"
                                    : suspect === "poppy"
                                    ? "rgb(27, 120, 38)"
                                    : suspect === "violet"
                                    ? "rgb(77, 2, 138)"
                                    : "rgb(203, 0, 132)",
                                opacity: verifiedSuspects.has(suspect) ? 0.5 : 1,
                                cursor: verifiedSuspects.has(suspect) ? "not-allowed" : "pointer",
                              }}
                              onClick={() => {
                                if (!verifiedSuspects.has(suspect)) {
                                  setSelectedSuspect(suspect);
                                  setDialogueIndex(0);
                                  verifyAlibi(suspect);
                                }
                              }}
                              disabled={verifiedSuspects.has(suspect)}
                            >
                              {suspect.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {showDialogue && (
                  <p className="detective-dialogue-box">{currentDialogue[dialogueIndex].text}</p>
                )}

                {showDialogue && dialogueIndex === currentDialogue.length - 1 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      position: "absolute",
                      top: "73%",
                      zIndex: "1400",
                      left: "8%",
                    }}
                  >
                    <button
                      className="next-button"
                      style={{ backgroundColor: "transparent", border: "none" }}
                      onClick={() => {
                        setShowDialogue(false);
                        setDialogueIndex(0);
                        setSelectedSuspect("");
                      }}
                    >
                      <img src={left} style={{ width: "8%" }} alt="Left Arrow" />
                      <div
                        className="warning"
                        style={{
                          margin: 0,
                          width: "155px",
                          textShadow: "2px 2px 2px grey",
                        }}
                      >
                        CHANGE SUSPECT
                      </div>
                    </button>
                  </div>
                )}

                {!showDialogue && verifiedSuspects.size === suspectNames.length && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      position: "absolute",
                      top: "73%",
                      zIndex: "1400",
                      left: "8%",
                    }}
                  >
                    <img src={down} style={{ width: "8%" }} alt="Down Arrow" />
                    <div
                      className="warning"
                      style={{
                        margin: 0,
                        width: "155px",
                        textShadow: "2px 2px 2px grey",
                      }}
                    >
                      PROCEED TO NEXT STAGE
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage 5: Placeholder (Final Deduction) */}
      <div className={`fade-container ${fadeOut ? "fade-out" : ""}`}>
        {step === 5 && (
          <div style={{ display: "grid", gridTemplateRows: "1fr 8fr" }}>
            <div className="section-header">
              <p style={{ margin: 0 }}>STAGE 5: FINAL DEDUCTION</p>
            </div>

            <CountdownTimer time={formatTime(timeLeft)} />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 6fr",
                columnGap: "1%",
                padding: "0 3.6vw 0 3vw",
                height: "100vh",
              }}
            >
              <div style={{ padding: "1rem" }}>
                <button className="analyse-buttons" onClick={() => setWeaponsOpen(true)}>
                  WEAPONS
                </button>

                <button className="analyse-buttons" onClick={() => setSuspectsOpen(true)}>
                  SUSPECTS
                </button>

                <div className="proceed-option">
                  <button className="proceed-buttons" onClick={nextStep}>
                    PROCEED
                  </button>
                  <p className="warning">⚠️THERE IS NO GOING BACK</p>
                </div>
              </div>

              <div className="game-box">
                <div style={{ borderTop: "dashed 2px white", position: "relative" }}>
                  <img
                    src={detective}
                    style={{
                      width: "22%",
                      marginTop: "20px",
                      marginLeft: "75%",
                      zIndex: "1200",
                    }}
                    alt="Detective"
                  />
                  <p style={{ color: "white", textAlign: "center" }}>
                    Final Deduction stage coming soon...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game Over Screen */}
      {timeLeft <= 0 && (
        <div className={`fade-container ${fadeOut ? "fade-out" : ""}`}>
          <div style={{ textAlign: "center", color: "white" }}>
            <h1>Game Over</h1>
            <p>Time's up! You ran out of time to solve the mystery.</p>
            <button className="proceed-buttons" onClick={navigateToHome}>
              RETURN TO HOME
            </button>
          </div>
        </div>
      )}

      {/* Suspect Cards Overlay */}
      {suspectsOpen && (
        <>
          <div className="overlay" onClick={() => setSuspectsOpen(false)} />
          <div className="card-container">
            <div
              className="card"
              style={{
                backgroundImage: `url(${suspect_cards[currentSuspectIndex].image})`,
              }}
            />
            <button onClick={prevSuspect} className="arrow" style={{ left: "20%" }}>
              ❮
            </button>
            <button onClick={nextSuspect} className="arrow" style={{ right: "20%" }}>
              ❯
            </button>
          </div>
        </>
      )}

      {/* Weapon Cards Overlay */}
      {weaponsOpen && (
        <>
          <div className="overlay" onClick={() => setWeaponsOpen(false)} />
          <div className="card-container">
            <div
              className="card"
              style={{
                backgroundImage: `url(${weapon_cards[currentWeapon].image})`,
              }}
            />
            <button onClick={prevWeapon} className="arrow" style={{ left: "20%" }}>
              ❮
            </button>
            <button onClick={nextWeapon} className="arrow" style={{ right: "20%" }}>
              ❯
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default GamePlay;
