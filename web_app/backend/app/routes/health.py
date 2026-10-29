# app/routes/health.py - CONVERTED TO app.route
from flask import request, jsonify
import firebase_admin
from datetime import datetime
from app.config.firebase import get_db
import logging

logger = logging.getLogger(__name__)

def register_routes(app):
    """Register health check routes"""
    
    @app.route('/api/health', methods=['GET', 'OPTIONS'])
    def health_check():
        """Basic health check endpoint"""
        if request.method == 'OPTIONS':
            return ('', 204)
        return jsonify({
            'status': 'ok',
            'service': 'Mirri API',
            'version': '2.0.0',
            'firebase': 'connected' if firebase_admin._apps else 'disconnected',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    
    @app.route('/api/health/detailed', methods=['GET', 'OPTIONS'])
    def detailed_health_check():
        """Detailed health check with database connectivity"""
        if request.method == 'OPTIONS':
            return ('', 204)
        
        health_status = {
            'status': 'healthy',
            'service': 'Mirri API',
            'version': '2.0.0',
            'timestamp': datetime.utcnow().isoformat(),
            'checks': {}
        }
        
        try:
            if firebase_admin._apps:
                health_status['checks']['firebase_initialized'] = {'status': 'ok', 'message': 'Firebase Admin SDK initialized'}
            else:
                health_status['checks']['firebase_initialized'] = {'status': 'error', 'message': 'Firebase not initialized'}
                health_status['status'] = 'degraded'
        except Exception as e:
            health_status['checks']['firebase_initialized'] = {'status': 'error', 'message': str(e)}
            health_status['status'] = 'degraded'
        
        try:
            db = get_db()
            test_ref = db.collection('_health_check').document('test')
            test_ref.set({'timestamp': datetime.utcnow(), 'status': 'healthy'})
            test_doc = test_ref.get()
            
            if test_doc.exists:
                health_status['checks']['firestore'] = {'status': 'ok', 'message': 'Firestore read/write successful'}
                test_ref.delete()
            else:
                health_status['checks']['firestore'] = {'status': 'warning', 'message': 'Firestore write succeeded but read failed'}
                health_status['status'] = 'degraded'
        except Exception as e:
            logger.error(f"Firestore health check failed: {str(e)}")
            health_status['checks']['firestore'] = {'status': 'error', 'message': f'Firestore connection failed: {str(e)}'}
            health_status['status'] = 'unhealthy'
        
        try:
            from firebase_admin import auth
            try:
                auth.get_user('non-existent-user-id-for-health-check')
            except auth.UserNotFoundError:
                health_status['checks']['firebase_auth'] = {'status': 'ok', 'message': 'Firebase Auth operational'}
            except Exception as auth_error:
                health_status['checks']['firebase_auth'] = {'status': 'warning', 'message': f'Auth check inconclusive: {str(auth_error)}'}
        except Exception as e:
            health_status['checks']['firebase_auth'] = {'status': 'error', 'message': f'Firebase Auth error: {str(e)}'}
            health_status['status'] = 'degraded'
        
        status_code = 200 if health_status['status'] != 'unhealthy' else 503
        return jsonify(health_status), status_code
    
    @app.route('/api/health/stats', methods=['GET', 'OPTIONS'])
    def system_stats():
        """Get basic system statistics"""
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            db = get_db()
            users_ref = db.collection('users')
            users_count = len(list(users_ref.limit(1000).stream()))
            reset_codes_ref = db.collection('resetCodes')
            reset_codes_count = len(list(reset_codes_ref.limit(100).stream()))
            
            stats = {
                'users_count': users_count,
                'reset_codes_count': reset_codes_count,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            return jsonify({'success': True, 'data': stats}), 200
        except Exception as e:
            logger.error(f"System stats error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to get system stats'}), 500
    
    @app.route('/api/health/version', methods=['GET', 'OPTIONS'])
    def version_info():
        """Get API version and environment info"""
        if request.method == 'OPTIONS':
            return ('', 204)
        import sys
        import platform
        
        version_data = {
            'api_version': '2.0.0',
            'service': 'Mirri API',
            'python_version': sys.version,
            'platform': platform.platform(),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return jsonify(version_data), 200