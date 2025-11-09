import { useState, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AddVitalSignsModal = ({ open, onClose, onSuccess }) => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    pulse: "",
    blood_pressure: "",
    temperature: "",
    weight: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // At least one field should be filled
    if (!formData.pulse && !formData.blood_pressure && !formData.temperature && !formData.weight) {
      toast.error("Bitte füllen Sie mindestens ein Feld aus");
      return;
    }

    setLoading(true);
    try {
      const data = {
        pulse: formData.pulse ? parseInt(formData.pulse) : null,
        blood_pressure: formData.blood_pressure || null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null
      };

      await axios.post(
        `${API}/vital-signs`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Vitalwerte gespeichert!");
      setFormData({
        pulse: "",
        blood_pressure: "",
        temperature: "",
        weight: ""
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Fehler beim Speichern der Vitalwerte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vitalwerte hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="pulse">Puls (bpm)</Label>
            <Input
              id="pulse"
              name="pulse"
              data-testid="vital-pulse-input"
              type="number"
              value={formData.pulse}
              onChange={handleChange}
              placeholder="z.B. 72"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="blood_pressure">Blutdruck</Label>
            <Input
              id="blood_pressure"
              name="blood_pressure"
              data-testid="vital-bp-input"
              value={formData.blood_pressure}
              onChange={handleChange}
              placeholder="z.B. 120/80"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="temperature">Temperatur (°C)</Label>
            <Input
              id="temperature"
              name="temperature"
              data-testid="vital-temp-input"
              type="number"
              step="0.1"
              value={formData.temperature}
              onChange={handleChange}
              placeholder="z.B. 36.6"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="weight">Gewicht (kg)</Label>
            <Input
              id="weight"
              name="weight"
              data-testid="vital-weight-input"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={handleChange}
              placeholder="z.B. 75.5"
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="vital-cancel-btn"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-testid="vital-submit-btn"
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
            >
              {loading ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVitalSignsModal;