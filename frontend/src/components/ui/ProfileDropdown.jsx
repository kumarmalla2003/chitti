// frontend/src/components/ui/ProfileDropdown.jsx

import { useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";

const dropdownVariants = {
  initial: { opacity: 0, scale: 0.95, y: -10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
};

const ProfileDropdown = ({ onClose }) => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <motion.div
      variants={dropdownVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="absolute top-13 md:top-14 right-0 w-56 bg-background-primary rounded-md shadow-lg border border-border z-50 origin-top-right"
    >
      <div className="p-4">
        <h3 className="text-xl font-bold text-center text-text-primary">
          Profile
        </h3>
        <hr className="my-3 border-border" />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-md text-error-accent bg-background-secondary hover:bg-error-bg transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ProfileDropdown;
