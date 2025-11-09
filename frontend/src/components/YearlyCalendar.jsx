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
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const CATEGORIES = [
  { value: 'food', label: 'Ernährung/Essen', color: '#10b981' },
  { value: 'sport', label: 'Sport', color: '#3b82f6' },
  { value: 'doctor', label: 'Arzt/Krankenhaus', color: '#ef4444' },
  { value: 'other', label: 'Sonstiges', color: '#a855f7' }
];

const YearlyCalendar = ({ children = [], selectedChild = null }) => {
  const { token } = useContext(AuthContext);
  const [schedule, setSchedule] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHour, setSelectedHour] = useState(8);

  const [formData, setFormData] = useState({
    date: '',
    time: '08:00',
    end_time: '',
    title: '',
    category: 'other',
    description: '',
    child_id: selectedChild || '',
    recurrence: 'once', // once, weekly-2, weekly-4, forever
    recurrence_count: 1
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
      
      // Organize by date and hour
      const organized = {};
      response.data.schedule.forEach(entry => {
        const hour = parseInt(entry.time.split(':')[0]);
        const key = `${entry.date}-${hour}`;
        if (!organized[key]) {
          organized[key] = [];
        }
        organized[key].push(entry);
      });
      
      setSchedule(organized);
    } catch (error) {
      console.error('Failed to fetch schedule', error);
    }
  };

  const handleAddEntry = async () => {
    if (!formData.title || !formData.date || !formData.time) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    setLoading(true);
    try {
      // Create entries based on recurrence
      const entriesToCreate = [];
      const startDate = new Date(formData.date);
      
      if (formData.recurrence === 'once') {
        entriesToCreate.push({ ...formData });
      } else if (formData.recurrence === 'weekly-2') {
        // Alle 2 Wochen für recurrence_count Mal
        for (let i = 0; i < formData.recurrence_count; i++) {
          const newDate = new Date(startDate);
          newDate.setDate(startDate.getDate() + (i * 14));
          entriesToCreate.push({
            ...formData,
            date: newDate.toISOString().split('T')[0]
          });
        }
      } else if (formData.recurrence === 'weekly-4') {
        // Alle 4 Wochen für recurrence_count Mal
        for (let i = 0; i < formData.recurrence_count; i++) {
          const newDate = new Date(startDate);
          newDate.setDate(startDate.getDate() + (i * 28));
          entriesToCreate.push({
            ...formData,
            date: newDate.toISOString().split('T')[0]
          });
        }
      } else if (formData.recurrence === 'forever') {
        // Für immer = 52 Wochen (1 Jahr)
        for (let i = 0; i < 52; i++) {
          const newDate = new Date(startDate);
          newDate.setDate(startDate.getDate() + (i * 7));
          entriesToCreate.push({
            ...formData,
            date: newDate.toISOString().split('T')[0]
          });
        }
      }

      // Create all entries
      await Promise.all(
        entriesToCreate.map(entry => 
          axios.post(`${API}/schedule`, entry, { headers: { Authorization: `Bearer ${token}` } })
        )
      );
      
      toast.success(`${entriesToCreate.length} Termin(e) hinzugefügt!`);
      setFormData({
        date: '',
        time: '08:00',
        end_time: '',
        title: '',
        category: 'other',
        description: '',
        child_id: selectedChild || '',
        recurrence: 'once',
        recurrence_count: 1
      });
      setShowAddModal(false);
      fetchSchedule();
    } catch (error) {
      toast.error('Fehler beim Hinzufügen');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      await axios.delete(`${API}/schedule/${entryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Eintrag gelöscht!');
      fetchSchedule();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const openAddModal = (date, hour) => {
    setSelectedDate(date);
    setSelectedHour(hour);
    setFormData({
      ...formData,
      date: date,
      time: `${String(hour).padStart(2, '0')}:00`,
      child_id: selectedChild || '',
      recurrence: 'once',
      recurrence_count: 1
    });
    setShowAddModal(true);
  };

  const handleQuickDateSelect = (event) => {
    const selectedDate = event.target.value;
    if (selectedDate) {
      setFormData({
        ...formData,
        date: selectedDate
      });
    }
  };

  const getWeekDays = (weekIndex) => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const startDay = startOfYear.getDay() || 7; // Make Monday = 1
    const daysToMonday = startDay === 1 ? 0 : (8 - startDay);
    
    const firstMonday = new Date(startOfYear);
    firstMonday.setDate(startOfYear.getDate() + daysToMonday);
    
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (weekIndex * 7));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
  };

  const getEntriesForDateAndHour = (date, hour) => {
    const dateStr = date.toISOString().split('T')[0];
    const key = `${dateStr}-${hour}`;
    return schedule[key] || [];
  };

  const getCategoryInfo = (category) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[3];
  };

  const weekDays = getWeekDays(currentWeek);
  const weekNumber = getWeekNumber(weekDays[0]);
  const weekStart = weekDays[0].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  const weekEnd = weekDays[6].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="space-y-6" data-testid="yearly-calendar">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Kalender</h2>
          <p className="text-gray-600">KW {weekNumber} - {weekStart} bis {weekEnd}</p>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            onChange={(e) => {
              const selectedDate = new Date(e.target.value);
              const startOfYear = new Date(selectedDate.getFullYear(), 0, 1);
              const daysSinceStart = Math.floor((selectedDate - startOfYear) / (24 * 60 * 60 * 1000));
              const weekIndex = Math.floor(daysSinceStart / 7);
              setCurrentWeek(Math.min(52, Math.max(0, weekIndex)));
            }}
            className="w-48"
            data-testid="calendar-date-picker"
            placeholder="Datum auswählen"
          />
          <Button
            onClick={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
            disabled={currentWeek === 0}
            variant="outline"
            data-testid="prev-week-btn"
          >
            <ChevronLeft className="w-4 h-4" />
            Vorherige
          </Button>
          <Button
            onClick={() => setCurrentWeek(Math.min(52, currentWeek + 1))}
            disabled={currentWeek === 52}
            variant="outline"
            data-testid="next-week-btn"
          >
            Nächste
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            data-testid="quick-add-btn"
            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full"
          >
            <Plus className="w-4 h-4" />
            Termin
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
                <th className="py-3 px-4 text-left font-semibold border-r border-teal-400 sticky left-0 bg-teal-500 z-10 min-w-[100px]">
                  Uhrzeit
                </th>
                {weekDays.map((day, idx) => (
                  <th key={idx} className="py-3 px-4 text-center font-semibold border-r border-teal-400 last:border-r-0 min-w-[150px]">
                    <div>{DAYS_SHORT[idx]}</div>
                    <div className="text-sm font-normal opacity-90">
                      {day.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                    </div>
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
                  {weekDays.map((day, dayIdx) => {
                    const entries = getEntriesForDateAndHour(day, hour);
                    return (
                      <td
                        key={dayIdx}
                        className="py-2 px-2 border-r border-gray-200 last:border-r-0 cursor-pointer align-top"
                        onClick={() => openAddModal(day.toISOString().split('T')[0], hour)}
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
                                {entry.time} {entry.end_time && `- ${entry.end_time}`}
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
                                data-testid={`delete-calendar-entry-${entry.id}`}
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
      </Card>

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
                  value={formData.child_id || "self"}
                  onValueChange={(value) => setFormData({ ...formData, child_id: value === "self" ? "" : value })}
                >
                  <SelectTrigger data-testid="calendar-child-select">
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
                <SelectTrigger data-testid="calendar-category-select">
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
              {formData.category === 'doctor' && (
                <p className="text-xs text-gray-600 mt-2">
                  🚨 Arzttermine werden 2 Tage vorher als Erinnerung angezeigt
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                data-testid="calendar-title-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. Arzttermin, Training"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="date">Datum *</Label>
              <Input
                id="date"
                type="date"
                data-testid="calendar-date-input"
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
                  data-testid="calendar-time-input"
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
                  data-testid="calendar-end-time-input"
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
                data-testid="calendar-description-input"
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
                data-testid="calendar-submit-btn"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
              >
                {loading ? 'Wird gespeichert...' : 'Hinzufügen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default YearlyCalendar;