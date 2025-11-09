import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Pill, Calendar, Users, Activity, Bell } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-teal-500" fill="currentColor" />
            <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              HealthLink
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              data-testid="nav-login-btn"
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-teal-700 hover:text-teal-800 hover:bg-teal-50"
            >
              Anmelden
            </Button>
            <Button
              data-testid="nav-register-btn"
              onClick={() => navigate("/register")}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-6 rounded-full shadow-lg shadow-teal-200"
            >
              Registrieren
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                Gesundheit
              </span>
              <br />
              <span className="text-gray-800">für die ganze Familie</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Verwalten Sie Medikamente, Termine und Gesundheitsdaten an einem Ort. 
              Einfach, sicher und für die ganze Familie.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                data-testid="hero-get-started-btn"
                onClick={() => navigate("/register")}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-8 py-6 text-lg rounded-full shadow-xl shadow-teal-200 hover:shadow-2xl hover:shadow-teal-300 transition-all duration-300"
              >
                Jetzt starten
              </Button>
              <Button
                data-testid="hero-learn-more-btn"
                variant="outline"
                className="px-8 py-6 text-lg rounded-full border-2 border-teal-300 text-teal-700 hover:bg-teal-50 transition-all duration-300"
              >
                Mehr erfahren
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Alles für Ihre Gesundheit
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Pill className="w-10 h-10" />}
              title="Medikamentenverwaltung"
              description="Scannen Sie Rezepte, verwalten Sie Vorräte und erhalten Sie Erinnerungen."
            />
            <FeatureCard
              icon={<Calendar className="w-10 h-10" />}
              title="Arzttermine"
              description="Planen und verwalten Sie Termine für die ganze Familie."
            />
            <FeatureCard
              icon={<Users className="w-10 h-10" />}
              title="Familienverwaltung"
              description="Verwalten Sie die Gesundheit aller Familienmitglieder."
            />
            <FeatureCard
              icon={<Activity className="w-10 h-10" />}
              title="Vitalwerte"
              description="Tracken Sie Puls, Blutdruck und andere Gesundheitsdaten."
            />
            <FeatureCard
              icon={<Bell className="w-10 h-10" />}
              title="Notfallbenachrichtigungen"
              description="Schnelle Hilfe wenn ein Medikament dringend benötigt wird."
            />
            <FeatureCard
              icon={<Heart className="w-10 h-10" />}
              title="Apotheken-Finder"
              description="Finden Sie Apotheken in Ihrer Nähe mit Live-Verfügbarkeit."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Einfache Preise
            </span>
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-white to-teal-50 rounded-3xl p-10 shadow-2xl border border-teal-100">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">Familien-Abo</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-teal-600">2,99€</span>
                  <span className="text-gray-600">/Monat</span>
                </div>
                <p className="text-gray-600 mt-2">für Erwachsene (ab 18)</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <PricingFeature text="Komplette Medikamentenverwaltung" />
                <PricingFeature text="Unbegrenzte Termine" />
                <PricingFeature text="Vitalwerte-Tracking" />
                <PricingFeature text="Apotheken-Finder" />
                <PricingFeature text="Notfallbenachrichtigungen" />
              </div>
              
              <div className="bg-gradient-to-r from-teal-100 to-emerald-100 rounded-xl p-6 mb-8">
                <p className="text-center text-teal-800 font-semibold">
                  + Nur 1,99€ pro Kind (unter 18)
                </p>
              </div>
              
              <Button
                data-testid="pricing-start-now-btn"
                onClick={() => navigate("/register")}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 text-lg rounded-full shadow-lg"
              >
                Jetzt starten
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-6 h-6" fill="currentColor" />
            <span className="text-xl font-bold">HealthLink</span>
          </div>
          <p className="text-teal-100">© 2025 HealthLink. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="group relative bg-gradient-to-br from-white to-teal-50 rounded-2xl p-8 shadow-lg border border-teal-100 hover:shadow-2xl hover:scale-105 transition-all duration-300">
      <div className="text-teal-500 mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const PricingFeature = ({ text }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-gray-700">{text}</span>
    </div>
  );
};

export default LandingPage;