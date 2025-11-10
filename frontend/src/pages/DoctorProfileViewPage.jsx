import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, MapPin, Phone, Mail, Calendar, Clock, User, Plane, Navigation } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

const DoctorProfileViewPage = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const { token } = useContext(AuthContext);
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctorData();
    checkSubscription();
  }, [doctorId]);

  const fetchDoctorData = async () => {
    try {
      const [profileRes, availRes, vacationRes] = await Promise.all([
        axios.get(`${API}/doctors/${doctorId}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/doctors/${doctorId}/availability`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/doctors/${doctorId}/vacation`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setDoctor(profileRes.data.profile);
      setAvailability(availRes.data.availability);
      setVacations(vacationRes.data.vacations);
    } catch (error) {
      console.error("Failed to fetch doctor data:", error);
      toast.error("Arztdaten konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const response = await axios.get(`${API}/doctors/my-subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subscribed = response.data.subscriptions.some(
        (sub) => sub.doctor.id === doctorId
      );
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error("Failed to check subscription:", error);
    }
  };

  const handleSubscribe = async () => {
    try {
      await axios.post(`${API}/doctors/${doctorId}/subscribe`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Erfolgreich beim Arzt angemeldet!");
      setIsSubscribed(true);
    } catch (error) {
      console.error("Failed to subscribe:", error);
      toast.error(error.response?.data?.detail || "Anmeldung fehlgeschlagen");
    }
  };

  const openNavigation = () => {
    const address = `${doctor.practice_address}, ${doctor.practice_postal_code} ${doctor.practice_city}`;
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return null;
  }

  // Filter upcoming vacations
  const upcomingVacations = vacations.filter(
    (v) => new Date(v.end_date) >= new Date()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      {/* Header */}
      <nav className="backdrop-blur-xl bg-white/70 border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/doctor-search")}
            className="text-gray-600 hover:text-teal-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Heart className="w-8 h-8 text-teal-500" fill="currentColor" />
          <h1 className="text-xl font-bold text-gray-800">Arztprofil</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Doctor Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-teal-100 overflow-hidden mb-6">
          {/* Header with Image */}
          <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-8 text-white">
            <div className="flex items-start gap-6">
              {doctor.profile_image ? (
                <img
                  src={doctor.profile_image}
                  alt={doctor.practice_name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{doctor.practice_name}</h2>
                <p className="text-teal-100 text-lg mb-4">{doctor.specialty}</p>
                {doctor.doctor_names && doctor.doctor_names.length > 0 && (
                  <div className="bg-white/20 rounded-lg p-3 inline-block">
                    <p className="text-sm font-semibold mb-1">Ärzte in der Praxis:</p>
                    {doctor.doctor_names.map((name, idx) => (
                      <p key={idx} className="text-sm">• {name}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-6 border-b border-teal-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Kontakt & Adresse</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-800">{doctor.practice_address}</p>
                  <p className="text-gray-800">{doctor.practice_postal_code} {doctor.practice_city}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-teal-600" />
                <a href={`tel:${doctor.practice_phone}`} className="text-teal-600 hover:text-teal-700">
                  {doctor.practice_phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-teal-600" />
                <a href={`mailto:${doctor.practice_email}`} className="text-teal-600 hover:text-teal-700">
                  {doctor.practice_email}
                </a>
              </div>
              <Button
                onClick={openNavigation}
                className="mt-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Navigation öffnen
              </Button>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="p-6 border-b border-teal-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Öffnungszeiten
            </h3>
            {availability.length === 0 ? (
              <p className="text-gray-500">Keine Öffnungszeiten angegeben</p>
            ) : (
              <div className="space-y-3">
                {availability
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map((avail) => (
                    <div key={avail.id} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-gray-800 w-32">
                        {DAYS[avail.day_of_week]}
                      </span>
                      <div className="flex-1">
                        {avail.break_start && avail.break_end ? (
                          <>
                            <p className="text-gray-700">
                              {avail.start_time} - {avail.break_start} Uhr
                            </p>
                            <p className="text-gray-700">
                              {avail.break_end} - {avail.end_time} Uhr
                            </p>
                            <p className="text-sm text-orange-600">
                              Mittagspause: {avail.break_start} - {avail.break_end} Uhr
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-700">
                            {avail.start_time} - {avail.end_time} Uhr
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Vacations */}
          {upcomingVacations.length > 0 && (
            <div className="p-6 bg-orange-50">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Urlaubszeiten
              </h3>
              <div className="space-y-2">
                {upcomingVacations.map((vacation) => (
                  <div key={vacation.id} className="bg-white rounded-lg p-3 border border-orange-200">
                    <p className="font-semibold text-gray-800">
                      {new Date(vacation.start_date).toLocaleDateString("de-DE")} - {new Date(vacation.end_date).toLocaleDateString("de-DE")}
                    </p>
                    {vacation.reason && (
                      <p className="text-sm text-gray-600">{vacation.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {isSubscribed ? (
            <Button
              onClick={() => navigate(`/book-appointment/${doctorId}`)}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 text-lg rounded-2xl shadow-xl"
            >
              <Calendar className="w-6 h-6 mr-2" />
              Termin buchen
            </Button>
          ) : (
            <Button
              onClick={handleSubscribe}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 text-lg rounded-2xl shadow-xl"
            >
              Beim Arzt anmelden
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorProfileViewPage;
