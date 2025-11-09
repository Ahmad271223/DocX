import { useState } from "react";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { useContext } from "react";

const TakeMedicationButton = ({ medication, onSuccess }) => {
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleTake = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/medications/${medication.id}/take`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.warning) {
        toast.warning(response.data.warning);
      } else {
        toast.success("Medikament eingenommen!");
      }
      
      onSuccess();
    } catch (error) {
      toast.error("Fehler beim Aufzeichnen der Einnahme");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      data-testid={`take-medication-btn-${medication.id}`}
      onClick={handleTake}
      disabled={loading || medication.stock === 0}
      size="sm"
      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex items-center gap-1"
    >
      <Check className="w-4 h-4" />
      {loading ? "..." : "Eingenommen"}
    </Button>
  );
};

export default TakeMedicationButton;