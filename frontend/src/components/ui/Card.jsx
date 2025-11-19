const Card = ({ children, className = "" }) => {
  return (
    <div
      // UPDATED: shadow-card
      className={`bg-background-secondary p-layout rounded-card shadow-card transition-all duration-normal ease-smooth ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
