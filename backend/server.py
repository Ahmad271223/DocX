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
    subscription_status: str = "pending"  # pending, active, cancelled
    subscription_plan: Optional[str] = None
    subscription_amount: float = 0.0
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
    name: str
    dosage: str
    frequency: str
    stock: int
    expiry_date: str
    prescription_number: Optional[str] = None
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

class Doctor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    specialty: str
    address: str
    phone: str
    email: EmailStr

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    doctor_id: str
    appointment_date: str
    appointment_time: str
    status: str = "scheduled"  # scheduled, completed, cancelled
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class VitalSigns(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
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
    stock: int
    expiry_date: str
    prescription_number: Optional[str] = None

class AddAppointmentRequest(BaseModel):
    doctor_id: str
    appointment_date: str
    appointment_time: str
    notes: Optional[str] = None

class AddVitalSignsRequest(BaseModel):
    pulse: Optional[int] = None
    blood_pressure: Optional[str] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None

class CheckoutRequest(BaseModel):
    origin_url: str
    num_children: int
    user_email: str

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
    
    # Calculate subscription amount
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
        subscription_amount=subscription_amount
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
    return {"children": children}

# ============== MEDICATION ENDPOINTS ==============

@api_router.post("/medications")
async def add_medication(request: AddMedicationRequest, current_user: User = Depends(get_current_user)):
    medication = Medication(
        user_id=current_user.id,
        name=request.name,
        dosage=request.dosage,
        frequency=request.frequency,
        stock=request.stock,
        expiry_date=request.expiry_date,
        prescription_number=request.prescription_number
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