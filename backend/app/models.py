# app/models.py - Updated for Medic
from datetime import datetime
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict, field

@dataclass
class User:
    """User model for Medic - supports admin, staff, and patient roles"""
    id: Optional[str] = None
    email: str = ""
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    
    # Role-based fields
    role: str = "patient"  # 'admin', 'staff', 'doctor', 'nurse', 'receptionist', 'patient'
    department: Optional[str] = None  # Only for staff roles
    
    # Jamaican-specific fields
    trn: Optional[str] = None  # Tax Registration Number
    nis: Optional[str] = None  # National Insurance Scheme
    parish: Optional[str] = None  # Jamaican parish (e.g., "Kingston", "St. Andrew")
    
    # Personal info
    dob: Optional[str] = None  # ISO date string
    gender: Optional[str] = None  # "male", "female", "other"
    address: Optional[str] = None
    profilePictureUrl: Optional[str] = None
    
    # Account status
    isActive: bool = True
    
    # Timestamps
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    
    def to_dict(self):
        """Convert to Firestore-compatible dict"""
        data = asdict(self)
        data.pop('id', None)
        
        # Convert datetime to Firestore timestamp
        if self.createdAt:
            data['createdAt'] = self.createdAt
        if self.updatedAt:
            data['updatedAt'] = self.updatedAt
        
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], doc_id: Optional[str] = None):
        """Create User from Firestore document"""
        user = cls()
        if doc_id:
            user.id = doc_id
        
        user.email = data.get('email', '')
        user.firstName = data.get('firstName')
        user.lastName = data.get('lastName')
        user.phone = data.get('phone')
        user.role = data.get('role', 'patient')
        user.department = data.get('department')
        user.trn = data.get('trn')
        user.nis = data.get('nis')
        user.parish = data.get('parish')
        user.dob = data.get('dob')
        user.gender = data.get('gender')
        user.address = data.get('address')
        user.profilePictureUrl = data.get('profilePictureUrl')
        user.isActive = data.get('isActive', True)
        user.createdAt = data.get('createdAt')
        user.updatedAt = data.get('updatedAt')
        
        return user
    
    def is_staff(self) -> bool:
        """Check if user is any type of staff"""
        return self.role in ['admin', 'staff', 'doctor', 'nurse', 'receptionist']
    
    def is_admin(self) -> bool:
        """Check if user is admin"""
        return self.role == 'admin'
    
    def is_patient(self) -> bool:
        """Check if user is patient"""
        return self.role == 'patient'


@dataclass
class Appointment:
    """Appointment model for Medic"""
    id: Optional[str] = None
    patientId: str = ""
    patientName: str = ""
    patientEmail: str = ""
    
    doctorId: Optional[str] = None
    doctorName: Optional[str] = None
    department: Optional[str] = None
    
    # Appointment details
    reasonForVisit: str = ""
    appointmentDate: Optional[datetime] = None
    appointmentTime: Optional[str] = None  # "8:00 AM - 9:00 AM"
    
    # Triage info
    triageLevel: Optional[int] = None  # 1-5 (1 = critical, 5 = low priority)
    symptoms: List[str] = field(default_factory=list)
    symptomDuration: Optional[str] = None  # "Less than 24 hours", "1-3 days", etc.
    severityLevel: Optional[int] = None  # 1-10
    isEmergency: bool = False
    
    # Status
    status: str = "pending"  # 'pending', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled'
    queueNumber: Optional[str] = None  # e.g., "A03"
    estimatedWaitTime: Optional[int] = None  # in minutes
    
    # Timestamps
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    checkedInAt: Optional[datetime] = None
    completedAt: Optional[datetime] = None
    
    def to_dict(self):
        data = asdict(self)
        data.pop('id', None)
        
        if self.appointmentDate:
            data['appointmentDate'] = self.appointmentDate
        if self.createdAt:
            data['createdAt'] = self.createdAt
        if self.updatedAt:
            data['updatedAt'] = self.updatedAt
        if self.checkedInAt:
            data['checkedInAt'] = self.checkedInAt
        if self.completedAt:
            data['completedAt'] = self.completedAt
        
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], doc_id: Optional[str] = None):
        appointment = cls()
        if doc_id:
            appointment.id = doc_id
        
        appointment.patientId = data.get('patientId', '')
        appointment.patientName = data.get('patientName', '')
        appointment.patientEmail = data.get('patientEmail', '')
        appointment.doctorId = data.get('doctorId')
        appointment.doctorName = data.get('doctorName')
        appointment.department = data.get('department')
        appointment.reasonForVisit = data.get('reasonForVisit', '')
        appointment.appointmentDate = data.get('appointmentDate')
        appointment.appointmentTime = data.get('appointmentTime')
        appointment.triageLevel = data.get('triageLevel')
        appointment.symptoms = data.get('symptoms', [])
        appointment.symptomDuration = data.get('symptomDuration')
        appointment.severityLevel = data.get('severityLevel')
        appointment.isEmergency = data.get('isEmergency', False)
        appointment.status = data.get('status', 'pending')
        appointment.queueNumber = data.get('queueNumber')
        appointment.estimatedWaitTime = data.get('estimatedWaitTime')
        appointment.createdAt = data.get('createdAt')
        appointment.updatedAt = data.get('updatedAt')
        appointment.checkedInAt = data.get('checkedInAt')
        appointment.completedAt = data.get('completedAt')
        
        return appointment


@dataclass
class MedicalRecord:
    """Medical record/history for a patient"""
    id: Optional[str] = None
    patientId: str = ""
    
    # Medical history
    conditions: List[str] = field(default_factory=list)  # ['Diabetes', 'Hypertension']
    allergies: List[str] = field(default_factory=list)  # ['Peanuts', 'Penicillin']
    currentMedications: List[str] = field(default_factory=list)  # ['Metformin', 'Lisinopril']
    previousSurgeries: List[Dict[str, Any]] = field(default_factory=list)  # [{'name': 'Appendectomy', 'date': '2020-01-15'}]
    
    # Vitals (most recent)
    bloodType: Optional[str] = None  # "O+", "A-", etc.
    height: Optional[float] = None  # in cm
    weight: Optional[float] = None  # in kg
    
    # Emergency contact
    emergencyContactName: Optional[str] = None
    emergencyContactRelation: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    emergencyContactEmail: Optional[str] = None
    
    # Insurance
    hasInsurance: bool = False
    insuranceProvider: Optional[str] = None  # "NHF", "Sagicor", etc.
    insurancePolicyNumber: Optional[str] = None
    
    # Timestamps
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    
    def to_dict(self):
        data = asdict(self)
        data.pop('id', None)
        
        if self.createdAt:
            data['createdAt'] = self.createdAt
        if self.updatedAt:
            data['updatedAt'] = self.updatedAt
        
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], doc_id: Optional[str] = None):
        record = cls()
        if doc_id:
            record.id = doc_id
        
        record.patientId = data.get('patientId', '')
        record.conditions = data.get('conditions', [])
        record.allergies = data.get('allergies', [])
        record.currentMedications = data.get('currentMedications', [])
        record.previousSurgeries = data.get('previousSurgeries', [])
        record.bloodType = data.get('bloodType')
        record.height = data.get('height')
        record.weight = data.get('weight')
        record.emergencyContactName = data.get('emergencyContactName')
        record.emergencyContactRelation = data.get('emergencyContactRelation')
        record.emergencyContactPhone = data.get('emergencyContactPhone')
        record.emergencyContactEmail = data.get('emergencyContactEmail')
        record.hasInsurance = data.get('hasInsurance', False)
        record.insuranceProvider = data.get('insuranceProvider')
        record.insurancePolicyNumber = data.get('insurancePolicyNumber')
        record.createdAt = data.get('createdAt')
        record.updatedAt = data.get('updatedAt')
        
        return record


@dataclass
class Document:
    """Uploaded documents (ID, insurance cards, medical records)"""
    id: Optional[str] = None
    userId: str = ""
    
    # Document info
    documentType: str = ""  # 'government_id', 'insurance_card', 'medical_record', 'lab_result', 'prescription'
    fileName: str = ""
    fileUrl: str = ""
    fileSize: Optional[int] = None  # in bytes
    mimeType: Optional[str] = None  # 'application/pdf', 'image/jpeg', etc.
    
    # Metadata
    description: Optional[str] = None
    uploadedBy: str = ""  # userId who uploaded
    
    # Timestamps
    uploadedAt: Optional[datetime] = None
    
    def to_dict(self):
        data = asdict(self)
        data.pop('id', None)
        
        if self.uploadedAt:
            data['uploadedAt'] = self.uploadedAt
        
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], doc_id: Optional[str] = None):
        document = cls()
        if doc_id:
            document.id = doc_id
        
        document.userId = data.get('userId', '')
        document.documentType = data.get('documentType', '')
        document.fileName = data.get('fileName', '')
        document.fileUrl = data.get('fileUrl', '')
        document.fileSize = data.get('fileSize')
        document.mimeType = data.get('mimeType')
        document.description = data.get('description')
        document.uploadedBy = data.get('uploadedBy', '')
        document.uploadedAt = data.get('uploadedAt')
        
        return document


@dataclass
class Notification:
    """Notifications for queue updates, appointments, etc."""
    id: Optional[str] = None
    userId: str = ""
    
    # Notification details
    type: str = ""  # 'queue_update', 'appointment_reminder', 'appointment_confirmed', 'message'
    title: str = ""
    message: str = ""
    
    # Related entities
    appointmentId: Optional[str] = None
    queueNumber: Optional[str] = None
    
    # Status
    isRead: bool = False
    isSent: bool = False  # For SMS/email tracking
    
    # Timestamps
    createdAt: Optional[datetime] = None
    readAt: Optional[datetime] = None
    sentAt: Optional[datetime] = None
    
    def to_dict(self):
        data = asdict(self)
        data.pop('id', None)
        
        if self.createdAt:
            data['createdAt'] = self.createdAt
        if self.readAt:
            data['readAt'] = self.readAt
        if self.sentAt:
            data['sentAt'] = self.sentAt
        
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], doc_id: Optional[str] = None):
        notification = cls()
        if doc_id:
            notification.id = doc_id
        
        notification.userId = data.get('userId', '')
        notification.type = data.get('type', '')
        notification.title = data.get('title', '')
        notification.message = data.get('message', '')
        notification.appointmentId = data.get('appointmentId')
        notification.queueNumber = data.get('queueNumber')
        notification.isRead = data.get('isRead', False)
        notification.isSent = data.get('isSent', False)
        notification.createdAt = data.get('createdAt')
        notification.readAt = data.get('readAt')
        notification.sentAt = data.get('sentAt')
        
        return notification


@dataclass
class ResetCode:
    """Password reset code model (you already have this, keeping for reference)"""
    id: Optional[str] = None
    email: str = ""
    code: str = ""
    used: bool = False
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    
    def to_dict(self):
        data = asdict(self)
        data.pop('id', None)
        
        if self.expires_at:
            data['expires_at'] = self.expires_at
        if self.created_at:
            data['created_at'] = self.created_at
        
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], doc_id: Optional[str] = None):
        reset_code = cls()
        if doc_id:
            reset_code.id = doc_id
        
        reset_code.email = data.get('email', '')
        reset_code.code = data.get('code', '')
        reset_code.used = data.get('used', False)
        reset_code.expires_at = data.get('expires_at')
        reset_code.created_at = data.get('created_at')
        
        return reset_code