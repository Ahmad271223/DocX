import { useState, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Scan } from "lucide-react";

const ScanBarcodeModal = ({ open, onClose, onSuccess }) => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [medicationData, setMedicationData] = useState(null);

  const handleScan = async () => {
    if (!barcode.trim()) {
      toast.error("Bitte geben Sie einen Barcode ein");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/medications/scan-barcode`,
        { barcode: barcode.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMedicationData(response.data.medication_data);
      toast.success("Barcode erfolgreich gescannt!");
    } catch (error) {
      toast.error("Fehler beim Scannen des Barcodes");
    } finally {
      setLoading(false);
    }
  };

  const handleUseData = () => {
    if (medicationData) {
      onSuccess(medicationData);
      handleClose();
    }
  };

  const handleClose = () => {
    setBarcode("");
    setMedicationData(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Barcode / QR-Code scannen</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="barcode">Barcode oder QR-Code</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="barcode"
                data-testid="barcode-input"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Code eingeben oder scannen"
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
              />
              <Button
                onClick={handleScan}
                disabled={loading}
                data-testid="scan-barcode-btn"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
              >
                <Scan className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {medicationData && (
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-gray-800 mb-3">Gefundenes Medikament:</h3>
              <p><strong>Name:</strong> {medicationData.name}</p>
              <p><strong>Dosierung:</strong> {medicationData.dosage}</p>
              <p><strong>Hersteller:</strong> {medicationData.manufacturer}</p>
              <p><strong>Barcode:</strong> {medicationData.barcode}</p>
              
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleUseData}
                  data-testid="use-barcode-data-btn"
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
                >
                  Daten übernehmen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBarcode("");
                    setMedicationData(null);
                  }}
                >
                  Neu scannen
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScanBarcodeModal;