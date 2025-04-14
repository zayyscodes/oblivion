import React from 'react'
import "./styles.css";
import "./GamePlay.css";
import house from "../assets/IMG_0985.JPG";

function GamePlay() {
  return (
    <div>
      <img src={house} style={{
        width: "45%",
        opacity: "0.5",
        position: "absolute",
        zIndex: "1",
        top: "2%",
        left: "25%"
      }}/>

      <div>
      <button className='analyse-buttons'>SUSPECTS</button>
      <button className='analyse-buttons'>WEAPONS</button>

      </div>

      </div>
  )
}

export default GamePlay