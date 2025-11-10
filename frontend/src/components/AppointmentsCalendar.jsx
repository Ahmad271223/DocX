import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Calendar, Stethoscope, MapPin, X, Clock } from "lucide-react";
import { toast } from "sonner";

const AppointmentsCalendar = () => {
  const { token } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [doctorDetails, setDoctorDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAppointments();
  }, []);

  const fetchAllAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const apts = response.data.appointments || [];
      
      // Sort by date and time
      const sortedApts = apts.sort((a, b) => {
        const dateA = new Date(a.appointment_date + 'T' + a.appointment_time);
        const dateB = new Date(b.appointment_date + 'T' + b.appointment_time);
        return dateA - dateB;
      });
      
      setAppointments(sortedApts);
      
      // Fetch doctor details
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
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm("Möchten Sie diesen Termin wirklich absagen?")) return;
    
    try {
      await axios.delete(`${API}/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Termin erfolgreich abgesagt");
      fetchAllAppointments();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      toast.error("Fehler beim Absagen des Termins");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Lädt Termine...</p>
      </div>
    );
  }

  // Filter upcoming appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingAppointments = appointments.filter(apt => {
    if (apt.status === 'cancelled') return false;
    const aptDate = new Date(apt.appointment_date);
    return aptDate >= today;
  });

  const pastAppointments = appointments.filter(apt => {
    if (apt.status === 'cancelled') return false;
    const aptDate = new Date(apt.appointment_date);
    return aptDate < today;
  });

  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Upcoming Appointments */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          Kommende Termine ({upcomingAppointments.length})
        </h3>
        {upcomingAppointments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Keine kommenden Termine</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                doctor={doctorDetails[apt.doctor_id]}
                onCancel={handleCancelAppointment}
                showCancelButton={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Vergangene Termine ({pastAppointments.length})
          </h3>
          <div className="space-y-3">
            {pastAppointments.slice(0, 5).map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                doctor={doctorDetails[apt.doctor_id]}
                isPast={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled Appointments */}
      {cancelledAppointments.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Abgesagte Termine ({cancelledAppointments.length})
          </h3>
          <div className="space-y-3">
            {cancelledAppointments.slice(0, 3).map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                doctor={doctorDetails[apt.doctor_id]}
                isCancelled={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AppointmentCard = ({ appointment, doctor, onCancel, showCancelButton, isPast, isCancelled }) => {
  const dateObj = new Date(appointment.appointment_date + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('de-DE', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const borderColor = isCancelled ? "border-red-200" : isPast ? "border-gray-200" : "border-teal-200";
  const bgColor = isCancelled ? "bg-red-50" : isPast ? "bg-gray-50" : "bg-white";

  return (
    <div className={`${bgColor} rounded-xl p-4 border ${borderColor} shadow-sm`}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          {doctor ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <p className="font-bold text-gray-800">{doctor.practice_name || doctor.name}</p>
              </div>
              <p className="text-sm text-gray-600 mb-1">{doctor.specialty}</p>
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                <MapPin className="w-4 h-4" />
                <span>{doctor.practice_address}, {doctor.practice_city}</span>
              </div>
            </>
          ) : (
            <p className="font-bold text-gray-800 mb-2">Arzttermin</p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="w-4 h-4 text-gray-600" />
            <p className="text-sm text-gray-700">{formattedDate}</p>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4 text-gray-600" />
            <p className="text-sm font-semibold text-teal-600">{appointment.appointment_time} Uhr</p>
          </div>

          {appointment.child_name && (
            <p className="text-sm text-purple-600 mt-2">👤 {appointment.child_name}</p>
          )}
          
          {appointment.notes && (
            <p className="text-sm text-gray-500 mt-2 italic">{appointment.notes}</p>
          )}

          {appointment.is_recurring && (
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Wiederkehrend (alle {appointment.recurrence_interval_weeks} Wochen)
            </span>
          )}

          {isCancelled && (
            <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              Abgesagt
            </span>
          )}
        </div>
        
        {showCancelButton && !isCancelled && (
          <Button
            onClick={() => onCancel(appointment.id)}
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Absagen
          </Button>
        )}
      </div>
    </div>
  );
};

export default AppointmentsCalendar;
