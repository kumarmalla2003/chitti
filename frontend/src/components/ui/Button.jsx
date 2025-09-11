const Button = ({ children, onClick, variant = "primary", className = "" }) => {
  const baseStyles =
    "px-6 py-2 rounded-md font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary cursor-pointer hover:scale-105";

  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover focus:ring-accent",
    secondary:
      "bg-background-secondary text-text-primary hover:bg-border focus:ring-accent",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
