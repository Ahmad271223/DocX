import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Pill } from "lucide-react";
import { toast } from "sonner";

const FamilyMemberMedicationsPage = () => {
  const navigate = useNavigate();
  const { memberId } = useParams();
  const { token } = useContext(AuthContext);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedications();
  }, [memberId]);

  const fetchMedications = async () => {
    try {
      const response = await axios.get(`${API}/family/member/${memberId}/medications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMedications(response.data.medications);
    } catch (error) {
      console.error("Failed to fetch medications:", error);
      toast.error("Medikamente konnten nicht geladen werden");
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
          <h1 className="text-xl font-bold text-gray-800">Medikamente</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {medications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-teal-100 p-12 text-center">
            <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Keine Medikamente vorhanden</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medications.map((med) => (
              <div
                key={med.id}
                className="bg-white rounded-2xl shadow-lg border border-teal-100 p-6"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-2">{med.name}</h3>
                <p className="text-gray-600 mb-1">Dosierung: {med.dosage}</p>
                <p className="text-gray-600 mb-1">Häufigkeit: {med.frequency}</p>
                <p className="text-gray-600 mb-1">Vorrat: {med.stock}</p>
                <p className="text-gray-600">Ablaufdatum: {med.expiry_date}</p>
                {med.stock <= 5 && (
                  <p className="text-red-600 font-semibold mt-2">⚠️ Niedriger Vorrat!</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyMemberMedicationsPage;
