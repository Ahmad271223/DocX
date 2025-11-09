import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Heart, Pill, Calendar, Users, Activity, LogOut, Plus } from "lucide-react";
import AddMedicationModal from "@/components/AddMedicationModal";
import AddChildModal from "@/components/AddChildModal";
import AddAppointmentModal from "@/components/AddAppointmentModal";
import AddVitalSignsModal from "@/components/AddVitalSignsModal";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useContext(AuthContext);
  const [medications, setMedications] = useState([]);
  const [children, setChildren] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [vitalSigns, setVitalSigns] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [medsRes, childrenRes, appointmentsRes, vitalRes, pharmaciesRes] = await Promise.all([
        axios.get(`${API}/medications`, { headers }),
        axios.get(`${API}/children`, { headers }),
        axios.get(`${API}/appointments`, { headers }),
        axios.get(`${API}/vital-signs`, { headers }),
        axios.get(`${API}/pharmacies`)
      ]);

      setMedications(medsRes.data.medications);
      setChildren(childrenRes.data.children);
      setAppointments(appointmentsRes.data.appointments);
      setVitalSigns(vitalRes.data.vital_signs);
      setPharmacies(pharmaciesRes.data.pharmacies);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Erfolgreich abgemeldet");
  };

  return (
    <div className="min-h-screen pb-20" data-testid="dashboard-page">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-teal-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-teal-500" fill="currentColor" />
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              HealthLink
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-800">{user?.first_name} {user?.last_name}</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <Button
              data-testid="logout-btn"
              onClick={handleLogout}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Willkommen zurück!
            </span>
          </h1>
          <p className="text-gray-600">Verwalten Sie Ihre Gesundheit und die Ihrer Familie</p>
        </div>

        <Tabs defaultValue="medications" className="space-y-6">
          <TabsList className="bg-white border border-teal-100 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="medications" data-testid="tab-medications" className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Medikamente
            </TabsTrigger>
            <TabsTrigger value="appointments" data-testid="tab-appointments" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Termine
            </TabsTrigger>
            <TabsTrigger value="family" data-testid="tab-family" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Familie
            </TabsTrigger>
            <TabsTrigger value="vitals" data-testid="tab-vitals" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Vitalwerte
            </TabsTrigger>
            <TabsTrigger value="pharmacies" data-testid="tab-pharmacies" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Apotheken
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medications" data-testid="medications-content">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Meine Medikamente</h2>
                <Button
                  data-testid="add-medication-btn"
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
                    <MedicationCard key={med.id} medication={med} />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="appointments" data-testid="appointments-content">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Meine Termine</h2>
                <Button
                  data-testid="add-appointment-btn"
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
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="family" data-testid="family-content">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Familienmitglieder</h2>
                <Button
                  data-testid="add-child-btn"
                  onClick={() => setShowChildModal(true)}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                  Kind hinzufügen
                </Button>
              </div>
              
              {children.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Noch keine Kinder hinzugefügt</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {children.map(child => (
                    <ChildCard key={child.id} child={child} />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="vitals" data-testid="vitals-content">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Vitalwerte</h2>
                <Button
                  data-testid="add-vital-signs-btn"
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
                    <VitalSignCard key={vital.id} vital={vital} />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="pharmacies" data-testid="pharmacies-content">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Apotheken in Ihrer Nähe</h2>
              
              {pharmacies.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Keine Apotheken gefunden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pharmacies.map(pharmacy => (
                    <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <AddMedicationModal
        open={showMedicationModal}
        onClose={() => setShowMedicationModal(false)}
        onSuccess={fetchData}
      />
      <AddChildModal
        open={showChildModal}
        onClose={() => setShowChildModal(false)}
        onSuccess={fetchData}
      />
      <AddAppointmentModal
        open={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSuccess={fetchData}
      />
      <AddVitalSignsModal
        open={showVitalSignsModal}
        onClose={() => setShowVitalSignsModal(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};

const MedicationCard = ({ medication }) => {
  const getStockColor = (stock) => {
    if (stock <= 1) return "text-red-600";
    if (stock <= 3) return "text-orange-600";
    if (stock <= 5) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="bg-gradient-to-br from-white to-teal-50 border border-teal-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <h3 className="font-bold text-gray-800 mb-2">{medication.name}</h3>
      <p className="text-sm text-gray-600 mb-1">Dosierung: {medication.dosage}</p>
      <p className="text-sm text-gray-600 mb-1">Häufigkeit: {medication.frequency}</p>
      <p className={`text-sm font-semibold ${getStockColor(medication.stock)}`}>
        Vorrat: {medication.stock} Stück
      </p>
      <p className="text-xs text-gray-500 mt-2">Ablauf: {medication.expiry_date}</p>
    </div>
  );
};

const AppointmentCard = ({ appointment }) => {
  return (
    <div className="bg-gradient-to-r from-white to-teal-50 border border-teal-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-gray-800">{appointment.appointment_date}</p>
          <p className="text-sm text-gray-600">{appointment.appointment_time}</p>
          {appointment.notes && (
            <p className="text-sm text-gray-500 mt-2">{appointment.notes}</p>
          )}
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
          {appointment.status}
        </span>
      </div>
    </div>
  );
};

const ChildCard = ({ child }) => {
  return (
    <div className="bg-gradient-to-br from-white to-emerald-50 border border-emerald-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <h3 className="font-bold text-gray-800 mb-2">{child.first_name} {child.last_name}</h3>
      <p className="text-sm text-gray-600">Geburtsdatum: {child.birthdate}</p>
    </div>
  );
};

const VitalSignCard = ({ vital }) => {
  return (
    <div className="bg-gradient-to-r from-white to-cyan-50 border border-cyan-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <p className="text-sm text-gray-600">{new Date(vital.recorded_at).toLocaleString('de-DE')}</p>
      </div>
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
  );
};

const PharmacyCard = ({ pharmacy }) => {
  return (
    <div className="bg-gradient-to-r from-white to-teal-50 border border-teal-100 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-gray-800 mb-1">{pharmacy.name}</h3>
          <p className="text-sm text-gray-600">{pharmacy.address}</p>
          <p className="text-sm text-gray-600">{pharmacy.postal_code} {pharmacy.city}</p>
          <p className="text-sm text-gray-600 mt-2">{pharmacy.phone}</p>
        </div>
        <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">
          {pharmacy.distance}
        </span>
      </div>
    </div>
  );
};

export default DashboardPage;