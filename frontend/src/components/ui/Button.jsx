const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled,
  ...props // <-- ADD THIS to collect other props
}) => {
  // Base styles are now more generic
  const baseStyles =
    "font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "px-6 py-2 rounded-md bg-accent text-white hover:bg-accent-hover focus:ring-accent hover:scale-105",
    secondary:
      "px-6 py-2 rounded-md bg-background-secondary text-text-primary hover:bg-border focus:ring-accent hover:scale-105",
    success:
      "px-6 py-2 rounded-md bg-success-accent text-white hover:bg-success-hover focus:ring-success-accent hover:scale-105",
    warning:
      "px-6 py-2 rounded-md bg-warning-accent text-white hover:bg-warning-hover focus:ring-warning-accent hover:scale-105",
    error:
      "px-6 py-2 rounded-md bg-error-accent text-white hover:bg-error-hover focus:ring-error-accent hover:scale-105",
    // New FAB variant for the sticky button
    fab: "fixed bottom-20 right-4 h-12 w-12 rounded-full p-0 flex items-center justify-center bg-success-accent text-white hover:bg-success-hover focus:ring-success-accent shadow-lg md:bottom-8 md:right-8 md:h-14 md:w-14 z-40",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props} // <-- SPREAD THE REST OF THE PROPS HERE
    >
      {children}
    </button>
  );
};

export default Button;
