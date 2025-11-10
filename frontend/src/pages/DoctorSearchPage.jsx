import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Search, MapPin, Stethoscope, Calendar, LogOut, Home } from "lucide-react";
import { toast } from "sonner";

const DoctorSearchPage = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState({
    specialty: "",
    city: "",
  });

  useEffect(() => {
    if (!user || user.user_type === "doctor") {
      navigate("/dashboard");
      return;
    }
    fetchDoctors();
    fetchMySubscriptions();
  }, [user, navigate]);

  const fetchDoctors = async () => {
    try {
      const params = new URLSearchParams();
      if (searchFilters.specialty) params.append("specialty", searchFilters.specialty);
      if (searchFilters.city) params.append("city", searchFilters.city);

      const response = await axios.get(`${API}/doctors/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      toast.error("Ärzte konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubscriptions = async () => {
    try {
      const response = await axios.get(`${API}/doctors/my-subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMySubscriptions(response.data.subscriptions);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    }
  };

  const handleSubscribe = async (doctorId) => {
    try {
      await axios.post(`${API}/doctors/${doctorId}/subscribe`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Erfolgreich beim Arzt angemeldet!");
      fetchMySubscriptions();
    } catch (error) {
      console.error("Failed to subscribe:", error);
      const errorMessage = error.response?.data?.detail || "Anmeldung fehlgeschlagen";
      toast.error(errorMessage);
    }
  };

  const handleUnsubscribe = async (subscriptionId) => {
    if (!confirm("Möchten Sie die Anmeldung wirklich beenden?")) return;

    try {
      await axios.delete(`${API}/doctors/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Anmeldung beendet");
      fetchMySubscriptions();
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      toast.error("Fehler beim Abmelden");
    }
  };

  const isSubscribed = (doctorId) => {
    return mySubscriptions.some(sub => sub.doctor.id === doctorId);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchDoctors();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt Ärzte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      {/* Header */}
      <nav className="backdrop-blur-xl bg-white/70 border-b border-teal-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Heart className="w-8 h-8 text-teal-500" fill="currentColor" />
            <h1 className="text-xl font-bold text-gray-800">Ärzte suchen</h1>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="text-gray-600 hover:text-teal-600"
            >
              <Home className="w-5 h-5 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-xl border border-teal-100 p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Fachgebiet (z.B. Allgemeinmedizin, Kardiologie)"
                value={searchFilters.specialty}
                onChange={(e) => setSearchFilters({ ...searchFilters, specialty: e.target.value })}
                className="border-teal-200"
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Stadt"
                value={searchFilters.city}
                onChange={(e) => setSearchFilters({ ...searchFilters, city: e.target.value })}
                className="border-teal-200"
              />
            </div>
            <Button
              type="submit"
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
            >
              <Search className="w-5 h-5 mr-2" />
              Suchen
            </Button>
          </form>
        </div>

        {/* My Subscriptions */}
        {mySubscriptions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Meine Ärzte</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mySubscriptions.map((sub) => (
                <DoctorCard
                  key={sub.subscription_id}
                  doctor={sub.doctor}
                  subscribed={true}
                  subscriptionId={sub.subscription_id}
                  onUnsubscribe={handleUnsubscribe}
                  onBookAppointment={(doctorId) => navigate(`/book-appointment/${doctorId}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {searchFilters.specialty || searchFilters.city ? "Suchergebnisse" : "Alle Ärzte"}
          </h2>
          {doctors.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-12 text-center">
              <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Keine Ärzte gefunden</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  subscribed={isSubscribed(doctor.id)}
                  onSubscribe={handleSubscribe}
                  onBookAppointment={(doctorId) => navigate(`/book-appointment/${doctorId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DoctorCard = ({ doctor, subscribed, subscriptionId, onSubscribe, onUnsubscribe, onBookAppointment }) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6 hover:shadow-xl transition-shadow">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-1">
          {doctor.practice_name || doctor.name}
        </h3>
        <div className="flex items-center gap-2 text-teal-600 mb-2">
          <Stethoscope className="w-4 h-4" />
          <span className="text-sm font-medium">{doctor.specialty}</span>
        </div>
        <div className="flex items-start gap-2 text-gray-600">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p>{doctor.practice_address || doctor.address}</p>
            <p>{doctor.practice_postal_code || doctor.postal_code} {doctor.practice_city || doctor.city}</p>
          </div>
        </div>
      </div>

      {doctor.doctor_names && doctor.doctor_names.length > 0 && (
        <div className="mb-4 p-3 bg-teal-50 rounded-lg">
          <p className="text-xs font-semibold text-teal-700 mb-1">Ärzte in der Praxis:</p>
          {doctor.doctor_names.map((name, idx) => (
            <p key={idx} className="text-sm text-gray-700">• {name}</p>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Button
          onClick={() => navigate(`/doctor-profile/${doctor.id}`)}
          variant="outline"
          className="w-full border-teal-200 text-teal-700 hover:bg-teal-50"
        >
          Profil ansehen
        </Button>
        {subscribed ? (
          <>
            <Button
              onClick={() => onBookAppointment(doctor.id)}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Termin buchen
            </Button>
            <Button
              variant="outline"
              onClick={() => onUnsubscribe(subscriptionId)}
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
            >
              Anmeldung beenden
            </Button>
          </>
        ) : (
          <Button
            onClick={() => onSubscribe(doctor.id)}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
          >
            Beim Arzt anmelden
          </Button>
        )}
      </div>
    </div>
  );
};

export default DoctorSearchPage;
