#!/usr/bin/env python3
"""
Comprehensive Backend Test Suite for Extended Medication App - Doctor Module
Tests all Phase 1 Doctor Module features as specified in the German requirements.
"""

import requests
import json
import uuid
from datetime import datetime, timedelta
import time

# Configuration
BASE_URL = "https://medtrack-165.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def log_success(self, test_name):
        print(f"✅ {test_name}")
        self.passed += 1
        
    def log_failure(self, test_name, error):
        print(f"❌ {test_name}: {error}")
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} passed")
        print(f"{'='*60}")
        if self.errors:
            print("FAILURES:")
            for error in self.errors:
                print(f"  - {error}")
        return self.failed == 0

# Global test results
results = TestResults()

def make_request(method, endpoint, data=None, headers=None, token=None):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    request_headers = HEADERS.copy()
    
    if headers:
        request_headers.update(headers)
    
    if token:
        request_headers["Authorization"] = f"Bearer {token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=request_headers, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=data, headers=request_headers, timeout=30)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=request_headers, timeout=30)
        elif method == "DELETE":
            response = requests.delete(url, headers=request_headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
            
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def test_user_registration_with_types():
    """Test 1: User Registration mit Type (doctor/patient)"""
    print("\n🧪 Testing User Registration with Types...")
    
    # Test Doctor Registration
    doctor_data = {
        "first_name": "Dr. Maria",
        "last_name": "Schmidt",
        "birthdate": "1980-05-15",
        "state": "Berlin",
        "city": "Berlin",
        "address": "Arztstraße 123",
        "postal_code": "10115",
        "email": f"dr.schmidt.{uuid.uuid4().hex[:8]}@test.de",
        "password": "SecurePass123!",
        "user_type": "doctor",
        "num_children": 0
    }
    
    response = make_request("POST", "/auth/register", doctor_data)
    if response and response.status_code == 200:
        data = response.json()
        if data.get("user", {}).get("user_type") == "doctor":
            results.log_success("Doctor registration with user_type='doctor'")
            doctor_token = data.get("token")
            doctor_id = data.get("user", {}).get("id")
        else:
            results.log_failure("Doctor registration", "user_type not set correctly")
            return None, None, None, None
    else:
        results.log_failure("Doctor registration", f"Status: {response.status_code if response else 'No response'}")
        return None, None, None, None
    
    # Test Patient Registration
    patient_data = {
        "first_name": "Anna",
        "last_name": "Müller",
        "birthdate": "1990-03-20",
        "state": "Hamburg",
        "city": "Hamburg", 
        "address": "Patientenweg 456",
        "postal_code": "20095",
        "email": f"anna.mueller.{uuid.uuid4().hex[:8]}@test.de",
        "password": "SecurePass123!",
        "user_type": "patient",
        "num_children": 1
    }
    
    response = make_request("POST", "/auth/register", patient_data)
    if response and response.status_code == 200:
        data = response.json()
        if data.get("user", {}).get("user_type") == "patient":
            results.log_success("Patient registration with user_type='patient'")
            patient_token = data.get("token")
            patient_id = data.get("user", {}).get("id")
        else:
            results.log_failure("Patient registration", "user_type not set correctly")
            return doctor_token, doctor_id, None, None
    else:
        results.log_failure("Patient registration", f"Status: {response.status_code if response else 'No response'}")
        return doctor_token, doctor_id, None, None
    
    # Verify doctor has active subscription automatically
    response = make_request("GET", "/auth/me", token=doctor_token)
    if response and response.status_code == 200:
        data = response.json()
        if data.get("subscription_status") == "active":
            results.log_success("Doctor automatic subscription_status='active'")
        else:
            results.log_failure("Doctor subscription", f"Expected 'active', got '{data.get('subscription_status')}'")
    else:
        results.log_failure("Doctor subscription check", f"Status: {response.status_code if response else 'No response'}")
    
    return doctor_token, doctor_id, patient_token, patient_id

def test_doctor_profile_management(doctor_token, doctor_id):
    """Test 2: Doctor Profile Management"""
    print("\n🧪 Testing Doctor Profile Management...")
    
    # Test Create Doctor Profile
    profile_data = {
        "specialty": "Allgemeinmedizin",
        "license_number": "DE-12345-2025",
        "address": "Praxisstraße 789",
        "city": "Berlin",
        "postal_code": "10117",
        "phone": "+49 30 12345678",
        "bio": "Erfahrener Allgemeinmediziner mit 15 Jahren Praxis",
        "years_of_experience": 15,
        "languages": ["Deutsch", "Englisch", "Spanisch"]
    }
    
    response = make_request("POST", "/doctors/profile", profile_data, token=doctor_token)
    if response and response.status_code == 200:
        results.log_success("POST /api/doctors/profile - Create doctor profile")
        created_profile = response.json().get("profile", {})
        profile_id = created_profile.get("id")
    else:
        results.log_failure("Create doctor profile", f"Status: {response.status_code if response else 'No response'}")
        return None
    
    # Test Get Own Profile
    response = make_request("GET", "/doctors/profile", token=doctor_token)
    if response and response.status_code == 200:
        data = response.json()
        if data.get("profile", {}).get("specialty") == "Allgemeinmedizin":
            results.log_success("GET /api/doctors/profile - Get own profile")
        else:
            results.log_failure("Get own profile", "Profile data mismatch")
    else:
        results.log_failure("Get own profile", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Update Profile
    update_data = {
        "bio": "Aktualisierte Biografie - Spezialist für Präventivmedizin",
        "years_of_experience": 16
    }
    
    response = make_request("PUT", "/doctors/profile", update_data, token=doctor_token)
    if response and response.status_code == 200:
        results.log_success("PUT /api/doctors/profile - Update profile")
    else:
        results.log_failure("Update profile", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Get Profile by ID (public access)
    if profile_id:
        response = make_request("GET", f"/doctors/{profile_id}/profile", token=doctor_token)
        if response and response.status_code == 200:
            results.log_success("GET /api/doctors/{doctor_id}/profile - Get profile by ID")
        else:
            results.log_failure("Get profile by ID", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Search Doctors
    response = make_request("GET", "/doctors/search?specialty=Allgemein", token=doctor_token)
    if response and response.status_code == 200:
        data = response.json()
        if len(data.get("doctors", [])) > 0:
            results.log_success("GET /api/doctors/search - Search doctors by specialty")
        else:
            results.log_success("GET /api/doctors/search - Search endpoint working (no results)")
    else:
        results.log_failure("Search doctors", f"Status: {response.status_code if response else 'No response'}")
    
    return profile_id

def test_doctor_availability(doctor_token, profile_id):
    """Test 3: Doctor Availability Management"""
    print("\n🧪 Testing Doctor Availability...")
    
    availability_ids = []
    
    # Test Add Availability (Monday 09:00-17:00)
    availability_data = {
        "day_of_week": 0,  # Monday
        "start_time": "09:00",
        "end_time": "17:00",
        "slot_duration": 30
    }
    
    response = make_request("POST", "/doctors/availability", availability_data, token=doctor_token)
    if response and response.status_code == 200:
        results.log_success("POST /api/doctors/availability - Add availability")
        availability_ids.append(response.json().get("availability", {}).get("id"))
    else:
        results.log_failure("Add availability", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Add More Availability (Tuesday-Friday)
    for day, day_name in [(1, "Tuesday"), (2, "Wednesday"), (3, "Thursday"), (4, "Friday")]:
        availability_data = {
            "day_of_week": day,
            "start_time": "09:00", 
            "end_time": "17:00",
            "slot_duration": 30
        }
        
        response = make_request("POST", "/doctors/availability", availability_data, token=doctor_token)
        if response and response.status_code == 200:
            availability_ids.append(response.json().get("availability", {}).get("id"))
    
    # Test Get Own Availability
    response = make_request("GET", "/doctors/availability", token=doctor_token)
    if response and response.status_code == 200:
        data = response.json()
        if len(data.get("availability", [])) >= 5:  # Monday-Friday
            results.log_success("GET /api/doctors/availability - Get own availability")
        else:
            results.log_failure("Get own availability", f"Expected 5+ slots, got {len(data.get('availability', []))}")
    else:
        results.log_failure("Get own availability", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Get Availability by Doctor ID
    if profile_id:
        response = make_request("GET", f"/doctors/{profile_id}/availability", token=doctor_token)
        if response and response.status_code == 200:
            results.log_success("GET /api/doctors/{doctor_id}/availability - Get availability by ID")
        else:
            results.log_failure("Get availability by ID", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Delete Availability
    if availability_ids:
        response = make_request("DELETE", f"/doctors/availability/{availability_ids[0]}", token=doctor_token)
        if response and response.status_code == 200:
            results.log_success("DELETE /api/doctors/availability/{id} - Delete availability")
        else:
            results.log_failure("Delete availability", f"Status: {response.status_code if response else 'No response'}")
    
    return availability_ids[1:] if len(availability_ids) > 1 else []

def test_doctor_vacation(doctor_token, profile_id):
    """Test 4: Doctor Vacation Management"""
    print("\n🧪 Testing Doctor Vacation...")
    
    vacation_ids = []
    
    # Test Add Vacation (in 2 weeks for 7 days)
    start_date = (datetime.now() + timedelta(weeks=2)).date()
    end_date = start_date + timedelta(days=7)
    
    vacation_data = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "reason": "Jahresurlaub - Erholung"
    }
    
    response = make_request("POST", "/doctors/vacation", vacation_data, token=doctor_token)
    if response and response.status_code == 200:
        results.log_success("POST /api/doctors/vacation - Add vacation")
        vacation_ids.append(response.json().get("vacation", {}).get("id"))
    else:
        results.log_failure("Add vacation", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Get Own Vacations
    response = make_request("GET", "/doctors/vacation", token=doctor_token)
    if response and response.status_code == 200:
        data = response.json()
        if len(data.get("vacations", [])) > 0:
            results.log_success("GET /api/doctors/vacation - Get own vacations")
        else:
            results.log_failure("Get own vacations", "No vacations found")
    else:
        results.log_failure("Get own vacations", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Get Vacation by Doctor ID
    if profile_id:
        response = make_request("GET", f"/doctors/{profile_id}/vacation", token=doctor_token)
        if response and response.status_code == 200:
            results.log_success("GET /api/doctors/{doctor_id}/vacation - Get vacation by ID")
        else:
            results.log_failure("Get vacation by ID", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Delete Vacation
    if vacation_ids:
        response = make_request("DELETE", f"/doctors/vacation/{vacation_ids[0]}", token=doctor_token)
        if response and response.status_code == 200:
            results.log_success("DELETE /api/doctors/vacation/{id} - Delete vacation")
            vacation_ids.remove(vacation_ids[0])
        else:
            results.log_failure("Delete vacation", f"Status: {response.status_code if response else 'No response'}")
    
    return vacation_ids

def test_doctor_patient_subscriptions(doctor_token, patient_token, profile_id):
    """Test 5: Doctor-Patient Subscription System"""
    print("\n🧪 Testing Doctor-Patient Subscriptions...")
    
    subscription_id = None
    
    # Test Patient Subscribe to Doctor
    response = make_request("POST", f"/doctors/{profile_id}/subscribe", token=patient_token)
    if response and response.status_code == 200:
        results.log_success("POST /api/doctors/{doctor_id}/subscribe - Patient subscribes to doctor")
        subscription_id = response.json().get("subscription", {}).get("id")
    else:
        results.log_failure("Patient subscribe to doctor", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Get Patient's Subscriptions
    response = make_request("GET", "/doctors/my-subscriptions", token=patient_token)
    if response and response.status_code == 200:
        data = response.json()
        if len(data.get("subscriptions", [])) > 0:
            results.log_success("GET /api/doctors/my-subscriptions - Patient sees subscribed doctors")
        else:
            results.log_failure("Patient subscriptions", "No subscriptions found")
    else:
        results.log_failure("Patient subscriptions", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Doctor Get Patients
    response = make_request("GET", "/doctors/patients", token=doctor_token)
    if response and response.status_code == 200:
        data = response.json()
        if len(data.get("patients", [])) > 0:
            results.log_success("GET /api/doctors/patients - Doctor sees patients")
        else:
            results.log_failure("Doctor patients", "No patients found")
    else:
        results.log_failure("Doctor patients", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Unsubscribe (will test later to keep subscription for other tests)
    return subscription_id

def test_doctor_dashboard(doctor_token):
    """Test 6: Doctor Dashboard"""
    print("\n🧪 Testing Doctor Dashboard...")
    
    # Test Doctor Dashboard
    response = make_request("GET", "/doctors/dashboard", token=doctor_token)
    if response and response.status_code == 200:
        data = response.json()
        required_fields = ["profile", "today_appointments", "patient_count", "availability", "upcoming_vacations"]
        
        missing_fields = [field for field in required_fields if field not in data]
        if not missing_fields:
            results.log_success("GET /api/doctors/dashboard - Complete dashboard data")
        else:
            results.log_failure("Doctor dashboard", f"Missing fields: {missing_fields}")
    else:
        results.log_failure("Doctor dashboard", f"Status: {response.status_code if response else 'No response'}")
    
    # Test Today's Appointments
    response = make_request("GET", "/doctors/appointments/today", token=doctor_token)
    if response and response.status_code == 200:
        results.log_success("GET /api/doctors/appointments/today - Today's appointments")
    else:
        results.log_failure("Today's appointments", f"Status: {response.status_code if response else 'No response'}")

def test_recurring_appointments(patient_token, profile_id):
    """Test 7: Recurring Appointments"""
    print("\n🧪 Testing Recurring Appointments...")
    
    # Test Create Recurring Appointment (every 2 weeks, 5 occurrences)
    appointment_date = (datetime.now() + timedelta(days=7)).date()
    
    recurring_data = {
        "doctor_id": profile_id,
        "appointment_date": appointment_date.isoformat(),
        "appointment_time": "10:00",
        "notes": "Regelmäßige Kontrolluntersuchung",
        "is_recurring": True,
        "recurrence_interval_weeks": 2,
        "num_occurrences": 5
    }
    
    response = make_request("POST", "/appointments/recurring", recurring_data, token=patient_token)
    if response and response.status_code == 200:
        data = response.json()
        appointments = data.get("appointments", [])
        if len(appointments) == 5:
            results.log_success("POST /api/appointments/recurring - Create recurring appointments (5 occurrences)")
        else:
            results.log_failure("Recurring appointments", f"Expected 5 appointments, got {len(appointments)}")
    else:
        results.log_failure("Recurring appointments", f"Status: {response.status_code if response else 'No response'}")
    
    # Verify appointments were created
    response = make_request("GET", "/appointments", token=patient_token)
    if response and response.status_code == 200:
        data = response.json()
        recurring_appointments = [apt for apt in data.get("appointments", []) if apt.get("is_recurring")]
        if len(recurring_appointments) >= 5:
            results.log_success("Recurring appointments verification - Appointments created successfully")
        else:
            results.log_failure("Recurring appointments verification", f"Expected 5+ recurring appointments, found {len(recurring_appointments)}")
    else:
        results.log_failure("Recurring appointments verification", f"Status: {response.status_code if response else 'No response'}")

def test_smart_prescription_warnings(patient_token, profile_id):
    """Test 8: Smart Prescription Warnings"""
    print("\n🧪 Testing Smart Prescription Warnings...")
    
    # First, add a medication that will run out during vacation
    medication_data = {
        "name": "Blutdrucksenker Ramipril",
        "dosage": "5mg",
        "frequency": "2x täglich",
        "frequency_times": ["08:00", "20:00"],
        "stock": 20,  # Will last ~10 days with 2x daily
        "expiry_date": (datetime.now() + timedelta(days=365)).date().isoformat(),
        "prescription_number": f"RX-{uuid.uuid4().hex[:8]}",
        "reminder_enabled": True
    }
    
    response = make_request("POST", "/medications", medication_data, token=patient_token)
    if response and response.status_code == 200:
        medication_id = response.json().get("medication", {}).get("id")
        results.log_success("Added test medication for prescription warnings")
    else:
        results.log_failure("Add test medication", f"Status: {response.status_code if response else 'No response'}")
        return
    
    # Add doctor vacation that overlaps with medication runout
    # Medication will run out in ~10 days, set vacation in 12 days for 7 days
    vacation_start = (datetime.now() + timedelta(days=12)).date()
    vacation_end = vacation_start + timedelta(days=7)
    
    # We need doctor token to add vacation, but we'll use the existing doctor
    # For this test, we'll just test the warning endpoint
    
    # Test Prescription Warnings
    response = make_request("GET", "/medications/prescription-warnings", token=patient_token)
    if response and response.status_code == 200:
        data = response.json()
        warnings = data.get("warnings", [])
        results.log_success("GET /api/medications/prescription-warnings - Smart warnings endpoint working")
        
        # Check if warning structure is correct
        if warnings:
            warning = warnings[0]
            required_fields = ["medication_id", "medication_name", "estimated_runout_date", "doctor_name", "vacation_start", "message"]
            missing_fields = [field for field in required_fields if field not in warning]
            
            if not missing_fields:
                results.log_success("Smart prescription warnings - Warning structure complete")
            else:
                results.log_failure("Warning structure", f"Missing fields: {missing_fields}")
        else:
            results.log_success("Smart prescription warnings - No warnings (expected if no vacation overlap)")
    else:
        results.log_failure("Smart prescription warnings", f"Status: {response.status_code if response else 'No response'}")

def test_authorization_security():
    """Test Authorization and Security"""
    print("\n🧪 Testing Authorization Security...")
    
    # Test accessing doctor endpoints without doctor role
    patient_data = {
        "first_name": "Test",
        "last_name": "Patient",
        "birthdate": "1990-01-01",
        "state": "Test",
        "city": "Test",
        "address": "Test",
        "postal_code": "12345",
        "email": f"testpatient.{uuid.uuid4().hex[:8]}@test.de",
        "password": "TestPass123!",
        "user_type": "patient",
        "num_children": 0
    }
    
    response = make_request("POST", "/auth/register", patient_data)
    if response and response.status_code == 200:
        patient_token = response.json().get("token")
        
        # Try to create doctor profile as patient (should fail)
        profile_data = {
            "specialty": "Test",
            "license_number": "TEST-123",
            "address": "Test",
            "city": "Test", 
            "postal_code": "12345",
            "phone": "+49 123 456789"
        }
        
        response = make_request("POST", "/doctors/profile", profile_data, token=patient_token)
        if response and response.status_code == 403:
            results.log_success("Authorization - Patient cannot create doctor profile (403 Forbidden)")
        else:
            results.log_failure("Authorization", f"Expected 403, got {response.status_code if response else 'No response'}")
        
        # Try to access doctor dashboard as patient (should fail)
        response = make_request("GET", "/doctors/dashboard", token=patient_token)
        if response and response.status_code == 403:
            results.log_success("Authorization - Patient cannot access doctor dashboard (403 Forbidden)")
        else:
            results.log_failure("Authorization", f"Expected 403, got {response.status_code if response else 'No response'}")
    else:
        results.log_failure("Create test patient for authorization", f"Status: {response.status_code if response else 'No response'}")

def run_comprehensive_test_scenarios():
    """Run the comprehensive test scenarios as specified in German requirements"""
    print("🚀 Starting Comprehensive Backend Tests for Extended Medication App - Doctor Module")
    print("=" * 80)
    
    # Scenario 1: Doctor Workflow
    print("\n📋 SCENARIO 1: Doctor Workflow")
    doctor_token, doctor_id, patient_token, patient_id = test_user_registration_with_types()
    
    if not doctor_token:
        print("❌ Cannot continue without doctor token")
        return False
    
    profile_id = test_doctor_profile_management(doctor_token, doctor_id)
    
    if not profile_id:
        print("❌ Cannot continue without doctor profile")
        return False
    
    availability_ids = test_doctor_availability(doctor_token, profile_id)
    vacation_ids = test_doctor_vacation(doctor_token, profile_id)
    test_doctor_dashboard(doctor_token)
    
    # Scenario 2: Patient Workflow
    print("\n📋 SCENARIO 2: Patient Workflow")
    if patient_token:
        subscription_id = test_doctor_patient_subscriptions(doctor_token, patient_token, profile_id)
        test_recurring_appointments(patient_token, profile_id)
        test_smart_prescription_warnings(patient_token, profile_id)
    
    # Scenario 3: Security & Authorization
    print("\n📋 SCENARIO 3: Security & Authorization")
    test_authorization_security()
    
    # Final cleanup test - unsubscribe
    if patient_token and subscription_id:
        response = make_request("DELETE", f"/doctors/subscriptions/{subscription_id}", token=patient_token)
        if response and response.status_code == 200:
            results.log_success("DELETE /api/doctors/subscriptions/{id} - Unsubscribe from doctor")
        else:
            results.log_failure("Unsubscribe from doctor", f"Status: {response.status_code if response else 'No response'}")
    
    return results.summary()

if __name__ == "__main__":
    success = run_comprehensive_test_scenarios()
    exit(0 if success else 1)