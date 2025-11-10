import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Users, Share2, UserPlus, Trash2, Home, LogOut, AlertCircle, Pill, Calendar } from "lucide-react";
import { toast } from "sonner";

const FamilyConnectionsPage = () => {
  const navigate = useNavigate();
  const { token, user, logout } = useContext(AuthContext);
  const [connections, setConnections] = useState([]);
  const [myCode, setMyCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmergencySearch, setShowEmergencySearch] = useState(false);
  const [connectForm, setConnectForm] = useState({
    connection_code: "",
    nickname: "",
    relationship: "Familie",
  });

  useEffect(() => {
    if (!user || user.user_type === "doctor") {
      navigate("/dashboard");
      return;
    }
    fetchMyCode();
    fetchConnections();
  }, [user, navigate]);

  const fetchMyCode = async () => {
    try {
      const response = await axios.get(`${API}/family/my-code`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMyCode(response.data.connection_code);
    } catch (error) {
      console.error("Failed to fetch code:", error);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await axios.get(`${API}/family/connections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConnections(response.data.connections);
    } catch (error) {
      console.error("Failed to fetch connections:", error);
      toast.error("Verbindungen konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/family/connect`, connectForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Erfolgreich mit ${response.data.connected_user.name} verbunden!`);
      setShowConnectModal(false);
      setConnectForm({ connection_code: "", nickname: "", relationship: "Familie" });
      fetchConnections();
    } catch (error) {
      console.error("Failed to connect:", error);
      const errorMessage = error.response?.data?.detail || "Verbindung fehlgeschlagen";
      toast.error(errorMessage);
    }
  };

  const handleRemoveConnection = async (connectionId) => {
    if (!confirm("Möchten Sie diese Verbindung wirklich entfernen?")) return;

    try {
      await axios.delete(`${API}/family/connections/${connectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Verbindung entfernt");
      fetchConnections();
    } catch (error) {
      console.error("Failed to remove connection:", error);
      toast.error("Fehler beim Entfernen");
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(myCode);
    toast.success("Code kopiert!");
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
      {/* Header */}
      <nav className="backdrop-blur-xl bg-white/70 border-b border-teal-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Heart className="w-8 h-8 text-teal-500" fill="currentColor" />
            <h1 className="text-xl font-bold text-gray-800">Familie & Freunde</h1>
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
        {/* My Code Card */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ihr Verbindungscode</h2>
              <p className="text-teal-100 mb-4">Teilen Sie diesen Code mit Familie und Freunden</p>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 inline-block">
                <code className="text-2xl font-mono font-bold">{myCode}</code>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={copyCodeToClipboard}
                className="bg-white text-teal-600 hover:bg-teal-50"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Code kopieren
              </Button>
              <Button
                onClick={() => setShowConnectModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Verbinden
              </Button>
            </div>
          </div>
        </div>

        {/* Emergency Search Button */}
        <div className="mb-8">
          <Button
            onClick={() => setShowEmergencySearch(true)}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-6 text-lg rounded-2xl shadow-xl"
          >
            <AlertCircle className="w-6 h-6 mr-3" />
            Notfall: Medikament suchen
          </Button>
        </div>

        {/* Connections List */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Meine Verbindungen ({connections.length})
          </h2>
          {connections.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">Noch keine Verbindungen</p>
              <Button
                onClick={() => setShowConnectModal(true)}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
              >
                Erste Verbindung hinzufügen
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connections.map((conn) => (
                <ConnectionCard
                  key={conn.connection_id}
                  connection={conn}
                  onRemove={handleRemoveConnection}
                  onViewMedications={(userId) => navigate(`/family-member/${userId}/medications`)}
                  onViewAppointments={(userId) => navigate(`/family-member/${userId}/appointments`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <Modal onClose={() => setShowConnectModal(false)} title="Mit Person verbinden">
          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <Label htmlFor="connection_code">Verbindungscode *</Label>
              <Input
                id="connection_code"
                value={connectForm.connection_code}
                onChange={(e) => setConnectForm({ ...connectForm, connection_code: e.target.value.toUpperCase() })}
                placeholder="USER-XXXXXXXX"
                required
                className="border-teal-200"
              />
            </div>
            <div>
              <Label htmlFor="nickname">Spitzname (optional)</Label>
              <Input
                id="nickname"
                value={connectForm.nickname}
                onChange={(e) => setConnectForm({ ...connectForm, nickname: e.target.value })}
                placeholder="z.B. Mama, Opa, etc."
                className="border-teal-200"
              />
            </div>
            <div>
              <Label htmlFor="relationship">Beziehung</Label>
              <select
                id="relationship"
                value={connectForm.relationship}
                onChange={(e) => setConnectForm({ ...connectForm, relationship: e.target.value })}
                className="w-full px-3 py-2 border border-teal-200 rounded-lg"
              >
                <option value="Familie">Familie</option>
                <option value="Eltern">Eltern</option>
                <option value="Kind">Kind</option>
                <option value="Geschwister">Geschwister</option>
                <option value="Großeltern">Großeltern</option>
                <option value="Partner">Partner</option>
                <option value="Freund">Freund</option>
                <option value="Sonstiges">Sonstiges</option>
              </select>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
            >
              Verbinden
            </Button>
          </form>
        </Modal>
      )}

      {/* Emergency Search Modal */}
      {showEmergencySearch && (
        <EmergencyMedicationSearch
          token={token}
          onClose={() => setShowEmergencySearch(false)}
        />
      )}
    </div>
  );
};

const ConnectionCard = ({ connection, onRemove, onViewMedications, onViewAppointments }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6 hover:shadow-xl transition-shadow">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          {connection.nickname || `${connection.connected_user.first_name} ${connection.connected_user.last_name}`}
        </h3>
        {connection.nickname && (
          <p className="text-sm text-gray-600">
            {connection.connected_user.first_name} {connection.connected_user.last_name}
          </p>
        )}
        <span className="inline-block mt-2 px-3 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
          {connection.relationship}
        </span>
      </div>

      <div className="space-y-2">
        <Button
          onClick={() => onViewMedications(connection.connected_user.id)}
          variant="outline"
          className="w-full border-teal-200 text-teal-700 hover:bg-teal-50"
        >
          <Pill className="w-4 h-4 mr-2" />
          Medikamente ansehen
        </Button>
        <Button
          onClick={() => onViewAppointments(connection.connected_user.id)}
          variant="outline"
          className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Termine ansehen
        </Button>
        <Button
          onClick={() => onRemove(connection.connection_id)}
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Verbindung entfernen
        </Button>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Verbunden seit: {new Date(connection.connected_at).toLocaleDateString("de-DE")}
      </p>
    </div>
  );
};

const Modal = ({ onClose, title, children }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const EmergencyMedicationSearch = ({ token, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    
    try {
      const response = await axios.post(
        `${API}/emergency/find-medication`,
        { medication_name: searchTerm },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data.results);
      if (response.data.results.length === 0) {
        toast.info("Keine Ergebnisse gefunden");
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Suche fehlgeschlagen");
    } finally {
      setSearching(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Notfall-Medikamentensuche">
      <form onSubmit={handleSearch} className="space-y-4 mb-6">
        <div>
          <Label htmlFor="search_medication">Medikamentenname</Label>
          <Input
            id="search_medication"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="z.B. Ibuprofen"
            required
            className="border-red-200"
          />
        </div>
        <Button
          type="submit"
          disabled={searching}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
        >
          {searching ? "Sucht..." : "Suchen"}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <p className="text-sm font-semibold text-gray-700">{results.length} Ergebnis(se) gefunden:</p>
          {results.map((result, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-800">{result.user_name}</p>
                  <span className="text-xs text-teal-600 font-medium">{result.relationship}</span>
                </div>
                {result.contact_email && (
                  <a
                    href={`mailto:${result.contact_email}`}
                    className="text-xs text-teal-600 hover:text-teal-700 underline"
                  >
                    Kontakt
                  </a>
                )}
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="font-medium text-gray-800">{result.medication.name}</p>
                <p className="text-sm text-gray-600">{result.medication.dosage}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">Vorrat: {result.medication.stock}</span>
                  <span className="text-xs text-gray-400">Exp: {result.medication.expiry_date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default FamilyConnectionsPage;
