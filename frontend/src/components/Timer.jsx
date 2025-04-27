import React from 'react';

const CountdownTimer = ({ time, step }) => {
  return (
    <div
      style={{
        fontSize: '2rem',
        fontWeight: 'bold',
        position: 'fixed',
        fontFamily: 'Press Start 2P',
        bottom: step === 5 ? '11.5%' : '9vw',
        left: '4.3%',
        color: 'white',
        letterSpacing: '3px',
        border: 'dashed 3px rgba(11, 171, 86, 0.97)',
        padding: '5px 0.5rem',
        backgroundColor: 'rgba(4, 40, 24, 0.97)',
        zIndex: '100',
      }}
    >
      {time}
    </div>
  );
};

export default CountdownTimer;