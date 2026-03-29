import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("smart_jobs_token");

  const setSession = (tokenValue, userValue) => {
    localStorage.setItem("smart_jobs_token", tokenValue);
    setUser(userValue);
  };

  const clearSession = () => {
    localStorage.removeItem("smart_jobs_token");
    setUser(null);
  };

  const fetchMe = useCallback(async () => {
    if (!localStorage.getItem("smart_jobs_token")) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (_error) {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (payload) => {
    const { data } = await api.post("/auth/login", payload);
    setSession(data.token, data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    // No auto-login — user must verify their Gmail first
    return data;
  };

  const loginWithData = (tokenValue, userData) => {
    setSession(tokenValue, userData);
  };

  const logout = () => clearSession();

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      loginWithData,
      refreshUser: fetchMe,
      isAuthenticated: Boolean(user)
    }),
    [user, token, loading, fetchMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
