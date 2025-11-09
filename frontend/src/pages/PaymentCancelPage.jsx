import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-12 text-center max-w-md w-full border-orange-100 shadow-2xl" data-testid="payment-cancel-card">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-16 h-16 text-orange-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Zahlung abgebrochen</h1>
        <p className="text-gray-600 mb-6">
          Sie haben die Zahlung abgebrochen. Keine Sorge, Sie können jederzeit zurückkehren und den Vorgang abschließen.
        </p>
        <div className="space-y-3">
          <Button
            data-testid="retry-payment-btn"
            onClick={() => navigate("/register")}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 text-lg rounded-full"
          >
            Erneut versuchen
          </Button>
          <Button
            data-testid="back-to-home-btn"
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full py-6 text-lg rounded-full border-teal-300 text-teal-700 hover:bg-teal-50"
          >
            Zur Startseite
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentCancelPage;