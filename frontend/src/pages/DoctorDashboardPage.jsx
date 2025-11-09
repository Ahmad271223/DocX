import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Users, Clock, Plane, Settings, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import DoctorAvailabilityManager from "@/components/DoctorAvailabilityManager";
import DoctorVacationManager from "@/components/DoctorVacationManager";

const DoctorDashboardPage = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user || user.user_type !== "doctor") {
      navigate("/doctor-login");
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/doctors/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
      if (error.response?.status === 404) {
        // No profile yet - redirect to profile creation
        navigate("/doctor-profile-setup");
      } else {
        toast.error("Dashboard konnte nicht geladen werden");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Erfolgreich abgemeldet");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { profile, today_appointments, patient_count, availability, upcoming_vacations } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      {/* Header */}
      <nav className="backdrop-blur-xl bg-white/70 border-b border-teal-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Heart className="w-8 h-8 text-teal-500" fill="currentColor" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">{profile.practice_name}</h1>
              <p className="text-sm text-gray-600">{profile.specialty}</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-teal-600"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Calendar className="w-8 h-8" />}
            title="Heutige Termine"
            value={today_appointments.length}
            color="teal"
          />
          <StatCard
            icon={<Users className="w-8 h-8" />}
            title="Patienten"
            value={patient_count}
            color="emerald"
          />
          <StatCard
            icon={<Plane className="w-8 h-8" />}
            title="Urlaube geplant"
            value={upcoming_vacations.length}
            color="cyan"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-teal-100 overflow-hidden">
          <div className="border-b border-teal-100">
            <div className="flex overflow-x-auto">
              <TabButton
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
                icon={<Calendar className="w-5 h-5" />}
                label="Übersicht"
              />
              <TabButton
                active={activeTab === "patients"}
                onClick={() => setActiveTab("patients")}
                icon={<Users className="w-5 h-5" />}
                label="Patienten"
              />
              <TabButton
                active={activeTab === "availability"}
                onClick={() => setActiveTab("availability")}
                icon={<Clock className="w-5 h-5" />}
                label="Verfügbarkeit"
              />
              <TabButton
                active={activeTab === "vacation"}
                onClick={() => setActiveTab("vacation")}
                icon={<Plane className="w-5 h-5" />}
                label="Urlaub"
              />
            </div>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <OverviewTab
                todayAppointments={today_appointments}
                upcomingVacations={upcoming_vacations}
              />
            )}
            {activeTab === "patients" && <PatientsTab token={token} />}
            {activeTab === "availability" && (
              <DoctorAvailabilityManager token={token} doctorId={profile.id} onUpdate={fetchDashboardData} />
            )}
            {activeTab === "vacation" && (
              <DoctorVacationManager token={token} doctorId={profile.id} onUpdate={fetchDashboardData} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => {
  const colors = {
    teal: "from-teal-500 to-teal-600",
    emerald: "from-emerald-500 to-emerald-600",
    cyan: "from-cyan-500 to-cyan-600",
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6">
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
        active
          ? "text-teal-600 border-b-2 border-teal-600 bg-teal-50/50"
          : "text-gray-600 hover:text-teal-600 hover:bg-teal-50/30"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const OverviewTab = ({ todayAppointments, upcomingVacations }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Heutige Termine</h2>
        {todayAppointments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Keine Termine für heute</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800">{apt.patient_name}</p>
                  <p className="text-sm text-gray-600">{apt.patient_email}</p>
                  {apt.notes && <p className="text-sm text-gray-500 mt-1">{apt.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-teal-600">{apt.appointment_time}</p>
                  <p className="text-sm text-gray-500">{apt.appointment_date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {upcomingVacations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Kommende Urlaubszeiten</h2>
          <div className="space-y-3">
            {upcomingVacations.map((vacation) => (
              <div
                key={vacation.id}
                className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800">Urlaub</p>
                  {vacation.reason && <p className="text-sm text-gray-600">{vacation.reason}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {vacation.start_date} bis {vacation.end_date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PatientsTab = ({ token }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API}/doctors/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(response.data.patients);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      toast.error("Patienten konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lädt Patienten...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Meine Patienten</h2>
      {patients.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Noch keine Patienten abonniert</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {patients.map((item) => (
            <div
              key={item.subscription_id}
              className="bg-white border border-teal-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-800">
                    {item.patient.first_name} {item.patient.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{item.patient.email}</p>
                  {item.patient.birthdate && (
                    <p className="text-sm text-gray-500">Geb.: {item.patient.birthdate}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Abonniert seit: {new Date(item.subscribed_at).toLocaleDateString("de-DE")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorDashboardPage;
