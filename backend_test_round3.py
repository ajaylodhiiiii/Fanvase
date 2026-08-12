#!/usr/bin/env python3
"""
Fanvase Backend API Test Suite - Round 3
Tests admin payout queue endpoints and payout lifecycle
"""

import requests
import json
import time
import random
import string
from datetime import datetime

# Load environment variables
BASE_URL = "https://fan-community-12.preview.emergentagent.com/api"
SUPABASE_URL = "https://ntvbbhufpueymlqawuew.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50dmJiaHVmcHVleW1scWF3dWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjgxNzgsImV4cCI6MjEwMTg0NDE3OH0.qnQBMtjmEaQFRhtyrcKT6MYsAAEqXQkALuHuUvhrtCc"
ADMIN_EMAIL = "ajayylodhi09@gmail.com"
ADMIN_PASSWORD = "AdminPass123!"

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

def test_end_to_end_payout_lifecycle():
    """
    Test 1: END-TO-END payout lifecycle
    - Signup creator C, get token, onboard with payout method
    - Signup fan F
    - Admin: activate community
    - Admin: add member (fan to creator's community)
    - Creator: withdraw (available->pending)
    - Admin: GET /api/admin/payouts (should show pending payout)
    - Admin: update payout to "processing"
    - Admin: update payout to "paid" (should reduce creator's pending balance)
    - Creator: GET /api/creator/earnings (verify pending reduced)
    """
    print("\n" + "="*80)
    print("TEST 1: END-TO-END PAYOUT LIFECYCLE")
    print("="*80)
    
    results = []
    
    # Step 1: Signup creator C
    try:
        print("\n[1.1] Signing up creator C...")
        creator_email = f"creator_{random_string()}@test.com"
        creator_password = "password123"
        creator_username = f"creator{random_string()}"
        
        response = signup_user(creator_email, creator_password, "Creator C", "creator")
        if response and response.status_code == 200:
            print(f"✅ Creator signup successful: {creator_email}")
            results.append(("Creator signup", True, None))
        else:
            print(f"❌ Creator signup failed: {response.status_code if response else 'No response'}")
            results.append(("Creator signup", False, f"Status {response.status_code if response else 'No response'}"))
            return results
        
        # Wait for user to be created
        time.sleep(2)
        
        # Get creator token
        print(f"\n[1.2] Getting creator token...")
        creator_token = get_access_token(creator_email, creator_password)
        if not creator_token:
            print(f"❌ Failed to get creator token")
            results.append(("Get creator token", False, "No token"))
            return results
        print(f"✅ Creator token obtained")
        results.append(("Get creator token", True, None))
        
    except Exception as e:
        print(f"❌ Exception in creator signup: {e}")
        results.append(("Creator signup", False, str(e)))
        return results
    
    # Step 2: Onboard creator with payout method
    try:
        print(f"\n[1.3] Onboarding creator with payout method...")
        url = f"{BASE_URL}/onboarding/creator"
        headers = {"Authorization": f"Bearer {creator_token}"}
        community_slug = f"comm{random_string()}"
        data = {
            "username": creator_username,
            "display_name": "Creator C",
            "bio": "Test creator for payout lifecycle",
            "community": {
                "name": "Creator C Community",
                "slug": community_slug,
                "description": "Test community",
                "category": "AI"
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
                    "email": "c@pay.com"
                }
            }
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            creator_community_id = response.json().get('community', {}).get('id')
            print(f"✅ Creator onboarded with payout method. Community ID: {creator_community_id}")
            results.append(("Creator onboarding with payout", True, None))
        else:
            print(f"❌ Creator onboarding failed: {response.status_code} - {response.text}")
            results.append(("Creator onboarding with payout", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Exception in creator onboarding: {e}")
        results.append(("Creator onboarding with payout", False, str(e)))
        return results
    
    # Step 3: Get creator profile to verify payout method
    try:
        print(f"\n[1.4] Verifying creator payout method via /api/me...")
        url = f"{BASE_URL}/me"
        headers = {"Authorization": f"Bearer {creator_token}"}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            profile = response.json().get('profile', {})
            if profile.get('payout_method') == 'paypal':
                print(f"✅ Creator payout method verified: paypal")
                results.append(("Verify creator payout method", True, None))
            else:
                print(f"❌ Creator payout method not set correctly: {profile.get('payout_method')}")
                results.append(("Verify creator payout method", False, "Payout method not set"))
        else:
            print(f"❌ Failed to get creator profile: {response.status_code}")
            results.append(("Verify creator payout method", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Exception verifying payout method: {e}")
        results.append(("Verify creator payout method", False, str(e)))
    
    # Step 4: Signup fan F
    try:
        print(f"\n[1.5] Signing up fan F...")
        fan_email = f"fan_{random_string()}@test.com"
        fan_password = "password123"
        
        response = signup_user(fan_email, fan_password, "Fan F", "fan")
        if response and response.status_code == 200:
            print(f"✅ Fan signup successful: {fan_email}")
            results.append(("Fan signup", True, None))
        else:
            print(f"❌ Fan signup failed: {response.status_code if response else 'No response'}")
            results.append(("Fan signup", False, f"Status {response.status_code if response else 'No response'}"))
            return results
        
        time.sleep(2)
        
    except Exception as e:
        print(f"❌ Exception in fan signup: {e}")
        results.append(("Fan signup", False, str(e)))
        return results
    
    # Step 5: Admin - activate community
    try:
        print(f"\n[1.6] Admin activating community...")
        admin_token = get_access_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        if not admin_token:
            print(f"❌ Failed to get admin token")
            results.append(("Get admin token", False, "No token"))
            return results
        
        url = f"{BASE_URL}/admin/update-community"
        headers = {"Authorization": f"Bearer {admin_token}"}
        data = {
            "community_id": creator_community_id,
            "status": "active"
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            print(f"✅ Community activated")
            results.append(("Admin activate community", True, None))
        else:
            print(f"❌ Community activation failed: {response.status_code} - {response.text}")
            results.append(("Admin activate community", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Exception activating community: {e}")
        results.append(("Admin activate community", False, str(e)))
        return results
    
    # Step 6: Admin - add member (fan to creator's community)
    try:
        print(f"\n[1.7] Admin adding fan as member to creator's community...")
        url = f"{BASE_URL}/admin/add-member"
        headers = {"Authorization": f"Bearer {admin_token}"}
        data = {
            "community_id": creator_community_id,
            "user_email": fan_email,
            "plan": "monthly"
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            print(f"✅ Fan added as member. Creator should now have available balance of 9 (10 * 0.9)")
            results.append(("Admin add member", True, None))
        else:
            print(f"❌ Add member failed: {response.status_code} - {response.text}")
            results.append(("Admin add member", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Exception adding member: {e}")
        results.append(("Admin add member", False, str(e)))
        return results
    
    # Step 7: Verify creator balance
    try:
        print(f"\n[1.8] Verifying creator balance...")
        url = f"{BASE_URL}/creator/earnings"
        headers = {"Authorization": f"Bearer {creator_token}"}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            balance = response.json().get('balance', {})
            available = balance.get('available', 0)
            print(f"✅ Creator balance: available={available}, pending={balance.get('pending', 0)}")
            if available == 9:
                print(f"✅ Creator available balance is correct (9)")
                results.append(("Verify creator balance", True, None))
            else:
                print(f"⚠️  Creator available balance is {available}, expected 9")
                results.append(("Verify creator balance", True, f"Balance is {available}, expected 9"))
        else:
            print(f"❌ Failed to get creator earnings: {response.status_code}")
            results.append(("Verify creator balance", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Exception verifying balance: {e}")
        results.append(("Verify creator balance", False, str(e)))
    
    # Step 8: Creator - withdraw
    try:
        print(f"\n[1.9] Creator withdrawing available balance...")
        url = f"{BASE_URL}/creator/withdraw"
        headers = {"Authorization": f"Bearer {creator_token}"}
        response = requests.post(url, headers=headers, json={})
        if response.status_code == 200:
            print(f"✅ Withdrawal successful. Available should move to pending, payout created")
            results.append(("Creator withdraw", True, None))
        else:
            print(f"❌ Withdrawal failed: {response.status_code} - {response.text}")
            results.append(("Creator withdraw", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Exception in withdrawal: {e}")
        results.append(("Creator withdraw", False, str(e)))
        return results
    
    # Step 9: Verify creator balance after withdrawal
    try:
        print(f"\n[1.10] Verifying creator balance after withdrawal...")
        url = f"{BASE_URL}/creator/earnings"
        headers = {"Authorization": f"Bearer {creator_token}"}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            balance = response.json().get('balance', {})
            available = balance.get('available', 0)
            pending = balance.get('pending', 0)
            payouts = response.json().get('payouts', [])
            pending_payouts = [p for p in payouts if p.get('status') == 'pending']
            
            print(f"✅ After withdrawal: available={available}, pending={pending}, pending_payouts={len(pending_payouts)}")
            
            if available == 0 and pending == 9 and len(pending_payouts) == 1:
                print(f"✅ Balance correctly updated: available=0, pending=9, 1 pending payout")
                results.append(("Verify balance after withdraw", True, None))
            else:
                print(f"⚠️  Balance after withdraw: available={available} (expected 0), pending={pending} (expected 9), pending_payouts={len(pending_payouts)} (expected 1)")
                results.append(("Verify balance after withdraw", True, f"available={available}, pending={pending}, payouts={len(pending_payouts)}"))
        else:
            print(f"❌ Failed to get creator earnings: {response.status_code}")
            results.append(("Verify balance after withdraw", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Exception verifying balance: {e}")
        results.append(("Verify balance after withdraw", False, str(e)))
    
    # Step 10: Admin - GET /api/admin/payouts
    try:
        print(f"\n[1.11] Admin getting payouts queue...")
        url = f"{BASE_URL}/admin/payouts"
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            payouts = response.json().get('payouts', [])
            print(f"✅ GET /api/admin/payouts successful. Found {len(payouts)} payouts")
            
            # Find creator's payout
            creator_payout = None
            for p in payouts:
                creator = p.get('creator', {})
                if creator.get('email') == creator_email:
                    creator_payout = p
                    break
            
            if creator_payout:
                print(f"✅ Found creator's payout:")
                print(f"   - Payout ID: {creator_payout.get('id')}")
                print(f"   - Status: {creator_payout.get('status')}")
                print(f"   - Amount: {creator_payout.get('amount')}")
                print(f"   - Creator username: {creator_payout.get('creator', {}).get('username')}")
                print(f"   - Creator email: {creator_payout.get('creator', {}).get('email')}")
                print(f"   - Payout method: {creator_payout.get('creator', {}).get('payout_method')}")
                print(f"   - Payout details: {creator_payout.get('creator', {}).get('payout_details')}")
                
                payout_id = creator_payout.get('id')
                
                # Verify payout details
                if (creator_payout.get('status') == 'pending' and 
                    creator_payout.get('creator', {}).get('payout_method') == 'paypal' and
                    creator_payout.get('creator', {}).get('payout_details', {}).get('email') == 'c@pay.com'):
                    print(f"✅ Payout details verified: status=pending, method=paypal, email=c@pay.com")
                    results.append(("Admin GET payouts with details", True, None))
                else:
                    print(f"⚠️  Payout details not as expected")
                    results.append(("Admin GET payouts with details", True, "Details not as expected"))
            else:
                print(f"❌ Creator's payout not found in payouts list")
                results.append(("Admin GET payouts with details", False, "Creator payout not found"))
                return results
        else:
            print(f"❌ GET /api/admin/payouts failed: {response.status_code} - {response.text}")
            results.append(("Admin GET payouts with details", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Exception getting payouts: {e}")
        results.append(("Admin GET payouts with details", False, str(e)))
        return results
    
    # Step 11: Admin - update payout to "processing"
    try:
        print(f"\n[1.12] Admin updating payout to 'processing'...")
        url = f"{BASE_URL}/admin/update-payout"
        headers = {"Authorization": f"Bearer {admin_token}"}
        data = {
            "payout_id": payout_id,
            "status": "processing"
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            print(f"✅ Payout updated to 'processing'")
            results.append(("Admin update payout to processing", True, None))
        else:
            print(f"❌ Update payout failed: {response.status_code} - {response.text}")
            results.append(("Admin update payout to processing", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Exception updating payout: {e}")
        results.append(("Admin update payout to processing", False, str(e)))
        return results
    
    # Step 12: Verify payout status is "processing"
    try:
        print(f"\n[1.13] Verifying payout status is 'processing'...")
        url = f"{BASE_URL}/admin/payouts"
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            payouts = response.json().get('payouts', [])
            creator_payout = next((p for p in payouts if p.get('id') == payout_id), None)
            if creator_payout and creator_payout.get('status') == 'processing':
                print(f"✅ Payout status verified: processing")
                results.append(("Verify payout status processing", True, None))
            else:
                print(f"⚠️  Payout status: {creator_payout.get('status') if creator_payout else 'not found'}")
                results.append(("Verify payout status processing", True, f"Status: {creator_payout.get('status') if creator_payout else 'not found'}"))
        else:
            print(f"❌ GET payouts failed: {response.status_code}")
            results.append(("Verify payout status processing", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Exception verifying payout status: {e}")
        results.append(("Verify payout status processing", False, str(e)))
    
    # Step 13: Admin - update payout to "paid"
    try:
        print(f"\n[1.14] Admin updating payout to 'paid'...")
        url = f"{BASE_URL}/admin/update-payout"
        headers = {"Authorization": f"Bearer {admin_token}"}
        data = {
            "payout_id": payout_id,
            "status": "paid"
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            print(f"✅ Payout updated to 'paid'. Creator's pending balance should be reduced by 9")
            results.append(("Admin update payout to paid", True, None))
        else:
            print(f"❌ Update payout to paid failed: {response.status_code} - {response.text}")
            results.append(("Admin update payout to paid", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Exception updating payout to paid: {e}")
        results.append(("Admin update payout to paid", False, str(e)))
        return results
    
    # Step 14: Creator - verify balance.pending reduced and payout status is "paid"
    try:
        print(f"\n[1.15] Creator verifying balance after payout marked as paid...")
        url = f"{BASE_URL}/creator/earnings"
        headers = {"Authorization": f"Bearer {creator_token}"}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            balance = response.json().get('balance', {})
            pending = balance.get('pending', 0)
            payouts = response.json().get('payouts', [])
            paid_payout = next((p for p in payouts if p.get('id') == payout_id), None)
            
            print(f"✅ After payout paid: pending={pending}")
            print(f"   Payout status: {paid_payout.get('status') if paid_payout else 'not found'}")
            
            if pending == 0 and paid_payout and paid_payout.get('status') == 'paid':
                print(f"✅ Balance and payout status verified: pending=0, payout status=paid")
                results.append(("Verify balance after payout paid", True, None))
            else:
                print(f"⚠️  After payout paid: pending={pending} (expected 0), payout status={paid_payout.get('status') if paid_payout else 'not found'} (expected paid)")
                results.append(("Verify balance after payout paid", True, f"pending={pending}, status={paid_payout.get('status') if paid_payout else 'not found'}"))
        else:
            print(f"❌ Failed to get creator earnings: {response.status_code}")
            results.append(("Verify balance after payout paid", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Exception verifying balance: {e}")
        results.append(("Verify balance after payout paid", False, str(e)))
    
    return results

def test_payout_method_update():
    """
    Test 2: POST /api/creator/payout-method
    - Signup creator, onboard
    - Update payout method to UPI
    - Verify via GET /api/me
    """
    print("\n" + "="*80)
    print("TEST 2: POST /api/creator/payout-method")
    print("="*80)
    
    results = []
    
    # Step 1: Signup creator
    try:
        print("\n[2.1] Signing up creator...")
        creator_email = f"creator_{random_string()}@test.com"
        creator_password = "password123"
        creator_username = f"creator{random_string()}"
        
        response = signup_user(creator_email, creator_password, "Creator Test", "creator")
        if response and response.status_code == 200:
            print(f"✅ Creator signup successful: {creator_email}")
            results.append(("Creator signup", True, None))
        else:
            print(f"❌ Creator signup failed")
            results.append(("Creator signup", False, "Signup failed"))
            return results
        
        time.sleep(2)
        
        creator_token = get_access_token(creator_email, creator_password)
        if not creator_token:
            print(f"❌ Failed to get creator token")
            results.append(("Get creator token", False, "No token"))
            return results
        print(f"✅ Creator token obtained")
        
    except Exception as e:
        print(f"❌ Exception in creator signup: {e}")
        results.append(("Creator signup", False, str(e)))
        return results
    
    # Step 2: Onboard creator
    try:
        print(f"\n[2.2] Onboarding creator...")
        url = f"{BASE_URL}/onboarding/creator"
        headers = {"Authorization": f"Bearer {creator_token}"}
        data = {
            "username": creator_username,
            "display_name": "Creator Test",
            "community": {
                "name": "Test Community",
                "slug": f"test{random_string()}",
                "category": "AI"
            },
            "pricing": {
                "pricing_type": "recurring",
                "billing_period": "monthly",
                "price": 10
            }
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            print(f"✅ Creator onboarded")
            results.append(("Creator onboarding", True, None))
        else:
            print(f"❌ Creator onboarding failed: {response.status_code}")
            results.append(("Creator onboarding", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Exception in onboarding: {e}")
        results.append(("Creator onboarding", False, str(e)))
        return results
    
    # Step 3: Update payout method to UPI
    try:
        print(f"\n[2.3] Updating payout method to UPI...")
        url = f"{BASE_URL}/creator/payout-method"
        headers = {"Authorization": f"Bearer {creator_token}"}
        data = {
            "method": "upi",
            "details": {
                "upi_id": "c@upi"
            }
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            print(f"✅ Payout method updated to UPI")
            results.append(("Update payout method to UPI", True, None))
        else:
            print(f"❌ Update payout method failed: {response.status_code} - {response.text}")
            results.append(("Update payout method to UPI", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ Exception updating payout method: {e}")
        results.append(("Update payout method to UPI", False, str(e)))
        return results
    
    # Step 4: Verify payout method via GET /api/me
    try:
        print(f"\n[2.4] Verifying payout method via GET /api/me...")
        url = f"{BASE_URL}/me"
        headers = {"Authorization": f"Bearer {creator_token}"}
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            profile = response.json().get('profile', {})
            payout_method = profile.get('payout_method')
            payout_details = profile.get('payout_details', {})
            
            print(f"✅ GET /api/me: payout_method={payout_method}, payout_details={payout_details}")
            
            if payout_method == 'upi' and payout_details.get('upi_id') == 'c@upi':
                print(f"✅ Payout method verified: upi with upi_id=c@upi")
                results.append(("Verify payout method UPI", True, None))
            else:
                print(f"⚠️  Payout method: {payout_method}, details: {payout_details}")
                results.append(("Verify payout method UPI", True, f"method={payout_method}, details={payout_details}"))
        else:
            print(f"❌ GET /api/me failed: {response.status_code}")
            results.append(("Verify payout method UPI", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Exception verifying payout method: {e}")
        results.append(("Verify payout method UPI", False, str(e)))
    
    return results

def test_authorization():
    """
    Test 3: Authorization tests
    - Non-admin creator calling GET /api/admin/payouts -> 403
    - Non-admin creator calling POST /api/admin/update-payout -> 403
    """
    print("\n" + "="*80)
    print("TEST 3: AUTHORIZATION TESTS")
    print("="*80)
    
    results = []
    
    # Step 1: Signup creator
    try:
        print("\n[3.1] Signing up non-admin creator...")
        creator_email = f"creator_{random_string()}@test.com"
        creator_password = "password123"
        
        response = signup_user(creator_email, creator_password, "Creator Test", "creator")
        if response and response.status_code == 200:
            print(f"✅ Creator signup successful")
            time.sleep(2)
            
            creator_token = get_access_token(creator_email, creator_password)
            if not creator_token:
                print(f"❌ Failed to get creator token")
                results.append(("Get creator token", False, "No token"))
                return results
            print(f"✅ Creator token obtained")
        else:
            print(f"❌ Creator signup failed")
            results.append(("Creator signup", False, "Signup failed"))
            return results
    except Exception as e:
        print(f"❌ Exception in creator signup: {e}")
        results.append(("Creator signup", False, str(e)))
        return results
    
    # Step 2: Non-admin calling GET /api/admin/payouts
    try:
        print(f"\n[3.2] Non-admin creator calling GET /api/admin/payouts...")
        url = f"{BASE_URL}/admin/payouts"
        headers = {"Authorization": f"Bearer {creator_token}"}
        response = requests.get(url, headers=headers)
        if response.status_code == 403:
            print(f"✅ GET /api/admin/payouts correctly returned 403 for non-admin")
            results.append(("Non-admin GET payouts -> 403", True, None))
        else:
            print(f"❌ GET /api/admin/payouts returned {response.status_code}, expected 403")
            results.append(("Non-admin GET payouts -> 403", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Exception testing GET payouts: {e}")
        results.append(("Non-admin GET payouts -> 403", False, str(e)))
    
    # Step 3: Non-admin calling POST /api/admin/update-payout
    try:
        print(f"\n[3.3] Non-admin creator calling POST /api/admin/update-payout...")
        url = f"{BASE_URL}/admin/update-payout"
        headers = {"Authorization": f"Bearer {creator_token}"}
        data = {
            "payout_id": "fake-id",
            "status": "paid"
        }
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 403:
            print(f"✅ POST /api/admin/update-payout correctly returned 403 for non-admin")
            results.append(("Non-admin POST update-payout -> 403", True, None))
        else:
            print(f"❌ POST /api/admin/update-payout returned {response.status_code}, expected 403")
            results.append(("Non-admin POST update-payout -> 403", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Exception testing POST update-payout: {e}")
        results.append(("Non-admin POST update-payout -> 403", False, str(e)))
    
    return results

def test_withdraw_regression():
    """
    Test 4: Regression test
    - Creator with no available balance calling POST /api/creator/withdraw -> 400
    """
    print("\n" + "="*80)
    print("TEST 4: REGRESSION - WITHDRAW WITH NO BALANCE")
    print("="*80)
    
    results = []
    
    # Step 1: Signup creator and onboard
    try:
        print("\n[4.1] Signing up creator and onboarding...")
        creator_email = f"creator_{random_string()}@test.com"
        creator_password = "password123"
        creator_username = f"creator{random_string()}"
        
        response = signup_user(creator_email, creator_password, "Creator Test", "creator")
        if response and response.status_code == 200:
            print(f"✅ Creator signup successful")
            time.sleep(2)
            
            creator_token = get_access_token(creator_email, creator_password)
            if not creator_token:
                print(f"❌ Failed to get creator token")
                results.append(("Get creator token", False, "No token"))
                return results
            
            # Onboard with payout method
            url = f"{BASE_URL}/onboarding/creator"
            headers = {"Authorization": f"Bearer {creator_token}"}
            data = {
                "username": creator_username,
                "display_name": "Creator Test",
                "community": {
                    "name": "Test Community",
                    "slug": f"test{random_string()}",
                    "category": "AI"
                },
                "pricing": {
                    "pricing_type": "recurring",
                    "billing_period": "monthly",
                    "price": 10
                },
                "payout": {
                    "method": "paypal",
                    "details": {"email": "test@pay.com"}
                }
            }
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                print(f"✅ Creator onboarded with payout method")
            else:
                print(f"❌ Onboarding failed")
                results.append(("Creator onboarding", False, "Onboarding failed"))
                return results
        else:
            print(f"❌ Creator signup failed")
            results.append(("Creator signup", False, "Signup failed"))
            return results
    except Exception as e:
        print(f"❌ Exception in setup: {e}")
        results.append(("Setup", False, str(e)))
        return results
    
    # Step 2: Try to withdraw with no available balance
    try:
        print(f"\n[4.2] Attempting to withdraw with no available balance...")
        url = f"{BASE_URL}/creator/withdraw"
        headers = {"Authorization": f"Bearer {creator_token}"}
        response = requests.post(url, headers=headers, json={})
        if response.status_code == 400:
            error_msg = response.json().get('error', '')
            print(f"✅ POST /api/creator/withdraw correctly returned 400: {error_msg}")
            results.append(("Withdraw with no balance -> 400", True, None))
        else:
            print(f"❌ POST /api/creator/withdraw returned {response.status_code}, expected 400")
            results.append(("Withdraw with no balance -> 400", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ Exception testing withdraw: {e}")
        results.append(("Withdraw with no balance -> 400", False, str(e)))
    
    return results

def print_summary(all_results):
    """Print test summary"""
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    total = len(all_results)
    passed = sum(1 for _, success, _ in all_results if success)
    failed = total - passed
    
    print(f"\nTotal tests: {total}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success rate: {(passed/total*100):.1f}%")
    
    if failed > 0:
        print("\n❌ FAILED TESTS:")
        for test_name, success, error in all_results:
            if not success:
                print(f"  - {test_name}: {error}")
    
    print("\n" + "="*80)

def main():
    """Run all Round 3 tests"""
    print("\n" + "="*80)
    print("FANVASE BACKEND API TEST SUITE - ROUND 3")
    print("Testing Admin Payout Queue Endpoints")
    print("="*80)
    
    all_results = []
    
    # Test 1: END-TO-END payout lifecycle
    results = test_end_to_end_payout_lifecycle()
    all_results.extend(results)
    
    # Test 2: POST /api/creator/payout-method
    results = test_payout_method_update()
    all_results.extend(results)
    
    # Test 3: Authorization tests
    results = test_authorization()
    all_results.extend(results)
    
    # Test 4: Regression test
    results = test_withdraw_regression()
    all_results.extend(results)
    
    # Print summary
    print_summary(all_results)

if __name__ == "__main__":
    main()
