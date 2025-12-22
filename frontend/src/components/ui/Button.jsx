const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "font-semibold transition-all duration-normal ease-smooth focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const commonClasses = "px-control py-2 rounded-btn";

  const variants = {
    primary: `${commonClasses} bg-accent text-white hover:bg-accent-hover focus:ring-accent hover:scale-105`,
    secondary: `${commonClasses} bg-background-secondary text-text-primary hover:bg-border focus:ring-accent hover:scale-105`,
    success: `${commonClasses} bg-success-accent text-white hover:bg-success-hover focus:ring-success-accent hover:scale-105`,
    warning: `${commonClasses} bg-warning-accent text-white hover:bg-warning-hover focus:ring-warning-accent hover:scale-105`,
    error: `${commonClasses} bg-error-accent text-white hover:bg-error-hover focus:ring-error-accent hover:scale-105`,
    // UPDATED: z-overlay, shadow-floating
    fab: "fixed bottom-20 right-4 h-12 w-12 rounded-full p-0 flex items-center justify-center bg-success-accent text-white hover:bg-success-hover focus:ring-success-accent shadow-floating md:bottom-8 md:right-8 md:h-14 md:w-14 z-overlay",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className} cursor-pointer`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
