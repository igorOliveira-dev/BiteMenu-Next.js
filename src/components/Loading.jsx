import React from "react";

const Loading = () => {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="w-8 h-8 border-4 -rotate-45 border-[#d42020] border-t-transparent rounded-full animate-[spin_1s_cubic-bezier(0.3,0,0.5,1)_infinite]"></div>
    </div>
  );
};

export default Loading;
