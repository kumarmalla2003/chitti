// frontend/src/components/ui/Message.jsx

import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

const messageConfig = {
  error: {
    bgColor: "bg-error-bg",
    textColor: "text-error-text",
    borderColor: "border-error-border",
    icon: <FiAlertTriangle />,
  },
  success: {
    bgColor: "bg-success-bg",
    textColor: "text-success-text",
    borderColor: "border-success-border",
    icon: <FiCheckCircle />,
  },
  warning: {
    bgColor: "bg-warning-bg",
    textColor: "text-warning-text",
    borderColor: "border-warning-border",
    icon: <FiAlertTriangle />,
  },
  info: {
    bgColor: "bg-info-bg",
    textColor: "text-info-text",
    borderColor: "border-info-border",
    icon: <FiInfo />,
  },
};

const Message = ({ type = "info", title, children, onClose }) => {
  const config = messageConfig[type] || messageConfig.info;

  return (
    <div
      className={`px-4 py-3 mb-4 rounded-md shadow-md flex items-center gap-3 border-l-4 ${config.bgColor} ${config.borderColor}`}
      role="alert"
    >
      <div className={`flex-shrink-0 text-xl ${config.textColor}`}>
        {config.icon}
      </div>
      <div className="flex-grow">
        <p className={`font-semibold text-sm ${config.textColor}`}>{title}</p>
        <p className={`text-xs ${config.textColor} opacity-90`}>{children}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`p-1 rounded-full hover:bg-black/10 ${config.textColor}`}
          aria-label="Close"
        >
          <FiX className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Message;
