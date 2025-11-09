import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    }
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    if (attempts >= maxAttempts) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/payment/status/${sessionId}`);
      setPaymentStatus(response.data);

      if (response.data.payment_status === "paid") {
        setLoading(false);
      } else if (response.data.status === "expired") {
        setLoading(false);
      } else {
        // Continue polling
        setAttempts(prev => prev + 1);
        setTimeout(pollPaymentStatus, 2000);
      }
    } catch (error) {
      console.error("Error checking payment status", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-12 text-center max-w-md w-full">
          <Loader2 className="w-16 h-16 text-teal-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Zahlungsstatus wird überprüft...</h2>
          <p className="text-gray-600">Bitte warten Sie einen Moment</p>
        </Card>
      </div>
    );
  }

  if (paymentStatus?.payment_status === "paid") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-12 text-center max-w-md w-full border-teal-100 shadow-2xl" data-testid="payment-success-card">
          <div className="w-24 h-24 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Zahlung erfolgreich!</h1>
          <p className="text-gray-600 mb-6">
            Vielen Dank für Ihr Abonnement. Ihre Zahlung wurde bestätigt.
          </p>
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Betrag</p>
            <p className="text-2xl font-bold text-teal-600">
              {paymentStatus.amount.toFixed(2)} {paymentStatus.currency.toUpperCase()}
            </p>
          </div>
          <Button
            data-testid="go-to-dashboard-btn"
            onClick={() => navigate("/dashboard")}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 text-lg rounded-full"
          >
            Zum Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="p-12 text-center max-w-md w-full border-red-100 shadow-2xl">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">❌</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Zahlung fehlgeschlagen</h1>
        <p className="text-gray-600 mb-6">
          Ihre Zahlung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.
        </p>
        <Button
          onClick={() => navigate("/register")}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 text-lg rounded-full"
        >
          Zurück zur Registrierung
        </Button>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;