import Image from "next/image";
import React from "react";

const CusImg = ({ url, alt, width, height }) => {
  return <Image height={height || 318} width={width || 566} src={url} alt={alt} className="my-4 rounded-lg" />;
};

export default CusImg;
