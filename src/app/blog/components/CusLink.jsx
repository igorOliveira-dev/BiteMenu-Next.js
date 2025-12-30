import React from "react";

const CusLink = ({ href, children }) => {
  return (
    <a href={href} className="text-blue-500 hover:text-blue-700 hover:underline transition" target="_blank">
      {children}
    </a>
  );
};

export default CusLink;
