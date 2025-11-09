import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";
import { toast } from "sonner";

const DoctorLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      const { token, user } = response.data;

      // Verify user is a doctor
      if (user.user_type !== "doctor") {
        toast.error("Diese Anmeldung ist nur für Ärzte. Bitte nutzen Sie die normale Anmeldung.");
        setLoading(false);
        return;
      }

      login(token, user);
      toast.success("Erfolgreich angemeldet!");
      navigate("/doctor-dashboard");
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.detail || "Anmeldung fehlgeschlagen";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      {/* Header */}
      <nav className="backdrop-blur-xl bg-white/70 border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-teal-500" fill="currentColor" />
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              HealthLink
            </span>
          </Link>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/doctor-register")}
              className="text-teal-700 hover:text-teal-800 hover:bg-teal-50"
            >
              Registrieren
            </Button>
          </div>
        </div>
      </nav>

      {/* Login Form */}
      <div className="max-w-md mx-auto px-6 py-20">
        <div className="bg-white rounded-2xl shadow-xl border border-teal-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Arzt Anmeldung
              </span>
            </h1>
            <p className="text-gray-600">
              Melden Sie sich mit Ihren Praxis-Zugangsdaten an
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Praxis-Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="praxis@beispiel.de"
                className="border-teal-200 focus:border-teal-500"
              />
            </div>

            <div>
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="border-teal-200 focus:border-teal-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 text-lg rounded-full shadow-lg mt-6"
            >
              {loading ? "Anmeldung läuft..." : "Anmelden"}
            </Button>
          </form>

          <div className="text-center mt-6 space-y-3">
            <p className="text-gray-600">
              Noch nicht registriert?{" "}
              <button
                onClick={() => navigate("/doctor-register")}
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                Praxis registrieren
              </button>
            </p>
            <p className="text-gray-600">
              <button
                onClick={() => navigate("/login")}
                className="text-gray-500 hover:text-gray-700"
              >
                Zur normalen Anmeldung
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorLoginPage;
