from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', 72))

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Security
security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    birthdate: str
    state: str
    city: str
    address: str
    postal_code: str
    email: EmailStr
    password_hash: str
    user_type: str = "patient"  # patient, doctor
    subscription_status: str = "pending"  # pending, active, cancelled
    subscription_plan: Optional[str] = None
    subscription_amount: float = 0.0
    max_children: int = 0  # Maximum number of children allowed based on subscription
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Child(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    parent_id: str
    first_name: str
    last_name: str
    birthdate: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Medication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    child_id: Optional[str] = None  # If medication belongs to a child
    child_name: Optional[str] = None  # For display in parent view
    name: str
    dosage: str
    frequency: str  # e.g., "2x täglich"
    frequency_times: List[str] = []  # e.g., ["08:00", "20:00"]
    stock: int
    expiry_date: str
    prescription_number: Optional[str] = None
    barcode: Optional[str] = None
    prescription_image: Optional[str] = None  # Base64 or URL
    reminder_enabled: bool = True
    last_taken: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Pharmacy(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    city: str
    postal_code: str
    phone: str
    latitude: float
    longitude: float

class DoctorProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Links to User with user_type="doctor"
    practice_name: str  # Name der Praxis
    practice_address: str  # Adresse der Praxis
    practice_city: str
    practice_postal_code: str
    practice_phone: str
    practice_email: EmailStr
    doctor_names: List[str] = []  # Namen aller Ärzte in der Praxis
    specialty: str
    license_number: str
    license_document: Optional[str] = None  # Base64 encoded document or URL
    bio: Optional[str] = None
    years_of_experience: Optional[int] = None
    languages: List[str] = []
    profile_image: Optional[str] = None  # Base64 encoded or URL
    # Legacy fields for backward compatibility
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Doctor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    specialty: str
    address: str
    phone: str
    email: EmailStr

class DoctorAvailability(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doctor_id: str
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str  # HH:MM format
    end_time: str  # HH:MM format
    break_start: Optional[str] = None  # HH:MM format for lunch break start
    break_end: Optional[str] = None  # HH:MM format for lunch break end
    slot_duration: int = 30  # minutes per appointment slot
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DoctorVacation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doctor_id: str
    start_date: str  # YYYY-MM-DD format
    end_date: str  # YYYY-MM-DD format
    reason: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DoctorPatientSubscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doctor_id: str
    patient_id: str
    status: str = "active"  # active, cancelled
    subscribed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FamilyConnection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # User who initiated the connection
    connected_user_id: str  # User who is connected
    connection_code: Optional[str] = None  # Code used to connect
    status: str = "active"  # active, cancelled
    nickname: Optional[str] = None  # Optional nickname for the connection
    relationship: Optional[str] = None  # e.g., "Parent", "Child", "Partner", "Friend"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    child_id: Optional[str] = None
    child_name: Optional[str] = None
    doctor_id: str
    appointment_date: str
    appointment_time: str
    status: str = "scheduled"  # scheduled, completed, cancelled
    notes: Optional[str] = None
    is_recurring: bool = False
    recurrence_interval_weeks: Optional[int] = None  # e.g., 2 for every 2 weeks, 3 for every 3 weeks
    parent_appointment_id: Optional[str] = None  # Links to original recurring appointment
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class VitalSigns(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    child_id: Optional[str] = None
    child_name: Optional[str] = None
    pulse: Optional[int] = None
    blood_pressure: Optional[str] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    recorded_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: Optional[str] = None
    email: Optional[str] = None
    amount: float
    currency: str
    payment_status: str  # initiated, paid, failed, expired
    metadata: Optional[Dict] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MedicationIntake(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    medication_id: str
    taken_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WeeklyScheduleEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    child_id: Optional[str] = None  # If entry belongs to a child
    child_name: Optional[str] = None  # For display in parent view
    date: str  # YYYY-MM-DD format for specific dates
    time: str  # HH:MM format for single time or start time
    end_time: Optional[str] = None  # HH:MM format, optional for single-time events
    title: str
    category: str = "other"  # food, sport, doctor, other
    description: Optional[str] = None
    color: str = "#14b8a6"  # Auto-set based on category
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class RecurringScheduleEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    child_id: Optional[str] = None
    child_name: Optional[str] = None
    day_of_week: int  # 0=Monday, 6=Sunday
    start_hour: int  # 0-23
    end_hour: int  # 0-23
    title: str
    category: str = "other"
    description: Optional[str] = None
    color: str = "#14b8a6"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ============== REQUEST MODELS ==============

class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    birthdate: str
    state: str
    city: str
    address: str
    postal_code: str
    email: EmailStr
    password: str
    num_children: int = 0
    user_type: str = "patient"  # patient or doctor

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AddChildRequest(BaseModel):
    first_name: str
    last_name: str
    birthdate: str

class AddMedicationRequest(BaseModel):
    name: str
    dosage: str
    frequency: str
    frequency_times: List[str] = []
    stock: int
    expiry_date: str
    prescription_number: Optional[str] = None
    barcode: Optional[str] = None
    prescription_image: Optional[str] = None
    reminder_enabled: bool = True
    child_id: Optional[str] = None

class AddAppointmentRequest(BaseModel):
    doctor_id: str
    appointment_date: str
    appointment_time: str
    notes: Optional[str] = None
    child_id: Optional[str] = None
    is_recurring: bool = False
    recurrence_interval_weeks: Optional[int] = None
    num_occurrences: Optional[int] = None  # How many recurring appointments to create

class AddVitalSignsRequest(BaseModel):
    pulse: Optional[int] = None
    blood_pressure: Optional[str] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    child_id: Optional[str] = None

class CheckoutRequest(BaseModel):
    origin_url: str
    num_children: int
    user_email: str

class TakeMedicationRequest(BaseModel):
    medication_id: str

class ScanPrescriptionRequest(BaseModel):
    image_data: str  # Base64 encoded image

class ScanBarcodeRequest(BaseModel):
    barcode: str

class AddScheduleEntryRequest(BaseModel):
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    end_time: Optional[str] = None  # HH:MM, optional
    title: str
    category: str = "other"  # food, sport, doctor, other
    description: Optional[str] = None
    child_id: Optional[str] = None

class AddRecurringScheduleRequest(BaseModel):
    day_of_week: int  # 0-6
    start_hour: int  # 0-23
    end_hour: int  # 0-23
    title: str
    category: str = "other"
    description: Optional[str] = None
    child_id: Optional[str] = None

class CreateDoctorProfileRequest(BaseModel):
    practice_name: str
    practice_address: str
    practice_city: str
    practice_postal_code: str
    practice_phone: str
    practice_email: EmailStr
    doctor_names: List[str]
    specialty: str
    license_number: str
    license_document: Optional[str] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    years_of_experience: Optional[int] = None
    languages: List[str] = []

class UpdateDoctorProfileRequest(BaseModel):
    practice_name: Optional[str] = None
    practice_address: Optional[str] = None
    practice_city: Optional[str] = None
    practice_postal_code: Optional[str] = None
    practice_phone: Optional[str] = None
    practice_email: Optional[EmailStr] = None
    doctor_names: Optional[List[str]] = None
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    license_document: Optional[str] = None
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    years_of_experience: Optional[int] = None
    languages: Optional[List[str]] = None

class AddDoctorAvailabilityRequest(BaseModel):
    day_of_week: int
    start_time: str
    end_time: str
    break_start: Optional[str] = None
    break_end: Optional[str] = None
    slot_duration: int = 30

class AddDoctorVacationRequest(BaseModel):
    start_date: str
    end_date: str
    reason: Optional[str] = None

class ConnectFamilyRequest(BaseModel):
    connection_code: str
    nickname: Optional[str] = None
    relationship: Optional[str] = None

class SearchMedicationRequest(BaseModel):
    medication_name: str

# ============== HELPER FUNCTIONS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_jwt_token(token)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

def calculate_subscription_amount(num_children: int) -> float:
    # Adult: €2.99, Child: €1.99 each
    base_price = 2.99
    child_price = 1.99
    return base_price + (child_price * num_children)

# ============== AUTHENTICATION ENDPOINTS ==============

@api_router.post("/auth/register")
async def register(request: RegisterRequest):
    # Check if email exists
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Calculate subscription amount (only for patients with children)
    subscription_amount = 0
    if request.user_type == "patient":
        subscription_amount = calculate_subscription_amount(request.num_children)
    
    # Create user
    user = User(
        first_name=request.first_name,
        last_name=request.last_name,
        birthdate=request.birthdate,
        state=request.state,
        city=request.city,
        address=request.address,
        postal_code=request.postal_code,
        email=request.email,
        password_hash=hash_password(request.password),
        user_type=request.user_type,
        subscription_amount=subscription_amount,
        max_children=request.num_children,  # Store max allowed children
        subscription_status="active" if request.user_type == "doctor" else "pending"  # Doctors don't need subscription
    )
    
    user_dict = user.model_dump()
    await db.users.insert_one(user_dict)
    
    # Create JWT token
    token = create_jwt_token(user.id, user.email)
    
    return {
        "message": "Registration successful",
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "user_type": user.user_type,
            "subscription_amount": subscription_amount,
            "num_children": request.num_children
        }
    }

@api_router.post("/auth/login")
async def login(request: LoginRequest):
    user_doc = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(request.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user_doc["id"], user_doc["email"])
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user_doc["id"],
            "email": user_doc["email"],
            "first_name": user_doc["first_name"],
            "last_name": user_doc["last_name"],
            "user_type": user_doc.get("user_type", "patient"),
            "subscription_status": user_doc["subscription_status"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "user_type": current_user.user_type,
        "subscription_status": current_user.subscription_status,
        "subscription_amount": current_user.subscription_amount
    }

# ============== PAYMENT ENDPOINTS ==============

@api_router.post("/payment/create-checkout")
async def create_checkout(request: CheckoutRequest):
    # Calculate amount
    amount = calculate_subscription_amount(request.num_children)
    
    # Create success and cancel URLs
    success_url = f"{request.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/payment-cancel"
    
    # Initialize Stripe checkout
    http_request_base_url = request.origin_url
    webhook_url = f"{http_request_base_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_email": request.user_email,
            "num_children": str(request.num_children)
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        session_id=session.session_id,
        email=request.user_email,
        amount=amount,
        currency="eur",
        payment_status="initiated",
        metadata={
            "user_email": request.user_email,
            "num_children": request.num_children
        }
    )
    
    transaction_dict = transaction.model_dump()
    await db.payment_transactions.insert_one(transaction_dict)
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.get("/payment/status/{session_id}")
async def get_payment_status(session_id: str):
    # Check if already processed
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If already paid, return immediately
    if transaction["payment_status"] == "paid":
        return {
            "status": "complete",
            "payment_status": "paid",
            "amount": transaction["amount"],
            "currency": transaction["currency"]
        }
    
    # Check with Stripe
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction
    if checkout_status.payment_status == "paid" and transaction["payment_status"] != "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": "paid",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update user subscription
        user_email = transaction.get("metadata", {}).get("user_email")
        if user_email:
            await db.users.update_one(
                {"email": user_email},
                {"$set": {"subscription_status": "active"}}
            )
    
    return {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "amount": checkout_status.amount_total / 100,  # Convert from cents
        "currency": checkout_status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    body = await request.body()
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        # Update transaction status
        if webhook_response.payment_status == "paid":
            transaction = await db.payment_transactions.find_one(
                {"session_id": webhook_response.session_id},
                {"_id": 0}
            )
            
            if transaction and transaction["payment_status"] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Update user subscription
                user_email = webhook_response.metadata.get("user_email")
                if user_email:
                    await db.users.update_one(
                        {"email": user_email},
                        {"$set": {"subscription_status": "active"}}
                    )
        
        return {"status": "success"}
    except Exception as e:
        logging.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

# ============== CHILDREN ENDPOINTS ==============

@api_router.post("/children")
async def add_child(request: AddChildRequest, current_user: User = Depends(get_current_user)):
    # Check if user has reached max children limit
    existing_children_count = await db.children.count_documents({"parent_id": current_user.id})
    
    if existing_children_count >= current_user.max_children:
        raise HTTPException(
            status_code=400, 
            detail=f"Sie haben die maximale Anzahl von Kindern ({current_user.max_children}) erreicht. Bitte aktualisieren Sie Ihr Abonnement."
        )
    
    child = Child(
        parent_id=current_user.id,
        first_name=request.first_name,
        last_name=request.last_name,
        birthdate=request.birthdate
    )
    
    child_dict = child.model_dump()
    await db.children.insert_one(child_dict)
    
    return {"message": "Child added successfully", "child": child}

@api_router.get("/children")
async def get_children(current_user: User = Depends(get_current_user)):
    children = await db.children.find({"parent_id": current_user.id}, {"_id": 0}).to_list(100)
    return {
        "children": children,
        "max_children": current_user.max_children,
        "can_add_more": len(children) < current_user.max_children
    }

@api_router.get("/children/{child_id}/dashboard")
async def get_child_dashboard(child_id: str, current_user: User = Depends(get_current_user)):
    # Verify child belongs to parent
    child = await db.children.find_one({"id": child_id, "parent_id": current_user.id}, {"_id": 0})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Get child's data
    medications = await db.medications.find({"user_id": current_user.id, "child_id": child_id}, {"_id": 0}).to_list(100)
    appointments = await db.appointments.find({"user_id": current_user.id, "child_id": child_id}, {"_id": 0}).to_list(100)
    vital_signs = await db.vital_signs.find({"user_id": current_user.id, "child_id": child_id}, {"_id": 0}).sort("recorded_at", -1).to_list(50)
    schedule = await db.weekly_schedule.find({"user_id": current_user.id, "child_id": child_id}, {"_id": 0}).to_list(500)
    
    return {
        "child": child,
        "medications": medications,
        "appointments": appointments,
        "vital_signs": vital_signs,
        "schedule": schedule
    }

# ============== MEDICATION ENDPOINTS ==============

@api_router.post("/medications")
async def add_medication(request: AddMedicationRequest, current_user: User = Depends(get_current_user)):
    child_name = None
    if request.child_id:
        child = await db.children.find_one({"id": request.child_id, "parent_id": current_user.id})
        if child:
            child_name = f"{child['first_name']} {child['last_name']}"
    
    medication = Medication(
        user_id=current_user.id,
        child_id=request.child_id,
        child_name=child_name,
        name=request.name,
        dosage=request.dosage,
        frequency=request.frequency,
        frequency_times=request.frequency_times,
        stock=request.stock,
        expiry_date=request.expiry_date,
        prescription_number=request.prescription_number,
        barcode=request.barcode,
        prescription_image=request.prescription_image,
        reminder_enabled=request.reminder_enabled
    )
    
    medication_dict = medication.model_dump()
    await db.medications.insert_one(medication_dict)
    
    return {"message": "Medication added successfully", "medication": medication}

@api_router.get("/medications")
async def get_medications(current_user: User = Depends(get_current_user)):
    medications = await db.medications.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    return {"medications": medications}

@api_router.put("/medications/{medication_id}/stock")
async def update_medication_stock(medication_id: str, stock: int, current_user: User = Depends(get_current_user)):
    result = await db.medications.update_one(
        {"id": medication_id, "user_id": current_user.id},
        {"$set": {"stock": stock}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    return {"message": "Stock updated successfully"}

@api_router.delete("/medications/{medication_id}")
async def delete_medication(medication_id: str, current_user: User = Depends(get_current_user)):
    result = await db.medications.delete_one(
        {"id": medication_id, "user_id": current_user.id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    return {"message": "Medication deleted successfully"}

@api_router.post("/medications/{medication_id}/take")
async def take_medication(medication_id: str, current_user: User = Depends(get_current_user)):
    # Get medication
    medication = await db.medications.find_one(
        {"id": medication_id, "user_id": current_user.id},
        {"_id": 0}
    )
    
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    # Decrease stock by 1
    new_stock = max(0, medication["stock"] - 1)
    
    await db.medications.update_one(
        {"id": medication_id},
        {"$set": {
            "stock": new_stock,
            "last_taken": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Record intake
    intake = MedicationIntake(
        user_id=current_user.id,
        medication_id=medication_id
    )
    
    await db.medication_intakes.insert_one(intake.model_dump())
    
    # Check if stock is low (5, 3, or 1)
    warning = None
    if new_stock <= 1:
        warning = "Kritisch! Nur noch 1 Tablette übrig!"
    elif new_stock <= 3:
        warning = "Achtung! Nur noch 3 Tabletten übrig!"
    elif new_stock <= 5:
        warning = "Hinweis: Nur noch 5 Tabletten übrig!"
    
    return {
        "message": "Medication taken successfully",
        "new_stock": new_stock,
        "warning": warning
    }

@api_router.post("/medications/scan-prescription")
async def scan_prescription(request: ScanPrescriptionRequest, current_user: User = Depends(get_current_user)):
    # Mock OCR processing - in production, use OCR service
    # For now, return mock data
    return {
        "success": True,
        "message": "Rezept erfolgreich gescannt",
        "extracted_data": {
            "medication_name": "Beispiel Medikament",
            "dosage": "500mg",
            "quantity": "20 Tabletten",
            "prescription_number": "RX-" + str(uuid.uuid4())[:8]
        }
    }

@api_router.post("/medications/scan-barcode")
async def scan_barcode(request: ScanBarcodeRequest, current_user: User = Depends(get_current_user)):
    # Mock barcode lookup - in production, use medication database API
    return {
        "success": True,
        "message": "Barcode erfolgreich gescannt",
        "medication_data": {
            "name": "Medikament (Code: " + request.barcode + ")",
            "dosage": "Nicht verfügbar",
            "manufacturer": "Demo Pharma",
            "barcode": request.barcode
        }
    }

@api_router.get("/medications/{medication_id}/reminders")
async def get_medication_reminders(medication_id: str, current_user: User = Depends(get_current_user)):
    medication = await db.medications.find_one(
        {"id": medication_id, "user_id": current_user.id},
        {"_id": 0}
    )
    
    if not medication:
        raise HTTPException(status_code=404, detail="Medication not found")
    
    # Return upcoming reminders based on frequency_times
    return {
        "medication_id": medication_id,
        "medication_name": medication["name"],
        "reminder_enabled": medication.get("reminder_enabled", True),
        "frequency_times": medication.get("frequency_times", []),
        "next_reminder": medication.get("frequency_times", [""])[0] if medication.get("frequency_times") else None
    }

# ============== PHARMACY ENDPOINTS ==============

@api_router.get("/pharmacies")
async def get_pharmacies():
    # Mock data for demo
    pharmacies = [
        {
            "id": "1",
            "name": "Apotheke am Markt",
            "address": "Marktplatz 5",
            "city": "Berlin",
            "postal_code": "10115",
            "phone": "+49 30 12345678",
            "distance": "0.5 km"
        },
        {
            "id": "2",
            "name": "Stadt Apotheke",
            "address": "Hauptstraße 12",
            "city": "Berlin",
            "postal_code": "10117",
            "phone": "+49 30 87654321",
            "distance": "1.2 km"
        }
    ]
    return {"pharmacies": pharmacies}

# ============== DOCTOR ENDPOINTS ==============

@api_router.get("/doctors")
async def get_doctors():
    doctors = await db.doctors.find({}, {"_id": 0}).to_list(100)
    return {"doctors": doctors}

# ============== APPOINTMENT ENDPOINTS ==============

@api_router.post("/appointments")
async def add_appointment(request: AddAppointmentRequest, current_user: User = Depends(get_current_user)):
    appointment = Appointment(
        user_id=current_user.id,
        doctor_id=request.doctor_id,
        appointment_date=request.appointment_date,
        appointment_time=request.appointment_time,
        notes=request.notes
    )
    
    appointment_dict = appointment.model_dump()
    await db.appointments.insert_one(appointment_dict)
    
    return {"message": "Appointment created successfully", "appointment": appointment}

@api_router.get("/appointments")
async def get_appointments(current_user: User = Depends(get_current_user)):
    appointments = await db.appointments.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    return {"appointments": appointments}

# ============== VITAL SIGNS ENDPOINTS ==============

@api_router.post("/vital-signs")
async def add_vital_signs(request: AddVitalSignsRequest, current_user: User = Depends(get_current_user)):
    vital_signs = VitalSigns(
        user_id=current_user.id,
        pulse=request.pulse,
        blood_pressure=request.blood_pressure,
        temperature=request.temperature,
        weight=request.weight
    )
    
    vital_signs_dict = vital_signs.model_dump()
    await db.vital_signs.insert_one(vital_signs_dict)
    
    return {"message": "Vital signs recorded successfully", "vital_signs": vital_signs}

@api_router.get("/vital-signs")
async def get_vital_signs(current_user: User = Depends(get_current_user)):
    vital_signs = await db.vital_signs.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("recorded_at", -1).to_list(50)
    return {"vital_signs": vital_signs}

# ============== WEEKLY SCHEDULE ENDPOINTS ==============

def get_category_color(category: str) -> str:
    colors = {
        "food": "#10b981",  # Green
        "sport": "#3b82f6",  # Blue
        "doctor": "#ef4444",  # Red
        "other": "#14b8a6"   # Teal (default)
    }
    return colors.get(category, "#14b8a6")

@api_router.post("/schedule")
async def add_schedule_entry(request: AddScheduleEntryRequest, current_user: User = Depends(get_current_user)):
    # Get child name if child_id provided
    child_name = None
    if request.child_id:
        child = await db.children.find_one({"id": request.child_id, "parent_id": current_user.id})
        if child:
            child_name = f"{child['first_name']} {child['last_name']}"
    
    entry = WeeklyScheduleEntry(
        user_id=current_user.id,
        child_id=request.child_id,
        child_name=child_name,
        date=request.date,
        time=request.time,
        end_time=request.end_time,
        title=request.title,
        category=request.category,
        description=request.description,
        color=get_category_color(request.category)
    )
    
    entry_dict = entry.model_dump()
    await db.weekly_schedule.insert_one(entry_dict)
    
    return {"message": "Schedule entry added successfully", "entry": entry}

@api_router.get("/schedule")
async def get_schedule(current_user: User = Depends(get_current_user), child_id: Optional[str] = None):
    # If child_id provided, get only that child's schedule
    # Otherwise, get all schedule (user's own + all children)
    
    if child_id:
        # Get specific child's schedule
        schedule = await db.weekly_schedule.find(
            {"user_id": current_user.id, "child_id": child_id},
            {"_id": 0}
        ).to_list(5000)
    else:
        # Get all schedule (user's + all children)
        schedule = await db.weekly_schedule.find(
            {"user_id": current_user.id},
            {"_id": 0}
        ).to_list(5000)
    
    # Sort by date and time
    schedule.sort(key=lambda x: (x["date"], x["time"]))
    
    return {"schedule": schedule}

@api_router.delete("/schedule/{entry_id}")
async def delete_schedule_entry(entry_id: str, current_user: User = Depends(get_current_user)):
    result = await db.weekly_schedule.delete_one(
        {"id": entry_id, "user_id": current_user.id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schedule entry not found")
    
    return {"message": "Schedule entry deleted successfully"}

@api_router.put("/schedule/{entry_id}")
async def update_schedule_entry(
    entry_id: str,
    request: AddScheduleEntryRequest,
    current_user: User = Depends(get_current_user)
):
    child_name = None
    if request.child_id:
        child = await db.children.find_one({"id": request.child_id, "parent_id": current_user.id})
        if child:
            child_name = f"{child['first_name']} {child['last_name']}"
    
    result = await db.weekly_schedule.update_one(
        {"id": entry_id, "user_id": current_user.id},
        {"$set": {
            "child_id": request.child_id,
            "child_name": child_name,
            "date": request.date,
            "time": request.time,
            "end_time": request.end_time,
            "title": request.title,
            "category": request.category,
            "description": request.description,
            "color": get_category_color(request.category)
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Schedule entry not found")
    
    return {"message": "Schedule entry updated successfully"}

# ============== RECURRING WEEKLY SCHEDULE ENDPOINTS ==============

@api_router.post("/schedule/weekly")
async def add_recurring_schedule(request: AddRecurringScheduleRequest, current_user: User = Depends(get_current_user)):
    child_name = None
    if request.child_id:
        child = await db.children.find_one({"id": request.child_id, "parent_id": current_user.id})
        if child:
            child_name = f"{child['first_name']} {child['last_name']}"
    
    entry = RecurringScheduleEntry(
        user_id=current_user.id,
        child_id=request.child_id,
        child_name=child_name,
        day_of_week=request.day_of_week,
        start_hour=request.start_hour,
        end_hour=request.end_hour,
        title=request.title,
        category=request.category,
        description=request.description,
        color=get_category_color(request.category)
    )
    
    entry_dict = entry.model_dump()
    await db.recurring_schedule.insert_one(entry_dict)
    
    return {"message": "Recurring schedule entry added successfully", "entry": entry}

@api_router.get("/schedule/weekly")
async def get_recurring_schedule(current_user: User = Depends(get_current_user), child_id: Optional[str] = None):
    if child_id:
        schedule = await db.recurring_schedule.find(
            {"user_id": current_user.id, "child_id": child_id},
            {"_id": 0}
        ).to_list(500)
    else:
        schedule = await db.recurring_schedule.find(
            {"user_id": current_user.id},
            {"_id": 0}
        ).to_list(500)
    
    # Organize by day_of_week and hour
    organized = {}
    for entry in schedule:
        for hour in range(entry["start_hour"], entry["end_hour"]):
            key = f"{entry['day_of_week']}-{hour}"
            if key not in organized:
                organized[key] = []
            organized[key].append(entry)
    
    return {"schedule": organized}

@api_router.delete("/schedule/weekly/{entry_id}")
async def delete_recurring_schedule(entry_id: str, current_user: User = Depends(get_current_user)):
    result = await db.recurring_schedule.delete_one(
        {"id": entry_id, "user_id": current_user.id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    return {"message": "Recurring schedule entry deleted successfully"}

@api_router.get("/appointments/upcoming")
async def get_upcoming_appointments(current_user: User = Depends(get_current_user)):
    # Get appointments in the next 2 days
    today = datetime.now(timezone.utc).date()
    two_days_later = today + timedelta(days=2)
    
    # Get schedule entries that are doctor appointments in the next 2 days
    schedule_entries = await db.weekly_schedule.find(
        {
            "user_id": current_user.id,
            "category": "doctor",
            "date": {
                "$gte": today.isoformat(),
                "$lte": two_days_later.isoformat()
            }
        },
        {"_id": 0}
    ).to_list(100)
    
    # Get regular appointments
    appointments = await db.appointments.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(100)
    
    # Combine and sort
    all_appointments = []
    
    for entry in schedule_entries:
        all_appointments.append({
            "type": "schedule",
            "id": entry["id"],
            "title": entry["title"],
            "date": entry["date"],
            "time": entry["time"],
            "description": entry.get("description"),
            "child_name": entry.get("child_name")
        })
    
    for apt in appointments:
        apt_date = datetime.fromisoformat(apt["appointment_date"]).date()
        if today <= apt_date <= two_days_later:
            all_appointments.append({
                "type": "appointment",
                "id": apt["id"],
                "title": "Arzttermin",
                "date": apt["appointment_date"],
                "time": apt["appointment_time"],
                "notes": apt.get("notes")
            })
    
    all_appointments.sort(key=lambda x: (x["date"], x["time"]))
    
    return {"upcoming_appointments": all_appointments}

# ============== DOCTOR PROFILE ENDPOINTS ==============

@api_router.post("/doctors/profile")
async def create_doctor_profile(request: CreateDoctorProfileRequest, current_user: User = Depends(get_current_user)):
    # Verify user is a doctor
    if current_user.user_type != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create doctor profiles")
    
    # Check if profile already exists
    existing_profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    if existing_profile:
        raise HTTPException(status_code=400, detail="Doctor profile already exists")
    
    profile = DoctorProfile(
        user_id=current_user.id,
        practice_name=request.practice_name,
        practice_address=request.practice_address,
        practice_city=request.practice_city,
        practice_postal_code=request.practice_postal_code,
        practice_phone=request.practice_phone,
        practice_email=request.practice_email,
        doctor_names=request.doctor_names,
        specialty=request.specialty,
        license_number=request.license_number,
        license_document=request.license_document,
        profile_image=request.profile_image,
        bio=request.bio,
        years_of_experience=request.years_of_experience,
        languages=request.languages,
        # Legacy fields for backward compatibility
        name=request.practice_name,
        address=request.practice_address,
        city=request.practice_city,
        postal_code=request.practice_postal_code,
        phone=request.practice_phone,
        email=request.practice_email
    )
    
    await db.doctor_profiles.insert_one(profile.model_dump())
    
    return {"message": "Doctor profile created successfully", "profile": profile}

@api_router.get("/doctors/profile")
async def get_doctor_profile(current_user: User = Depends(get_current_user)):
    profile = await db.doctor_profiles.find_one({"user_id": current_user.id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return {"profile": profile}

@api_router.put("/doctors/profile")
async def update_doctor_profile(request: UpdateDoctorProfileRequest, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update doctor profiles")
    
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.doctor_profiles.update_one(
        {"user_id": current_user.id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    return {"message": "Doctor profile updated successfully"}

@api_router.get("/doctors/search")
async def search_doctors(
    specialty: Optional[str] = None,
    city: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if specialty:
        query["specialty"] = {"$regex": specialty, "$options": "i"}
    if city:
        # Search in both practice_city and legacy city field
        query["$or"] = [
            {"practice_city": {"$regex": city, "$options": "i"}},
            {"city": {"$regex": city, "$options": "i"}}
        ]
    
    doctors = await db.doctor_profiles.find(query, {"_id": 0}).to_list(100)
    return {"doctors": doctors}

@api_router.get("/doctors/{doctor_id}/profile")
async def get_doctor_profile_by_id(doctor_id: str, current_user: User = Depends(get_current_user)):
    profile = await db.doctor_profiles.find_one({"id": doctor_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return {"profile": profile}

# ============== DOCTOR AVAILABILITY ENDPOINTS ==============

@api_router.post("/doctors/availability")
async def add_doctor_availability(request: AddDoctorAvailabilityRequest, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can set availability")
    
    # Get doctor profile
    profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found. Create a profile first.")
    
    availability = DoctorAvailability(
        doctor_id=profile["id"],
        day_of_week=request.day_of_week,
        start_time=request.start_time,
        end_time=request.end_time,
        break_start=request.break_start,
        break_end=request.break_end,
        slot_duration=request.slot_duration
    )
    
    await db.doctor_availability.insert_one(availability.model_dump())
    
    return {"message": "Availability added successfully", "availability": availability}

@api_router.get("/doctors/availability")
async def get_doctor_availability(current_user: User = Depends(get_current_user)):
    if current_user.user_type != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view their availability")
    
    profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    availability = await db.doctor_availability.find({"doctor_id": profile["id"]}, {"_id": 0}).to_list(100)
    return {"availability": availability}

@api_router.get("/doctors/{doctor_id}/availability")
async def get_doctor_availability_by_id(doctor_id: str, current_user: User = Depends(get_current_user)):
    availability = await db.doctor_availability.find({"doctor_id": doctor_id}, {"_id": 0}).to_list(100)
    return {"availability": availability}

@api_router.get("/doctors/{doctor_id}/available-slots")
async def get_available_slots(
    doctor_id: str,
    date: str,  # YYYY-MM-DD format
    current_user: User = Depends(get_current_user)
):
    """
    Get available time slots for a specific doctor on a specific date
    Takes into account: availability, breaks, vacations, existing appointments
    """
    try:
        target_date = datetime.fromisoformat(date).date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Get day of week (0=Monday, 6=Sunday)
    day_of_week = target_date.weekday()
    
    # Get doctor's availability for this day
    availability = await db.doctor_availability.find_one({
        "doctor_id": doctor_id,
        "day_of_week": day_of_week
    })
    
    if not availability:
        return {"available_slots": [], "message": "Doctor not available on this day"}
    
    # Check if doctor is on vacation
    vacations = await db.doctor_vacations.find(
        {"doctor_id": doctor_id},
        {"_id": 0}
    ).to_list(100)
    
    for vacation in vacations:
        vacation_start = datetime.fromisoformat(vacation["start_date"]).date()
        vacation_end = datetime.fromisoformat(vacation["end_date"]).date()
        if vacation_start <= target_date <= vacation_end:
            return {"available_slots": [], "message": "Doctor is on vacation"}
    
    # Generate all possible time slots
    from datetime import time as dt_time
    start_hour, start_minute = map(int, availability["start_time"].split(":"))
    end_hour, end_minute = map(int, availability["end_time"].split(":"))
    
    start_datetime = datetime.combine(target_date, dt_time(start_hour, start_minute))
    end_datetime = datetime.combine(target_date, dt_time(end_hour, end_minute))
    
    slot_duration = availability["slot_duration"]
    
    # Check for break time
    break_start_datetime = None
    break_end_datetime = None
    if availability.get("break_start") and availability.get("break_end"):
        break_start_hour, break_start_minute = map(int, availability["break_start"].split(":"))
        break_end_hour, break_end_minute = map(int, availability["break_end"].split(":"))
        break_start_datetime = datetime.combine(target_date, dt_time(break_start_hour, break_start_minute))
        break_end_datetime = datetime.combine(target_date, dt_time(break_end_hour, break_end_minute))
    
    # Generate slots
    slots = []
    current_slot = start_datetime
    
    while current_slot + timedelta(minutes=slot_duration) <= end_datetime:
        # Skip if slot is during break
        if break_start_datetime and break_end_datetime:
            if break_start_datetime <= current_slot < break_end_datetime:
                current_slot += timedelta(minutes=slot_duration)
                continue
        
        slots.append(current_slot.strftime("%H:%M"))
        current_slot += timedelta(minutes=slot_duration)
    
    # Get existing appointments for this date
    existing_appointments = await db.appointments.find(
        {
            "doctor_id": doctor_id,
            "appointment_date": date,
            "status": {"$ne": "cancelled"}
        },
        {"_id": 0}
    ).to_list(1000)
    
    # Remove booked slots
    booked_times = [apt["appointment_time"] for apt in existing_appointments]
    available_slots = [slot for slot in slots if slot not in booked_times]
    
    return {
        "date": date,
        "day_of_week": day_of_week,
        "available_slots": available_slots,
        "slot_duration": slot_duration,
        "morning_hours": f"{availability['start_time']} - {availability.get('break_start', availability['end_time'])}",
        "afternoon_hours": f"{availability.get('break_end', '')} - {availability['end_time']}" if availability.get('break_end') else None
    }

@api_router.delete("/doctors/availability/{availability_id}")
async def delete_doctor_availability(availability_id: str, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can delete availability")
    
    profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    result = await db.doctor_availability.delete_one({
        "id": availability_id,
        "doctor_id": profile["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Availability not found")
    
    return {"message": "Availability deleted successfully"}

# ============== DOCTOR VACATION ENDPOINTS ==============

@api_router.post("/doctors/vacation")
async def add_doctor_vacation(request: AddDoctorVacationRequest, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can set vacation periods")
    
    profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    vacation = DoctorVacation(
        doctor_id=profile["id"],
        start_date=request.start_date,
        end_date=request.end_date,
        reason=request.reason
    )
    
    await db.doctor_vacations.insert_one(vacation.model_dump())
    
    return {"message": "Vacation period added successfully", "vacation": vacation}

@api_router.get("/doctors/vacation")
async def get_doctor_vacations(current_user: User = Depends(get_current_user)):
    if current_user.user_type != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view their vacation periods")
    
    profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    vacations = await db.doctor_vacations.find({"doctor_id": profile["id"]}, {"_id": 0}).to_list(100)
    return {"vacations": vacations}

@api_router.get("/doctors/{doctor_id}/vacation")
async def get_doctor_vacation_by_id(doctor_id: str, current_user: User = Depends(get_current_user)):
    vacations = await db.doctor_vacations.find({"doctor_id": doctor_id}, {"_id": 0}).to_list(100)
    return {"vacations": vacations}

@api_router.delete("/doctors/vacation/{vacation_id}")
async def delete_doctor_vacation(vacation_id: str, current_user: User = Depends(get_current_user)):
    if current_user.user_type != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can delete vacation periods")
    
    profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    result = await db.doctor_vacations.delete_one({
        "id": vacation_id,
        "doctor_id": profile["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vacation period not found")
    
    return {"message": "Vacation period deleted successfully"}

# ============== DOCTOR-PATIENT SUBSCRIPTION ENDPOINTS ==============

@api_router.post("/doctors/{doctor_id}/subscribe")
async def subscribe_to_doctor(doctor_id: str, current_user: User = Depends(get_current_user)):
    # Verify doctor exists
    doctor_profile = await db.doctor_profiles.find_one({"id": doctor_id})
    if not doctor_profile:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check if already subscribed
    existing_sub = await db.doctor_patient_subscriptions.find_one({
        "doctor_id": doctor_id,
        "patient_id": current_user.id,
        "status": "active"
    })
    
    if existing_sub:
        raise HTTPException(status_code=400, detail="Already subscribed to this doctor")
    
    subscription = DoctorPatientSubscription(
        doctor_id=doctor_id,
        patient_id=current_user.id
    )
    
    await db.doctor_patient_subscriptions.insert_one(subscription.model_dump())
    
    return {"message": "Successfully subscribed to doctor", "subscription": subscription}

@api_router.get("/doctors/my-subscriptions")
async def get_my_doctor_subscriptions(current_user: User = Depends(get_current_user)):
    subscriptions = await db.doctor_patient_subscriptions.find(
        {"patient_id": current_user.id, "status": "active"},
        {"_id": 0}
    ).to_list(100)
    
    # Get doctor details for each subscription
    doctor_details = []
    for sub in subscriptions:
        doctor = await db.doctor_profiles.find_one({"id": sub["doctor_id"]}, {"_id": 0})
        if doctor:
            doctor_details.append({
                "subscription_id": sub["id"],
                "doctor": doctor,
                "subscribed_at": sub["subscribed_at"]
            })
    
    return {"subscriptions": doctor_details}

@api_router.delete("/doctors/subscriptions/{subscription_id}")
async def unsubscribe_from_doctor(subscription_id: str, current_user: User = Depends(get_current_user)):
    result = await db.doctor_patient_subscriptions.update_one(
        {"id": subscription_id, "patient_id": current_user.id},
        {"$set": {"status": "cancelled"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return {"message": "Successfully unsubscribed from doctor"}

@api_router.get("/doctors/patients")
async def get_my_patients(current_user: User = Depends(get_current_user)):
    if current_user.user_type != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view their patients")
    
    profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    # Get all active subscriptions
    subscriptions = await db.doctor_patient_subscriptions.find(
        {"doctor_id": profile["id"], "status": "active"},
        {"_id": 0}
    ).to_list(1000)
    
    # Get patient details
    patients = []
    for sub in subscriptions:
        patient = await db.users.find_one(
            {"id": sub["patient_id"]},
            {"_id": 0, "password_hash": 0}
        )
        if patient:
            patients.append({
                "subscription_id": sub["id"],
                "patient": {
                    "id": patient["id"],
                    "first_name": patient["first_name"],
                    "last_name": patient["last_name"],
                    "email": patient["email"],
                    "birthdate": patient.get("birthdate")
                },
                "subscribed_at": sub["subscribed_at"]
            })
    
    return {"patients": patients}

@api_router.get("/doctors/appointments/today")
async def get_doctor_appointments_today(current_user: User = Depends(get_current_user)):
    if current_user.user_type != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view their appointments")
    
    profile = await db.doctor_profiles.find_one({"user_id": current_user.id})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    # Get today's date
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Get all appointments for today
    appointments = await db.appointments.find(
        {
            "doctor_id": profile["id"],
            "appointment_date": today,
            "status": {"$ne": "cancelled"}
        },
        {"_id": 0}
    ).sort("appointment_time", 1).to_list(100)
    
    # Enrich with patient details
    enriched_appointments = []
    for apt in appointments:
        patient = await db.users.find_one(
            {"id": apt["user_id"]},
            {"_id": 0, "password_hash": 0}
        )
        if patient:
            enriched_appointments.append({
                **apt,
                "patient_name": f"{patient['first_name']} {patient['last_name']}",
                "patient_email": patient["email"]
            })
    
    return {"appointments": enriched_appointments}

@api_router.get("/doctors/dashboard")
async def get_doctor_dashboard(current_user: User = Depends(get_current_user)):
    if current_user.user_type != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access doctor dashboard")
    
    profile = await db.doctor_profiles.find_one({"user_id": current_user.id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found. Please create a profile first.")
    
    # Get today's appointments
    today = datetime.now(timezone.utc).date().isoformat()
    today_appointments = await db.appointments.find(
        {
            "doctor_id": profile["id"],
            "appointment_date": today,
            "status": {"$ne": "cancelled"}
        },
        {"_id": 0}
    ).sort("appointment_time", 1).to_list(100)
    
    # Enrich appointments with patient details
    enriched_appointments = []
    for apt in today_appointments:
        patient = await db.users.find_one(
            {"id": apt["user_id"]},
            {"_id": 0, "password_hash": 0}
        )
        if patient:
            enriched_appointments.append({
                **apt,
                "patient_name": f"{patient['first_name']} {patient['last_name']}",
                "patient_email": patient["email"]
            })
    
    # Get patient count
    patient_count = await db.doctor_patient_subscriptions.count_documents({
        "doctor_id": profile["id"],
        "status": "active"
    })
    
    # Get availability
    availability = await db.doctor_availability.find(
        {"doctor_id": profile["id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Get upcoming vacations
    current_date = datetime.now(timezone.utc).date().isoformat()
    upcoming_vacations = await db.doctor_vacations.find(
        {
            "doctor_id": profile["id"],
            "end_date": {"$gte": current_date}
        },
        {"_id": 0}
    ).to_list(100)
    
    return {
        "profile": profile,
        "today_appointments": enriched_appointments,
        "patient_count": patient_count,
        "availability": availability,
        "upcoming_vacations": upcoming_vacations
    }

# ============== RECURRING APPOINTMENTS ==============

@api_router.post("/appointments/recurring")
async def create_recurring_appointment(request: AddAppointmentRequest, current_user: User = Depends(get_current_user)):
    if not request.is_recurring or not request.recurrence_interval_weeks or not request.num_occurrences:
        raise HTTPException(status_code=400, detail="Missing recurring appointment parameters")
    
    # Verify doctor exists
    doctor_profile = await db.doctor_profiles.find_one({"id": request.doctor_id})
    if not doctor_profile:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Get child name if provided
    child_name = None
    if request.child_id:
        child = await db.children.find_one({"id": request.child_id, "parent_id": current_user.id})
        if child:
            child_name = f"{child['first_name']} {child['last_name']}"
    
    # Create parent appointment
    parent_appointment = Appointment(
        user_id=current_user.id,
        child_id=request.child_id,
        child_name=child_name,
        doctor_id=request.doctor_id,
        appointment_date=request.appointment_date,
        appointment_time=request.appointment_time,
        notes=request.notes,
        is_recurring=True,
        recurrence_interval_weeks=request.recurrence_interval_weeks
    )
    
    await db.appointments.insert_one(parent_appointment.model_dump())
    
    # Create recurring appointments
    created_appointments = [parent_appointment]
    base_date = datetime.fromisoformat(request.appointment_date)
    
    for i in range(1, request.num_occurrences):
        next_date = base_date + timedelta(weeks=request.recurrence_interval_weeks * i)
        
        recurring_apt = Appointment(
            user_id=current_user.id,
            child_id=request.child_id,
            child_name=child_name,
            doctor_id=request.doctor_id,
            appointment_date=next_date.date().isoformat(),
            appointment_time=request.appointment_time,
            notes=request.notes,
            is_recurring=True,
            recurrence_interval_weeks=request.recurrence_interval_weeks,
            parent_appointment_id=parent_appointment.id
        )
        
        await db.appointments.insert_one(recurring_apt.model_dump())
        created_appointments.append(recurring_apt)
    
    return {
        "message": f"Created {len(created_appointments)} recurring appointments",
        "appointments": created_appointments
    }

# ============== PRESCRIPTION WARNINGS (SMART NOTIFICATIONS) ==============

@api_router.get("/medications/prescription-warnings")
async def get_prescription_warnings(current_user: User = Depends(get_current_user)):
    """
    Smart endpoint that checks if medications will run out during doctor's vacation
    and warns patients 1-2 weeks in advance
    """
    warnings = []
    
    # Get all user's medications
    medications = await db.medications.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    
    # Get all subscribed doctors
    subscriptions = await db.doctor_patient_subscriptions.find(
        {"patient_id": current_user.id, "status": "active"},
        {"_id": 0}
    ).to_list(100)
    
    for medication in medications:
        # Calculate when medication will run out
        if medication["stock"] <= 0:
            continue
        
        # Estimate days until stock runs out based on frequency
        # Simplified: assume frequency "2x täglich" means 2 pills per day
        daily_usage = 1  # Default
        if "täglich" in medication["frequency"].lower() or "daily" in medication["frequency"].lower():
            try:
                parts = medication["frequency"].lower().split("x")
                if len(parts) > 1:
                    daily_usage = int(parts[0].strip())
            except (ValueError, IndexError):
                daily_usage = 1
        
        days_until_empty = medication["stock"] / daily_usage if daily_usage > 0 else medication["stock"]
        runout_date = datetime.now(timezone.utc).date() + timedelta(days=days_until_empty)
        
        # Check each subscribed doctor's vacation
        for sub in subscriptions:
            doctor_vacations = await db.doctor_vacations.find(
                {"doctor_id": sub["doctor_id"]},
                {"_id": 0}
            ).to_list(100)
            
            for vacation in doctor_vacations:
                vacation_start = datetime.fromisoformat(vacation["start_date"]).date()
                vacation_end = datetime.fromisoformat(vacation["end_date"]).date()
                
                # Check if medication will run out during vacation
                if vacation_start <= runout_date <= vacation_end:
                    # Warn 1-2 weeks before
                    warning_date_2weeks = vacation_start - timedelta(weeks=2)
                    today = datetime.now(timezone.utc).date()
                    
                    if warning_date_2weeks <= today <= vacation_start:
                        # Get doctor details
                        doctor = await db.doctor_profiles.find_one(
                            {"id": sub["doctor_id"]},
                            {"_id": 0}
                        )
                        
                        days_until_vacation = (vacation_start - today).days
                        
                        warnings.append({
                            "medication_id": medication["id"],
                            "medication_name": medication["name"],
                            "stock": medication["stock"],
                            "estimated_runout_date": runout_date.isoformat(),
                            "doctor_name": doctor["name"] if doctor else "Unknown",
                            "doctor_id": sub["doctor_id"],
                            "vacation_start": vacation["start_date"],
                            "vacation_end": vacation["end_date"],
                            "days_until_vacation": days_until_vacation,
                            "severity": "high" if days_until_vacation <= 7 else "medium",
                            "message": f"ACHTUNG! Ihr Arzt {doctor['name'] if doctor else 'Unknown'} ist ab dem {vacation['start_date']} im Urlaub. "
                                      f"Ihr Medikament '{medication['name']}' läuft voraussichtlich am {runout_date.isoformat()} aus. "
                                      f"Bitte holen Sie rechtzeitig ein neues Rezept!"
                        })
    
    return {"warnings": warnings}

# ============== FAMILY CONNECTION ENDPOINTS ==============

@api_router.get("/family/my-code")
async def get_my_connection_code(current_user: User = Depends(get_current_user)):
    """
    Generate a unique connection code for the user
    Format: USER-XXXXX (first 8 chars of user ID)
    """
    connection_code = f"USER-{current_user.id[:8].upper()}"
    return {
        "connection_code": connection_code,
        "user_id": current_user.id,
        "name": f"{current_user.first_name} {current_user.last_name}"
    }

@api_router.post("/family/connect")
async def connect_family_member(request: ConnectFamilyRequest, current_user: User = Depends(get_current_user)):
    """
    Connect with another user using their connection code
    """
    # Extract user ID from connection code (format: USER-XXXXXXXX)
    if not request.connection_code.startswith("USER-"):
        raise HTTPException(status_code=400, detail="Invalid connection code format")
    
    code_part = request.connection_code.replace("USER-", "").lower()
    
    # Find user with matching ID prefix
    all_users = await db.users.find({}, {"_id": 0}).to_list(1000)
    target_user = None
    for user in all_users:
        if user["id"].lower().startswith(code_part):
            target_user = user
            break
    
    if not target_user:
        raise HTTPException(status_code=404, detail="User with this connection code not found")
    
    if target_user["id"] == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")
    
    # Check if connection already exists
    existing_connection = await db.family_connections.find_one({
        "$or": [
            {"user_id": current_user.id, "connected_user_id": target_user["id"]},
            {"user_id": target_user["id"], "connected_user_id": current_user.id}
        ],
        "status": "active"
    })
    
    if existing_connection:
        raise HTTPException(status_code=400, detail="Connection already exists")
    
    # Create bidirectional connections
    connection1 = FamilyConnection(
        user_id=current_user.id,
        connected_user_id=target_user["id"],
        connection_code=request.connection_code,
        status="active",
        nickname=request.nickname,
        relationship=request.relationship
    )
    
    connection2 = FamilyConnection(
        user_id=target_user["id"],
        connected_user_id=current_user.id,
        connection_code=request.connection_code,
        status="active",
        nickname=f"{current_user.first_name} {current_user.last_name}",
        relationship=request.relationship
    )
    
    await db.family_connections.insert_one(connection1.model_dump())
    await db.family_connections.insert_one(connection2.model_dump())
    
    return {
        "message": "Successfully connected",
        "connection": connection1,
        "connected_user": {
            "id": target_user["id"],
            "name": f"{target_user['first_name']} {target_user['last_name']}",
            "email": target_user["email"]
        }
    }

@api_router.get("/family/connections")
async def get_family_connections(current_user: User = Depends(get_current_user)):
    """
    Get all family connections for the current user
    """
    connections = await db.family_connections.find(
        {"user_id": current_user.id, "status": "active"},
        {"_id": 0}
    ).to_list(100)
    
    # Enrich with user details
    enriched_connections = []
    for conn in connections:
        connected_user = await db.users.find_one(
            {"id": conn["connected_user_id"]},
            {"_id": 0, "password_hash": 0}
        )
        if connected_user:
            enriched_connections.append({
                "connection_id": conn["id"],
                "connected_user": {
                    "id": connected_user["id"],
                    "first_name": connected_user["first_name"],
                    "last_name": connected_user["last_name"],
                    "email": connected_user["email"]
                },
                "nickname": conn.get("nickname"),
                "relationship": conn.get("relationship"),
                "connected_at": conn["created_at"]
            })
    
    return {"connections": enriched_connections}

@api_router.delete("/family/connections/{connection_id}")
async def remove_family_connection(connection_id: str, current_user: User = Depends(get_current_user)):
    """
    Remove a family connection
    """
    # Find the connection
    connection = await db.family_connections.find_one({
        "id": connection_id,
        "user_id": current_user.id
    })
    
    if not connection:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    # Mark as cancelled (bidirectional)
    await db.family_connections.update_many(
        {
            "$or": [
                {"user_id": current_user.id, "connected_user_id": connection["connected_user_id"]},
                {"user_id": connection["connected_user_id"], "connected_user_id": current_user.id}
            ]
        },
        {"$set": {"status": "cancelled"}}
    )
    
    return {"message": "Connection removed successfully"}

@api_router.get("/family/member/{member_id}/medications")
async def get_family_member_medications(member_id: str, current_user: User = Depends(get_current_user)):
    """
    Get medications of a connected family member
    """
    # Verify connection exists
    connection = await db.family_connections.find_one({
        "user_id": current_user.id,
        "connected_user_id": member_id,
        "status": "active"
    })
    
    if not connection:
        raise HTTPException(status_code=403, detail="Not connected to this user")
    
    # Get medications
    medications = await db.medications.find(
        {"user_id": member_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"medications": medications}

@api_router.get("/family/member/{member_id}/appointments")
async def get_family_member_appointments(member_id: str, current_user: User = Depends(get_current_user)):
    """
    Get appointments of a connected family member
    """
    # Verify connection exists
    connection = await db.family_connections.find_one({
        "user_id": current_user.id,
        "connected_user_id": member_id,
        "status": "active"
    })
    
    if not connection:
        raise HTTPException(status_code=403, detail="Not connected to this user")
    
    # Get appointments
    appointments = await db.appointments.find(
        {"user_id": member_id},
        {"_id": 0}
    ).to_list(100)
    
    return {"appointments": appointments}

@api_router.post("/emergency/find-medication")
async def find_medication_in_network(request: SearchMedicationRequest, current_user: User = Depends(get_current_user)):
    """
    Emergency search: Find who in your family network has a specific medication
    """
    results = []
    
    # Get all family connections
    connections = await db.family_connections.find(
        {"user_id": current_user.id, "status": "active"},
        {"_id": 0}
    ).to_list(100)
    
    # Search in current user's medications first
    my_medications = await db.medications.find(
        {
            "user_id": current_user.id,
            "name": {"$regex": request.medication_name, "$options": "i"},
            "stock": {"$gt": 0}
        },
        {"_id": 0}
    ).to_list(100)
    
    for med in my_medications:
        results.append({
            "user_id": current_user.id,
            "user_name": f"{current_user.first_name} {current_user.last_name}",
            "relationship": "Eigenes Medikament",
            "medication": {
                "id": med["id"],
                "name": med["name"],
                "dosage": med["dosage"],
                "stock": med["stock"],
                "expiry_date": med["expiry_date"]
            }
        })
    
    # Search in connected users' medications
    for conn in connections:
        connected_user = await db.users.find_one(
            {"id": conn["connected_user_id"]},
            {"_id": 0, "password_hash": 0}
        )
        
        if not connected_user:
            continue
        
        medications = await db.medications.find(
            {
                "user_id": conn["connected_user_id"],
                "name": {"$regex": request.medication_name, "$options": "i"},
                "stock": {"$gt": 0}
            },
            {"_id": 0}
        ).to_list(100)
        
        for med in medications:
            results.append({
                "user_id": conn["connected_user_id"],
                "user_name": f"{connected_user['first_name']} {connected_user['last_name']}",
                "relationship": conn.get("relationship", "Verbunden"),
                "contact_email": connected_user["email"],
                "medication": {
                    "id": med["id"],
                    "name": med["name"],
                    "dosage": med["dosage"],
                    "stock": med["stock"],
                    "expiry_date": med["expiry_date"]
                }
            })
    
    return {
        "medication_searched": request.medication_name,
        "results_count": len(results),
        "results": results
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()