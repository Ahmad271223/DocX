import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Calendar } from "lucide-react";
import { toast } from "sonner";

const FamilyMemberAppointmentsPage = () => {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const { token } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [memberId]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/family/member/${memberId}/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      toast.error("Termine konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      <nav className="backdrop-blur-xl bg-white/70 border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/family-connections")}
            className="text-gray-600 hover:text-teal-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Heart className="w-8 h-8 text-teal-500" fill="currentColor" />
          <h1 className="text-xl font-bold text-gray-800">Termine</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Keine Termine vorhanden</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments
              .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
              .map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6 flex justify-between items-center"
                >
                  <div>
                    <p className="text-lg font-semibold text-gray-800">Arzttermin</p>
                    {apt.notes && <p className="text-gray-600">{apt.notes}</p>}
                    {apt.is_recurring && (
                      <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Wiederkehrend (alle {apt.recurrence_interval_weeks} Wochen)
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-teal-600">{apt.appointment_time} Uhr</p>
                    <p className="text-gray-600">
                      {new Date(apt.appointment_date).toLocaleDateString("de-DE", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${
                      apt.status === "scheduled" ? "bg-green-100 text-green-700" :
                      apt.status === "completed" ? "bg-gray-100 text-gray-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {apt.status === "scheduled" ? "Geplant" :
                       apt.status === "completed" ? "Abgeschlossen" : "Abgesagt"}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyMemberAppointmentsPage;
