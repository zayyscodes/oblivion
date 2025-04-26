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

import robo from "../assets/robot.PNG";

function GamePlay() {
  const navigate = useNavigate();

  // Retrieve gameId from localStorage
  const initialGameId = localStorage.getItem("gameId");
  console.log(
    "GamePlay loaded with initialGameId from localStorage:",
    initialGameId
  );

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
  const [stage4Dialogues, setStage4Dialogues] = useState([]);
  const [selectedSuspect, setSelectedSuspect] = useState("");
  const [showDialogue, setShowDialogue] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);
  const [timerStarted, setTimerStarted] = useState(false);
  const [verifiedSuspects, setVerifiedSuspects] = useState(new Set());
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [hasSetAiSuggestion, setHasSetAiSuggestion] = useState(false);
  const [AIIndex, setAIIndex] = useState(0);
  const [AIPop, setAIPop] = useState(true);
  const [finalDeductionData, setFinalDeductionData] = useState(null);
  const [selectedWeapon, setSelectedWeapon] = useState("");
  const [triesLeft, setTriesLeft] = useState(3);
  const [guessResult, setGuessResult] = useState(null);
  const [alibisOpen, setAlibisOpen] = useState(false);
  const [alibiResults, setAlibiResults] = useState({});
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [username, setUsername] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  console.log("Current step state:", step);

  const hasFetchedInitialData = useRef(false);
  const hasFetchedAlibis = useRef(false);
  const hasStartedGame = useRef(false);
  const hasFetchedFinalDeduction = useRef(false);

  useEffect(() => {
    // Start timer only when timerStarted is true and timeLeft > 0
    if (!timerStarted || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          console.log("Time is up! Game Over.");
          setTimerStarted(false); // Stop the timer
          // Show username prompt after 3 seconds
          setTimeout(() => {
            setShowUsernamePrompt(true);
          }, 3000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerStarted, timeLeft]);

  const formatTime = (seconds) => {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  const startNewGame = async () => {
    try {
      // Reset verifiedSuspects for a new game
      setVerifiedSuspects(new Set());
      setAlibiResults({});
      console.log("Reset verifiedSuspects on new game");
      const options = {
        method: "POST",
      };
      console.log(
        "Fetching http://127.0.0.1:5000/api/start_game with method POST"
      );
      const res = await fetch("http://127.0.0.1:5000/api/start_game", options);

      if (!res.ok) {
        console.log(
          `HTTP error! Status: ${res.status}, Status Text: ${res.statusText}`
        );
        const errorData = await res.json().catch(() => ({}));
        console.log("Error response from /start_game:", errorData);
        throw new Error(
          `HTTP error! Status: ${res.status}, Message: ${
            errorData.message || res.statusText
          }`
        );
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
      console.log(
        "Updated localStorage gameId:",
        localStorage.getItem("gameId")
      );
      setGameId(data.game_id);
      setStep(1);
      return true;
    } catch (e) {
      console.log("Fetch error for /start_game:", e.message);
      setError("Failed to start a new game. Please try again.");
      return false;
    }
  };

  const fetchInitialData = async () => {
    if (!gameId) {
      console.log(
        "No gameId available for fetchInitialData, redirecting to home..."
      );
      setError(
        "No active game found. Please start a new game from the homepage."
      );
      setTimeout(() => navigate("/"), 3000); // Redirect after 3 seconds
      return;
    }

    try {
      const url = `http://127.0.0.1:5000/api/round1_interview?game_id=${gameId}`;
      console.log(`Fetching ${url} with method GET`);
      const res = await fetch(url, {
        method: "GET",
      });

      if (!res.ok) {
        console.log(
          `HTTP error! Status: ${res.status}, Status Text: ${res.statusText}`
        );
        const errorData = await res.json().catch(() => ({}));
        console.log("Error response from /round1_interview:", errorData);

        if (
          res.status === 400 &&
          errorData.message?.includes("Invalid or missing game_id")
        ) {
          console.log(
            "Invalid game_id detected, clearing localStorage and redirecting to home..."
          );
          localStorage.removeItem("gameId");
          setGameId(null);
          setError(
            "Invalid game session. Please start a new game from the homepage."
          );
          setTimeout(() => navigate("/"), 3000);
          return;
        }

        throw new Error(
          `HTTP error! Status: ${res.status}, Message: ${
            errorData.message || res.statusText
          }`
        );
      }

      const data = await res.json();
      console.log("Response from /round1_interview:", data);

      if (data.status === "error") {
        console.log(`Backend error: ${data.message}`);
        setError(data.message);
        return;
      }

      console.log(
        "Successfully fetched suspect dialogues:",
        data.suspect_dialogues
      );
      setSuspectDialogues(data.suspect_dialogues);
    } catch (e) {
      console.log("Fetch error for /round1_interview:", e.message);
      setError(
        "Failed to fetch suspect dialogues. Please ensure the backend is running and try again from the homepage."
      );
      setTimeout(() => navigate("/"), 3000);
    }
  };

  useEffect(() => {
    if (gameId && !hasFetchedInitialData.current) {
      hasFetchedInitialData.current = true;
      console.log("Fetching initial data for gameId:", gameId);
      fetchInitialData();
    }
  }, [gameId]);

  const fetchAlibis = async () => {
    try {
      const url = `http://127.0.0.1:5000/api/round2_alibis?game_id=${gameId}`;
      console.log(`Fetching ${url} with method GET`);
      const res = await fetch(url, {
        method: "GET",
      });

      if (!res.ok) {
        console.log(
          `HTTP error! Status: ${res.status}, Status Text: ${res.statusText}`
        );
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

  const fetchAiSuggestion = async () => {
    try {
      const url = `http://127.0.0.1:5000/api/round3_get_suggestion?game_id=${encodeURIComponent(gameId)}`;
      console.log(`Fetching ${url} with method GET to get AI suggestion`);
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.log(
          `HTTP error! Status: ${res.status}, Status Text: ${res.statusText}`
        );
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Response from /round3_get_suggestion for AI suggestion:", data);

      if (data.status === "error") {
        console.log(`Backend error: ${data.message}`);
        setError(data.message);
        return;
      }

      if (!hasSetAiSuggestion) {
        if (data.most_suspected_suggestion) {
          console.log("Backend suggestion:", data.most_suspected_suggestion);
          // Normalize case for matching
          const suggestionLower = data.most_suspected_suggestion.toLowerCase();
          const suggestionFrontendName = Object.keys(SUSPECT_NAME_MAPPING).find(
            (key) => SUSPECT_NAME_MAPPING[key].toLowerCase() === suggestionLower || key === suggestionLower
          );
          console.log("Mapped frontend name:", suggestionFrontendName);

          if (suggestionFrontendName) {
            setAiSuggestion(
              `PIP suggests checking ${suggestionFrontendName}'s alibi.`
            );
          } else {
            console.warn(`No frontend mapping found for ${data.most_suspected_suggestion}`);
            setAiSuggestion("The AI has no specific suspect to suggest at this time.");
          }
        } else {
          setAiSuggestion("All suspects have been verified.");
        }
        setHasSetAiSuggestion(true);
      }
    } catch (e) {
      console.log("Fetch error for /round3_get_suggestion:", e.message);
      setError("Failed to fetch AI suggestion. Please try again.");
    }
  };

  const verifyAlibi = async (suspectName) => {
    console.log(`verifyAlibi called for ${suspectName}, verifiedSuspects:`, Array.from(verifiedSuspects));
    try {
      // Ensure suspectName is valid and mapped correctly
      const backendSuspectName = SUSPECT_NAME_MAPPING[suspectName];
      if (!backendSuspectName) {
        console.error(`No backend mapping for suspect: ${suspectName}`);
        throw new Error(`Invalid suspect name: ${suspectName}`);
      }

      // Double-check verifiedSuspects to prevent duplicate verification
      if (verifiedSuspects.has(suspectName)) {
        throw new Error(`Frontend error: ${suspectName} already in verifiedSuspects`);
      }
      console.log(`Verifying alibi for ${suspectName} (backend: ${backendSuspectName}) with gameId: ${gameId}`);

      const url = `http://127.0.0.1:5000/api/round3_verify_alibi`;
      const requestBody = JSON.stringify({ suspect_name: backendSuspectName, game_id: gameId });
      console.log(`Sending POST to ${url} with body: ${requestBody}`);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "No response text");
        console.error(`HTTP error for ${suspectName}: Status: ${res.status}, Response: ${errorText}`);
        throw new Error(`HTTP error! Status: ${res.status}, Message: ${errorText || res.statusText}`);
      }

      const data = await res.json();
      console.log(`Response from /round3_verify_alibi for ${suspectName}:`, data);

      if (data.status === "error") {
        console.error(`Backend error for ${suspectName}: ${data.message}`);
        throw new Error(data.message);
      }

      // Update state
      setVerifiedSuspects((prev) => {
        console.log(`Adding ${suspectName} to verifiedSuspects`);
        const newSet = new Set(prev);
        newSet.add(suspectName);
        console.log(`Updated verifiedSuspects:`, Array.from(newSet));
        return newSet;
      });

      // Store alibi result
      setAlibiResults((prev) => ({
        ...prev,
        [suspectName]: {
          isValid: data.verification.is_alibi_valid,
          claimedLocation: data.verification.claimed_location,
          actualLocation: data.verification.actual_location,
        },
      }));

      const stage4 = buildStage4(data);
      setStage4Dialogues(stage4);
      setShowDialogue(true);
      setSelectedSuspect(suspectName); // Ensure selectedSuspect is set

      console.log(`Stage 4 dialogues set for ${suspectName}:`, stage4);

      // Fetch AI suggestion if not set
      if (!hasSetAiSuggestion) {
        await fetchAiSuggestion();
      }
    } catch (e) {
      console.error(`Error verifying alibi for ${suspectName}:`, e.message);
      setError(`Failed to verify ${suspectName}'s alibi: ${e.message}`);
    }
  };

  const fetchFinalDeduction = async () => {
    try {
      const url = `http://127.0.0.1:5000/api/round4_final_deduction`;
      console.log(`Fetching ${url} with method GET`);
      const res = await fetch(url, {
        method: "GET",
      });

      if (!res.ok) {
        console.log(
          `HTTP error! Status: ${res.status}, Status Text: ${res.statusText}`
        );
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Response from /round4_final_deduction:", data);

      if (data.status === "error") {
        console.log(`Backend error: ${data.message}`);
        setError(data.message);
        return;
      }

      setFinalDeductionData(data);
    } catch (e) {
      console.log("Fetch error for /round4_final_deduction:", e.message);
      setError("Failed to fetch final deduction data. Please try again.");
    }
  };

  useEffect(() => {
    if (step === 5 && !hasFetchedFinalDeduction.current) {
      hasFetchedFinalDeduction.current = true;
      fetchFinalDeduction();
    }
  }, [step]);

  const submitScore = async () => {
    if (!username.trim()) {
      setError("Please enter a valid username.");
      return;
    }

    try {
      const totalTime = 180 - timeLeft; // Total time used in seconds
      const scoreData = {
        username,
        time: formatTime(totalTime),
        tries: 3 - triesLeft,
      };
      console.log("Submitting score:", scoreData);

      const res = await fetch("http://127.0.0.1:5001/submit_score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scoreData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit score.");
      }

      const data = await res.json();
      console.log("Score submission response:", data);

      // Fetch leaderboard
      const leaderboardRes = await fetch("http://127.0.0.1:5001/leaderboard");
      if (!leaderboardRes.ok) {
        throw new Error("Failed to fetch leaderboard.");
      }

      const leaderboardData = await leaderboardRes.json();
      console.log("Leaderboard data:", leaderboardData);
      setLeaderboard(leaderboardData.leaderboard || []);
      setShowUsernamePrompt(false);
      setShowLeaderboard(true);
    } catch (e) {
      console.error("Error submitting score:", e.message);
      setError(e.message);
    }
  };

  const makeGuess = async () => {
    try {
      if (!suspectNames.includes(selectedSuspect)) {
        console.error(`Invalid suspect: ${selectedSuspect}`);
        setError("Please select a valid suspect.");
        return;
      }
      if (!weaponNames.includes(selectedWeapon)) {
        console.error(`Invalid weapon: ${selectedWeapon}`);
        setError("Please select a valid weapon.");
        return;
      }

      const url = `http://127.0.0.1:5000/api/make_guess`;
      console.log(
        `Fetching ${url} with method POST for suspect: ${selectedSuspect}, weapon: ${selectedWeapon}`
      );
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          suspect: selectedSuspect,
          weapon: selectedWeapon,
          game_id: gameId,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "No response text");
        console.log(
          `HTTP error! Status: ${res.status}, Status Text: ${res.statusText}, Response: ${errorText}`
        );
        let errorMessage = res.statusText;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || res.statusText;
        } catch (parseError) {
          console.log("Failed to parse error response:", parseError);
        }
        throw new Error(`HTTP error! Status: ${res.status}, Message: ${errorMessage}`);
      }

      const data = await res.json();
      console.log("Response from /make_guess:", data);

      if (data.status === "error") {
        console.log(`Backend error: ${data.message}`);
        setError(data.message);
        return;
      }

      setGuessResult(data);
      setTriesLeft(data.remaining_tries);
      if (data.status === "success") {
        setTimerStarted(false); // Stop the timer on correct guess
        // Show username prompt after 3 seconds
        setTimeout(() => {
          setShowUsernamePrompt(true);
        }, 3000);
      } else if (data.status === "game_over") {
        // Show username prompt after 3 seconds
        setTimeout(() => {
          setShowUsernamePrompt(true);
        }, 3000);
      } else if (data.status === "incorrect") {
        setSelectedSuspect("");
        setSelectedWeapon("");
      }
    } catch (e) {
      console.log("Fetch error for /make_guess:", e.message);
      setError(e.message || "Failed to make guess. Please try again.");
    }
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (
        step === 1 ||
        step === 2 ||
        (step === 3 && showDialogue) ||
        (step === 4 && showDialogue)
      ) {
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

  // For AI assistant (PIP)
  useEffect(() => {
    const handleAIKeyPress = (event) => {
      if (step === 3 && AIPop) {
        if (event.code === "Space" || event.code === "ArrowRight") {
          setAIIndex((prev) =>
            prev < AI_dialogues.length - 1 ? prev + 1 : prev
          );
        }
        if (event.code === "ArrowLeft") {
          setAIIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
      }
    };
    window.addEventListener("keydown", handleAIKeyPress);
    return () => window.removeEventListener("keydown", handleAIKeyPress);
  }, [step, AIIndex, AIPop]);

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
  const weaponNames = weapon_cards.map((w) => w.name);

  const SUSPECT_NAME_MAPPING = {
    chris: "Chris Blaine",
    jason: "Jason Blue",
    kate: "Kate Ivory",
    poppy: "Poppy Green",
    violet: "Violet Riley",
    zehab: "Zehab Rose",
  };

  const AI_dialogues = [
    "HELLO, DETECTIVE.",
    "I AM YOUR ASSIGNED DETECTIVE ASSISTANT.",
    "I AM A PERCEPTIVE INVESTIGATIVE PROCESSOR,",
    "BUT YOU COULD REFER TO ME AS PiP.",
    "I WILL ASSIST YOU IN ANALYZING CLUES AND CROSS-REFERENCING STATEMENTS.",
    "REMEMBER: OBSERVATION IS KEY. 🔑",
    "MY DATABASE HAS BEEN UPDATED WITH THEIR PROFILES AND MOTIVES,",
    "AND MOVING FORTH I WILL HELP YOU IN SHORTLISTING THE SUSPECTS,",
    "BY MONITORING PATTERNS AND INCONSISTENCIES.",
    "JUSTICE SHALL PREVAIL!",
  ];

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
        const targetName =
          suspect_cards.find((s) => s.displayName === target)?.name ||
          target.toLowerCase();
        const randomPhrase =
          phrases[Math.floor(Math.random() * phrases.length)];
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

    const dialogue = [
      {
        char: "detective",
        text: `Let's verify ${verification.suspect}'s alibi.`,
      },
      {
        char: "detective",
        text: `${verification.suspect} claimed to be at the ${verification.claimed_location}.`,
      },
      {
        char: "detective",
        text: `Alibi is ${verification.is_alibi_valid ? "valid" : "invalid"}.`,
      },
    ];

    othersStatements.forEach((statement) => {
      const accuserFrontendName = Object.keys(SUSPECT_NAME_MAPPING).find(
        (key) => SUSPECT_NAME_MAPPING[key] === statement.accuser
      );
      dialogue.push({
        char: "detective",
        text: `${accuserFrontendName} said ${verification.suspect} was at the ${
          statement.claimed_location
        }. This statement is ${
          statement.is_correct ? "correct" : "incorrect"
        }.`,
      });
    });

    return dialogue;
  };

  const getDialogueSet = () => {
    if (step === 1) {
      if (!dialogues || !dialogues.stage1) {
        console.error("dialogues.stage1 is undefined, using fallback");
        return [
          {
            char: "inspector",
            text: "A murder has occurred. Let's investigate.",
            id: "candlestick",
          },
          { char: "detective", text: "Understood. What did you find?" },
          {
            char: "inspector",
            text: "The weapon appears to be a candlestick.",
            id: "candlestick",
          },
        ];
      }
      return dialogues.stage1;
    }
    if (step === 2) {
      const suspectName = suspectNames[currentSuspectIndex];
      const backendDialogues = suspectDialogues[suspectName] || [];
      const staticDialogues = dialogues.stage2[suspectName] || [];

      // Extract backend dialogues up to rebuttal (indices 0-5 for most, 0-6 for Kate)
      const isKate = suspectName === "kate";
      const rebuttalIndex = isKate ? 6 : 5; // Kate has an extra intro line
      const backendUpToRebuttal = backendDialogues.slice(0, rebuttalIndex + 1);

      // Fallback if backend dialogues are missing
      if (backendUpToRebuttal.length < (isKate ? 7 : 6)) {
        console.warn(
          `Incomplete backend dialogues for ${suspectName}, using fallback`
        );
        const fallbackDialogues = [
          {
            id: "intro",
            char: "detective",
            text: `Interviewing ${suspectName}. What's your story?`,
          },
          {
            id: "intro",
            char: suspectName,
            text: "I’m just here, detective. No trouble.",
          },
          ...(isKate
            ? [{ id: "intro", char: "kate", text: "Let’s make this quick." }]
            : []),
          {
            id: "alibi",
            char: "detective",
            text: `Where were you last night, ${suspectName}?`,
          },
          {
            id: "alibi",
            char: suspectName,
            text: "I was minding my own business, detective.",
          },
          {
            id: "alibi",
            char: "detective",
            text: "That’s a bit vague. Care to clarify?",
          },
          {
            id: "alibi",
            char: "detective",
            text: "Quiet nights tend to get loud when someone's trying to hide something.",
          },
          {
            id: "alibi",
            char: suspectName,
            text: "Nothing to hide here. Just a quiet night.",
          },
        ];
        return [...fallbackDialogues, ...staticDialogues];
      }

      // Combine backend dialogues (up to rebuttal) with static dialogues (post-rebuttal)
      return [...backendUpToRebuttal, ...staticDialogues];
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
      setVerifiedSuspects(new Set()); // Reset verifiedSuspects on stage transition
      setFadeOut(false);
      setDialogueIndex(0);
      setCurrentSuspectIndex(0);
      setSelectedSuspect("");
      setShowDialogue(false);
      setStage4Dialogues([]);
      setAiSuggestion("");
      setHasSetAiSuggestion(false);
      setAIPop(true);
      setAIIndex(0);
      console.log("Reset verifiedSuspects on stage transition");
      if (step + 1 === 4) {
        fetchAiSuggestion();
      }
    }, 500);
  };

  const nextSuspect = () => {
    setCurrentSuspectIndex((prev) => (prev + 1) % suspect_cards.length);
    setDialogueIndex(0);
  };

  const prevSuspect = () => {
    setCurrentSuspectIndex(
      (prev) => (prev - 1 + suspect_cards.length) % suspect_cards.length
    );
    setDialogueIndex(0);
  };

  const nextWeapon = () => {
    setCurrentWeapon((prev) => (prev + 1) % weapon_cards.length);
  };

  const prevWeapon = () => {
    setCurrentWeapon(
      (prev) => (prev - 1 + weapon_cards.length) % weapon_cards.length
    );
  };

  const navigateToHome = () => {
    console.log("Clearing gameId from localStorage");
    localStorage.removeItem("gameId");
    navigate("/");
  };

  if (!gameId) {
    return (
      <div className="game-play">
        <h1>No active game found</h1>
        <p>Please return to the homepage to start a new game.</p>
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
      {error && (
        <p style={{ color: "red", textAlign: "center" }}>Error: {error}</p>
      )}

      <img src={background} className="background" alt="background" />
      {showUsernamePrompt && (
        <>
          <div className="overlay" />
          <div className="username-popup">
            <p
              className="section-header"
              style={{ fontSize: "clamp(16px, 2vw, 20px)", margin: "0 0 20px 0" }}
            >
              Game Over! Submit Your Score?
            </p>
            <input
              type="text"
              className="username-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button className="username-submit" onClick={submitScore}>
                Submit Score
              </button>
              <button
                className="username-submit"
                style={{ backgroundColor: "#ff4d4d" }}
                onClick={navigateToHome}
              >
                Return to Home
              </button>
            </div>
          </div>
        </>
      )}

      {showLeaderboard && (
        <>
          <div className="overlay" />
          <div className="leaderboard-container">
            <p className="leaderboard-title">Leaderboard</p>
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, index) => (
                <div key={index} className="leaderboard-item">
                  <p className="leaderboard-text">{entry.username}</p>
                  <p className="leaderboard-text">{entry.score}</p>
                </div>
              ))
            ) : (
              <p className="leaderboard-text">No scores available.</p>
            )}
            <button
              className="username-submit"
              style={{ marginTop: "20px" }}
              onClick={navigateToHome}
            >
              Return to Home
            </button>
          </div>
        </>
      )}

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
                <button
                  className="analyse-buttons"
                  onClick={() => setWeaponsOpen(true)}
                >
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
                        <img
                          src={down}
                          style={{ width: "8%" }}
                          alt="Down Arrow"
                        />
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
                <button
                  className="analyse-buttons"
                  onClick={() => setWeaponsOpen(true)}
                >
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
                  style={
                    currentDialogue[dialogueIndex].char !== "detective"
                      ? {
                          backgroundColor:
                            suspectNames[currentSuspectIndex] === "chris"
                              ? "rgb(236, 224, 121)"
                              : suspectNames[currentSuspectIndex] === "jason"
                              ? "rgb(139, 216, 239)"
                              : suspectNames[currentSuspectIndex] === "kate"
                              ? "rgb(190, 190, 190)"
                              : suspectNames[currentSuspectIndex] === "poppy"
                              ? "rgb(119, 207, 136)"
                              : suspectNames[currentSuspectIndex] === "violet"
                              ? "rgb(171, 121, 236)"
                              : "rgb(238, 142, 216)",
                          borderColor:
                            suspectNames[currentSuspectIndex] === "chris"
                              ? "rgb(255, 196, 0)"
                              : suspectNames[currentSuspectIndex] === "jason"
                              ? "rgb(2, 3, 80)"
                              : suspectNames[currentSuspectIndex] === "kate"
                              ? "rgb(73, 73, 73)"
                              : suspectNames[currentSuspectIndex] === "poppy"
                              ? "rgb(27, 120, 38)"
                              : suspectNames[currentSuspectIndex] === "violet"
                              ? "rgb(77, 2, 138)"
                              : "rgb(203, 0, 132)",
                        }
                      : {}
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
                      <img
                        src={left}
                        style={{ width: "8%" }}
                        alt="Left Arrow"
                      />
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
                      <img
                        src={down}
                        style={{ width: "8%" }}
                        alt="Down Arrow"
                      />
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

      <div className={`fade-container ${fadeOut ? "fade-out" : ""}`}>
        {step === 3 && (
          <div style={{ display: "grid", gridTemplateRows: "1fr 8fr" }}>
            <div className="section-header">
              <p style={{ margin: 0 }}>STAGE 3: SUSPECTS' THEORIES</p>
            </div>

            {AIPop && AIIndex < AI_dialogues.length && (
              <>
                <div className="overlay" />
                <div className="AI_popup">
                  <p
                    className="AI_popup_text"
                    style={{
                      transition: "opacity 2s ease-out", // Add transition for fade-out effect
                      opacity: AIIndex >= AI_dialogues.length - 1 ? 0 : 1,
                    }}
                  >
                    {AI_dialogues[AIIndex]}
                  </p>

                  <img
                    src={robo}
                    style={{
                      width: "35%",
                      marginLeft: "65%",
                      transition: "opacity 2s ease-out", // Add transition for fade-out effect
                      opacity: AIIndex >= AI_dialogues.length - 1 ? 0 : 1, // Fade out when dialogue ends
                    }}
                  />
                </div>
              </>
            )}

            {AIPop && AIIndex >= AI_dialogues.length - 1 && (
              <>
                <div className="AI_popup" style={{ textAlign: "center" }}>
                  <p className="start-text">FROM THIS ROUND ONWARD...</p>
                  <p className="start-text">⏱️ A TIMER WILL START.</p>
                  <p className="start-text">🕵️‍♂️ YOU HAVE 3 MINUTES TO:</p>
                  <p className="start-text">
                    INTERVIEW SUSPECTS, VERIFY FACTS & MAKE DEDUCTIONS TO WIN.
                  </p>

                  <button
                    style={{
                      zIndex: "1300",
                      fontSize: "1.2vw",
                      backgroundColor: "white",
                      color: "green",
                      border: "dashed 2px green",
                      fontFamily: "'Press Start 2P'",
                      padding: "1rem",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setTimerStarted(true); // Start the timer here
                      setAIPop(false);
                    }}
                  >
                    START
                  </button>
                </div>
              </>
            )}

            {!AIPop && <CountdownTimer time={formatTime(timeLeft)} />}

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
                <button
                  className="analyse-buttons"
                  onClick={() => setWeaponsOpen(true)}
                >
                  WEAPONS
                </button>

                <button
                  className="analyse-buttons"
                  onClick={() => setSuspectsOpen(true)}
                >
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
                <div
                  style={{
                    borderTop: "dashed 2px white",
                    position: "relative",
                  }}
                >
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
                    style={
                      currentDialogue[dialogueIndex].char !== "detective"
                        ? {
                            backgroundColor:
                              selectedSuspect === "chris"
                                ? "rgb(236, 224, 121)"
                                : selectedSuspect === "jason"
                                ? "rgb(139, 216, 239)"
                                : selectedSuspect === "kate"
                                ? "rgb(190, 190, 190)"
                                : selectedSuspect === "poppy"
                                ? "rgb(119, 207, 136)"
                                : selectedSuspect === "violet"
                                ? "rgb(171, 121, 236)"
                                : "rgb(238, 142, 216)",
                            borderColor:
                              selectedSuspect === "chris"
                                ? "rgb(255, 196, 0)"
                                : selectedSuspect === "jason"
                                ? "rgb(2, 3, 80)"
                                : selectedSuspect === "kate"
                                ? "rgb(73, 73, 73)"
                                : selectedSuspect === "poppy"
                                ? "rgb(27, 120, 38)"
                                : selectedSuspect === "violet"
                                ? "rgb(77, 2, 138)"
                                : "rgb(203, 0, 132)",
                          }
                        : {}
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
                <button
                  className="analyse-buttons"
                  onClick={() => setWeaponsOpen(true)}
                >
                  WEAPONS
                </button>

                <button
                  className="analyse-buttons"
                  onClick={() => setSuspectsOpen(true)}
                >
                  SUSPECTS
                </button>

                {aiSuggestion && (
                  <div
                    className="suggestions"
                    style={{
                      marginLeft: "2px",
                    }}
                  >
                    <label className="suggestion-label"> PiP SUGGESTS</label>
                    <p className="suggestion-text">{aiSuggestion}</p>
                  </div>
                )}

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
                      {showDialogue &&
                      dialogueIndex >= 2 &&
                      stage4Dialogues.length > 2 ? (
                        <p style={{ margin: "0", color: "#FFD700" }}>
                          {stage4Dialogues[2].text}
                        </p>
                      ) : (
                        <p style={{ margin: "0", color: "#FFD700" }}>
                          {showDialogue
                            ? "Verifying alibi..."
                            : "Select a suspect to verify their alibi."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "dashed 2px white",
                    position: "relative",
                  }}
                >
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
                                opacity: verifiedSuspects.has(suspect)
                                  ? 0.5
                                  : 1,
                                cursor: verifiedSuspects.has(suspect)
                                  ? "not-allowed"
                                  : "pointer",
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

                {showDialogue && currentDialogue[dialogueIndex] ? (
                  <p className="detective-dialogue-box">
                    {currentDialogue[dialogueIndex].text}
                  </p>
                ) : null}

                {showDialogue &&
                  dialogueIndex === currentDialogue.length - 1 && (
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
                        style={{
                          backgroundColor: "transparent",
                          border: "none",
                        }}
                        onClick={() => {
                          setShowDialogue(false);
                          setDialogueIndex(0);
                          setSelectedSuspect("");
                        }}
                      >
                        <img
                          src={left}
                          style={{ width: "8%" }}
                          alt="Left Arrow"
                        />
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

                {!showDialogue &&
                  verifiedSuspects.size === suspectNames.length && (
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
                      <img
                        src={down}
                        style={{ width: "8%" }}
                        alt="Down Arrow"
                      />
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
                <button
                  className="analyse-buttons"
                  onClick={() => setWeaponsOpen(true)}
                >
                  WEAPONS
                </button>

                <button
                  className="analyse-buttons"
                  onClick={() => setSuspectsOpen(true)}
                >
                  SUSPECTS
                </button>

                <button
                  className="analyse-buttons"
                  onClick={() => setAlibisOpen(true)}
                >
                  ALIBIS
                </button>

                {finalDeductionData && finalDeductionData.top_suspects && (
                  <div className="suggestions" style={{ marginLeft: "2px" }}>
                    <label className="suggestion-label">PiP SUGGESTS</label>
                    <p className="suggestion-text">
                      Top suspects:{" "}
                      {finalDeductionData.top_suspects
                        .map((s) => s.name)
                        .join(", ")}
                    </p>
                    <p className="suggestion-text">
                      Weapon clue: {finalDeductionData.weapon_clue}
                    </p>
                  </div>
                )}

                <div className="proceed-option">
                  {selectedSuspect &&
                    selectedWeapon &&
                    triesLeft > 0 &&
                    !guessResult && (
                      <button className="proceed-buttons" onClick={makeGuess}>
                        SUBMIT GUESS
                      </button>
                    )}
                  {guessResult?.status === "incorrect" && (
                    <button
                      className="proceed-buttons"
                      onClick={() => setGuessResult(null)} // Clear guess result to allow another guess
                    >
                      TRY AGAIN
                    </button>
                  )}
                </div>
              </div>

              <div className="game-box">
                <div style={{ position: "relative" }}>
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

                  <div
                    style={{
                      display: "grid",
                      gridTemplateRows: "15% 80%",
                      position: "absolute",
                      left: "20px",
                      top: "5px",
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
                      WHO IS THE MURDERER?
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
                            opacity: selectedSuspect === suspect ? 1 : 0.7,
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSelectedSuspect(suspect);
                          }}
                          disabled={
                            guessResult?.status === "success" ||
                            guessResult?.status === "game_over"
                          }
                        >
                          {suspect.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: "dashed 2px white",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      textShadow: "2px 2px 1px rgb(14, 42, 121)",
                      fontFamily: "'Press Start 2P'",
                      fontSize: "15px",
                      padding: "1rem",
                      color: "white",
                    }}
                  >
                    AND THE WEAPON?
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      columnGap: "15px",
                      rowGap: "10px",
                      padding: "0 4rem",
                      position: "absolute",
                      top: "20%",
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  >
                    {weaponNames.map((weapon) => (
                      <button
                        key={weapon}
                        className="suspect-button"
                        style={{
                          opacity: selectedWeapon === weapon ? 1 : 0.7,
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setSelectedWeapon(weapon);
                        }}
                        disabled={
                          guessResult?.status === "success" ||
                          guessResult?.status === "game_over"
                        }
                      >
                        {weapon.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {guessResult && (
                  <p className="detective-dialogue-box">
                    {guessResult.message}
                    {guessResult.status === "incorrect" && (
                      <>
                        <br />
                        Killer Clue: {guessResult.killer_clue}
                        <br />
                        Weapon Clue: {guessResult.weapon_clue}
                        <br />
                        Tries Left: {guessResult.tries_left}
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {timeLeft <= 0 && (
        <div className={`fade-container ${fadeOut ? "fade-out" : ""}`}>
          {/* This section is intentionally left empty as the username prompt is handled in the useEffect hook */}
        </div>
      )}

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
            <button
              onClick={prevSuspect}
              className="arrow"
              style={{ left: "20%" }}
            >
              ❮
            </button>
            <button
              onClick={nextSuspect}
              className="arrow"
              style={{ right: "20%" }}
            >
              ❯
            </button>
          </div>
        </>
      )}

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
            <button
              onClick={prevWeapon}
              className="arrow"
              style={{ left: "20%" }}
            >
              ❮
            </button>
            <button
              onClick={nextWeapon}
              className="arrow"
              style={{ right: "20%" }}
            >
              ❯
            </button>
          </div>
        </>
      )}

      {alibisOpen && (
        <>
          <div className="overlay" onClick={() => setAlibisOpen(false)} />
          <div className="alibis-container">
            <h2 className="alibis-title">ALIBI VERIFICATION STATUS</h2>
            {suspectNames.length > 0 ? (
              suspectNames.map((suspect) => (
                <div
                  key={suspect}
                  className="alibi-item"
                  style={{
                    backgroundColor:
                      suspect === "chris"
                        ? "rgba(236, 224, 121, 0.8)"
                        : suspect === "jason"
                        ? "rgba(139, 216, 239, 0.8)"
                        : suspect === "kate"
                        ? "rgba(190, 190, 190, 0.8)"
                        : suspect === "poppy"
                        ? "rgba(119, 207, 136, 0.8)"
                        : suspect === "violet"
                        ? "rgba(171, 121, 236, 0.8)"
                        : "rgba(238, 142, 216, 0.8)",
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
                >
                  <p className="alibi-text">
                    {suspect.toUpperCase()}:{" "}
                    {alibiResults[suspect] ? (
                      <>
                        {alibiResults[suspect].isValid ? (
                          <span className="alibi-valid">Valid</span>
                        ) : (
                          <span className="alibi-invalid">Invalid</span>
                        )}{" "}
                        (Claimed: {alibiResults[suspect].claimedLocation || "N/A"})
                      </>
                    ) : (
                      <span className="alibi-not-verified">Not Verified</span>
                    )}
                  </p>
                </div>
              ))
            ) : (
              <p className="alibi-text">No suspects available.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default GamePlay
