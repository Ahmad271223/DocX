import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

const DoctorRegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [doctorNames, setDoctorNames] = useState([""]);
  const [licenseDocument, setLicenseDocument] = useState(null);
  
  const [formData, setFormData] = useState({
    practice_name: "",
    practice_address: "",
    practice_city: "",
    practice_postal_code: "",
    practice_phone: "",
    practice_email: "",
    specialty: "",
    license_number: "",
    password: "",
    confirm_password: "",
    // User registration fields
    first_name: "",
    last_name: "",
    birthdate: "",
    state: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDoctorNameChange = (index, value) => {
    const newDoctorNames = [...doctorNames];
    newDoctorNames[index] = value;
    setDoctorNames(newDoctorNames);
  };

  const addDoctorName = () => {
    setDoctorNames([...doctorNames, ""]);
  };

  const removeDoctorName = (index) => {
    if (doctorNames.length > 1) {
      const newDoctorNames = doctorNames.filter((_, i) => i !== index);
      setDoctorNames(newDoctorNames);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setLicenseDocument(reader.result);
      };
      reader.readAsDataURL(file);
      toast.success(`Dokument "${file.name}" hochgeladen`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirm_password) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }

    if (doctorNames.filter(name => name.trim()).length === 0) {
      toast.error("Bitte geben Sie mindestens einen Arztnamen ein");
      return;
    }

    setLoading(true);
    
    try {
      // Step 1: Register user as doctor
      const registerResponse = await axios.post(`${API}/auth/register`, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        birthdate: formData.birthdate,
        state: formData.state,
        city: formData.practice_city,
        address: formData.practice_address,
        postal_code: formData.practice_postal_code,
        email: formData.practice_email,
        password: formData.password,
        user_type: "doctor",
        num_children: 0
      });

      const { token, user } = registerResponse.data;
      
      // Step 2: Create doctor profile
      const profileResponse = await axios.post(
        `${API}/doctors/profile`,
        {
          practice_name: formData.practice_name,
          practice_address: formData.practice_address,
          practice_city: formData.practice_city,
          practice_postal_code: formData.practice_postal_code,
          practice_phone: formData.practice_phone,
          practice_email: formData.practice_email,
          doctor_names: doctorNames.filter(name => name.trim()),
          specialty: formData.specialty,
          license_number: formData.license_number,
          license_document: licenseDocument,
          languages: ["Deutsch"]
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      login(token, user);
      toast.success("Arztpraxis erfolgreich registriert!");
      navigate("/doctor-dashboard");
      
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.detail || "Registrierung fehlgeschlagen";
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
              onClick={() => navigate("/doctor-login")}
              className="text-teal-700 hover:text-teal-800 hover:bg-teal-50"
            >
              Anmelden
            </Button>
          </div>
        </div>
      </nav>

      {/* Registration Form */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-teal-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Arztpraxis registrieren
              </span>
            </h1>
            <p className="text-gray-600">
              Erstellen Sie ein Profil für Ihre Praxis und verwalten Sie Ihre Patienten
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Persönliche Daten des Kontoinhabers */}
            <div className="border-b border-teal-100 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Kontaktperson der Praxis</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">Vorname *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="border-teal-200 focus:border-teal-500"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nachname *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="border-teal-200 focus:border-teal-500"
                  />
                </div>
                <div>
                  <Label htmlFor="birthdate">Geburtsdatum *</Label>
                  <Input
                    id="birthdate"
                    name="birthdate"
                    type="date"
                    value={formData.birthdate}
                    onChange={handleChange}
                    required
                    className="border-teal-200 focus:border-teal-500"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Bundesland *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="z.B. Berlin"
                    className="border-teal-200 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Praxis-Informationen */}
            <div className="border-b border-teal-100 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Praxis-Informationen</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="practice_name">Name der Praxis *</Label>
                  <Input
                    id="practice_name"
                    name="practice_name"
                    value={formData.practice_name}
                    onChange={handleChange}
                    required
                    placeholder="z.B. Hausarztpraxis Dr. Müller"
                    className="border-teal-200 focus:border-teal-500"
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="practice_address">Praxis-Adresse *</Label>
                    <Input
                      id="practice_address"
                      name="practice_address"
                      value={formData.practice_address}
                      onChange={handleChange}
                      required
                      placeholder="Straße und Hausnummer"
                      className="border-teal-200 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="practice_city">Stadt *</Label>
                    <Input
                      id="practice_city"
                      name="practice_city"
                      value={formData.practice_city}
                      onChange={handleChange}
                      required
                      placeholder="Stadt"
                      className="border-teal-200 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="practice_postal_code">PLZ *</Label>
                    <Input
                      id="practice_postal_code"
                      name="practice_postal_code"
                      value={formData.practice_postal_code}
                      onChange={handleChange}
                      required
                      placeholder="12345"
                      className="border-teal-200 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="practice_phone">Telefon *</Label>
                    <Input
                      id="practice_phone"
                      name="practice_phone"
                      type="tel"
                      value={formData.practice_phone}
                      onChange={handleChange}
                      required
                      placeholder="+49 30 12345678"
                      className="border-teal-200 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="practice_email">Praxis-Email *</Label>
                  <Input
                    id="practice_email"
                    name="practice_email"
                    type="email"
                    value={formData.practice_email}
                    onChange={handleChange}
                    required
                    placeholder="praxis@beispiel.de"
                    className="border-teal-200 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Ärzte in der Praxis */}
            <div className="border-b border-teal-100 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Ärzte in der Praxis</h2>
              <div className="space-y-3">
                {doctorNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) => handleDoctorNameChange(index, e.target.value)}
                      placeholder={`Name des ${index + 1}. Arztes/Ärztin`}
                      className="border-teal-200 focus:border-teal-500 flex-1"
                    />
                    {doctorNames.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeDoctorName(index)}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDoctorName}
                  className="w-full border-teal-300 text-teal-700 hover:bg-teal-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Weiteren Arzt hinzufügen
                </Button>
              </div>
            </div>

            {/* Fachgebiet und Lizenz */}
            <div className="border-b border-teal-100 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Fachgebiet & Lizenz</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="specialty">Fachgebiet *</Label>
                  <Input
                    id="specialty"
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    required
                    placeholder="z.B. Allgemeinmedizin, Kardiologie"
                    className="border-teal-200 focus:border-teal-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="license_number">Lizenznummer *</Label>
                  <Input
                    id="license_number"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                    required
                    placeholder="Ihre ärztliche Lizenznummer"
                    className="border-teal-200 focus:border-teal-500"
                  />
                </div>

                <div>
                  <Label htmlFor="license_document">Lizenzdokument (optional)</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="license_document"
                      className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-teal-300 rounded-lg cursor-pointer hover:bg-teal-50 transition-colors"
                    >
                      <Upload className="w-5 h-5 text-teal-600" />
                      <span className="text-teal-700">
                        {licenseDocument ? "Dokument hochgeladen ✓" : "Dokument hochladen"}
                      </span>
                    </label>
                    <input
                      id="license_document"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    PDF, JPG oder PNG (max. 5MB)
                  </p>
                </div>
              </div>
            </div>

            {/* Passwort */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Zugangsdaten</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Passwort *</Label>
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
                <div>
                  <Label htmlFor="confirm_password">Passwort bestätigen *</Label>
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                    className="border-teal-200 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 text-lg rounded-full shadow-lg"
            >
              {loading ? "Registrierung läuft..." : "Praxis registrieren"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Bereits registriert?{" "}
              <button
                onClick={() => navigate("/doctor-login")}
                className="text-teal-600 hover:text-teal-700 font-semibold"
              >
                Hier anmelden
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegisterPage;
