const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled,
}) => {
  const baseStyles =
    "px-6 py-2 rounded-md font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary cursor-pointer hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

  const variants = {
    primary: "bg-accent text-white hover:bg-accent-hover focus:ring-accent",
    secondary:
      "bg-background-secondary text-text-primary hover:bg-border focus:ring-accent",
    success:
      "bg-success-accent text-white hover:bg-success-hover focus:ring-success-accent",
    warning:
      "bg-warning-accent text-white hover:bg-warning-hover focus:ring-warning-accent",
    error:
      "bg-error-accent text-white hover:bg-error-hover focus:ring-error-accent",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
