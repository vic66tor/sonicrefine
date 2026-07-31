from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# Auth
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: dict
    token: str


# Project
class ProcessingSettings(BaseModel):
    normalize: bool = True
    denoise: bool = False
    eqCorrection: bool = True
    multibandCompression: bool = True
    stereoEnhancement: bool = False
    limiting: bool = True
    loudnessNormalization: bool = True


class CreateProjectRequest(BaseModel):
    title: str
    output_format: str = "mp3"
    processing_settings: Optional[ProcessingSettings] = None


class ProjectResponse(BaseModel):
    id: str
    title: str
    original_filename: str
    status: str
    output_format: str
    analysis_data: Optional[dict] = None
    processing_settings: Optional[dict] = None
    duration_seconds: Optional[float] = None
    original_bitrate: Optional[int] = None
    sample_rate: Optional[int] = None
    channels: Optional[int] = None
    error_message: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
