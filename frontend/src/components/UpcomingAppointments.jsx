import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, X, Stethoscope, MapPin } from "lucide-react";
import { toast } from "sonner";

const UpcomingAppointments = () => {
  const { token } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [doctorDetails, setDoctorDetails] = useState({});

  useEffect(() => {
    fetchUpcomingAppointments();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUpcomingAppointments, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments/upcoming`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const apts = response.data.upcoming_appointments;
      setAppointments(apts);
      
      // Fetch doctor details for appointments with doctor_id
      const doctorIds = [...new Set(apts.filter(apt => apt.doctor_id).map(apt => apt.doctor_id))];
      const doctorDetailsMap = {};
      
      for (const doctorId of doctorIds) {
        try {
          const docResponse = await axios.get(`${API}/doctors/${doctorId}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          doctorDetailsMap[doctorId] = docResponse.data.profile;
        } catch (error) {
          console.error(`Failed to fetch doctor ${doctorId}:`, error);
        }
      }
      
      setDoctorDetails(doctorDetailsMap);
    } catch (error) {
      console.error("Failed to fetch upcoming appointments", error);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm("Möchten Sie diesen Termin wirklich absagen?")) return;
    
    try {
      await axios.delete(`${API}/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Termin erfolgreich abgesagt");
      fetchUpcomingAppointments(); // Refresh list
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      toast.error("Fehler beim Absagen des Termins");
    }
  };

  if (appointments.length === 0) return null;

  return (
    <Card className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 mb-6" data-testid="upcoming-appointments">
      <div className="flex items-start gap-3">
        <Bell className="w-6 h-6 text-orange-600 flex-shrink-0 animate-pulse" />
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 mb-2">🔔 Anstehende Arzttermine (nächste 2 Tage)</h3>
          <div className="space-y-2">
            {appointments.map(apt => {
              const dateObj = new Date(apt.date + 'T12:00:00');
              const formattedDate = dateObj.toLocaleDateString('de-DE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });

              const doctor = apt.doctor_id ? doctorDetails[apt.doctor_id] : null;
              
              return (
                <div key={apt.id} className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      {doctor ? (
                        <>
                          <div className="flex items-center gap-2 mb-2">
                            <Stethoscope className="w-4 h-4 text-teal-600" />
                            <p className="font-semibold text-gray-800">{doctor.practice_name || doctor.name}</p>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{doctor.specialty}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <MapPin className="w-3 h-3" />
                            <span>{doctor.practice_city || doctor.city}</span>
                          </div>
                        </>
                      ) : (
                        <p className="font-semibold text-gray-800 mb-2">{apt.title}</p>
                      )}
                      <p className="text-sm text-gray-600">{formattedDate}</p>
                      <p className="text-sm text-orange-600 font-semibold">Uhrzeit: {apt.time}</p>
                      {apt.child_name && (
                        <p className="text-sm text-teal-600">👤 {apt.child_name}</p>
                      )}
                      {apt.description && (
                        <p className="text-sm text-gray-500 mt-1">{apt.description}</p>
                      )}
                      {apt.notes && (
                        <p className="text-sm text-gray-500 mt-1">{apt.notes}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleCancelAppointment(apt.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default UpcomingAppointments;