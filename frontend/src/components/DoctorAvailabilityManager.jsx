import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DAYS = [
  { value: 0, label: "Montag" },
  { value: 1, label: "Dienstag" },
  { value: 2, label: "Mittwoch" },
  { value: 3, label: "Donnerstag" },
  { value: 4, label: "Freitag" },
  { value: 5, label: "Samstag" },
  { value: 6, label: "Sonntag" },
];

const DoctorAvailabilityManager = ({ token, doctorId, onUpdate }) => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: 0,
    start_time: "09:00",
    end_time: "17:00",
    break_start: "",
    break_end: "",
    slot_duration: 30,
  });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await axios.get(`${API}/doctors/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailability(response.data.availability);
    } catch (error) {
      console.error("Failed to fetch availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/doctors/availability`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Verfügbarkeit hinzugefügt");
      setShowForm(false);
      setFormData({
        day_of_week: 0,
        start_time: "09:00",
        end_time: "17:00",
        break_start: "",
        break_end: "",
        slot_duration: 30,
      });
      fetchAvailability();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to add availability:", error);
      toast.error("Fehler beim Hinzufügen");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Möchten Sie diese Verfügbarkeit wirklich löschen?")) return;
    
    try {
      await axios.delete(`${API}/doctors/availability/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Verfügbarkeit gelöscht");
      fetchAvailability();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Failed to delete availability:", error);
      toast.error("Fehler beim Löschen");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Lädt Verfügbarkeit...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Verfügbarkeitszeiten</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Verfügbarkeit hinzufügen
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-teal-50 border border-teal-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Neue Verfügbarkeit</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Wochentag</Label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Termin-Dauer (Minuten)</Label>
              <Input
                type="number"
                value={formData.slot_duration}
                onChange={(e) => setFormData({ ...formData, slot_duration: parseInt(e.target.value) })}
                className="border-teal-300"
              />
            </div>
            <div>
              <Label>Von</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="border-teal-300"
              />
            </div>
            <div>
              <Label>Bis</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="border-teal-300"
              />
            </div>
          </div>
          
          <div className="border-t border-teal-200 pt-4 mt-4">
            <Label className="mb-2 block">Mittagspause (optional)</Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Pause von</Label>
                <Input
                  type="time"
                  value={formData.break_start}
                  onChange={(e) => setFormData({ ...formData, break_start: e.target.value })}
                  className="border-teal-300"
                />
              </div>
              <div>
                <Label className="text-sm">Pause bis</Label>
                <Input
                  type="time"
                  value={formData.break_end}
                  onChange={(e) => setFormData({ ...formData, break_end: e.target.value })}
                  className="border-teal-300"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
              Hinzufügen
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      )}

      {availability.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <p className="text-gray-500">Noch keine Verfügbarkeitszeiten festgelegt</p>
        </div>
      ) : (
        <div className="space-y-3">
          {availability
            .sort((a, b) => a.day_of_week - b.day_of_week)
            .map((item) => (
              <div
                key={item.id}
                className="bg-white border border-teal-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {DAYS.find((d) => d.value === item.day_of_week)?.label}
                  </p>
                  {item.break_start && item.break_end ? (
                    <>
                      <p className="text-sm text-gray-600">
                        {item.start_time} - {item.break_start} Uhr
                      </p>
                      <p className="text-xs text-orange-600">
                        Pause: {item.break_start} - {item.break_end} Uhr
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.break_end} - {item.end_time} Uhr
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {item.start_time} - {item.end_time} Uhr
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Termin-Dauer: {item.slot_duration} Minuten</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAvailabilityManager;
