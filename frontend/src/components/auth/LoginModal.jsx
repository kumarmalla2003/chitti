import { useState, useEffect, useRef } from "react";
import Button from "../ui/Button";
import { FiPhone, FiLock, FiX } from "react-icons/fi";

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [step, setStep] = useState("phone"); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState(""); // Stores raw 10 digits
  const [otp, setOtp] = useState(new Array(4).fill(""));

  const phoneInputRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Effect to handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      onClose();
    };

    if (isOpen) {
      window.history.pushState({ modal: true }, "");
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, onClose]);

  // Autofocus logic
  useEffect(() => {
    if (isOpen) {
      if (step === "phone") {
        setTimeout(() => phoneInputRef.current?.focus(), 100);
      } else if (step === "otp") {
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      }
    }
  }, [isOpen, step]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("phone");
        setPhoneNumber("");
        setOtp(new Array(4).fill(""));
      }, 300);
    }
  }, [isOpen]);

  const handlePhoneChange = (e) => {
    // Remove all non-numeric characters and limit to 10 digits
    const input = e.target.value.replace(/\D/g, "");
    setPhoneNumber(input.slice(0, 10));
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    console.log("Sending OTP to:", phoneNumber);
    setStep("otp");
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 4) {
      alert("Please enter the complete 4-digit OTP.");
      return;
    }
    console.log("Verifying OTP:", enteredOtp);
    // On successful verification
    onLoginSuccess();
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value.slice(-1);
    setOtp(newOtp);

    if (element.value !== "" && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  // Create the formatted phone number for display
  let formattedPhoneNumber = phoneNumber;
  if (phoneNumber.length > 5) {
    formattedPhoneNumber = `${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`;
  }

  return (
    <div
      className={`fixed inset-0 z-30 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-background-primary rounded-md shadow-lg p-8 w-full max-w-sm transition-all duration-300 ease-in-out ${
          isOpen
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
          <FiX className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-bold text-center text-text-primary">
          Login
        </h2>
        <hr className="my-6 border-border" />

        {step === "phone" ? (
          <form onSubmit={handleSendOtp}>
            <p className="text-text-secondary text-center mb-4">
              Please enter your registered phone number to continue.
            </p>
            <div className="relative flex items-center mb-6">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiPhone className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                ref={phoneInputRef}
                type="tel"
                placeholder="98765 43210"
                value={formattedPhoneNumber}
                onChange={handlePhoneChange}
                required
                className="w-full pl-12 pr-4 py-3 bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <Button type="submit" className="w-full">
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-4">
              <p className="text-center text-text-secondary text-sm">
                Enter the 4-digit OTP sent to +91 {formattedPhoneNumber}
              </p>
            </div>
            <div className="flex justify-center items-center gap-2 mb-6">
              <FiLock className="w-10 h-10 text-text-secondary" />
              <div className="mr-1 h-10 w-px bg-border"></div>
              <div className="flex justify-center gap-2">
                {otp.map((data, index) => {
                  return (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      pattern="\d{1}"
                      maxLength="1"
                      value={data}
                      onChange={(e) => handleOtpChange(e.target, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      className="w-10 h-10 text-center text-2xl bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  );
                })}
              </div>
            </div>
            <Button type="submit" className="w-full">
              Verify & Log In
            </Button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-sm text-accent underline underline-offset-2 hover:opacity-80 cursor-pointer"
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
