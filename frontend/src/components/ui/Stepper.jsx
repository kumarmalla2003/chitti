// frontend/src/components/ui/Stepper.jsx
import { FiCheck } from "react-icons/fi";
import React from "react";

const Stepper = ({
  steps,
  currentStep,
  variant = "default",
  direction = "vertical",
}) => {
  const isDark = variant === "on-dark";

  // Unified logic for active step classes, used by both layouts
  let activeClasses = `bg-white border-2 border-accent text-accent ring-2 ring-accent ring-offset-2`;
  if (isDark) {
    activeClasses += " ring-offset-white";
  } else {
    activeClasses += " ring-offset-background-primary";
  }

  if (direction === "horizontal") {
    // HORIZONTAL LAYOUT
    return (
      <div className="flex items-start w-full max-w-md">
        {steps.map((step, index) => {
          const stepIndex = index + 1;
          const isCompleted = currentStep > stepIndex;
          const isActive = currentStep === stepIndex;

          return (
            <React.Fragment key={step.name}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 ease-in-out font-bold text-lg ${
                    isCompleted
                      ? "bg-success-accent border-2 border-success-accent text-white"
                      : isActive
                      ? activeClasses
                      : "bg-background-primary border-2 border-border text-text-secondary"
                  }`}
                >
                  {isCompleted ? <FiCheck size={20} /> : step.icon}
                </div>
                <div className="text-center mt-2 w-20">
                  <p className="text-sm font-semibold text-text-secondary">
                    STEP {stepIndex}
                  </p>
                  <p
                    className={`text-lg font-bold transition-colors duration-300 ${
                      isActive || isCompleted
                        ? "text-text-primary"
                        : "text-text-secondary"
                    }`}
                  >
                    {step.name}
                  </p>
                </div>
              </div>

              {stepIndex < steps.length && (
                <div className="flex-auto h-1 relative mx-2 mt-5 bg-border">
                  <div
                    className="absolute top-0 left-0 h-full w-full bg-success-accent transition-transform duration-500"
                    style={{
                      transform: isCompleted ? "scaleX(1)" : "scaleX(0)",
                      transformOrigin: "left",
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // VERTICAL LAYOUT
  return (
    <div className="flex flex-col h-full">
      {steps.map((step, index) => {
        const stepIndex = index + 1;
        const isCompleted = currentStep > stepIndex;
        const isActive = currentStep === stepIndex;

        return (
          <React.Fragment key={step.name}>
            <div
              className={`flex ${
                stepIndex < steps.length ? "flex-grow" : "flex-grow-0"
              }`}
            >
              <div className="flex flex-col items-center mr-4">
                <div
                  className={`z-10 w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 ease-in-out font-bold text-lg ${
                    isCompleted
                      ? "bg-success-accent border-2 border-success-accent text-white"
                      : isActive
                      ? activeClasses
                      : isDark
                      ? "bg-white/10 border-2 border-white/20 text-white/60"
                      : "bg-background-primary border-2 border-border text-text-secondary"
                  }`}
                >
                  {isCompleted ? <FiCheck size={20} /> : step.icon}
                </div>
                {stepIndex < steps.length && (
                  <div
                    className={`flex-grow w-1 relative ${
                      isDark ? "bg-white/20" : "bg-border"
                    }`}
                  >
                    <div
                      className="absolute top-0 left-0 h-full w-full bg-success-accent transition-transform duration-500"
                      style={{
                        transform: isCompleted ? "scaleY(1)" : "scaleY(0)",
                        transformOrigin: "top",
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="pt-1">
                <p
                  className={`text-sm font-semibold ${
                    isDark ? "text-white/60" : "text-text-secondary"
                  }`}
                >
                  STEP {stepIndex}
                </p>
                <p
                  className={`text-lg font-bold transition-colors duration-300 ${
                    isActive || isCompleted
                      ? isDark
                        ? "text-white"
                        : "text-text-primary"
                      : isDark
                      ? "text-white/60"
                      : "text-text-secondary"
                  }`}
                >
                  {step.name}
                </p>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;
