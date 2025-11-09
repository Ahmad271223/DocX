import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DoctorVacationManager = ({ token, doctorId, onUpdate }) => {
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    fetchVacations();
  }, []);

  const fetchVacations = async () => {
    try {
      const response = await axios.get(`${API}/doctors/vacation`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVacations(response.data.vacations);
    } catch (error) {
      console.error("Failed to fetch vacations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error("Enddatum muss nach dem Startdatum liegen");
      return;
    }

    try {
      await axios.post(`${API}/doctors/vacation`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Urlaubszeit hinzugefügt");
      setShowForm(false);
      setFormData({
        start_date: "",
        end_date: "",
        reason: "",
      });
      fetchVacations();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to add vacation:", error);
      toast.error("Fehler beim Hinzufügen");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Möchten Sie diese Urlaubszeit wirklich löschen?")) return;
    
    try {
      await axios.delete(`${API}/doctors/vacation/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Urlaubszeit gelöscht");
      fetchVacations();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to delete vacation:", error);
      toast.error("Fehler beim Löschen");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lädt Urlaubszeiten...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Urlaubszeiten</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Urlaub hinzufügen
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-cyan-50 border border-cyan-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Neue Urlaubszeit</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Von</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="border-cyan-300"
              />
            </div>
            <div>
              <Label>Bis</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
                className="border-cyan-300"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Grund (optional)</Label>
              <Input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="z.B. Jahresurlaub, Fortbildung"
                className="border-cyan-300"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
              Hinzufügen
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}

      {vacations.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <p className="text-gray-500">Keine Urlaubszeiten geplant</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vacations
            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
            .map((vacation) => {
              const isPast = new Date(vacation.end_date) < new Date();
              return (
                <div
                  key={vacation.id}
                  className={`border rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow ${
                    isPast ? "bg-gray-50 border-gray-200" : "bg-cyan-50 border-cyan-200"
                  }`}
                >
                  <div>
                    <p className={`font-semibold ${isPast ? "text-gray-500" : "text-gray-800"}`}>
                      {vacation.reason || "Urlaub"}
                      {isPast && " (Vergangen)"}
                    </p>
                    <p className={`text-sm ${isPast ? "text-gray-400" : "text-gray-600"}`}>
                      {new Date(vacation.start_date).toLocaleDateString("de-DE")} -{" "}
                      {new Date(vacation.end_date).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(vacation.id)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default DoctorVacationManager;
