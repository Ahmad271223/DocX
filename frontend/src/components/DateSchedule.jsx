import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";

const CATEGORIES = [
  { value: 'food', label: 'Ernährung/Essen', color: '#10b981' },
  { value: 'sport', label: 'Sport', color: '#3b82f6' },
  { value: 'doctor', label: 'Arzt/Krankenhaus', color: '#ef4444' },
  { value: 'other', label: 'Sonstiges', color: '#a855f7' }
];

const DateSchedule = ({ children = [], selectedChild = null }) => {
  const { token } = useContext(AuthContext);
  const [schedule, setSchedule] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: "12:00",
    end_time: "",
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
        ? `${API}/schedule?child_id=${selectedChild}`
        : `${API}/schedule`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedule(response.data.schedule);
    } catch (error) {
      console.error("Failed to fetch schedule", error);
    }
  };

  const handleAddEntry = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/schedule`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success("Eintrag hinzugefügt!");
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: "12:00",
        end_time: "",
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
      await axios.delete(`${API}/schedule/${entryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Eintrag gelöscht!");
      fetchSchedule();
    } catch (error) {
      toast.error("Fehler beim Löschen");
    }
  };

  // Group entries by date
  const groupedSchedule = schedule.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {});

  // Sort entries within each date by time
  Object.keys(groupedSchedule).forEach(date => {
    groupedSchedule[date].sort((a, b) => a.time.localeCompare(b.time));
  });

  // Get dates in range (today + 60 days)
  const getDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 730; i++) { // 2 years
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const dates = getDates();
  const filteredDates = dates.filter(date => groupedSchedule[date]?.length > 0);

  const getCategoryInfo = (category) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[3];
  };

  return (
    <div className="space-y-6" data-testid="date-schedule">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Terminplan</h2>
        <Button
          onClick={() => {
            setFormData({ ...formData, child_id: selectedChild || "" });
            setShowAddModal(true);
          }}
          data-testid="add-schedule-entry-btn"
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full"
        >
          <Plus className="w-4 h-4" />
          Termin hinzufügen
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Keine Termine geplant</p>
          </div>
        ) : (
          filteredDates.map(date => {
            const dateObj = new Date(date + 'T12:00:00');
            const dayName = dateObj.toLocaleDateString('de-DE', { weekday: 'long' });
            const formattedDate = dateObj.toLocaleDateString('de-DE');

            return (
              <Card key={date} className="p-4 hover:shadow-lg transition-shadow">
                <div className="mb-3 pb-2 border-b border-gray-200">
                  <h3 className="font-bold text-gray-800">{dayName}</h3>
                  <p className="text-sm text-gray-600">{formattedDate}</p>
                </div>
                
                <div className="space-y-2">
                  {groupedSchedule[date].map(entry => {
                    const categoryInfo = getCategoryInfo(entry.category);
                    return (
                      <div
                        key={entry.id}
                        className="p-3 rounded-lg text-white relative group"
                        style={{ backgroundColor: entry.color }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-semibold">{entry.title}</div>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/30 rounded-full p-1 transition-opacity"
                            data-testid={`delete-entry-${entry.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-sm opacity-90">
                          {entry.time} {entry.end_time && `- ${entry.end_time}`}
                        </div>
                        {entry.child_name && (
                          <div className="text-xs opacity-75 mt-1">👤 {entry.child_name}</div>
                        )}
                        {entry.description && (
                          <div className="text-xs opacity-75 mt-1">{entry.description}</div>
                        )}
                        <div className="text-xs opacity-75 mt-1">{categoryInfo.label}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Termin hinzufügen</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {!selectedChild && children.length > 0 && (
              <div>
                <Label>Für wen? (optional)</Label>
                <Select
                  value={formData.child_id}
                  onValueChange={(value) => setFormData({ ...formData, child_id: value })}
                >
                  <SelectTrigger data-testid="schedule-child-select">
                    <SelectValue placeholder="Für mich selbst" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Für mich selbst</SelectItem>
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
                <SelectTrigger data-testid="schedule-category-select">
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
                data-testid="schedule-title-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. Hausarzt, Yoga, Mittagessen"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="date">Datum *</Label>
              <Input
                id="date"
                type="date"
                data-testid="schedule-date-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time">Uhrzeit *</Label>
                <Input
                  id="time"
                  type="time"
                  data-testid="schedule-time-input"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end_time">Bis (optional)</Label>
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

export default DateSchedule;