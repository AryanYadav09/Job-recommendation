import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("smart_jobs_theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("smart_jobs_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("smart_jobs_theme", "light");
    }
  }, [darkMode]);

  const value = useMemo(
    () => ({
      darkMode,
      toggleTheme: () => setDarkMode((prev) => !prev)
    }),
    [darkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
};
