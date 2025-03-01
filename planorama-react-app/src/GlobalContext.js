import React, { createContext, useContext, useState } from "react";

// Create Context
const GlobalContext = createContext();

// Context Provider
export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState("Guest");

  return (
    <GlobalContext.Provider value={{ user, setUser }}>
      {children}
    </GlobalContext.Provider>
  );
};

// Hook to use the context
export const useGlobal = () => useContext(GlobalContext);
