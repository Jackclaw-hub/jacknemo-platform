"""
Monitoring-Modul für die SaaS-Plattform
Stellt Endpunkte für System-Metriken, Health-Checks und Logging bereit
"""
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
import psutil
import platform
from datetime import datetime

# Blueprint erstellen
monitoring_bp = Blueprint('monitoring', __name__, url_prefix='/monitoring')

@monitoring_bp.route('/health')
def health():
    """Einfacher Health Check"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'service': 'jacknemo-platform'
    })

@monitoring_bp.route('/metrics')
@login_required
def metrics():
    """Prometheus-ähnliche Metriken"""
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # System-Metriken
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Anwendungsspezifische Metriken (simuliert)
    app_metrics = {
        'requests_total': 12450,
        'requests_per_second': 4.2,
        'error_rate': 0.001,
        'avg_response_time_ms': 145,
        'active_users': 23,
        'database_connections': 8
    }
    
    return jsonify({
        'system': {
            'cpu_usage_percent': cpu_percent,
            'memory_usage_percent': memory.percent,
            'memory_used_gb': round(memory.used / (1024**3), 2),
            'memory_total_gb': round(memory.total / (1024**3), 2),
            'disk_usage_percent': disk.percent,
            'disk_used_gb': round(disk.used / (1024**3), 2),
            'disk_total_gb': round(disk.total / (1024**3), 2),
            'boot_time': datetime.fromtimestamp(psutil.boot_time()).isoformat()
        },
        'application': app_metrics,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })

@monitoring_bp.route('/logs')
@login_required
def logs():
    """Zugriff auf Anwendungslogs"""
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Simulierte Logs
    sample_logs = [
        {
            'timestamp': '2026-04-09T15:30:00Z',
            'level': 'INFO',
            'message': 'User login successful',
            'user_id': 1,
            'ip_address': '192.168.1.100'
        },
        {
            'timestamp': '2026-04-09T15:29:45Z',
            'level': 'INFO',
            'message': 'Environment deployment initiated',
            'environment': 'dev',
            'status': 'started'
        },
        {
            'timestamp': '2026-04-09T15:29:30Z',
            'level': 'WARNING',
            'message': 'High memory usage detected',
            'memory_usage': '85%',
            'threshold': '80%'
        }
    ]
    
    return jsonify({
        'logs': sample_logs,
        'total': len(sample_logs),
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })

@monitoring_bp.route('/status')
def status():
    """Detaillierter Status für Monitoring-Tools"""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.5)
        memory = psutil.virtual_memory()
        
        return jsonify({
            'status': 'ok' if cpu_percent < 90 and memory.percent < 90 else 'warning',
            'checks': {
                'cpu': {
                    'status': 'ok' if cpu_percent < 80 else 'warning' if cpu_percent < 95 else 'critical',
                    'value': f'{cpu_percent}%',
                    'threshold': '< 80%'
                },
                'memory': {
                    'status': 'ok' if memory.percent < 80 else 'warning' if memory.percent < 95 else 'critical',
                    'value': f'{memory.percent}%',
                    'threshold': '< 80%'
                },
                'disk': {
                    'status': 'ok',
                    'value': 'Available',
                    'threshold': '> 10% free'
                }
            },
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'uptime_seconds': int((datetime.now() - datetime.fromtimestamp(psutil.boot_time())).total_seconds())
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500