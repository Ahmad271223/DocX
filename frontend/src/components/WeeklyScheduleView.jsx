import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CATEGORIES = [
  { value: 'food', label: 'Ernährung/Essen', color: '#10b981' },
  { value: 'sport', label: 'Sport', color: '#3b82f6' },
  { value: 'doctor', label: 'Arzt/Krankenhaus', color: '#ef4444' },
  { value: 'other', label: 'Sonstiges', color: '#a855f7' }
];

const WeeklyScheduleView = ({ children = [], selectedChild = null }) => {
  const { token } = useContext(AuthContext);
  const [schedule, setSchedule] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedHour, setSelectedHour] = useState(8);

  const [formData, setFormData] = useState({
    day_of_week: 0,
    start_hour: 8,
    end_hour: 9,
    title: "",
    category: "other",
    description: "",
    child_id: selectedChild || ""
  });

  useEffect(() => {
    fetchSchedule();
  }, [selectedChild]);

  const fetchSchedule = async () => {
    try {
      const url = selectedChild 
        ? `${API}/schedule/weekly?child_id=${selectedChild}`
        : `${API}/schedule/weekly`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedule(response.data.schedule);
    } catch (error) {
      console.error("Failed to fetch weekly schedule", error);
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
        `${API}/schedule/weekly`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Eintrag hinzugefügt!");
      setFormData({
        day_of_week: 0,
        start_hour: 8,
        end_hour: 9,
        title: "",
        category: "other",
        description: "",
        child_id: selectedChild || ""
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
      await axios.delete(`${API}/schedule/weekly/${entryId}`, {
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
      day_of_week: day,
      start_hour: hour,
      end_hour: hour + 1,
      child_id: selectedChild || ""
    });
    setShowAddModal(true);
  };

  const getEntriesForDayAndHour = (day, hour) => {
    const key = `${day}-${hour}`;
    return schedule[key] || [];
  };

  const getCategoryInfo = (category) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[3];
  };

  return (
    <div className="space-y-6" data-testid="weekly-schedule-view">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Wochenplan (wiederkehrend)</h2>
        <Button
          onClick={() => openAddModal(0, 8)}
          data-testid="add-weekly-entry-btn"
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full"
        >
          <Plus className="w-4 h-4" />
          Wöchentlich hinzufügen
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-teal-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                <th className="py-3 px-4 text-left font-semibold border-r border-teal-400 sticky left-0 bg-teal-500 z-10">Uhrzeit</th>
                {DAYS.map((day, idx) => (
                  <th key={idx} className="py-3 px-4 text-center font-semibold border-r border-teal-400 last:border-r-0 min-w-[140px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(hour => (
                <tr key={hour} className="border-b border-gray-200 hover:bg-teal-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-white z-10">
                    {String(hour).padStart(2, '0')}:00
                  </td>
                  {DAYS.map((_, dayIdx) => {
                    const entries = getEntriesForDayAndHour(dayIdx, hour);
                    return (
                      <td
                        key={dayIdx}
                        className="py-2 px-2 border-r border-gray-200 last:border-r-0 cursor-pointer align-top"
                        onClick={() => openAddModal(dayIdx, hour)}
                      >
                        {entries.map(entry => {
                          const categoryInfo = getCategoryInfo(entry.category);
                          return (
                            <div
                              key={entry.id}
                              className="mb-1 p-2 rounded text-xs text-white shadow-sm hover:shadow-md transition-shadow relative group"
                              style={{ backgroundColor: entry.color }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="font-semibold">{entry.title}</div>
                              <div className="text-xs opacity-90">
                                {String(entry.start_hour).padStart(2, '0')}:00 - {String(entry.end_hour).padStart(2, '0')}:00
                              </div>
                              {entry.child_name && (
                                <div className="text-xs opacity-75 mt-1">👤 {entry.child_name}</div>
                              )}
                              {entry.description && (
                                <div className="text-xs opacity-75 mt-1">{entry.description}</div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEntry(entry.id);
                                }}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-opacity"
                                data-testid={`delete-weekly-entry-${entry.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
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
            <DialogTitle>Wöchentlichen Eintrag hinzufügen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Tag</Label>
              <div className="mt-2 font-semibold text-teal-600">{DAYS[formData.day_of_week]}</div>
            </div>

            {!selectedChild && children.length > 0 && (
              <div>
                <Label>Für wen? (optional)</Label>
                <Select
                  value={formData.child_id || "self"}
                  onValueChange={(value) => setFormData({ ...formData, child_id: value === "self" ? "" : value })}
                >
                  <SelectTrigger data-testid="weekly-schedule-child-select">
                    <SelectValue placeholder="Für mich selbst" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Für mich selbst</SelectItem>
                    {children.map(child => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.first_name} {child.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="category">Kategorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger data-testid="weekly-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                data-testid="weekly-title-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. Training, Yoga"
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_hour">Von (Stunde)</Label>
                <Input
                  id="start_hour"
                  type="number"
                  min="0"
                  max="23"
                  data-testid="weekly-start-hour-input"
                  value={formData.start_hour}
                  onChange={(e) => setFormData({ ...formData, start_hour: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end_hour">Bis (Stunde)</Label>
                <Input
                  id="end_hour"
                  type="number"
                  min="0"
                  max="23"
                  data-testid="weekly-end-hour-input"
                  value={formData.end_hour}
                  onChange={(e) => setFormData({ ...formData, end_hour: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                data-testid="weekly-description-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Weitere Details..."
                className="mt-1"
                rows={3}
              />
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
                data-testid="weekly-submit-btn"
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

export default WeeklyScheduleView;