import React from 'react';

const Greetings = ({ name }) => {
  const getTimeGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good morning, Coach";
    if (hour >= 12 && hour < 17) return "Good afternoon, Coach";
    if (hour >= 17 && hour < 21) return "Good evening, Coach";
  };

  return (
    <h1>{getTimeGreeting()} {name}</h1>
  );
};

export default Greetings;
