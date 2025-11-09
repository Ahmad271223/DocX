import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const WeeklySchedule = () => {
  const { token } = useContext(AuthContext);
  const [schedule, setSchedule] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedHour, setSelectedHour] = useState(8);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    start_time: "08:00",
    end_time: "09:00",
    description: "",
    color: "#14b8a6"
  });

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const response = await axios.get(`${API}/schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedule(response.data.schedule);
    } catch (error) {
      console.error("Failed to fetch schedule", error);
    }
  };

  const handleAddEntry = async () => {
    if (!formData.title) {
      toast.error("Bitte geben Sie einen Titel ein");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/schedule`,
        {
          day_of_week: selectedDay,
          ...formData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Eintrag hinzugefügt!");
      setFormData({
        title: "",
        start_time: "08:00",
        end_time: "09:00",
        description: "",
        color: "#14b8a6"
      });
      setShowAddModal(false);
      fetchSchedule();
    } catch (error) {
      toast.error("Fehler beim Hinzufügen");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      await axios.delete(`${API}/schedule/${entryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Eintrag gelöscht!");
      fetchSchedule();
    } catch (error) {
      toast.error("Fehler beim Löschen");
    }
  };

  const openAddModal = (day, hour) => {
    setSelectedDay(day);
    setSelectedHour(hour);
    setFormData({
      ...formData,
      start_time: `${String(hour).padStart(2, '0')}:00`,
      end_time: `${String(hour + 1).padStart(2, '0')}:00`
    });
    setShowAddModal(true);
  };

  const getEntriesForDayAndHour = (day, hour) => {
    if (!schedule[day]) return [];
    
    return schedule[day].filter(entry => {
      const [startHour] = entry.start_time.split(':').map(Number);
      const [endHour] = entry.end_time.split(':').map(Number);
      return hour >= startHour && hour < endHour;
    });
  };

  return (
    <div className="space-y-6" data-testid="weekly-schedule">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Wochenplan</h2>
        <Button
          onClick={() => openAddModal(0, 8)}
          data-testid="add-schedule-entry-btn"
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full"
        >
          <Plus className="w-4 h-4" />
          Eintrag hinzufügen
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-teal-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                <th className="py-3 px-4 text-left font-semibold border-r border-teal-400">Uhrzeit</th>
                {DAYS.map((day, idx) => (
                  <th key={idx} className="py-3 px-4 text-center font-semibold border-r border-teal-400 last:border-r-0">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} className="border-b border-gray-200 hover:bg-teal-50 transition-colors">
                  <td className="py-2 px-4 font-semibold text-gray-700 border-r border-gray-200">
                    {String(hour).padStart(2, '0')}:00
                  </td>
                  {DAYS.map((_, dayIdx) => {
                    const entries = getEntriesForDayAndHour(dayIdx, hour);
                    return (
                      <td
                        key={dayIdx}
                        className="py-2 px-2 border-r border-gray-200 last:border-r-0 cursor-pointer"
                        onClick={() => openAddModal(dayIdx, hour)}
                      >
                        {entries.map(entry => (
                          <div
                            key={entry.id}
                            className="mb-1 p-2 rounded text-xs text-white shadow-sm hover:shadow-md transition-shadow relative group"
                            style={{ backgroundColor: entry.color }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="font-semibold">{entry.title}</div>
                            <div className="text-xs opacity-90">
                              {entry.start_time} - {entry.end_time}
                            </div>
                            {entry.description && (
                              <div className="text-xs opacity-75 mt-1">{entry.description}</div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEntry(entry.id);
                              }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-opacity"
                              data-testid={`delete-schedule-entry-${entry.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eintrag hinzufügen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Tag</Label>
              <div className="mt-2 font-semibold text-teal-600">{DAYS[selectedDay]}</div>
            </div>
            
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                data-testid="schedule-title-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. Training, Arzttermin"
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Von</Label>
                <Input
                  id="start_time"
                  type="time"
                  data-testid="schedule-start-time-input"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end_time">Bis</Label>
                <Input
                  id="end_time"
                  type="time"
                  data-testid="schedule-end-time-input"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                data-testid="schedule-description-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Weitere Details..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="color">Farbe</Label>
              <div className="flex gap-2 mt-2">
                {['#14b8a6', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#ef4444'].map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      formData.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleAddEntry}
                disabled={loading}
                data-testid="schedule-submit-btn"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
              >
                {loading ? "Wird gespeichert..." : "Hinzufügen"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WeeklySchedule;