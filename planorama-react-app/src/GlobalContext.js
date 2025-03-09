import React, { createContext, useContext, useState, useEffect } from "react";
import axios from 'axios';

// Create Context
const GlobalContext = createContext();

// Context Provider
export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState("Guest");

  useEffect(() => {
    axios.get("http://127.0.0.1:5000/update-user")
      .then(response => {
        setUser(response.data);
      })
  }, []);

  return (
    <GlobalContext.Provider value={{ user, setUser }}>
      {children}
    </GlobalContext.Provider>
  );
};

// Hook to use the context
export const useGlobal = () => useContext(GlobalContext);
