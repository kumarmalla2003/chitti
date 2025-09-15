import { useDispatch } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { FiLogOut } from "react-icons/fi";

const ProfileDropdown = ({ onClose }) => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    onClose();
  };

  return (
    <div className="absolute top-13 md:top-14 right-0 w-56 bg-background-primary rounded-md shadow-lg border border-border z-50">
      <div className="p-4">
        <h3 className="text-xl font-bold text-center text-text-primary">
          Profile
        </h3>
        <hr className="my-3 border-border" /> {/* Consistent HR */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded-md text-text-primary hover:bg-danger-bg hover:text-danger transition-colors cursor-pointer"
        >
          <FiLogOut className="w-5 h-5 text-danger" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
