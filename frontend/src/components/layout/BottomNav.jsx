import Button from "../ui/Button";

const BottomNav = ({ onLoginClick }) => {
  return (
    <footer className="fixed bottom-0 left-0 w-full h-16 bg-background-secondary shadow-[0_-2px_6px_rgba(0,0,0,0.1)] px-4 border-t border-border md:hidden flex items-center">
      <div className="container mx-auto">
        <Button onClick={onLoginClick} className="w-full">
          Log In
        </Button>
      </div>
    </footer>
  );
};

export default BottomNav;
