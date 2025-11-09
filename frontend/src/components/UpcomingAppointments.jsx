import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

const UpcomingAppointments = () => {
  const { token } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);

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
      setAppointments(response.data.upcoming_appointments);
    } catch (error) {
      console.error("Failed to fetch upcoming appointments", error);
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

              return (
                <div key={apt.id} className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{apt.title}</p>
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