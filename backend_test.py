#!/usr/bin/env python3
"""
Migration Smoke Test for Fanvase
Tests the app end-to-end against the NEW Supabase project
"""
import requests
import json
import os
import time
import io
from PIL import Image

# Load environment variables
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://a496f0a6-6a09-45ca-b5d5-2e984a3060c1.preview.emergentagent.com')
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', 'https://ptidleqbiyixavlkextw.supabase.co')
SUPABASE_ANON_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aWRsZXFiaXlpeGF2bGtleHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MjEyOTIsImV4cCI6MjEwMjA5NzI5Mn0.mWS4aCki3A6aRn5MAN0gNgfLS5b1KoeZX--ST7zODcA')
ADMIN_EMAIL = 'ajayylodhi09@gmail.com'

API_BASE = f"{BASE_URL}/api"

# Generate unique identifiers for this test run
timestamp = int(time.time())
creator_email = f"creator_migration_{timestamp}@test.com"
creator_password = "TestPass123!"
creator_username = f"creator_mig_{timestamp}"
fan_email = f"fan_migration_{timestamp}@test.com"
fan_password = "FanPass123!"
admin_password = "AdminPass123!"

# Global variables to store test data
creator_token = None
fan_token = None
admin_token = None
community_id = None
post_id = None
payout_id = None

def print_test(msg):
    print(f"\n{'='*80}")
    print(f"TEST: {msg}")
    print('='*80)

def print_pass(msg):
    print(f"✅ PASS: {msg}")

def print_fail(msg):
    print(f"❌ FAIL: {msg}")

def get_bearer_token(email, password):
    """Get Supabase Bearer token for authentication"""
    try:
        url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        }
        data = {'email': email, 'password': password}
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            return response.json().get('access_token')
        else:
            print(f"Token fetch failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Token fetch error: {e}")
        return None

# ============================================================================
# TEST 1: PUBLIC ENDPOINTS
# ============================================================================

def test_public_categories():
    print_test("1.1 GET /api/categories (expect 11 categories)")
    try:
        response = requests.get(f"{API_BASE}/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert 'categories' in data, "Missing 'categories' key"
        assert len(data['categories']) == 11, f"Expected 11 categories, got {len(data['categories'])}"
        print_pass(f"Categories endpoint working: {len(data['categories'])} categories")
        return True
    except Exception as e:
        print_fail(f"Categories test failed: {e}")
        return False

def test_public_communities():
    print_test("1.2 GET /api/communities (expect array, likely empty on fresh project)")
    try:
        response = requests.get(f"{API_BASE}/communities")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert 'communities' in data, "Missing 'communities' key"
        assert isinstance(data['communities'], list), "Communities should be an array"
        print_pass(f"Communities endpoint working: {len(data['communities'])} communities (fresh project)")
        return True
    except Exception as e:
        print_fail(f"Communities test failed: {e}")
        return False

# ============================================================================
# TEST 2: CREATOR FLOW
# ============================================================================

def test_creator_signup():
    print_test(f"2.1 Creator signup: {creator_email}")
    try:
        response = requests.post(f"{API_BASE}/auth/signup", json={
            'email': creator_email,
            'password': creator_password,
            'display_name': 'Migration Test Creator',
            'role': 'creator'
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('ok') == True, f"Expected ok=true, got {data}"
        print_pass(f"Creator signup successful: {creator_email}")
        return True
    except Exception as e:
        print_fail(f"Creator signup failed: {e}")
        return False

def test_creator_token():
    global creator_token
    print_test("2.2 Get creator Bearer token")
    try:
        creator_token = get_bearer_token(creator_email, creator_password)
        assert creator_token is not None, "Failed to get creator token"
        print_pass(f"Creator token obtained: {creator_token[:20]}...")
        return True
    except Exception as e:
        print_fail(f"Creator token failed: {e}")
        return False

def test_creator_me():
    print_test("2.3 GET /api/me (verify role=creator)")
    try:
        headers = {'Authorization': f'Bearer {creator_token}'}
        response = requests.get(f"{API_BASE}/me", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get('profile', {}).get('role') == 'creator', f"Expected role=creator, got {data.get('profile', {}).get('role')}"
        assert data.get('profile', {}).get('is_creator') == True, "Expected is_creator=true"
        print_pass(f"Creator /me working: role={data['profile']['role']}, is_creator={data['profile']['is_creator']}")
        return True
    except Exception as e:
        print_fail(f"Creator /me failed: {e}")
        return False

def test_creator_onboarding():
    global community_id
    print_test("2.4 POST /api/onboarding/creator (with payout method)")
    try:
        headers = {'Authorization': f'Bearer {creator_token}'}
        response = requests.post(f"{API_BASE}/onboarding/creator", headers=headers, json={
            'username': creator_username,
            'display_name': 'Migration Test Creator',
            'country': 'United States',
            'bio': 'Testing migration',
            'community': {
                'name': f'Migration Test Community {timestamp}',
                'slug': f'mig-test-{timestamp}',
                'description': 'Testing migration to new Supabase project',
                'category': 'AI'
            },
            'pricing': {
                'pricing_type': 'recurring',
                'billing_period': 'monthly',
                'price': 10,
                'currency': 'USD'
            },
            'payout': {
                'method': 'paypal',
                'details': {'email': 'c@pay.com'}
            }
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('ok') == True, f"Expected ok=true, got {data}"
        assert 'community' in data, "Missing community in response"
        community_id = data['community']['id']
        assert data['community']['status'] == 'pending', f"Expected status=pending, got {data['community']['status']}"
        print_pass(f"Creator onboarding successful: community_id={community_id}, status=pending")
        return True
    except Exception as e:
        print_fail(f"Creator onboarding failed: {e}")
        return False

def test_creator_me_payout():
    print_test("2.5 GET /api/me (verify payout_method)")
    try:
        headers = {'Authorization': f'Bearer {creator_token}'}
        response = requests.get(f"{API_BASE}/me", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get('profile', {}).get('payout_method') == 'paypal', f"Expected payout_method=paypal, got {data.get('profile', {}).get('payout_method')}"
        print_pass(f"Creator payout_method verified: {data['profile']['payout_method']}")
        return True
    except Exception as e:
        print_fail(f"Creator payout_method verification failed: {e}")
        return False

def test_creator_post():
    global post_id
    print_test("2.6 POST /api/posts (create a post)")
    try:
        headers = {'Authorization': f'Bearer {creator_token}'}
        response = requests.post(f"{API_BASE}/posts", headers=headers, json={
            'community_id': community_id,
            'title': 'Migration Test Post',
            'content': 'Testing post creation after migration',
            'type': 'text',
            'visibility': 'members',
            'status': 'published'
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('ok') == True, f"Expected ok=true, got {data}"
        assert 'post' in data, "Missing post in response"
        post_id = data['post']['id']
        print_pass(f"Post created successfully: post_id={post_id}")
        return True
    except Exception as e:
        print_fail(f"Post creation failed: {e}")
        return False

def test_creator_overview():
    print_test("2.7 GET /api/creator/overview?range=30 (verify KPIs and series)")
    try:
        headers = {'Authorization': f'Bearer {creator_token}'}
        response = requests.get(f"{API_BASE}/creator/overview?range=30", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert 'kpis' in data, "Missing kpis in response"
        assert 'series' in data, "Missing series in response"
        assert len(data['series']) == 30, f"Expected series length=30, got {len(data['series'])}"
        print_pass(f"Creator overview working: kpis present, series length={len(data['series'])}")
        return True
    except Exception as e:
        print_fail(f"Creator overview failed: {e}")
        return False

# ============================================================================
# TEST 3: UPLOAD
# ============================================================================

def test_upload():
    print_test("3.1 POST /api/upload (upload tiny PNG)")
    try:
        # Create a tiny 10x10 PNG in memory
        img = Image.new('RGB', (10, 10), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        headers = {'Authorization': f'Bearer {creator_token}'}
        files = {'file': ('test.png', img_bytes, 'image/png')}
        data = {'bucket': 'media'}
        response = requests.post(f"{API_BASE}/upload", headers=headers, files=files, data=data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        result = response.json()
        assert result.get('ok') == True, f"Expected ok=true, got {result}"
        assert 'url' in result, "Missing url in response"
        print_pass(f"Upload successful: {result['url'][:50]}...")
        return True
    except Exception as e:
        print_fail(f"Upload failed: {e}")
        return False

# ============================================================================
# TEST 4: FAN + ADMIN + PAYOUT LIFECYCLE
# ============================================================================

def test_fan_signup():
    print_test(f"4.1 Fan signup: {fan_email}")
    try:
        response = requests.post(f"{API_BASE}/auth/signup", json={
            'email': fan_email,
            'password': fan_password,
            'display_name': 'Migration Test Fan',
            'role': 'fan'
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('ok') == True, f"Expected ok=true, got {data}"
        print_pass(f"Fan signup successful: {fan_email}")
        return True
    except Exception as e:
        print_fail(f"Fan signup failed: {e}")
        return False

def test_fan_token():
    global fan_token
    print_test("4.2 Get fan Bearer token")
    try:
        fan_token = get_bearer_token(fan_email, fan_password)
        assert fan_token is not None, "Failed to get fan token"
        print_pass(f"Fan token obtained: {fan_token[:20]}...")
        return True
    except Exception as e:
        print_fail(f"Fan token failed: {e}")
        return False

def test_admin_signup_or_login():
    global admin_token
    print_test(f"4.3 Admin signup/login: {ADMIN_EMAIL}")
    try:
        # Try to signup admin (will auto-assign role=admin)
        response = requests.post(f"{API_BASE}/auth/signup", json={
            'email': ADMIN_EMAIL,
            'password': admin_password,
            'display_name': 'Admin',
            'role': 'admin'
        })
        
        if response.status_code == 200:
            print(f"Admin signup successful (fresh project)")
        elif response.status_code == 400 and 'already registered' in response.text.lower():
            print(f"Admin already exists, will try to get token")
        else:
            print(f"Admin signup response: {response.status_code} - {response.text}")
        
        # Get admin token
        admin_token = get_bearer_token(ADMIN_EMAIL, admin_password)
        assert admin_token is not None, "Failed to get admin token"
        print_pass(f"Admin token obtained: {admin_token[:20]}...")
        return True
    except Exception as e:
        print_fail(f"Admin signup/login failed: {e}")
        return False

def test_admin_overview():
    print_test("4.4 GET /api/admin/overview")
    try:
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = requests.get(f"{API_BASE}/admin/overview", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'users' in data, "Missing users in response"
        assert 'creators' in data, "Missing creators in response"
        assert 'communities' in data, "Missing communities in response"
        print_pass(f"Admin overview working: users={data['users']}, creators={data['creators']}, communities={data['communities']}")
        return True
    except Exception as e:
        print_fail(f"Admin overview failed: {e}")
        return False

def test_admin_activate_community():
    print_test("4.5 POST /api/admin/update-community (activate creator community)")
    try:
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = requests.post(f"{API_BASE}/admin/update-community", headers=headers, json={
            'community_id': community_id,
            'status': 'active'
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('ok') == True, f"Expected ok=true, got {data}"
        assert data.get('community', {}).get('status') == 'active', f"Expected status=active, got {data.get('community', {}).get('status')}"
        print_pass(f"Community activated: {data['community']['name']}")
        return True
    except Exception as e:
        print_fail(f"Community activation failed: {e}")
        return False

def test_admin_add_member():
    print_test("4.6 POST /api/admin/add-member (add fan to community)")
    try:
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = requests.post(f"{API_BASE}/admin/add-member", headers=headers, json={
            'community_id': community_id,
            'user_email': fan_email,
            'plan': 'monthly'
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('ok') == True, f"Expected ok=true, got {data}"
        print_pass(f"Member added: {fan_email} to community")
        return True
    except Exception as e:
        print_fail(f"Add member failed: {e}")
        return False

def test_creator_earnings():
    print_test("4.7 Creator GET /api/creator/earnings (verify balance.available == 9)")
    try:
        headers = {'Authorization': f'Bearer {creator_token}'}
        response = requests.get(f"{API_BASE}/creator/earnings", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert 'balance' in data, "Missing balance in response"
        available = float(data['balance'].get('available', 0))
        # Should be 10 * 0.9 = 9
        assert available == 9.0, f"Expected balance.available=9, got {available}"
        print_pass(f"Creator earnings correct: balance.available={available}")
        return True
    except Exception as e:
        print_fail(f"Creator earnings check failed: {e}")
        return False

def test_creator_withdraw():
    print_test("4.8 Creator POST /api/creator/withdraw")
    try:
        headers = {'Authorization': f'Bearer {creator_token}'}
        response = requests.post(f"{API_BASE}/creator/withdraw", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('ok') == True, f"Expected ok=true, got {data}"
        print_pass("Creator withdraw successful")
        return True
    except Exception as e:
        print_fail(f"Creator withdraw failed: {e}")
        return False

def test_admin_payouts():
    global payout_id
    print_test("4.9 Admin GET /api/admin/payouts (verify payout with creator.payout_method)")
    try:
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = requests.get(f"{API_BASE}/admin/payouts", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert 'payouts' in data, "Missing payouts in response"
        assert len(data['payouts']) > 0, "Expected at least 1 payout"
        
        # Find the payout for our creator
        creator_payout = None
        for p in data['payouts']:
            if p.get('creator', {}).get('email') == creator_email:
                creator_payout = p
                break
        
        assert creator_payout is not None, f"Payout not found for creator {creator_email}"
        payout_id = creator_payout['id']
        assert creator_payout['status'] == 'pending', f"Expected status=pending, got {creator_payout['status']}"
        assert creator_payout.get('creator', {}).get('payout_method') == 'paypal', f"Expected payout_method=paypal, got {creator_payout.get('creator', {}).get('payout_method')}"
        assert creator_payout.get('creator', {}).get('payout_details', {}).get('email') == 'c@pay.com', "Payout details email mismatch"
        print_pass(f"Admin payouts working: payout_id={payout_id}, status=pending, payout_method=paypal")
        return True
    except Exception as e:
        print_fail(f"Admin payouts check failed: {e}")
        return False

def test_admin_update_payout():
    print_test("4.10 Admin POST /api/admin/update-payout (status=paid)")
    try:
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = requests.post(f"{API_BASE}/admin/update-payout", headers=headers, json={
            'payout_id': payout_id,
            'status': 'paid'
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('ok') == True, f"Expected ok=true, got {data}"
        print_pass("Payout updated to paid")
        return True
    except Exception as e:
        print_fail(f"Admin update payout failed: {e}")
        return False

def test_creator_earnings_after_payout():
    print_test("4.11 Creator GET /api/creator/earnings (verify balance.pending=0, payout status=paid)")
    try:
        headers = {'Authorization': f'Bearer {creator_token}'}
        response = requests.get(f"{API_BASE}/creator/earnings", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert 'balance' in data, "Missing balance in response"
        pending = float(data['balance'].get('pending', 0))
        assert pending == 0.0, f"Expected balance.pending=0, got {pending}"
        
        # Check payout status
        assert 'payouts' in data, "Missing payouts in response"
        assert len(data['payouts']) > 0, "Expected at least 1 payout"
        payout = data['payouts'][0]
        assert payout['status'] == 'paid', f"Expected payout status=paid, got {payout['status']}"
        print_pass(f"Creator earnings after payout correct: balance.pending={pending}, payout status=paid")
        return True
    except Exception as e:
        print_fail(f"Creator earnings after payout check failed: {e}")
        return False

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

def main():
    print("\n" + "="*80)
    print("FANVASE MIGRATION SMOKE TEST")
    print("Testing against NEW Supabase project")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    results = []
    
    # Test 1: Public endpoints
    results.append(("Public: GET /api/categories", test_public_categories()))
    results.append(("Public: GET /api/communities", test_public_communities()))
    
    # Test 2: Creator flow
    results.append(("Creator: Signup", test_creator_signup()))
    results.append(("Creator: Get token", test_creator_token()))
    results.append(("Creator: GET /api/me", test_creator_me()))
    results.append(("Creator: Onboarding", test_creator_onboarding()))
    results.append(("Creator: Verify payout_method", test_creator_me_payout()))
    results.append(("Creator: Create post", test_creator_post()))
    results.append(("Creator: Overview", test_creator_overview()))
    
    # Test 3: Upload
    results.append(("Upload: POST /api/upload", test_upload()))
    
    # Test 4: Fan + Admin + Payout lifecycle
    results.append(("Fan: Signup", test_fan_signup()))
    results.append(("Fan: Get token", test_fan_token()))
    results.append(("Admin: Signup/Login", test_admin_signup_or_login()))
    results.append(("Admin: Overview", test_admin_overview()))
    results.append(("Admin: Activate community", test_admin_activate_community()))
    results.append(("Admin: Add member", test_admin_add_member()))
    results.append(("Creator: Check earnings (balance=9)", test_creator_earnings()))
    results.append(("Creator: Withdraw", test_creator_withdraw()))
    results.append(("Admin: Get payouts", test_admin_payouts()))
    results.append(("Admin: Update payout to paid", test_admin_update_payout()))
    results.append(("Creator: Check earnings after payout", test_creator_earnings_after_payout()))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print("\n" + "="*80)
    print(f"TOTAL: {passed}/{total} tests passed ({100*passed//total}%)")
    print("="*80)
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED - MIGRATION SUCCESSFUL!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} TEST(S) FAILED - MIGRATION ISSUES DETECTED")
        return 1

if __name__ == '__main__':
    exit(main())
