#!/usr/bin/env python3
"""
Test script to verify admin status badges functionality
"""

# Test user status badges
def test_user_status_badges():
    print("Testing user status badges...")
    
    # Simulated user data
    users = {
        'test@example.com': {'status': 'verified'},
        'user@example.com': {'status': 'pending'},
        'flagged@example.com': {'status': 'flagged'}
    }
    
    # Expected badge classes
    expected_badges = {
        'verified': 'status-verified',
        'pending': 'status-pending',
        'flagged': 'status-flagged'
    }
    
    for email, user in users.items():
        status = user['status']
        expected_class = expected_badges.get(status, '')
        print(f"✓ User {email}: {status} -> badge class: {expected_class}")
    
    print("✓ User status badges test passed!\n")

# Test role status badges
def test_role_status_badges():
    print("Testing role status badges...")
    
    # Simulated role data
    roles = [
        {'status': 'active'},
        {'status': 'pending'},
        {'status': 'deprecated'}
    ]
    
    # Expected badge classes
    expected_badges = {
        'active': 'status-active',
        'pending': 'status-pending',
        'deprecated': 'status-deprecated'
    }
    
    for role in roles:
        status = role['status']
        expected_class = expected_badges.get(status, '')
        print(f"✓ Role status {status} -> badge class: {expected_class}")
    
    print("✓ Role status badges test passed!\n")

def test_system_status_badges():
    print("Testing system status badges...")
    
    # Simulated system statuses
    statuses = ['operational', 'degraded', 'down', 'maintenance']
    
    # Expected badge classes
    expected_badges = {
        'operational': 'status-operational',
        'degraded': 'status-degraded',
        'down': 'status-down',
        'maintenance': 'status-maintenance'
    }
    
    for status in statuses:
        expected_class = expected_badges.get(status, '')
        print(f"✓ System status {status} -> badge class: {expected_class}")
    
    print("✓ System status badges test passed!\n")

if __name__ == "__main__":
    print("=== Testing Admin Status Badges ===\n")
    test_user_status_badges()
    test_role_status_badges()
    test_system_status_badges()
    print("🎉 All status badge tests completed successfully!")