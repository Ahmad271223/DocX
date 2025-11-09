import { useState, useContext } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AddChildModal = ({ open, onClose, onSuccess }) => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    birthdate: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.birthdate) {
      toast.error("Bitte füllen Sie alle Felder aus");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/children`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Kind hinzugefügt!");
      setFormData({
        first_name: "",
        last_name: "",
        birthdate: ""
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Fehler beim Hinzufügen des Kindes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kind hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="first_name">Vorname</Label>
            <Input
              id="first_name"
              name="first_name"
              data-testid="child-first-name-input"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Vorname"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="last_name">Nachname</Label>
            <Input
              id="last_name"
              name="last_name"
              data-testid="child-last-name-input"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Nachname"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="birthdate">Geburtsdatum</Label>
            <Input
              id="birthdate"
              name="birthdate"
              data-testid="child-birthdate-input"
              type="date"
              value={formData.birthdate}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="child-cancel-btn"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading}
              data-testid="child-submit-btn"
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

export default AddChildModal;