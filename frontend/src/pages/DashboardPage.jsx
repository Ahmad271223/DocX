import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Heart, Pill, Calendar, Users, Activity, LogOut, Plus, CalendarDays, Trash2, CalendarRange } from "lucide-react";
import AddMedicationModal from "@/components/AddMedicationModal";
import AddChildModal from "@/components/AddChildModal";
import AddAppointmentModal from "@/components/AddAppointmentModal";
import AddVitalSignsModal from "@/components/AddVitalSignsModal";
import TakeMedicationButton from "@/components/TakeMedicationButton";
import UpcomingAppointments from "@/components/UpcomingAppointments";
import YearlyCalendar from "@/components/YearlyCalendar";
import EmergencyAddresses from "@/components/EmergencyAddresses";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useContext(AuthContext);
  const [medications, setMedications] = useState([]);
  const [children, setChildren] = useState([]);
  const [vitalSigns, setVitalSigns] = useState([]);
  
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [showVitalSignsModal, setShowVitalSignsModal] = useState(false);
  const [childrenData, setChildrenData] = useState({ children: [], max_children: 0, can_add_more: true });
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedMedications, setSelectedMedications] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [medsRes, childrenRes, vitalRes] = await Promise.all([
        axios.get(`${API}/medications`, { headers }),
        axios.get(`${API}/children`, { headers }),
        axios.get(`${API}/vital-signs`, { headers })
      ]);

      setMedications(medsRes.data.medications);
      setChildrenData(childrenRes.data);
      setChildren(childrenRes.data.children);
      setVitalSigns(vitalRes.data.vital_signs);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Erfolgreich abgemeldet");
  };

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedMedications([]);
  };

  const toggleMedicationSelection = (medicationId) => {
    if (selectedMedications.includes(medicationId)) {
      setSelectedMedications(selectedMedications.filter(id => id !== medicationId));
    } else {
      setSelectedMedications([...selectedMedications, medicationId]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMedications.length === 0) {
      toast.error("Keine Medikamente ausgewählt");
      return;
    }

    if (!window.confirm(`Möchten Sie ${selectedMedications.length} Medikament(e) wirklich löschen?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedMedications.map(id =>
          axios.delete(`${API}/medications/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      toast.success("Medikamente gelöscht!");
      setSelectedMedications([]);
      setDeleteMode(false);
      fetchData();
    } catch (error) {
      toast.error("Fehler beim Löschen");
    }
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

        <UpcomingAppointments />

        <Tabs defaultValue="medications" className="space-y-6">
          <TabsList className="bg-white border border-teal-100 p-1 rounded-xl shadow-sm">
            <TabsTrigger value="medications" data-testid="tab-medications" className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Medikamente
            </TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Kalender
            </TabsTrigger>
            <TabsTrigger value="emergency" data-testid="tab-emergency" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Notfall-Adressen
            </TabsTrigger>
            <TabsTrigger value="vitals" data-testid="tab-vitals" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Vitalwerte/Blutzucker
            </TabsTrigger>
            <TabsTrigger value="family" data-testid="tab-family" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Familie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medications" data-testid="medications-content">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Meine Medikamente</h2>
                <div className="flex gap-2">
                  <Button
                    data-testid="toggle-delete-mode-btn"
                    onClick={toggleDeleteMode}
                    variant={deleteMode ? "destructive" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleteMode ? "Abbrechen" : "Löschen"}
                  </Button>
                  {deleteMode && selectedMedications.length > 0 && (
                    <Button
                      data-testid="delete-selected-btn"
                      onClick={handleDeleteSelected}
                      className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                    >
                      {selectedMedications.length} löschen
                    </Button>
                  )}
                  <Button
                    data-testid="add-medication-btn"
                    onClick={() => setShowMedicationModal(true)}
                    disabled={deleteMode}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    Medikament hinzufügen
                  </Button>
                </div>
              </div>
              
              {medications.length === 0 ? (
                <div className="text-center py-12">
                  <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Noch keine Medikamente hinzugefügt</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {medications.map(med => (
                    <MedicationCard 
                      key={med.id} 
                      medication={med} 
                      onTaken={fetchData} 
                      deleteMode={deleteMode}
                      isSelected={selectedMedications.includes(med.id)}
                      onToggleSelect={toggleMedicationSelection}
                    />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Appointments tab removed - functionality moved to calendar */}

          <TabsContent value="family" data-testid="family-content">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Familienmitglieder</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {children.length} von {childrenData.max_children} Kindern hinzugefügt
                  </p>
                </div>
                <Button
                  data-testid="add-child-btn"
                  onClick={() => setShowChildModal(true)}
                  disabled={!childrenData.can_add_more}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Kind hinzufügen
                </Button>
              </div>
              
              {!childrenData.can_add_more && children.length >= childrenData.max_children && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    Sie haben die maximale Anzahl von Kindern ({childrenData.max_children}) erreicht. 
                    Bitte aktualisieren Sie Ihr Abonnement um mehr Kinder hinzuzufügen.
                  </p>
                </div>
              )}
              
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

          <TabsContent value="emergency" data-testid="emergency-content">
            <EmergencyAddresses />
          </TabsContent>

          <TabsContent value="calendar" data-testid="calendar-content">
            <YearlyCalendar children={children} />
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

const MedicationCard = ({ medication, onTaken, deleteMode, isSelected, onToggleSelect }) => {
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

  const handleClick = () => {
    if (deleteMode) {
      onToggleSelect(medication.id);
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`bg-gradient-to-br from-white to-teal-50 border rounded-xl p-4 hover:shadow-lg transition-all relative ${
        deleteMode ? 'cursor-pointer' : ''
      } ${
        isSelected ? 'border-red-500 border-2 bg-red-50' : 'border-teal-100'
      }`}
      data-testid={`medication-card-${medication.id}`}
    >
      {deleteMode && (
        <div className="absolute top-2 right-2">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
            isSelected ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'
          }`}>
            {isSelected && <span className="text-white text-sm">✓</span>}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800">{medication.name}</h3>
        {!deleteMode && <TakeMedicationButton medication={medication} onSuccess={onTaken} />}
      </div>
      
      {medication.child_name && (
        <p className="text-sm text-teal-600 font-semibold mb-1">\ud83d\udc64 {medication.child_name}</p>
      )}
      
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
      
      {medication.last_taken && (
        <p className="text-xs text-green-600 mt-1">
          Zuletzt eingenommen: {new Date(medication.last_taken).toLocaleString('de-DE')}
        </p>
      )}
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
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => navigate(`/child/${child.id}`)}
      className="bg-gradient-to-br from-white to-emerald-50 border border-emerald-100 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer hover:scale-105 transition-transform"
      data-testid={`child-card-${child.id}`}
    >
      <h3 className="font-bold text-gray-800 mb-2">{child.first_name} {child.last_name}</h3>
      <p className="text-sm text-gray-600">Geburtsdatum: {child.birthdate}</p>
      <p className="text-xs text-teal-600 mt-2">Klicken um Details anzuzeigen →</p>
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