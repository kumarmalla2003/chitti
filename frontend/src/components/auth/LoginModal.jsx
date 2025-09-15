import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/slices/authSlice";
import Button from "../ui/Button";
import { FiPhone, FiLock, FiX } from "react-icons/fi";

const LoginModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState("phone"); // 'phone' or 'pin'
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pin, setPin] = useState(new Array(6).fill(""));
  const [visiblePinIndex, setVisiblePinIndex] = useState(null);
  const dispatch = useDispatch();

  const phoneInputRef = useRef(null);
  const pinInputRefs = useRef([]);
  const visibilityTimerRef = useRef(null);

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
      clearTimeout(visibilityTimerRef.current);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      if (step === "phone") {
        setTimeout(() => phoneInputRef.current?.focus(), 100);
      } else if (step === "pin") {
        setTimeout(() => pinInputRefs.current[0]?.focus(), 100);
      }
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("phone");
        setPhoneNumber("");
        setPin(new Array(6).fill(""));
      }, 300);
    }
  }, [isOpen]);

  const handlePhoneChange = (e) => {
    const input = e.target.value.replace(/\D/g, "");
    setPhoneNumber(input.slice(0, 10));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    setStep("pin");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const enteredPin = pin.join("");
    if (enteredPin.length < 6) {
      alert("Please enter the complete 6-digit PIN.");
      return;
    }
    const mockUserData = { phone: phoneNumber };
    const mockToken = `fake-jwt-token-for-${phoneNumber}`;
    dispatch(loginSuccess({ user: mockUserData, token: mockToken }));
    onClose();
  };

  const handlePinChange = (element, index) => {
    if (isNaN(element.value)) return;
    const newPin = [...pin];
    newPin[index] = element.value.slice(-1);
    setPin(newPin);

    setVisiblePinIndex(index);
    clearTimeout(visibilityTimerRef.current);

    visibilityTimerRef.current = setTimeout(() => {
      setVisiblePinIndex(null);
    }, 500); // Changed from 800 to 500

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
    setTimeout(() => {
      e.target.setSelectionRange(e.target.value.length, e.target.value.length);
    }, 0);
  };

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
          <form onSubmit={handleNextStep}>
            <p className="text-text-secondary text-center mb-4">
              Please enter your registered phone number
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
              Verify
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <p className="text-center text-text-secondary text-sm">
                Enter the 6-digit PIN for +91 {formattedPhoneNumber}
              </p>
            </div>
            <div className="flex justify-center items-center gap-2 mb-6">
              <FiLock className="w-8 h-8 text-text-secondary" />
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
                    className="w-8 h-8 text-center text-xl bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">
              Login
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
