from pydantic import BaseModel, Field
from typing import List, Optional

# --- Nested Models ---

class BadgeLocation(BaseModel):
    x: Optional[int] = Field(default=10, description="X coordinate")
    y: Optional[int] = Field(default=15, description="Y coordinate")
    
    class Config:
        extra = "ignore"  # Ignore extra fields like "zone"

class BadgeTelemetry(BaseModel):
    # FIXED: Made all fields Optional with defaults
    hr: Optional[int] = Field(default=72, description="Heart rate in bpm")
    spo2: Optional[int] = Field(default=99, description="Oxygen saturation %")
    skinTemp: Optional[float] = Field(default=36.5, description="Skin temperature in °C")
    location: Optional[BadgeLocation] = Field(default_factory=lambda: BadgeLocation(x=10, y=15))
    fallDetected: Optional[bool] = Field(default=False, description="Fall detection flag")
    sosActive: Optional[bool] = Field(default=False, description="SOS button status")
    
    class Config:
        extra = "ignore"  # Ignore extra fields

class VisionTelemetry(BaseModel):
    isCompliant: Optional[bool] = Field(default=True, description="PPE compliance status")
    missingItems: Optional[List[str]] = Field(default_factory=list, description="Missing PPE items")
    allFoundItems: Optional[List[str]] = Field(default_factory=list, description="Detected PPE items")
    
    class Config:
        extra = "ignore"  # Ignore extra fields like ppeCompliant, complianceScore, ppe

class SCADAContext(BaseModel):
    ambientGasPpm: Optional[int] = Field(default=30, description="Ambient gas in ppm")
    zoneTemp: Optional[int] = Field(default=35, description="Zone temperature in °C")
    zoneAlarmActive: Optional[bool] = Field(default=False, description="Zone alarm status")
    
    class Config:
        extra = "ignore"  # Ignore extra fields

class WorkerProfile(BaseModel):
    shiftDurationHours: Optional[float] = Field(default=6.5, description="Hours on current shift")
    pastIncidentCount: Optional[int] = Field(default=0, description="Number of past incidents")
    age: Optional[int] = Field(default=28, description="Worker age")
    fatigueScore: Optional[float] = Field(default=0.3, description="Fatigue score 0.0-1.0")
    
    class Config:
        extra = "ignore"  # Ignore extra fields

# --- 1. The FULL INPUT Schema (from Guru) ---
class UnifiedWorkerContext(BaseModel):
    workerId: str
    timestamp: str
    badgeTelemetry: BadgeTelemetry
    visionTelemetry: VisionTelemetry
    scadaContext: SCADAContext
    workerProfile: WorkerProfile
    
    class Config:
        extra = "ignore"  # Ignore extra fields like "ts"

# --- 2. The FULL OUTPUT Schema (To Guru) ---
class RiskResponse(BaseModel):
    workerId: str
    risk: int
    confidence: float
    topRiskFactors: List[str]
    advisoryHinglish: str
    modelUsed: str
    timestamp: str