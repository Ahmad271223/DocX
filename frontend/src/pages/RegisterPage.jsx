import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, ArrowLeft, ArrowRight } from "lucide-react";
import { useContext } from "react";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    birthdate: "",
    state: "",
    city: "",
    address: "",
    postal_code: "",
    email: "",
    password: "",
    confirm_password: "",
    num_children: 0
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChildrenChange = (increment) => {
    setFormData(prev => ({
      ...prev,
      num_children: Math.max(0, prev.num_children + increment)
    }));
  };

  const calculateTotal = () => {
    const adultPrice = 2.99;
    const childPrice = 1.99;
    return (adultPrice + (childPrice * formData.num_children)).toFixed(2);
  };

  const validateStep1 = () => {
    if (!formData.first_name || !formData.last_name || !formData.birthdate) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.state || !formData.city || !formData.address || !formData.postal_code) {
      toast.error("Bitte füllen Sie alle Adressfelder aus");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.email || !formData.password || !formData.confirm_password) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return false;
    }
    if (formData.password !== formData.confirm_password) {
      toast.error("Passwörter stimmen nicht überein");
      return false;
    }
    if (formData.password.length < 6) {
      toast.error("Passwort muss mindestens 6 Zeichen lang sein");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      toast.success("Registrierung erfolgreich!");
      login(response.data.token, response.data.user);
      
      // Redirect to payment
      const checkoutResponse = await axios.post(`${API}/payment/create-checkout`, {
        origin_url: window.location.origin,
        num_children: formData.num_children,
        user_email: formData.email
      });
      
      window.location.href = checkoutResponse.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registrierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-10 h-10 text-teal-500" fill="currentColor" />
            <span className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              HealthLink
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Registrierung</h1>
          <p className="text-gray-600">Schritt {step} von 4</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <Card className="p-8 shadow-2xl border-teal-100">
          {step === 1 && (
            <div className="space-y-6" data-testid="register-step-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Persönliche Informationen</h2>
              <div>
                <Label htmlFor="first_name">Vorname</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  data-testid="input-first-name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Max"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nachname</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  data-testid="input-last-name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Mustermann"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="birthdate">Geburtsdatum</Label>
                <Input
                  id="birthdate"
                  name="birthdate"
                  data-testid="input-birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={handleChange}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6" data-testid="register-step-2">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Adresse</h2>
              <div>
                <Label htmlFor="state">Bundesland</Label>
                <Input
                  id="state"
                  name="state"
                  data-testid="input-state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Berlin"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  name="city"
                  data-testid="input-city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Berlin"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="address">Straße und Hausnummer</Label>
                <Input
                  id="address"
                  name="address"
                  data-testid="input-address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Hauptstraße 123"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Postleitzahl</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  data-testid="input-postal-code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  placeholder="10115"
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6" data-testid="register-step-3">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Zugangsdaten</h2>
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  name="email"
                  data-testid="input-email"
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
                  data-testid="input-password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mindestens 6 Zeichen"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="confirm_password">Passwort bestätigen</Label>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  data-testid="input-confirm-password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Passwort wiederholen"
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6" data-testid="register-step-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Abo-Auswahl</h2>
              
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 mb-6">
                <div className="text-center mb-6">
                  <p className="text-gray-700 font-semibold mb-2">Erwachsener (ab 18 Jahre)</p>
                  <p className="text-3xl font-bold text-teal-600">2,99 €</p>
                  <p className="text-sm text-gray-600">pro Monat</p>
                </div>
                
                <div className="border-t border-teal-200 pt-6">
                  <p className="text-gray-700 font-semibold mb-4">Kinder hinzufügen (unter 18 Jahre)</p>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <Button
                      data-testid="btn-decrease-children"
                      onClick={() => handleChildrenChange(-1)}
                      variant="outline"
                      className="w-12 h-12 rounded-full text-xl border-teal-300 hover:bg-teal-50"
                    >
                      -
                    </Button>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-teal-600">{formData.num_children}</p>
                      <p className="text-sm text-gray-600">Kinder</p>
                    </div>
                    <Button
                      data-testid="btn-increase-children"
                      onClick={() => handleChildrenChange(1)}
                      variant="outline"
                      className="w-12 h-12 rounded-full text-xl border-teal-300 hover:bg-teal-50"
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-center text-gray-600">à 1,99 € pro Monat</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl p-6 text-center">
                <p className="text-sm mb-2">Monatlicher Gesamtbetrag</p>
                <p className="text-5xl font-bold" data-testid="total-amount">{calculateTotal()} €</p>
                <p className="text-sm mt-2 opacity-90">monatlich, jederzeit kündbar</p>
              </div>

              {formData.num_children > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Hinweis:</strong> Nach der Registrierung können Sie die Namen und Geburtsdaten Ihrer Kinder im Dashboard hinzufügen.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 && (
              <Button
                data-testid="btn-back"
                onClick={handleBack}
                variant="outline"
                className="flex items-center gap-2 border-teal-300 text-teal-700 hover:bg-teal-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </Button>
            )}
            
            {step < 4 ? (
              <Button
                data-testid="btn-next"
                onClick={handleNext}
                className="ml-auto bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-2 px-8 rounded-full"
              >
                Weiter
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                data-testid="btn-submit"
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-8 rounded-full shadow-lg"
              >
                {loading ? "Wird bearbeitet..." : "Zur Zahlung"}
              </Button>
            )}
          </div>
        </Card>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Bereits registriert?{" "}
            <button
              data-testid="link-to-login"
              onClick={() => navigate("/login")}
              className="text-teal-600 hover:text-teal-700 font-semibold"
            >
              Jetzt anmelden
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;