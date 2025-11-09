import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Heart, Pill, Calendar, Activity, ArrowLeft, Plus, Trash2 } from "lucide-react";
import AddMedicationModal from "@/components/AddMedicationModal";
import AddVitalSignsModal from "@/components/AddVitalSignsModal";
import TakeMedicationButton from "@/components/TakeMedicationButton";
import YearlyCalendar from "@/components/YearlyCalendar";

const ChildDashboardPage = () => {
  const navigate = useNavigate();
  const { childId } = useParams();
  const { token } = useContext(AuthContext);
  const [child, setChild] = useState(null);
  const [medications, setMedications] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vitalSigns, setVitalSigns] = useState([]);
  
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);

  useEffect(() => {
    fetchChildDashboard();
  }, [childId]);

  const fetchChildDashboard = async () => {
    try {
      const response = await axios.get(`${API}/children/${childId}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChild(response.data.child);
      setMedications(response.data.medications);
      setAppointments(response.data.appointments);
      setVitalSigns(response.data.vital_signs);
    } catch (error) {
      console.error("Failed to fetch child dashboard", error);
      toast.error("Fehler beim Laden der Daten");
    }
  };

  if (!child) {
    return <div className="min-h-screen flex items-center justify-center">Laden...</div>;
  }

  const MedicationCard = ({ medication, onTaken }) => {
    const getStockColor = (stock) => {
      if (stock <= 1) return "text-red-600";
      if (stock <= 3) return "text-orange-600";
      if (stock <= 5) return "text-yellow-600";
      return "text-green-600";
    };

    const getStockWarning = (stock) => {
      if (stock <= 1) return "Kritisch! Nur noch 1 Tablette!";
      if (stock <= 3) return "Achtung! Nur noch 3 Tabletten!";
      if (stock <= 5) return "Hinweis: Nur noch 5 Tabletten!";
      return null;
    };

    const warning = getStockWarning(medication.stock);

    return (
      <div className="bg-gradient-to-br from-white to-teal-50 border border-teal-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-800">{medication.name}</h3>
          <TakeMedicationButton medication={medication} onSuccess={onTaken} />
        </div>
        
        <p className="text-sm text-gray-600 mb-1">Dosierung: {medication.dosage}</p>
        <p className="text-sm text-gray-600 mb-1">Häufigkeit: {medication.frequency}</p>
        
        {medication.frequency_times && medication.frequency_times.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 mb-2">
            {medication.frequency_times.map(time => (
              <span key={time} className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                {time}
              </span>
            ))}
          </div>
        )}
        
        <p className={`text-sm font-semibold ${getStockColor(medication.stock)}`}>
          Vorrat: {medication.stock} Stück
        </p>
        
        {warning && (
          <div className={`mt-2 p-2 rounded-lg text-xs font-semibold ${
            medication.stock <= 1 ? 'bg-red-100 text-red-700' :
            medication.stock <= 3 ? 'bg-orange-100 text-orange-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {warning}
          </div>
        )}
        
        <p className="text-xs text-gray-500 mt-2">Ablauf: {medication.expiry_date}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20" data-testid="child-dashboard-page">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-teal-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="flex items-center gap-2"
              data-testid="back-to-parent-dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {child.first_name} {child.last_name}
              </h1>
              <p className="text-sm text-gray-600">Geboren: {child.birthdate}</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="medications" className="space-y-6">
          <TabsList className="bg-white border border-teal-100 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="medications" data-testid="child-tab-medications" className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Medikamente
            </TabsTrigger>
            <TabsTrigger value="appointments" data-testid="child-tab-appointments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Termine
            </TabsTrigger>
            <TabsTrigger value="vitals" data-testid="child-tab-vitals" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Vitalwerte
            </TabsTrigger>
            <TabsTrigger value="schedule" data-testid="child-tab-schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Kalender
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medications" data-testid="child-medications-content">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Medikamente</h2>
                <Button
                  data-testid="child-add-medication-btn"
                  onClick={() => setShowMedicationModal(true)}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                  Medikament hinzufügen
                </Button>
              </div>
              
              {medications.length === 0 ? (
                <div className="text-center py-12">
                  <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Noch keine Medikamente hinzugefügt</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {medications.map(med => (
                    <MedicationCard key={med.id} medication={med} onTaken={fetchChildDashboard} />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="appointments" data-testid="child-appointments-content">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Termine</h2>
                <Button
                  data-testid="child-add-appointment-btn"
                  onClick={() => setShowAppointmentModal(true)}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                  Termin hinzufügen
                </Button>
              </div>
              
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Noch keine Termine eingetragen</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map(apt => (
                    <div key={apt.id} className="bg-gradient-to-r from-white to-teal-50 border border-teal-100 rounded-xl p-4">
                      <p className="font-bold text-gray-800">{apt.appointment_date}</p>
                      <p className="text-sm text-gray-600">{apt.appointment_time}</p>
                      {apt.notes && <p className="text-sm text-gray-500 mt-2">{apt.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="vitals" data-testid="child-vitals-content">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Vitalwerte</h2>
                <Button
                  data-testid="child-add-vital-signs-btn"
                  onClick={() => setShowVitalSignsModal(true)}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                  Werte hinzufügen
                </Button>
              </div>
              
              {vitalSigns.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Noch keine Vitalwerte erfasst</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vitalSigns.map(vital => (
                    <div key={vital.id} className="bg-gradient-to-r from-white to-cyan-50 border border-cyan-100 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-2">{new Date(vital.recorded_at).toLocaleString('de-DE')}</p>
                      <div className="grid grid-cols-2 gap-4">
                        {vital.pulse && (
                          <div>
                            <p className="text-xs text-gray-500">Puls</p>
                            <p className="font-bold text-teal-600">{vital.pulse} bpm</p>
                          </div>
                        )}
                        {vital.blood_pressure && (
                          <div>
                            <p className="text-xs text-gray-500">Blutdruck</p>
                            <p className="font-bold text-teal-600">{vital.blood_pressure}</p>
                          </div>
                        )}
                        {vital.temperature && (
                          <div>
                            <p className="text-xs text-gray-500">Temperatur</p>
                            <p className="font-bold text-teal-600">{vital.temperature}°C</p>
                          </div>
                        )}
                        {vital.weight && (
                          <div>
                            <p className="text-xs text-gray-500">Gewicht</p>
                            <p className="font-bold text-teal-600">{vital.weight} kg</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="schedule" data-testid="child-schedule-content">
            <YearlyCalendar selectedChild={childId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <AddMedicationModal
        open={showMedicationModal}
        onClose={() => setShowMedicationModal(false)}
        onSuccess={fetchChildDashboard}
        childId={childId}
      />
      <AddAppointmentModal
        open={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSuccess={fetchChildDashboard}
        childId={childId}
      />
      <AddVitalSignsModal
        open={showVitalSignsModal}
        onClose={() => setShowVitalSignsModal(false)}
        onSuccess={fetchChildDashboard}
        childId={childId}
      />
    </div>
  );
};

export default ChildDashboardPage;