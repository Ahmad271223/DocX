import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import "@/App.css";
import RegisterPage from "@/pages/RegisterPage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ChildDashboardPage from "@/pages/ChildDashboardPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentCancelPage from "@/pages/PaymentCancelPage";
import LandingPage from "@/pages/LandingPage";
import DoctorRegisterPage from "@/pages/DoctorRegisterPage";
import DoctorLoginPage from "@/pages/DoctorLoginPage";
import DoctorDashboardPage from "@/pages/DoctorDashboardPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const AuthContext = React.createContext();

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user", error);
      logout();
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <RegisterPage />} />
          <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/dashboard" element={token ? <DashboardPage /> : <Navigate to="/login" />} />
          <Route path="/child/:childId" element={token ? <ChildDashboardPage /> : <Navigate to="/login" />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-cancel" element={<PaymentCancelPage />} />
          
          {/* Doctor Routes */}
          <Route path="/doctor-register" element={token && user?.user_type === "doctor" ? <Navigate to="/doctor-dashboard" /> : <DoctorRegisterPage />} />
          <Route path="/doctor-login" element={token && user?.user_type === "doctor" ? <Navigate to="/doctor-dashboard" /> : <DoctorLoginPage />} />
          <Route path="/doctor-dashboard" element={token && user?.user_type === "doctor" ? <DoctorDashboardPage /> : <Navigate to="/doctor-login" />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthContext.Provider>
  );
}

export default App;