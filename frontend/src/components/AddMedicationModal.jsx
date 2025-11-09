import { useState, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Scan, Plus, X } from "lucide-react";
import ScanPrescriptionModal from "./ScanPrescriptionModal";
import ScanBarcodeModal from "./ScanBarcodeModal";

const AddMedicationModal = ({ open, onClose, onSuccess, childId = null }) => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    frequency_times: [],
    stock: "",
    expiry_date: "",
    prescription_number: "",
    barcode: "",
    reminder_enabled: true,
    child_id: childId || ""
  });
  const [newTime, setNewTime] = useState("08:00");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTime = () => {
    if (!formData.frequency_times.includes(newTime)) {
      setFormData({
        ...formData,
        frequency_times: [...formData.frequency_times, newTime].sort()
      });
      setNewTime("08:00");
    }
  };

  const handleRemoveTime = (time) => {
    setFormData({
      ...formData,
      frequency_times: formData.frequency_times.filter(t => t !== time)
    });
  };

  const handlePrescriptionData = (data) => {
    setFormData({
      ...formData,
      name: data.medication_name || formData.name,
      dosage: data.dosage || formData.dosage,
      prescription_number: data.prescription_number || formData.prescription_number
    });
  };

  const handleBarcodeData = (data) => {
    setFormData({
      ...formData,
      name: data.name || formData.name,
      dosage: data.dosage || formData.dosage,
      barcode: data.barcode || formData.barcode
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.dosage || !formData.frequency || !formData.stock || !formData.expiry_date) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/medications`,
        { ...formData, stock: parseInt(formData.stock) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Medikament hinzugefügt!");
      setFormData({
        name: "",
        dosage: "",
        frequency: "",
        frequency_times: [],
        stock: "",
        expiry_date: "",
        prescription_number: "",
        barcode: "",
        reminder_enabled: true
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Fehler beim Hinzufügen des Medikaments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medikament hinzufügen</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              onClick={() => setShowPrescriptionModal(true)}
              variant="outline"
              className="flex-1 flex items-center gap-2"
              data-testid="open-prescription-scan-btn"
            >
              <Camera className="w-4 h-4" />
              Rezept scannen
            </Button>
            <Button
              type="button"
              onClick={() => setShowBarcodeModal(true)}
              variant="outline"
              className="flex-1 flex items-center gap-2"
              data-testid="open-barcode-scan-btn"
            >
              <Scan className="w-4 h-4" />
              Barcode scannen
            </Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                data-testid="medication-name-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="z.B. Aspirin"
                className="mt-1"
              />
            </div>
          <div>
            <Label htmlFor="dosage">Dosierung *</Label>
            <Input
              id="dosage"
              name="dosage"
              data-testid="medication-dosage-input"
              value={formData.dosage}
              onChange={handleChange}
              placeholder="z.B. 500mg"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="frequency">Häufigkeit *</Label>
            <Input
              id="frequency"
              name="frequency"
              data-testid="medication-frequency-input"
              value={formData.frequency}
              onChange={handleChange}
              placeholder="z.B. 2x täglich"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="stock">Vorrat (Stück) *</Label>
            <Input
              id="stock"
              name="stock"
              data-testid="medication-stock-input"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              placeholder="z.B. 20"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="expiry_date">Ablaufdatum *</Label>
            <Input
              id="expiry_date"
              name="expiry_date"
              data-testid="medication-expiry-input"
              type="date"
              value={formData.expiry_date}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="prescription_number">Rezeptnummer (optional)</Label>
            <Input
              id="prescription_number"
              name="prescription_number"
              data-testid="medication-prescription-input"
              value={formData.prescription_number}
              onChange={handleChange}
              placeholder="Optional"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="barcode">Barcode (optional)</Label>
            <Input
              id="barcode"
              name="barcode"
              data-testid="medication-barcode-input"
              value={formData.barcode}
              onChange={handleChange}
              placeholder="Optional"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label>Erinnerungszeiten</Label>
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  data-testid="medication-time-input"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddTime}
                  data-testid="add-time-btn"
                  className="bg-teal-500 hover:bg-teal-600 text-white"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {formData.frequency_times.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.frequency_times.map(time => (
                    <div
                      key={time}
                      className="flex items-center gap-2 bg-teal-100 text-teal-700 px-3 py-1 rounded-full"
                    >
                      <span>{time}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTime(time)}
                        className="hover:text-red-600"
                        data-testid={`remove-time-${time}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="medication-cancel-btn"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-testid="medication-submit-btn"
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
            >
              {loading ? "Wird gespeichert..." : "Hinzufügen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    
    <ScanPrescriptionModal
      open={showPrescriptionModal}
      onClose={() => setShowPrescriptionModal(false)}
      onSuccess={handlePrescriptionData}
    />
    
    <ScanBarcodeModal
      open={showBarcodeModal}
      onClose={() => setShowBarcodeModal(false)}
      onSuccess={handleBarcodeData}
    />
    </>
  );
};

export default AddMedicationModal;