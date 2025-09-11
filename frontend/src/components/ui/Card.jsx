const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-background-secondary p-8 rounded-md shadow-md transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
