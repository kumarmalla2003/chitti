import React from "react";

const StatsCard = ({ icon: Icon, label, value, subtext, onClick, color = "blue" }) => {
  // Define color schemes
  const colorSchemes = {
    blue: "from-blue-600 to-blue-800",
    purple: "from-purple-600 to-purple-800",
    green: "from-emerald-600 to-emerald-800",
    orange: "from-orange-500 to-orange-700",
    accent: "from-accent to-blue-600", // Default dashboard style
  };

  const gradient = colorSchemes[color] || colorSchemes.blue;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-gradient-to-br ${gradient} p-5 md:p-6 rounded-xl shadow-card text-white flex items-center justify-between min-w-[200px] flex-1 ${
        onClick
          ? "cursor-pointer hover:shadow-floating hover:-translate-y-1 transition-all duration-300"
          : ""
      }`}
    >
      <div className="flex flex-col z-10">
        <p className="text-white/80 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">
          {label}
        </p>
        <p className="text-2xl md:text-3xl font-extrabold tracking-tight">
          {value}
        </p>
        {subtext && (
          <p className="text-white/70 text-xs mt-2 font-medium">
            {subtext}
          </p>
        )}
      </div>
      {Icon && (
        <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner text-white z-10 border border-white/10">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
    </div>
  );
};

export default StatsCard;
