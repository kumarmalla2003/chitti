// frontend/src/components/ui/Message.jsx

import { TriangleAlert, CircleCheck, Info, X } from "lucide-react";

const messageConfig = {
  error: {
    bgColor: "bg-error-bg",
    textColor: "text-error-accent",
    borderColor: "border-error-accent",
    icon: <TriangleAlert className="w-5 h-5" />,
  },
  success: {
    bgColor: "bg-success-bg",
    textColor: "text-success-accent",
    borderColor: "border-success-accent",
    icon: <CircleCheck className="w-5 h-5" />,
  },
  warning: {
    bgColor: "bg-warning-bg",
    textColor: "text-warning-accent",
    borderColor: "border-warning-accent",
    icon: <TriangleAlert className="w-5 h-5" />,
  },
  info: {
    bgColor: "bg-info-bg",
    textColor: "text-info-accent",
    borderColor: "border-info-accent",
    icon: <Info className="w-5 h-5" />,
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
        <div className={`text-xs ${config.textColor} opacity-90`}>{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`p-1 rounded-full hover:bg-black/10 cursor-pointer ${config.textColor}`}
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Message;
