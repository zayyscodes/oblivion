import React, { useState, useEffect } from 'react';
import styles from './Envelope.module.css';

const Envelope = ({ text }) => {
    const [isFlapOpen, setIsFlapOpen] = useState(false);
  
    const toggleFlap = () => {
      setIsFlapOpen(!isFlapOpen);
    };

  return (
    <div className={styles.container}>
      <div
        className={`${styles['envelope-wrapper']} ${isFlapOpen ? styles.flap : ''}`}
        onClick={toggleFlap}
      >
        <div className={styles.envelope}>
          <div style={{
            zIndex: 6000,
            position: "absolute",
            fontFamily: "'Press Start 2P'",
            color: "rgb(218, 194, 150)",
            top: "75%",
            left: "16%"
          }}>CLICK TO OPEN OR CLOSE</div>
          <div className={styles.letter}>
            <div style={{textAlign: 'left'}} className={styles.text}>
                <p style={{
                    color: "rgb(138, 6, 6)",
                    fontSize: "10px"
                }}>FORENSIC AUTOPSY REPORT</p>
                <p style={{
                    color: "rgb(0, 0, 0)",
                    fontSize: "9px"
                }}>VICTIM: SIERRA ROSE</p>
              <p>{text}</p>
            </div>
          </div>
        </div>
        </div>
    </div>
  );
};

export default Envelope;