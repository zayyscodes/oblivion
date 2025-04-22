import React from 'react';

const CountdownTimer = ({ time }) => {
  return (
    <div
      style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        position: 'fixed',
        fontFamily: 'Press Start 2P',
        bottom: '130px',
        left: '70px',
        color: 'white',
        letterSpacing: '3px',
        border: 'dashed 3px rgba(193, 233, 220, 0.97)',
        padding: '5px 0.5rem',
        backgroundColor: 'rgba(2, 59, 34, 0.97)',
        zIndex: '120',
      }}
    >
      {time}
    </div>
  );
};

export default CountdownTimer;