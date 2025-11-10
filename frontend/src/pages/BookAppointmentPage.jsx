import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Calendar, ArrowLeft, Repeat } from "lucide-react";
import { toast } from "sonner";

const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const { token, user } = useContext(AuthContext);
  const [doctor, setDoctor] = useState(null);
  const [children, setChildren] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    appointment_date: "",
    appointment_time: "",
    notes: "",
    child_id: "",
    is_recurring: false,
    recurrence_interval_weeks: 2,
    num_occurrences: 1,
  });

  useEffect(() => {
    fetchDoctorDetails();
    fetchChildren();
  }, [doctorId]);

  useEffect(() => {
    if (formData.appointment_date) {
      fetchAvailableSlots();
    }
  }, [formData.appointment_date]);

  const fetchDoctorDetails = async () => {
    try {
      const response = await axios.get(`${API}/doctors/${doctorId}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDoctor(response.data.profile);
    } catch (error) {
      console.error("Failed to fetch doctor:", error);
      toast.error("Arztdaten konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const response = await axios.get(`${API}/children`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChildren(response.data.children);
    } catch (error) {
      console.error("Failed to fetch children:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const endpoint = formData.is_recurring ? "/appointments/recurring" : "/appointments";
      
      const payload = {
        doctor_id: doctorId,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        notes: formData.notes,
        child_id: formData.child_id || null,
      };

      if (formData.is_recurring) {
        payload.is_recurring = true;
        payload.recurrence_interval_weeks = parseInt(formData.recurrence_interval_weeks);
        payload.num_occurrences = parseInt(formData.num_occurrences);
      }

      await axios.post(`${API}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (formData.is_recurring) {
        toast.success(`${formData.num_occurrences} Termine erfolgreich gebucht!`);
      } else {
        toast.success("Termin erfolgreich gebucht!");
      }
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to book appointment:", error);
      const errorMessage = error.response?.data?.detail || "Buchung fehlgeschlagen";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      {/* Header */}
      <nav className="backdrop-blur-xl bg-white/70 border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/doctor-search")}
            className="text-gray-600 hover:text-teal-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Heart className="w-8 h-8 text-teal-500" fill="currentColor" />
          <h1 className="text-xl font-bold text-gray-800">Termin buchen</h1>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Doctor Info */}
        <div className="bg-white rounded-2xl shadow-xl border border-teal-100 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {doctor.practice_name || doctor.name}
          </h2>
          <p className="text-teal-600 font-medium mb-2">{doctor.specialty}</p>
          <p className="text-gray-600 text-sm">
            {doctor.practice_address || doctor.address}, {doctor.practice_city || doctor.city}
          </p>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-teal-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* For whom */}
            <div>
              <Label htmlFor="child_id">Termin für</Label>
              <select
                id="child_id"
                value={formData.child_id}
                onChange={(e) => setFormData({ ...formData, child_id: e.target.value })}
                className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Mich selbst</option>
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointment_date">Datum *</Label>
                <Input
                  id="appointment_date"
                  name="appointment_date"
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="border-teal-200"
                />
              </div>
              <div>
                <Label htmlFor="appointment_time">Uhrzeit *</Label>
                <Input
                  id="appointment_time"
                  name="appointment_time"
                  type="time"
                  value={formData.appointment_time}
                  onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                  required
                  className="border-teal-200"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notizen (optional)</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Grund des Besuchs, Beschwerden, etc."
                className="w-full px-3 py-2 border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Recurring Appointment */}
            <div className="border-t border-teal-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="w-4 h-4 text-teal-600"
                />
                <Label htmlFor="is_recurring" className="cursor-pointer flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Wiederkehrende Termine erstellen
                </Label>
              </div>

              {formData.is_recurring && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recurrence_interval_weeks">Alle (Wochen)</Label>
                      <select
                        id="recurrence_interval_weeks"
                        value={formData.recurrence_interval_weeks}
                        onChange={(e) => setFormData({ ...formData, recurrence_interval_weeks: e.target.value })}
                        className="w-full px-3 py-2 border border-teal-300 rounded-lg"
                      >
                        <option value="1">1 Woche</option>
                        <option value="2">2 Wochen</option>
                        <option value="3">3 Wochen</option>
                        <option value="4">4 Wochen</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="num_occurrences">Anzahl Termine</Label>
                      <Input
                        id="num_occurrences"
                        type="number"
                        min="2"
                        max="52"
                        value={formData.num_occurrences}
                        onChange={(e) => setFormData({ ...formData, num_occurrences: e.target.value })}
                        className="border-teal-300"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Es werden {formData.num_occurrences} Termine alle {formData.recurrence_interval_weeks} Woche(n) erstellt.
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 text-lg rounded-full shadow-lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              {submitting 
                ? "Wird gebucht..." 
                : formData.is_recurring 
                  ? `${formData.num_occurrences} Termine buchen` 
                  : "Termin buchen"
              }
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentPage;
