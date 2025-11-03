// frontend/src/components/ui/ViewOnlyField.jsx

import React from "react";

const ViewOnlyField = ({ label, value, icon }) => {
  const IconComponent = icon;
  return (
    <div>
      <label className="block text-lg font-medium text-text-secondary mb-1">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {IconComponent && (
            <IconComponent className="w-5 h-5 text-text-secondary" />
          )}
        </span>
        <div className="absolute left-10 h-6 w-px bg-border pointer-events-none"></div>
        <div className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md text-text-primary break-words min-h-[50px] flex items-center">
          {value || "-"}
        </div>
      </div>
    </div>
  );
};

export default ViewOnlyField;
