const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className = "",
  disabled,
  isLoading,
  ...props
}) => {
  const baseStyles =
    "font-semibold transition-all duration-normal ease-smooth focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const commonClasses = "px-control py-2 rounded-btn flex items-center justify-center gap-2";

  const variants = {
    primary: `${commonClasses} bg-accent text-white hover:bg-accent-hover focus:ring-accent hover:scale-105`,
    secondary: `${commonClasses} bg-background-secondary text-text-primary hover:bg-border focus:ring-accent hover:scale-105`,
    success: `${commonClasses} bg-success-accent text-white hover:bg-success-hover focus:ring-success-accent hover:scale-105`,
    warning: `${commonClasses} bg-warning-accent text-white hover:bg-warning-hover focus:ring-warning-accent hover:scale-105`,
    error: `${commonClasses} bg-error-accent text-white hover:bg-error-hover focus:ring-error-accent hover:scale-105`,
    // UPDATED: z-overlay, shadow-floating
    fab: "fixed bottom-20 right-4 h-12 w-12 rounded-full p-0 flex items-center justify-center bg-success-accent text-white hover:bg-success-hover focus:ring-success-accent shadow-floating md:bottom-8 md:right-8 md:h-14 md:w-14 z-overlay",
  };

  // Ghost variant (often needed for cancel buttons)
  if (variant === 'ghost') {
    variants.ghost = "bg-transparent text-text-secondary hover:text-text-primary hover:bg-background-secondary px-4 py-2 rounded-lg transition-colors";
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
