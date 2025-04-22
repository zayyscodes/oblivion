import React, { useState, useEffect } from "react";
import "./styles.css";
import "./GamePlay.css";
import dialogues from "./dialogues.js";
import CountdownTimer from "../components/Timer.jsx";

import background from "../assets/Something9.png";
import inspector from "../assets/Something8.png";
import detective from "../assets/Something3.png";
import left from "../assets/arrow-left-solid.svg";
import down from "../assets/arrow-down-solid.svg";

// SUSPECTS
import chris from "../assets/chris.JPEG";
import jason from "../assets/jason.JPEG";
import kade from "../assets/kate.JPEG";
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

function GamePlay() {
  const suspect_cards = [
    { id: 1, name: "chris", image: chris },
    { id: 2, name: "jason", image: jason },
    { id: 3, name: "kade", image: kade },
    { id: 4, name: "poppy", image: poppy },
    { id: 5, name: "violet", image: violet },
    { id: 6, name: "zehab", image: zehab },
  ];

  const weapon_cards = [
    { id: 1, image: wrench },
    { id: 2, image: pipe },
    { id: 3, image: revolver },
    { id: 4, image: rope },
    { id: 5, image: candle },
    { id: 6, image: knife },
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
    kade: int_kate,
    poppy: int_poppy,
    violet: int_violet,
    zehab: int_zehab,
  };

  const phrases = [
    (t, l) => `I saw ${t} near the ${l}.`,
    (t, l) => `${t}? Think they were by the ${l}.`,
    (t, l) => `Pretty sure ${t} was at the ${l}.`,
    (t, l) => `I think I saw ${t} around the ${l}.`,
    (t, l) => `${t} was hanging near the ${l}, I believe.`,
  ];

  const buildStage3 = (alibi_claims) => {
    const stage3 = {};

    for (const [suspect, claims] of Object.entries(alibi_claims)) {
      const dialogue = [
        { char: "detective", text: "Where was everyone when it happened?" },
      ];

      for (const [target, location] of Object.entries(claims)) {
        const randomPhrase =
          phrases[Math.floor(Math.random() * phrases.length)];
        dialogue.push({
          char: suspect,
          text: randomPhrase(target, location),
        });
      }

      stage3[suspect] = dialogue;
    }

    return stage3;
  };

  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [step, setStep] = useState(1); // Tracks current game stage
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes = 180 seconds
  const [timerStarted, setTimerStarted] = useState(false); // Tracks if timer has started
  const [currentSuspect, setCurrentSuspect] = useState(0);
  const [currentWeapon, setCurrentWeapon] = useState(0);
  const [suspects, setSuspects] = useState(false);
  const [weapons, setWeapons] = useState(false);
  const [weaponCards, setWeaponCards] = useState(false); // Presumably for some UI logic
  const [fadeOut, setFadeOut] = useState(false);
  const suspectNames = ["chris", "jason", "kade", "poppy", "violet", "zehab"];
  const [currentSuspectIndex, setCurrentSuspectIndex] = useState(0);
  const [selectedSuspect, setSelectedSuspect] = useState("");
  const [showDialogue, setShowDialogue] = useState(false);
  const [stage3Dialogues, setStage3Dialogues] = useState({});

  const getDialogueSet = () => {
    if (step === 1) return dialogues.stage1;
    if (step === 2) return dialogues.stage2[suspectNames[currentSuspectIndex]];
    if (step === 3) return dialogues.stage3[suspectNames[currentSuspectIndex]];
    return [];
  };

  const currentDialogue = getDialogueSet();

  useEffect(() => {
    // Start timer only when step >= 3 and timer hasn't started yet
    if (step >= 3 && !timerStarted && timeLeft > 0) {
      setTimerStarted(true);
    }

    if (!timerStarted || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval); // Cleanup on unmount or when timer stops
  }, [timerStarted, timeLeft, step]);

  // Format time for display
  const formatTime = (seconds) => {
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    return `${min}:${sec}`;
  };

  // Handle game end when time runs out
  useEffect(() => {
    if (timeLeft <= 0) {
      console.log("Time is up! Game Over.");
    }
  }, [timeLeft]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (step === 1) {
        if (event.code === "Space" || event.code === "ArrowRight") {
          setDialogueIndex((prev) =>
            prev < currentDialogue.length - 1 ? prev + 1 : prev
          );
        }

        if (event.code === "ArrowLeft") {
          setDialogueIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
      }

      if (step === 2) {
        if (event.code === "Space" || event.code === "ArrowRight") {
          setDialogueIndex((prev) =>
            prev < currentDialogue.length - 1 ? prev + 1 : prev
          );
        }

        if (event.code === "ArrowLeft") {
          setDialogueIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [step, dialogueIndex]);

  const nextStep = () => {
    setFadeOut(true);
    setTimeout(() => {
      setStep((prev) => (prev < 6 ? prev + 1 : prev));
      setFadeOut(false);
      setCurrentSuspectIndex(0);
      setDialogueIndex(0);
    }, 500); // Match the transition duration
  };

  const nextSuspect = () => {
    setCurrentSuspect((prev) => (prev + 1) % suspect_cards.length);
  };

  const prevSuspect = () => {
    setCurrentSuspect(
      (prev) => (prev - 1 + suspect_cards.length) % suspect_cards.length
    );
  };

  const nextWeapon = () => {
    setCurrentWeapon((prev) => (prev + 1) % weapon_cards.length);
  };

  const prevWeapon = () => {
    if (weapon_cards && weapon_cards.length > 0) {
      setCurrentWeapon(
        (prev) => (prev - 1 + weapon_cards.length) % weapon_cards.length
      );
    }
  };
  console.log(
    "current dialogue: ",
    Array.isArray(currentDialogue) && dialogueIndex < currentDialogue.length
      ? currentDialogue[dialogueIndex].id
      : "Not available"
  );

  useEffect(() => {
    if (currentDialogue[dialogueIndex]?.id === "weapons" && step === 1) {
      setWeaponCards(true);
    }

    if (
      currentDialogue[dialogueIndex]?.id !== "weapons" &&
      weaponCards &&
      currentDialogue[dialogueIndex]?.char !== "detective"
    ) {
      setWeaponCards(false);
    }
  }, [dialogueIndex, currentDialogue]);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/round2_alibis")
      .then((res) => res.json())
      .then((alibiClaims) => {
        const stage3 = buildStage3(alibiClaims); // builds full dialogues
        setStage3Dialogues(stage3);
      });
  }, []);

  /*useEffect(() => {
    const stage3 = buildStage3(alibi_claims);
    setStage3Dialogues(stage3);
  }, [alibi_claims]);
  */

  useEffect(() => {
    let interval;

    if (step >= 3 && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [step, timeLeft]);

  return (
    <div
      style={{
        position: "relative",
        maxHeight: "100vh",
        overflow: "hidden",
        backgroundColor: "black",
      }}
    >
      <img src={background} className="background" alt="background" />

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
                {weaponCards && (
                  <button
                    className="analyse-buttons"
                    onClick={() => setWeapons(true)}
                  >
                    WEAPONS
                  </button>
                )}
                <div className={weaponCards ? "proceed-option" : ""}>
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

                <div
                  style={{
                    borderTop: "dashed 2px white",
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
                </div>

                <p
                  className={
                    currentDialogue[dialogueIndex].char === "inspector"
                      ? "inspector-dialogue-box"
                      : "detective-dialogue-box"
                  }
                >
                  {currentDialogue[dialogueIndex].text}
                </p>

                <img
                  src={weaponImages[currentDialogue[dialogueIndex].id]}
                  className="appear-card"
                  style={{
                    left: weaponImages[currentDialogue[dialogueIndex].id]
                      ? "3%"
                      : "-30%",
                  }}
                  alt="Weapon"
                />

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
                      style={{
                        width: "8%",
                      }}
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
                  onClick={() => setWeapons(true)}
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
                      padding: 0,
                      zIndex: "1400",
                    }}
                    alt="Suspect"
                  />

                  <button
                    className="next-button"
                    onClick={(e) => {
                      e.currentTarget.blur(); // <-- removes focus from the button
                      if (currentSuspectIndex < suspectNames.length - 1) {
                        setCurrentSuspectIndex(currentSuspectIndex + 1);
                        setDialogueIndex(0);
                      }
                    }}
                  >
                    CHANGE SUSPECT
                  </button>
                </div>

                <div
                  style={{
                    borderTop: "dashed 2px white",
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
                      <img
                        src={left}
                        style={{
                          width: "8%",
                        }}
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
                        style={{
                          width: "8%",
                        }}
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
                <button
                  className="analyse-buttons"
                  onClick={() => setWeapons(true)}
                >
                  WEAPONS
                </button>

                <button
                  className="analyse-buttons"
                  onClick={() => setSuspects(true)}
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
                            padding: 0,
                            zIndex: "1400",
                          }}
                          alt="Suspect"
                        />

                        <button
                          className="next-button"
                          onClick={(e) => {
                            e.currentTarget.blur(); // <-- removes focus from the button
                            if (currentSuspectIndex < suspectNames.length - 1) {
                              setShowDialogue(false);
                              setDialogueIndex(0);
                              setSelectedSuspect("");
                            }
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
                          bottom: 0,
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            textShadow: "2px 2px 1px rgb(14, 42, 121)",
                            fontFamily: "'Press Start 2P'",
                            fontSize: "15px",
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
                          <button
                            className="suspect-button"
                            style={{
                              backgroundColor: "rgb(236, 224, 121)",
                              color: "black",
                              borderColor: "rgb(255, 196, 0)",
                            }}
                            onClick={() => {
                              setSelectedSuspect("chris");
                              setDialogueIndex(0);
                              setShowDialogue(true);
                            }}
                          >
                            CHRIS
                          </button>
                          <button
                            className="suspect-button"
                            style={{
                              backgroundColor: "rgb(139, 216, 239)",
                              color: "black",
                              borderColor: "rgb(2, 3, 80)",
                            }}
                            onClick={() => {
                              setSelectedSuspect("jason");
                              setDialogueIndex(0);
                              setShowDialogue(true);
                            }}
                          >
                            JASON
                          </button>
                          <button
                            className="suspect-button"
                            style={{
                              backgroundColor: "rgb(190, 190, 190)",
                              color: "black",
                              borderColor: "rgb(73, 73, 73)",
                            }}
                            onClick={() => {
                              setSelectedSuspect("kade");
                              setDialogueIndex(0);
                              setShowDialogue(true);
                            }}
                          >
                            KADE
                          </button>
                          <button
                            className="suspect-button"
                            style={{
                              backgroundColor: "rgb(119, 207, 136)",
                              color: "black",
                              borderColor: "rgb(27, 120, 38)",
                            }}
                            onClick={() => {
                              setSelectedSuspect("poppy");
                              setDialogueIndex(0);
                              setShowDialogue(true);
                            }}
                          >
                            POPPY
                          </button>
                          <button
                            className="suspect-button"
                            style={{
                              backgroundColor: "rgb(171, 121, 236)",
                              color: "black",
                              borderColor: "rgb(77, 2, 138)",
                            }}
                            onClick={() => {
                              setSelectedSuspect("violet");
                              setDialogueIndex(0);
                              setShowDialogue(true);
                            }}
                          >
                            VIOLET
                          </button>
                          <button
                            className="suspect-button"
                            style={{
                              backgroundColor: "rgb(238, 142, 216)",
                              color: "black",
                              borderColor: "rgb(203, 0, 132)",
                            }}
                            onClick={() => {
                              setSelectedSuspect("zehab");
                              setDialogueIndex(0);
                              setShowDialogue(true);
                            }}
                          >
                            ZEHAB
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {showDialogue && (
                  <>
                    <p
                      className={
                        currentDialogue[dialogueIndex].char !== "detective"
                          ? "suspect-dialogue-box"
                          : "detective-dialogue-box"
                      }
                    >
                      {currentDialogue[dialogueIndex].text}
                    </p>

                    <div className="suspect-dialogue-box">
                      {stage3Dialogues[selectedSuspect]?.map((line, idx) => (
                        <p key={idx}>
                          <strong>{line.char}:</strong> {line.text}
                        </p>
                      ))}
                    </div>
                  </>
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
                  onClick={() => setWeapons(true)}
                >
                  WEAPONS
                </button>

                <button
                  className="analyse-buttons"
                  onClick={() => setSuspects(true)}
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
                <div
                  style={{
                    position: "relative",
                  }}
                >
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
                    <div style={{
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
                    }}>
                      <p>C</p>
                      <p>C</p>
                      <p>T</p>
                      <p>V</p>
                    </div>

                    <div  style={{
                      padding: "0 1rem",
                      fontFamily: "'Press Start 2P'",
                      textAlign: "center",
                      backgroundColor: "rgb(57, 48, 72)",
                      color: "white",
                      fontSize: "15px",
                      zIndex: "99"
                    }}>

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
                          }}
                        >
                          WHOSE ALIBI YOU WANT TO VERIFY?
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            columnGap: "15px",
                            rowGap: "10px",
                          }}
                        >
                          <button
                            className="suspect-button"
                            style={{
                              backgroundColor: "rgb(236, 224, 121)",
                              color: "black",
                              borderColor: "rgb(255, 196, 0)",
                            }}
                            onClick={() => {
                              setSelectedSuspect("chris");
                              setDialogueIndex(0);
                              setShowDialogue(true);
                            }}
                          >
                            CHRIS
                          </button>
                          <button
                            className="suspect-button"
                            style={{
                              backgroundColor: "rgb(139, 216, 239)",
                              color: "black",
                              borderColor: "rgb(2, 3, 80)",
                            }}
                            onClick={() => {
                              setSelectedSuspect("jason");
                              setDialogueIndex(0);
                              setShowDialogue(true);
                            }}
                          >
                            JASON
                          </button>
                          <button
                            className="suspect-button"
                            style={{
                              backgroundColor: "rgb(190, 190, 190)",
                              color: "black",
                              borderColor: "rgb(73, 73, 73)",
                            }}
                            onClick={() => {
                              setSelectedSuspect("kade");
                              setDialogueIndex(0);
                              setShowDialogue(true);
                            }}
                          >
                            KADE
                          </button>
                          <button
                            className="suspect-button"
                            style={{
                              backgroundColor: "rgb(119, 207, 136)",
                              color: "black",
                              borderColor: "rgb(27, 120, 38)",
                            }}
                            onClick={() => {
                              setSelectedSuspect("poppy");
                              setDialogueIndex(0);
                              setShowDialogue(true);
                            }}
                          >
                            POPPY
                          </button>
                          <button
                            className="suspect-button"
                            style={{
                              backgroundColor: "rgb(171, 121, 236)",
                              color: "black",
                              borderColor: "rgb(77, 2, 138)",
                            }}
                            onClick={() => {
                              setSelectedSuspect("violet");
                              setDialogueIndex(0);
                              setShowDialogue(true);
                            }}
                          >
                            VIOLET
                          </button>
                          <button
                            className="suspect-button"
                            style={{
                              backgroundColor: "rgb(238, 142, 216)",
                              color: "black",
                              borderColor: "rgb(203, 0, 132)",
                            }}
                            onClick={() => {
                              setSelectedSuspect("zehab");
                              setDialogueIndex(0);
                              setShowDialogue(true);
                            }}
                          >
                            ZEHAB
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

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
                      style={{
                        width: "8%",
                      }}
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

      {timeLeft <= 0 && (
        <div className={`fade-container ${fadeOut ? "fade-out" : ""}`}>
          <h1>Game Over</h1>
        </div>
      )}

      {suspects && (
        <>
          <div className="overlay" onClick={() => setSuspects(false)} />
          <div className="card-container">
            <div
              className="card"
              style={{
                backgroundImage: `url(${suspect_cards[currentSuspect].image})`,
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

      {weapons && (
        <>
          <div className="overlay" onClick={() => setWeapons(false)} />
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
    </div>
  );
}

export default GamePlay;
