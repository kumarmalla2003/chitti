// frontend/src/features/auth/components/LoginModal.jsx

import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../authSlice";
import Button from "../../../components/ui/Button";
import { Phone, Lock, X, Loader2 } from "lucide-react";
import { verifyPhone, login } from "../../../lib/api";
import Message from "../../../components/ui/Message";
import useCursorTracking from "../../../hooks/useCursorTracking";

const LoginModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState(new Array(6).fill(""));
  const [visiblePinIndex, setVisiblePinIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();

  const phoneInputRef = useRef(null);
  const pinInputRefs = useRef([]);
  const visibilityTimerRef = useRef(null);

  // --- 1. Restore Formatting Logic ---
  let formattedPhoneNumber = phoneNumber;
  if (phoneNumber.length > 5) {
    formattedPhoneNumber = `${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`;
  }

  // --- 2. Track Cursor on the FORMATTED value ---
  const trackPhoneCursor = useCursorTracking(
    phoneInputRef,
    formattedPhoneNumber,
    /\d/ // Track digits only (ignore the space)
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (step === "phone") {
        setTimeout(() => phoneInputRef.current?.focus(), 100);
      } else if (step === "pin") {
        setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
      }
    } else {
      document.body.style.overflow = "auto";
    }
    return () => clearTimeout(visibilityTimerRef.current);
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("phone");
        setPhoneNumber("");
        setPin(new Array(6).fill(""));
        setError(null);
        setIsLoading(false);
      }, 300);
    }
  }, [isOpen]);

  const handlePhoneChange = (e) => {
    trackPhoneCursor(e); // <--- Track cursor before update
    const input = e.target.value.replace(/\D/g, "");
    setPhoneNumber(input.slice(0, 10));
    if (error) setError(null);
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      setTimeout(() => phoneInputRef.current?.focus(), 100);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await verifyPhone(phoneNumber);
      setStep("pin");
    } catch (err) {
      setError(err.message);
      setTimeout(() => phoneInputRef.current?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const enteredPin = pin.join("");
    if (enteredPin.length < 6) {
      setError("Please enter the complete 6-digit PIN.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await login(phoneNumber, enteredPin);
      const userData = { phone: phoneNumber };
      dispatch(loginSuccess({ user: userData }));
      onClose();
    } catch (err) {
      setError(err.message);
      setPin(new Array(6).fill(""));
      setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (element, index) => {
    if (isNaN(element.value)) return;
    if (error) setError(null);

    const newPin = [...pin];
    newPin[index] = element.value.slice(-1);
    setPin(newPin);

    setVisiblePinIndex(index);
    clearTimeout(visibilityTimerRef.current);
    visibilityTimerRef.current = setTimeout(
      () => setVisiblePinIndex(null),
      500
    );

    if (element.value !== "" && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handlePinKeyDown = (e, index) => {
    if (e.key === "Backspace" && !pin[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handlePinFocus = (e) => {
    setTimeout(
      () =>
        e.target.setSelectionRange(
          e.target.value.length,
          e.target.value.length
        ),
      0
    );
  };

  const handleGoBackToPhone = () => {
    setStep("phone");
    setError(null);
    setPin(new Array(6).fill(""));
  };

  return (
    <div
      className={`fixed inset-0 z-30 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-background-primary rounded-md shadow-lg p-8 w-full max-w-sm transition-all duration-300 ease-in-out ${isOpen
          ? "opacity-100 scale-100"
          : "opacity-0 scale-95 pointer-events-none"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-transform duration-300 hover:rotate-90 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-bold text-center text-text-primary">
          Login
        </h2>
        <hr className="my-4 border-border" />
        <p className="text-sm text-center text-text-secondary h-5 mb-6">
          {step === "phone"
            ? "Enter your authorized phone number"
            : `Enter PIN for +91 ${formattedPhoneNumber}`}
        </p>
        {step === "phone" ? (
          <form onSubmit={handleNextStep}>
            {error && (
              <Message
                type="error"
                title="Validation Error"
                onClose={() => setError(null)}
              >
                {error}
              </Message>
            )}
            <div className="relative flex items-center mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Phone className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                ref={phoneInputRef}
                type="tel"
                placeholder="98765 43210"
                value={formattedPhoneNumber} // <--- Using the formatted value
                onChange={handlePhoneChange}
                required
                className={`w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 ${error
                  ? "border-error-border focus:ring-error-border"
                  : "border-border focus:ring-accent"
                  }`}
                disabled={isLoading}
                maxLength="11" // 10 digits + 1 space
                autoComplete="off"
                autoCorrect="off"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin mx-auto w-5 h-5" />
              ) : (
                "Verify"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            {error && (
              <Message
                type="error"
                title="Authentication Error"
                onClose={() => setError(null)}
              >
                {error}
              </Message>
            )}
            <div className="flex justify-center items-center gap-2 mb-4">
              <Lock className="w-8 h-8 text-text-secondary" />
              <div className="mr-1 h-8 w-px bg-border"></div>
              <div className="flex justify-center gap-2">
                {pin.map((data, index) => (
                  <input
                    key={index}
                    type={visiblePinIndex === index ? "text" : "password"}
                    inputMode="numeric"
                    pattern="\d{1}"
                    maxLength="1"
                    value={data}
                    onChange={(e) => handlePinChange(e.target, index)}
                    onKeyDown={(e) => handlePinKeyDown(e, index)}
                    onFocus={handlePinFocus}
                    ref={(el) => (pinInputRefs.current[index] = el)}
                    className={`w-8 h-8 text-center text-xl bg-background-secondary border rounded-md focus:outline-none focus:ring-2 ${error
                      ? "border-error-border focus:ring-error-border"
                      : "border-border focus:ring-accent"
                      }`}

                    disabled={isLoading}
                    autoComplete="off"
                    autoCorrect="off"
                  />
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin mx-auto w-5 h-5" />
              ) : (
                "Login"
              )}
            </Button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleGoBackToPhone}
                className="text-sm text-accent underline underline-offset-2 hover:opacity-80 cursor-pointer"
                disabled={isLoading}
              >
                Change number?
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
