# app/config/firebase.py - MIRRI MENTAL HEALTH APP
import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
import os
import logging

logger = logging.getLogger(__name__)

# Global references
db = None

def initialize_firebase():
    """Initialize Firebase Admin SDK for Mirri Mental Health App"""
    global db
    
    try:
        # Check if already initialized
        if firebase_admin._apps:
            logger.info("✅ Firebase already initialized")
            db = firestore.client()
            return True
        
        # ✅ Get storage bucket name from env or use default
        storage_bucket = os.getenv('FIREBASE_STORAGE_BUCKET', 'mirri-6b0ef.firebasestorage.app')
        
        # OPTION 1: Use environment variables (Railway/Production)
        if os.getenv('FIREBASE_PROJECT_ID'):
            logger.info("🔑 Using Firebase credentials from environment variables")
            
            # Build credentials dict from environment variables
            firebase_creds = {
                "type": os.getenv('FIREBASE_TYPE', 'service_account'),
                "project_id": os.getenv('FIREBASE_PROJECT_ID'),
                "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID', ''),
                "private_key": os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
                "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
                "client_id": os.getenv('FIREBASE_CLIENT_ID', ''),
                "auth_uri": os.getenv('FIREBASE_AUTH_URI', 'https://accounts.google.com/o/oauth2/auth'),
                "token_uri": os.getenv('FIREBASE_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
                "auth_provider_x509_cert_url": os.getenv('FIREBASE_AUTH_PROVIDER_X509_CERT_URL', 'https://www.googleapis.com/oauth2/v1/certs'),
                "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_X509_CERT_URL', '')
            }
            
            # Remove empty fields
            firebase_creds = {k: v for k, v in firebase_creds.items() if v}
            
            cred = credentials.Certificate(firebase_creds)
            
            # ✅ Initialize with storage bucket
            firebase_admin.initialize_app(cred, {
                'storageBucket': storage_bucket
            })
            logger.info(f"✅ Firebase initialized from environment variables")
            logger.info(f"✅ Storage bucket: {storage_bucket}")
            
        # OPTION 2: Use service account file (Local Development)
        elif os.path.exists('serviceAccountKey.json'):
            logger.info("🔑 Using Service Account credentials from file")
            
            cred = credentials.Certificate('serviceAccountKey.json')
            
            # ✅ Initialize with storage bucket
            firebase_admin.initialize_app(cred, {
                'storageBucket': storage_bucket
            })
            logger.info(f"✅ Firebase initialized from service account file")
            logger.info(f"✅ Storage bucket: {storage_bucket}")
        
        else:
            logger.error("❌ No Firebase credentials found! Need either environment variables or serviceAccountKey.json")
            return False
        
        # Initialize Firestore client
        db = firestore.client()
        logger.info("✅ Firestore client initialized for Mirri Mental Health App")
        return True
        
    except Exception as e:
        logger.error(f"❌ Firebase initialization error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def get_db():
    """Get Firestore database instance - REQUIRED BY ALL ROUTES"""
    global db
    if db is None:
        db = firestore.client()
    return db


def get_auth():
    """Get Firebase Auth instance - REQUIRED BY AUTH ROUTES"""
    return auth


def get_storage_bucket():
    """Get Firebase Storage bucket - REQUIRED BY STORE IMAGE UPLOAD"""
    return storage.bucket()


# Collection references helper
def get_collection_ref(collection_name):
    """Get a Firestore collection reference"""
    if db is None:
        logger.warning(f"⚠️ Firebase not initialized, cannot access {collection_name}")
        return None
    return db.collection(collection_name)


# Initialize Firebase on import
initialize_firebase()

# ===================================================================
# MIRRI MENTAL HEALTH APP COLLECTIONS
# ===================================================================

# Core User Data
USERS_REF = get_collection_ref('users')                    # User profiles
ADMIN_REF = get_collection_ref('admin')                    # Admin settings
STAFF_REF = get_collection_ref('staff')                    # Admin settings