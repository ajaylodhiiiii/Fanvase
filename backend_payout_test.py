#!/usr/bin/env python3
"""
Fanvase Backend Payout Features Test Suite
Tests new payout functionality: onboarding with payout, withdraw, payout method updates
"""

import requests
import json
import time
import random
import string

# Load environment variables
BASE_URL = "https://a496f0a6-6a09-45ca-b5d5-2e984a3060c1.preview.emergentagent.com/api"
SUPABASE_URL = "https://ntvbbhufpueymlqawuew.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dmJiaHVmcHVleW1scWF3dWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjgxNzgsImV4cCI6MjEwMTg0NDE3OH0.qnQBMtjmEaQFRhtyrcKT6MYsAAEqXQkALuHuUvhrtCc"
ADMIN_EMAIL = "ajayylodhi09@gmail.com"

def random_string(length=8):
    """Generate random string for unique identifiers"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def get_access_token(email, password):
    """Get Supabase access token using email/password"""
    try:
        url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json"
        }
        data = {"email": email, "password": password}
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            return response.json().get('access_token')
        else:
            print(f"❌ Failed to get token for {email}: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Exception getting token: {e}")
        return None

def signup_user(email, password, display_name, role):
    """Sign up a new user"""
    try:
        url = f"{BASE_URL}/auth/signup"
        data = {
            "email": email,
            "password": password,
            "display_name": display_name,
            "role": role
        }
        response = requests.post(url, json=data)
        return response
    except Exception as e:
        print(f"❌ Exception in signup: {e}")
        return None

def test_1_creator_onboarding_with_payout():
    """Test 1: Creator onboarding WITH payout method"""
    print("\n" + "="*80)
    print("TEST 1: CREATOR ONBOARDING WITH PAYOUT")
    print("="*80)
    
    results = []
    
    # Create unique creator
    creator_email = f"payout_creator_{random_string()}@test.com"
    creator_password = "TestPass123!"
    creator_display_name = f"Payout Creator {random_string(4)}"
    
    try:
        print(f"\n[1.1] Signing up creator: {creator_email}...")
        response = signup_user(creator_email, creator_password, creator_display_name, "creator")
        if not (response and response.status_code == 200 and response.json().get('ok')):
            print(f"❌ Creator signup failed")
            results.append(("Creator signup", False, f"Status {response.status_code if response else 'None'}"))
            return results, None
        print(f"✅ Creator signed up")
        results.append(("Creator signup", True, None))
    except Exception as e:
        print(f"❌ Creator signup exception: {e}")
        results.append(("Creator signup", False, str(e)))
        return results, None
    
    time.sleep(2)
    
    # Get access token
    print(f"\n[1.2] Getting access token...")
    creator_token = get_access_token(creator_email, creator_password)
    if not creator_token:
        print(f"❌ Failed to get token")
        results.append(("Get access token", False, "Token retrieval failed"))
        return results, None
    print(f"✅ Got access token")
    results.append(("Get access token", True, None))
    
    headers = {"Authorization": f"Bearer {creator_token}"}
    
    # Onboard with payout method
    creator_username = f"payoutcreator{random_string()}"
    try:
        print(f"\n[1.3] Onboarding creator WITH payout method (PayPal)...")
        onboarding_data = {
            "username": creator_username,
            "display_name": creator_display_name,
            "country": "US",
            "bio": "Creator with payout method",
            "community": {
                "name": f"Payout Test Community {random_string(4)}",
                "slug": f"payoutcomm{random_string()}",
                "description": "Testing payout features",
                "category": "Business",
                "country": "US"
            },
            "pricing": {
                "pricing_type": "recurring",
                "billing_period": "monthly",
                "price": 10,
                "currency": "USD"
            },
            "payout": {
                "method": "paypal",
                "details": {
                    "email": "pay@test.com"
                }
            }
        }
        response = requests.post(f"{BASE_URL}/onboarding/creator", headers=headers, json=onboarding_data)
        if response.status_code == 200 and response.json().get('ok'):
            community_data = response.json().get('community')
            print(f"✅ Creator onboarded with payout method")
            results.append(("POST /api/onboarding/creator with payout", True, None))
        else:
            print(f"❌ Onboarding failed: {response.status_code} - {response.text}")
            results.append(("POST /api/onboarding/creator with payout", False, f"Status {response.status_code}"))
            return results, None
    except Exception as e:
        print(f"❌ Onboarding exception: {e}")
        results.append(("POST /api/onboarding/creator with payout", False, str(e)))
        return results, None
    
    # Verify payout_method in profile via GET /api/me
    try:
        print(f"\n[1.4] Verifying payout_method in GET /api/me...")
        response = requests.get(f"{BASE_URL}/me", headers=headers)
        if response.status_code == 200:
            data = response.json()
            profile = data.get('profile', {})
            payout_method = profile.get('payout_method')
            if payout_method == 'paypal':
                print(f"✅ GET /api/me shows payout_method='paypal'")
                results.append(("GET /api/me payout_method verification", True, None))
            else:
                print(f"❌ Expected payout_method='paypal', got '{payout_method}'")
                results.append(("GET /api/me payout_method verification", False, f"Got {payout_method}"))
        else:
            print(f"❌ GET /api/me failed: {response.status_code}")
            results.append(("GET /api/me payout_method verification", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/me exception: {e}")
        results.append(("GET /api/me payout_method verification", False, str(e)))
    
    return results, {
        'email': creator_email,
        'password': creator_password,
        'username': creator_username,
        'token': creator_token,
        'community': community_data
    }

def test_2_earnings_includes_payout_fields(creator_data):
    """Test 2: GET /api/creator/earnings includes payout_method and payout_details"""
    print("\n" + "="*80)
    print("TEST 2: EARNINGS INCLUDES PAYOUT FIELDS")
    print("="*80)
    
    results = []
    
    if not creator_data:
        print("❌ No creator data available")
        return results
    
    headers = {"Authorization": f"Bearer {creator_data['token']}"}
    
    try:
        print(f"\n[2.1] Testing GET /api/creator/earnings...")
        response = requests.get(f"{BASE_URL}/creator/earnings", headers=headers)
        if response.status_code == 200:
            data = response.json()
            payout_method = data.get('payout_method')
            payout_details = data.get('payout_details')
            
            if payout_method is not None and payout_details is not None:
                print(f"✅ GET /api/creator/earnings includes payout_method='{payout_method}' and payout_details")
                results.append(("GET /api/creator/earnings payout fields", True, None))
            else:
                print(f"❌ Missing payout fields: payout_method={payout_method}, payout_details={payout_details}")
                results.append(("GET /api/creator/earnings payout fields", False, "Missing payout fields"))
        else:
            print(f"❌ GET /api/creator/earnings failed: {response.status_code} - {response.text}")
            results.append(("GET /api/creator/earnings payout fields", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/creator/earnings exception: {e}")
        results.append(("GET /api/creator/earnings payout fields", False, str(e)))
    
    return results

def test_3_withdraw_guardrails():
    """Test 3: Withdraw guardrails - no payout method and 0 balance"""
    print("\n" + "="*80)
    print("TEST 3: WITHDRAW GUARDRAILS")
    print("="*80)
    
    results = []
    
    # Create a new creator WITHOUT payout method
    creator_email = f"no_payout_{random_string()}@test.com"
    creator_password = "TestPass123!"
    
    try:
        print(f"\n[3.1] Creating creator WITHOUT payout method...")
        response = signup_user(creator_email, creator_password, "No Payout Creator", "creator")
        if not (response and response.status_code == 200):
            print(f"❌ Signup failed")
            return results
        time.sleep(2)
        
        token = get_access_token(creator_email, creator_password)
        if not token:
            print(f"❌ Failed to get token")
            return results
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Onboard WITHOUT payout
        onboarding_data = {
            "username": f"nopayout{random_string()}",
            "display_name": "No Payout Creator",
            "country": "US",
            "community": {
                "name": f"No Payout Community {random_string(4)}",
                "slug": f"nopayout{random_string()}",
                "category": "Other"
            },
            "pricing": {
                "pricing_type": "recurring",
                "billing_period": "monthly",
                "price": 5,
                "currency": "USD"
            }
        }
        response = requests.post(f"{BASE_URL}/onboarding/creator", headers=headers, json=onboarding_data)
        if not (response.status_code == 200 and response.json().get('ok')):
            print(f"❌ Onboarding failed")
            return results
        
        print(f"✅ Creator onboarded WITHOUT payout method")
        results.append(("Creator onboarding without payout", True, None))
        
    except Exception as e:
        print(f"❌ Setup exception: {e}")
        return results
    
    # Test withdraw with no payout method
    try:
        print(f"\n[3.2] Testing POST /api/creator/withdraw (no payout method, expect 400)...")
        response = requests.post(f"{BASE_URL}/creator/withdraw", headers=headers, json={})
        if response.status_code == 400:
            error_msg = response.json().get('error', '')
            if 'payout method' in error_msg.lower():
                print(f"✅ POST /api/creator/withdraw returned 400 with message: '{error_msg}'")
                results.append(("Withdraw without payout method (400)", True, None))
            else:
                print(f"❌ Got 400 but wrong message: '{error_msg}'")
                results.append(("Withdraw without payout method (400)", False, f"Wrong error message"))
        else:
            print(f"❌ Expected 400, got {response.status_code} - {response.text}")
            results.append(("Withdraw without payout method (400)", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Withdraw test exception: {e}")
        results.append(("Withdraw without payout method (400)", False, str(e)))
    
    # Now test with payout method but 0 balance
    # Create another creator with payout but no earnings
    creator2_email = f"zero_balance_{random_string()}@test.com"
    creator2_password = "TestPass123!"
    
    try:
        print(f"\n[3.3] Creating creator WITH payout method but 0 balance...")
        response = signup_user(creator2_email, creator2_password, "Zero Balance Creator", "creator")
        if not (response and response.status_code == 200):
            print(f"❌ Signup failed")
            return results
        time.sleep(2)
        
        token2 = get_access_token(creator2_email, creator2_password)
        if not token2:
            print(f"❌ Failed to get token")
            return results
        
        headers2 = {"Authorization": f"Bearer {token2}"}
        
        # Onboard WITH payout
        onboarding_data2 = {
            "username": f"zerobal{random_string()}",
            "display_name": "Zero Balance Creator",
            "country": "US",
            "community": {
                "name": f"Zero Balance Community {random_string(4)}",
                "slug": f"zerobal{random_string()}",
                "category": "Other"
            },
            "pricing": {
                "pricing_type": "recurring",
                "billing_period": "monthly",
                "price": 8,
                "currency": "USD"
            },
            "payout": {
                "method": "bank",
                "details": {
                    "account": "123456789"
                }
            }
        }
        response = requests.post(f"{BASE_URL}/onboarding/creator", headers=headers2, json=onboarding_data2)
        if not (response.status_code == 200 and response.json().get('ok')):
            print(f"❌ Onboarding failed")
            return results
        
        print(f"✅ Creator onboarded WITH payout method")
        
    except Exception as e:
        print(f"❌ Setup exception: {e}")
        return results
    
    # Test withdraw with 0 balance
    try:
        print(f"\n[3.4] Testing POST /api/creator/withdraw (0 balance, expect 400)...")
        response = requests.post(f"{BASE_URL}/creator/withdraw", headers=headers2, json={})
        if response.status_code == 400:
            error_msg = response.json().get('error', '')
            if 'balance' in error_msg.lower() or 'no available' in error_msg.lower():
                print(f"✅ POST /api/creator/withdraw returned 400 with message: '{error_msg}'")
                results.append(("Withdraw with 0 balance (400)", True, None))
            else:
                print(f"❌ Got 400 but wrong message: '{error_msg}'")
                results.append(("Withdraw with 0 balance (400)", False, f"Wrong error message"))
        else:
            print(f"❌ Expected 400, got {response.status_code} - {response.text}")
            results.append(("Withdraw with 0 balance (400)", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Withdraw test exception: {e}")
        results.append(("Withdraw with 0 balance (400)", False, str(e)))
    
    return results

def test_4_full_earning_withdraw_flow(creator_data):
    """Test 4: Full earning + withdraw flow"""
    print("\n" + "="*80)
    print("TEST 4: FULL EARNING + WITHDRAW FLOW")
    print("="*80)
    
    results = []
    
    if not creator_data:
        print("❌ No creator data available")
        return results
    
    # Get admin token
    print(f"\n[4.1] Getting admin token...")
    admin_token = get_access_token(ADMIN_EMAIL, "AdminPass123!")
    if not admin_token:
        print(f"❌ Failed to get admin token")
        results.append(("Get admin token", False, "Token retrieval failed"))
        return results
    print(f"✅ Got admin token")
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    creator_headers = {"Authorization": f"Bearer {creator_data['token']}"}
    
    # Activate creator's community
    try:
        print(f"\n[4.2] Activating creator's community...")
        update_data = {
            "community_id": creator_data['community']['id'],
            "status": "active"
        }
        response = requests.post(f"{BASE_URL}/admin/update-community", headers=admin_headers, json=update_data)
        if response.status_code == 200 and response.json().get('ok'):
            print(f"✅ Community activated")
            results.append(("Admin activate community", True, None))
        else:
            print(f"❌ Failed to activate community: {response.status_code} - {response.text}")
            results.append(("Admin activate community", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Activate community exception: {e}")
        results.append(("Admin activate community", False, str(e)))
        return results
    
    # Create a fan
    fan_email = f"fan_{random_string()}@test.com"
    fan_password = "TestPass123!"
    
    try:
        print(f"\n[4.3] Creating fan user...")
        response = signup_user(fan_email, fan_password, "Test Fan", "fan")
        if not (response and response.status_code == 200):
            print(f"❌ Fan signup failed")
            return results
        time.sleep(2)
        print(f"✅ Fan created")
    except Exception as e:
        print(f"❌ Fan creation exception: {e}")
        return results
    
    # Admin adds fan to creator's community
    try:
        print(f"\n[4.4] Admin adding fan to creator's community...")
        add_member_data = {
            "community_id": creator_data['community']['id'],
            "user_email": fan_email,
            "plan": "monthly"
        }
        response = requests.post(f"{BASE_URL}/admin/add-member", headers=admin_headers, json=add_member_data)
        if response.status_code == 200 and response.json().get('ok'):
            print(f"✅ Fan added to community")
            results.append(("Admin add member", True, None))
        else:
            print(f"❌ Failed to add member: {response.status_code} - {response.text}")
            results.append(("Admin add member", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Add member exception: {e}")
        results.append(("Admin add member", False, str(e)))
        return results
    
    # Verify creator's balance is now > 0
    try:
        print(f"\n[4.5] Verifying creator's balance increased...")
        response = requests.get(f"{BASE_URL}/creator/earnings", headers=creator_headers)
        if response.status_code == 200:
            data = response.json()
            balance = data.get('balance', {})
            available = balance.get('available', 0)
            if available > 0:
                print(f"✅ Creator balance.available = {available} (expected 9.0 = 10 * 0.9)")
                results.append(("Creator balance after member added", True, None))
            else:
                print(f"❌ Expected balance > 0, got {available}")
                results.append(("Creator balance after member added", False, f"Balance is {available}"))
                return results
        else:
            print(f"❌ Failed to get earnings: {response.status_code}")
            results.append(("Creator balance after member added", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Get earnings exception: {e}")
        results.append(("Creator balance after member added", False, str(e)))
        return results
    
    # Creator withdraws
    try:
        print(f"\n[4.6] Creator withdrawing funds...")
        response = requests.post(f"{BASE_URL}/creator/withdraw", headers=creator_headers, json={})
        if response.status_code == 200 and response.json().get('ok'):
            print(f"✅ Withdrawal successful")
            results.append(("POST /api/creator/withdraw", True, None))
        else:
            print(f"❌ Withdrawal failed: {response.status_code} - {response.text}")
            results.append(("POST /api/creator/withdraw", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Withdraw exception: {e}")
        results.append(("POST /api/creator/withdraw", False, str(e)))
        return results
    
    # Verify balance.available is now 0 and balance.pending increased
    try:
        print(f"\n[4.7] Verifying balance after withdrawal...")
        response = requests.get(f"{BASE_URL}/creator/earnings", headers=creator_headers)
        if response.status_code == 200:
            data = response.json()
            balance = data.get('balance', {})
            available = balance.get('available', 0)
            pending = balance.get('pending', 0)
            payouts = data.get('payouts', [])
            
            if available == 0 and pending > 0 and len(payouts) > 0:
                pending_payouts = [p for p in payouts if p.get('status') == 'pending']
                if len(pending_payouts) > 0:
                    print(f"✅ After withdrawal: available=0, pending={pending}, {len(pending_payouts)} pending payout(s)")
                    results.append(("Balance after withdrawal", True, None))
                else:
                    print(f"❌ No pending payouts found")
                    results.append(("Balance after withdrawal", False, "No pending payouts"))
            else:
                print(f"❌ Expected available=0, pending>0, payouts>0; got available={available}, pending={pending}, payouts={len(payouts)}")
                results.append(("Balance after withdrawal", False, f"Unexpected balance state"))
        else:
            print(f"❌ Failed to get earnings: {response.status_code}")
            results.append(("Balance after withdrawal", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Get earnings exception: {e}")
        results.append(("Balance after withdrawal", False, str(e)))
    
    return results

def test_5_update_payout_method(creator_data):
    """Test 5: POST /api/creator/payout-method to update payout info"""
    print("\n" + "="*80)
    print("TEST 5: UPDATE PAYOUT METHOD")
    print("="*80)
    
    results = []
    
    if not creator_data:
        print("❌ No creator data available")
        return results
    
    headers = {"Authorization": f"Bearer {creator_data['token']}"}
    
    # Update payout method to UPI
    try:
        print(f"\n[5.1] Updating payout method to UPI...")
        update_data = {
            "method": "upi",
            "details": {
                "upi_id": "test@upi"
            }
        }
        response = requests.post(f"{BASE_URL}/creator/payout-method", headers=headers, json=update_data)
        if response.status_code == 200 and response.json().get('ok'):
            print(f"✅ Payout method updated")
            results.append(("POST /api/creator/payout-method", True, None))
        else:
            print(f"❌ Failed to update payout method: {response.status_code} - {response.text}")
            results.append(("POST /api/creator/payout-method", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Update payout method exception: {e}")
        results.append(("POST /api/creator/payout-method", False, str(e)))
        return results
    
    # Verify via GET /api/me
    try:
        print(f"\n[5.2] Verifying updated payout method in GET /api/me...")
        response = requests.get(f"{BASE_URL}/me", headers=headers)
        if response.status_code == 200:
            data = response.json()
            profile = data.get('profile', {})
            payout_method = profile.get('payout_method')
            if payout_method == 'upi':
                print(f"✅ GET /api/me shows payout_method='upi'")
                results.append(("Verify updated payout method", True, None))
            else:
                print(f"❌ Expected payout_method='upi', got '{payout_method}'")
                results.append(("Verify updated payout method", False, f"Got {payout_method}"))
        else:
            print(f"❌ GET /api/me failed: {response.status_code}")
            results.append(("Verify updated payout method", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/me exception: {e}")
        results.append(("Verify updated payout method", False, str(e)))
    
    return results

def test_6_regression_tests():
    """Test 6: Regression tests - verify existing features still work"""
    print("\n" + "="*80)
    print("TEST 6: REGRESSION TESTS")
    print("="*80)
    
    results = []
    
    # Test onboarding without payout still works
    creator_email = f"regression_{random_string()}@test.com"
    creator_password = "TestPass123!"
    
    try:
        print(f"\n[6.1] Testing onboarding WITHOUT payout (regression)...")
        response = signup_user(creator_email, creator_password, "Regression Creator", "creator")
        if not (response and response.status_code == 200):
            print(f"❌ Signup failed")
            return results
        time.sleep(2)
        
        token = get_access_token(creator_email, creator_password)
        if not token:
            print(f"❌ Failed to get token")
            return results
        
        headers = {"Authorization": f"Bearer {token}"}
        
        onboarding_data = {
            "username": f"regression{random_string()}",
            "display_name": "Regression Creator",
            "country": "US",
            "community": {
                "name": f"Regression Community {random_string(4)}",
                "slug": f"regression{random_string()}",
                "category": "Education"
            },
            "pricing": {
                "pricing_type": "recurring",
                "billing_period": "monthly",
                "price": 7,
                "currency": "USD"
            }
        }
        response = requests.post(f"{BASE_URL}/onboarding/creator", headers=headers, json=onboarding_data)
        if response.status_code == 200 and response.json().get('ok'):
            print(f"✅ Onboarding without payout still works")
            results.append(("Regression: onboarding without payout", True, None))
        else:
            print(f"❌ Onboarding failed: {response.status_code} - {response.text}")
            results.append(("Regression: onboarding without payout", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Regression test exception: {e}")
        results.append(("Regression: onboarding without payout", False, str(e)))
    
    # Test GET /api/communities still works
    try:
        print(f"\n[6.2] Testing GET /api/communities (regression)...")
        response = requests.get(f"{BASE_URL}/communities")
        if response.status_code == 200 and 'communities' in response.json():
            print(f"✅ GET /api/communities still works")
            results.append(("Regression: GET /api/communities", True, None))
        else:
            print(f"❌ GET /api/communities failed: {response.status_code}")
            results.append(("Regression: GET /api/communities", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Regression test exception: {e}")
        results.append(("Regression: GET /api/communities", False, str(e)))
    
    # Test POST /api/platform/subscribe still works
    if token:
        try:
            print(f"\n[6.3] Testing POST /api/platform/subscribe (regression)...")
            response = requests.post(f"{BASE_URL}/platform/subscribe", headers=headers, json={"plan": "pro"})
            if response.status_code == 200 and response.json().get('ok'):
                print(f"✅ POST /api/platform/subscribe still works")
                results.append(("Regression: POST /api/platform/subscribe", True, None))
                
                # Verify platform_status is pending
                response = requests.get(f"{BASE_URL}/me", headers=headers)
                if response.status_code == 200:
                    profile = response.json().get('profile', {})
                    if profile.get('platform_status') == 'pending':
                        print(f"✅ Platform status is 'pending' after subscribe")
                    else:
                        print(f"⚠️  Platform status is '{profile.get('platform_status')}', expected 'pending'")
            else:
                print(f"❌ POST /api/platform/subscribe failed: {response.status_code}")
                results.append(("Regression: POST /api/platform/subscribe", False, f"Status {response.status_code}"))
        except Exception as e:
            print(f"❌ Regression test exception: {e}")
            results.append(("Regression: POST /api/platform/subscribe", False, str(e)))
    
    return results

def print_summary(all_results):
    """Print test summary"""
    print("\n" + "="*80)
    print("PAYOUT FEATURES TEST SUMMARY")
    print("="*80)
    
    total = len(all_results)
    passed = sum(1 for _, success, _ in all_results if success)
    failed = total - passed
    
    print(f"\nTotal tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success rate: {(passed/total*100) if total > 0 else 0:.1f}%")
    
    if failed > 0:
        print("\n❌ FAILED TESTS:")
        for test_name, success, error in all_results:
            if not success:
                print(f"   - {test_name}: {error}")
    else:
        print("\n✅ ALL TESTS PASSED!")
    
    print("\n" + "="*80)

def main():
    """Main test execution"""
    print("="*80)
    print("FANVASE PAYOUT FEATURES TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Testing new payout functionality")
    print("="*80)
    
    all_results = []
    
    # Test 1: Creator onboarding with payout
    results_1, creator_data = test_1_creator_onboarding_with_payout()
    all_results.extend(results_1)
    
    # Test 2: Earnings includes payout fields
    if creator_data:
        results_2 = test_2_earnings_includes_payout_fields(creator_data)
        all_results.extend(results_2)
    
    # Test 3: Withdraw guardrails
    results_3 = test_3_withdraw_guardrails()
    all_results.extend(results_3)
    
    # Test 4: Full earning + withdraw flow
    if creator_data:
        results_4 = test_4_full_earning_withdraw_flow(creator_data)
        all_results.extend(results_4)
    
    # Test 5: Update payout method
    if creator_data:
        results_5 = test_5_update_payout_method(creator_data)
        all_results.extend(results_5)
    
    # Test 6: Regression tests
    results_6 = test_6_regression_tests()
    all_results.extend(results_6)
    
    # Print summary
    print_summary(all_results)
    
    return all_results

if __name__ == "__main__":
    main()
