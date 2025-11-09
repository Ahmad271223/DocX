import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Navigation, Clock } from "lucide-react";
import { toast } from "sonner";

const EmergencyAddresses = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pharmacies, setPharmacies] = useState([]);
  const [hospital, setHospital] = useState(null);
  const [emergencyPharmacy, setEmergencyPharmacy] = useState(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(coords);
          fetchNearbyPlaces(coords);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Standort konnte nicht ermittelt werden');
          // Fallback zu Mock-Daten wenn GPS nicht verfügbar
          loadMockData();
          setLoading(false);
        }
      );
    } else {
      toast.error('Geolocation wird nicht unterstützt');
      loadMockData();
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Mock-Daten für Berlin als Fallback
    setPharmacies([
      {
        id: '1',
        name: 'Apotheke am Markt',
        address: 'Marktplatz 5, 10115 Berlin',
        phone: '+49 30 12345678',
        distance: '0.5 km',
        type: 'pharmacy'
      },
      {
        id: '2',
        name: 'Stadt Apotheke',
        address: 'Hauptstraße 12, 10117 Berlin',
        phone: '+49 30 87654321',
        distance: '1.2 km',
        type: 'pharmacy'
      }
    ]);
    
    setHospital({
      id: 'h1',
      name: 'Charité Campus Mitte',
      address: 'Charitéplatz 1, 10117 Berlin',
      phone: '+49 30 450 50',
      distance: '2.3 km',
      type: 'hospital'
    });
    
    setEmergencyPharmacy({
      id: 'e1',
      name: 'Notdienst Apotheke Europa-Center',
      address: 'Tauentzienstraße 9, 10789 Berlin',
      phone: '+49 30 2616061',
      distance: '3.1 km',
      hours: '24 Stunden geöffnet',
      type: 'emergency'
    });
  };

  const fetchNearbyPlaces = async (coords) => {
    try {
      // In production: Use Google Places API or similar
      // For now: Mock data based on location
      loadMockData();
      toast.success('Standort aktualisiert');
    } catch (error) {
      console.error('Error fetching places:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const openMaps = (address) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <div className="space-y-6" data-testid="emergency-addresses">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notfall-Adressen</h2>
          <p className="text-gray-600">In Ihrer Nähe</p>
        </div>
        <Button
          onClick={getLocation}
          disabled={loading}
          data-testid="refresh-location-btn"
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-2 rounded-full"
        >
          <Navigation className="w-4 h-4" />
          {loading ? 'Wird aktualisiert...' : 'Standort aktualisieren'}
        </Button>
      </div>

      {/* Nearest Hospital */}
      {hospital && (
        <Card className="p-6 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl">🏥</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold text-red-800">Nächstes Krankenhaus</h3>
                  <p className="text-lg font-semibold text-gray-800 mt-1">{hospital.name}</p>
                </div>
                <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-semibold">
                  {hospital.distance}
                </span>
              </div>
              <div className="space-y-2 text-gray-700">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>{hospital.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-600" />
                  <a href={`tel:${hospital.phone}`} className="text-red-600 hover:text-red-700 font-semibold">
                    {hospital.phone}
                  </a>
                </div>
              </div>
              <Button
                onClick={() => openMaps(hospital.address)}
                data-testid="hospital-route-btn"
                className="mt-4 bg-red-600 hover:bg-red-700 text-white"
              >
                Route anzeigen
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Emergency Pharmacy */}
      {emergencyPharmacy && (
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl">⚡</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-xl font-bold text-orange-800">Notfall-Apotheke</h3>
                  <p className="text-lg font-semibold text-gray-800 mt-1">{emergencyPharmacy.name}</p>
                </div>
                <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-semibold">
                  {emergencyPharmacy.distance}
                </span>
              </div>
              <div className="space-y-2 text-gray-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="font-semibold text-orange-700">{emergencyPharmacy.hours}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>{emergencyPharmacy.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-600" />
                  <a href={`tel:${emergencyPharmacy.phone}`} className="text-orange-600 hover:text-orange-700 font-semibold">
                    {emergencyPharmacy.phone}
                  </a>
                </div>
              </div>
              <Button
                onClick={() => openMaps(emergencyPharmacy.address)}
                data-testid="emergency-pharmacy-route-btn"
                className="mt-4 bg-orange-600 hover:bg-orange-700 text-white"
              >
                Route anzeigen
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Regular Pharmacies */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Apotheken in der Nähe</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {pharmacies.map(pharmacy => (
            <Card key={pharmacy.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xl">💊</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800">{pharmacy.name}</h4>
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">
                      {pharmacy.distance}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-teal-600" />
                      <span>{pharmacy.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-teal-600" />
                      <a href={`tel:${pharmacy.phone}`} className="text-teal-600 hover:text-teal-700">
                        {pharmacy.phone}
                      </a>
                    </div>
                  </div>
                  <Button
                    onClick={() => openMaps(pharmacy.address)}
                    data-testid={`pharmacy-route-btn-${pharmacy.id}`}
                    variant="outline"
                    className="mt-3 w-full border-teal-300 text-teal-700 hover:bg-teal-50"
                    size="sm"
                  >
                    Route anzeigen
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmergencyAddresses;