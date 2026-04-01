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
const TOKEN_KEY = "smart_jobs_token";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const setSession = useCallback((tokenValue, userValue) => {
    localStorage.setItem(TOKEN_KEY, tokenValue);
    setToken(tokenValue);
    setUser(userValue);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    if (!token) {
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
  }, [clearSession, token]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(
    async (payload) => {
      const { data } = await api.post("/auth/login", payload);
      setSession(data.token, data.user);
      return data;
    },
    [setSession]
  );

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data;
  }, []);

  const loginWithData = useCallback(
    (tokenValue, userData) => {
      setSession(tokenValue, userData);
    },
    [setSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

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
    [user, token, loading, login, register, logout, loginWithData, fetchMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
