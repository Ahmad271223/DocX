#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Erweitern der bestehenden Medikamenten-App um folgende Features:
  
  PHASE 1: Ärzte-Modul
  - Ärzte können Profile erstellen mit Fachgebiet, Lizenz, etc.
  - Ärzte können verfügbare Terminzeiten definieren (wöchentlich)
  - Ärzte können Urlaubszeiten eintragen
  - Patienten können Ärzte suchen und abonnieren
  - Wiederkehrende Termine (alle 2-3 Wochen)
  - Automatische Benachrichtigung wenn Rezept während Arzt-Urlaub ausläuft
  - Ärzte-Dashboard mit Kalender, Patientenliste, heutige Termine
  
  PHASE 2: Familie & Notfall-Funktion
  - Nutzer können Familie/Freunde über Code/Link verbinden
  - Medikamente und Termine von Verbundenen sehen
  - Notfall-Medikamentensuche (wer hat welches Medikament)
  
  PHASE 3: Externe Integrationen
  - eRezept API
  - Apothekenbestände (IhreApotheken.de / Noweda)
  - Krankenkassenkarte einlesen
  - Online-Preisvergleich

backend:
  - task: "User-Type (patient/doctor) hinzufügen"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "User-Model erweitert mit user_type field (patient/doctor). Registrierung und Login aktualisiert."
  
  - task: "DoctorProfile Model und CRUD Endpoints"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "DoctorProfile Model mit allen Details erstellt. Endpoints: POST/GET/PUT /api/doctors/profile, GET /api/doctors/search, GET /api/doctors/{id}/profile"
  
  - task: "DoctorAvailability Model und Endpoints"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "DoctorAvailability Model für wöchentliche Verfügbarkeit. Endpoints: POST/GET/DELETE /api/doctors/availability"
  
  - task: "DoctorVacation Model und Endpoints"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "DoctorVacation Model für Urlaubszeiten. Endpoints: POST/GET/DELETE /api/doctors/vacation"
  
  - task: "Doctor-Patient Subscription System"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "DoctorPatientSubscription Model. Endpoints: POST /api/doctors/{id}/subscribe, GET /api/doctors/my-subscriptions, DELETE /api/doctors/subscriptions/{id}"
  
  - task: "Doctor Dashboard und Patient List"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Doctor Dashboard zeigt Profile, heutige Termine, Patientenanzahl, Verfügbarkeit, Urlaub. Endpoints: GET /api/doctors/dashboard, GET /api/doctors/patients, GET /api/doctors/appointments/today"
  
  - task: "Recurring Appointments"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Appointment Model erweitert mit is_recurring, recurrence_interval_weeks. Endpoint: POST /api/appointments/recurring erstellt mehrere Termine automatisch."
  
  - task: "Smart Prescription Warnings"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Intelligente Logik die prüft ob Medikamente während Arzt-Urlaub auslaufen. Warnt 1-2 Wochen vorher. Endpoint: GET /api/medications/prescription-warnings"

frontend:

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "User-Type (patient/doctor) hinzufügen"
    - "DoctorProfile Model und CRUD Endpoints"
    - "DoctorAvailability Model und Endpoints"
    - "DoctorVacation Model und Endpoints"
    - "Doctor-Patient Subscription System"
    - "Doctor Dashboard und Patient List"
    - "Recurring Appointments"
    - "Smart Prescription Warnings"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Backend Phase 1 (Ärzte-Modul) vollständig implementiert.
      
      Implementierte Features:
      1. User kann sich als "patient" oder "doctor" registrieren
      2. Ärzte können detaillierte Profile erstellen (Fachgebiet, Lizenz, etc.)
      3. Ärzte können wöchentliche Verfügbarkeitszeiten definieren
      4. Ärzte können Urlaubszeiten eintragen
      5. Patienten können Ärzte suchen und abonnieren
      6. Wiederkehrende Termine (z.B. alle 2 Wochen)
      7. Doctor Dashboard mit allen wichtigen Infos
      8. Smart Warnings: App warnt wenn Medikament während Arzt-Urlaub ausläuft
      
      Bitte teste alle neuen Backend-Endpunkte:
      - Auth mit user_type
      - Doctor Profile CRUD
      - Doctor Availability
      - Doctor Vacation
      - Subscriptions
      - Dashboard
      - Recurring Appointments
      - Prescription Warnings
      
      Teste mit verschiedenen Szenarien:
      - Doctor Registration
      - Patient Registration
      - Doctor erstellt Profil
      - Doctor setzt Verfügbarkeit
      - Doctor setzt Urlaub
      - Patient sucht Ärzte
      - Patient abonniert Arzt
      - Patient erstellt wiederkehrende Termine
      - Prescription Warning während Urlaub