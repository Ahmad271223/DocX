import { useState, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Camera } from "lucide-react";

const ScanPrescriptionModal = ({ open, onClose, onSuccess }) => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Scan prescription
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const response = await axios.post(
        `${API}/medications/scan-prescription`,
        { image_data: base64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setExtractedData(response.data.extracted_data);
      toast.success("Rezept erfolgreich gescannt!");
    } catch (error) {
      toast.error("Fehler beim Scannen des Rezepts");
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUseData = () => {
    if (extractedData) {
      onSuccess(extractedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setPreview(null);
    setExtractedData(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rezept scannen</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!preview ? (
            <div className="border-2 border-dashed border-teal-300 rounded-xl p-12 text-center">
              <Camera className="w-16 h-16 text-teal-500 mx-auto mb-4" />
              <Label
                htmlFor="prescription-upload"
                className="cursor-pointer text-teal-600 hover:text-teal-700 font-semibold"
              >
                Foto aufnehmen oder hochladen
              </Label>
              <input
                id="prescription-upload"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                data-testid="prescription-upload-input"
              />
            </div>
          ) : (
            <div>
              <img
                src={preview}
                alt="Rezept Vorschau"
                className="w-full rounded-lg mb-4"
              />
              
              {loading && (
                <div className="text-center py-4">
                  <p className="text-gray-600">Rezept wird gescannt...</p>
                </div>
              )}
              
              {extractedData && (
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 space-y-2">
                  <h3 className="font-bold text-gray-800 mb-3">Erkannte Daten:</h3>
                  <p><strong>Medikament:</strong> {extractedData.medication_name}</p>
                  <p><strong>Dosierung:</strong> {extractedData.dosage}</p>
                  <p><strong>Menge:</strong> {extractedData.quantity}</p>
                  <p><strong>Rezeptnummer:</strong> {extractedData.prescription_number}</p>
                  
                  <div className="flex gap-3 mt-4">
                    <Button
                      onClick={handleUseData}
                      data-testid="use-extracted-data-btn"
                      className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
                    >
                      Daten übernehmen
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPreview(null);
                        setExtractedData(null);
                      }}
                    >
                      Neu scannen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScanPrescriptionModal;