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

  // Use tailwind utility classes for spacing
  const commonClasses = "px-6 py-2 rounded-md"; // using theme("spacing.6") -> px-6, theme("borderRadius.md") -> rounded-md

  const variants = {
    primary: `${commonClasses} bg-accent text-white hover:bg-accent-hover focus:ring-accent hover:scale-105`,
    secondary: `${commonClasses} bg-background-secondary text-text-primary hover:bg-background-tertiary focus:ring-accent hover:scale-105`, // Changed hover to bg-background-tertiary
    success: `${commonClasses} bg-success-accent text-white hover:bg-success-hover focus:ring-success-accent hover:scale-105`,
    warning: `${commonClasses} bg-warning-accent text-white hover:bg-warning-hover focus:ring-warning-accent hover:scale-105`,
    error: `${commonClasses} bg-error-accent text-white hover:bg-error-hover focus:ring-error-accent hover:scale-105`,
    // UPDATED: z-overlay, shadow-floating
    fab: "fixed bottom-20 right-4 h-12 w-12 rounded-full p-0 flex items-center justify-center bg-success-accent text-white hover:bg-success-hover focus:ring-success-accent shadow-lg md:bottom-8 md:right-8 md:h-14 md:w-14 z-50", // z-overlay and shadow-floating replacements
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
