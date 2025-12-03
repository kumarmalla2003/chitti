import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Button from "../ui/Button";

const Hero = forwardRef(({ onLoginClick }, ref) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useSelector((state) => state.auth);

  return (
    <section
      id="home"
      ref={ref}
      className="flex flex-col justify-center items-center text-center py-24"
    >
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-4">
          The Future of <span className="text-accent">Predictable</span> Chit
          Funds
        </h1>
        <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-8">
          The all-in-one platform for foremen. Structure pre-approved payout
          schedules, track collections, and manage your groups with complete
          transparency and control.
        </p>

        {isLoggedIn ? (
          <Button
            onClick={() => navigate("/dashboard")}
            className="text-lg px-8 py-3"
          >
            Go to dashboard
          </Button>
        ) : (
          <Button onClick={onLoginClick} className="text-lg px-8 py-3">
            Log In
          </Button>
        )}
      </div>
    </section>
  );
});

export default Hero;
