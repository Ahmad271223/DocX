import { useState, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const AddAppointmentModal = ({ open, onClose, onSuccess }) => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    doctor_id: "demo-doctor-1",
    appointment_date: "",
    appointment_time: "",
    notes: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.appointment_date || !formData.appointment_time) {
      toast.error("Bitte füllen Sie Datum und Uhrzeit aus");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/appointments`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Termin hinzugefügt!");
      setFormData({
        doctor_id: "demo-doctor-1",
        appointment_date: "",
        appointment_time: "",
        notes: ""
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Fehler beim Hinzufügen des Termins");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Termin hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="appointment_date">Datum</Label>
            <Input
              id="appointment_date"
              name="appointment_date"
              data-testid="appointment-date-input"
              type="date"
              value={formData.appointment_date}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="appointment_time">Uhrzeit</Label>
            <Input
              id="appointment_time"
              name="appointment_time"
              data-testid="appointment-time-input"
              type="time"
              value={formData.appointment_time}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notizen (optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              data-testid="appointment-notes-input"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Notizen zum Termin"
              className="mt-1"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="appointment-cancel-btn"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-testid="appointment-submit-btn"
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
            >
              {loading ? "Wird gespeichert..." : "Hinzufügen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAppointmentModal;