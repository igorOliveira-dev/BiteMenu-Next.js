"use client";

import { createContext, useContext, useState } from "react";

const ThemeColorContext = createContext(null);

export function ThemeColorProvider({ children }) {
  const [colors, setColors] = useState(null); // null = usa cor padrão

  return <ThemeColorContext.Provider value={{ colors, setColors }}>{children}</ThemeColorContext.Provider>;
}

export function useThemeColor() {
  const ctx = useContext(ThemeColorContext);
  if (!ctx) throw new Error("useThemeColor precisa estar dentro de ThemeColorProvider");
  return ctx;
}
