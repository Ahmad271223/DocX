import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      toast.success("Anmeldung erfolgreich!");
      login(response.data.token, response.data.user);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Anmeldung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-10 h-10 text-teal-500" fill="currentColor" />
            <span className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              HealthLink
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Willkommen zurück</h1>
          <p className="text-gray-600">Melden Sie sich in Ihrem Konto an</p>
        </div>

        <Card className="p-8 shadow-2xl border-teal-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                name="email"
                data-testid="login-email-input"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="max@beispiel.de"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                name="password"
                data-testid="login-password-input"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Ihr Passwort"
                className="mt-2"
              />
            </div>
            <Button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 text-lg rounded-full shadow-lg"
            >
              {loading ? "Wird angemeldet..." : "Anmelden"}
            </Button>
          </form>
        </Card>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Noch kein Konto?{" "}
            <button
              data-testid="link-to-register"
              onClick={() => navigate("/register")}
              className="text-teal-600 hover:text-teal-700 font-semibold"
            >
              Jetzt registrieren
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;