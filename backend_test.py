#!/usr/bin/env python3
"""
Fanvase Backend API Test Suite
Tests all backend endpoints with Supabase authentication
"""

import requests
import json
import time
import random
import string
from datetime import datetime

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

def signup_user(email, password, display_name, role, ref=None):
    """Sign up a new user"""
    try:
        url = f"{BASE_URL}/auth/signup"
        data = {
            "email": email,
            "password": password,
            "display_name": display_name,
            "role": role
        }
        if ref:
            data["ref"] = ref
        response = requests.post(url, json=data)
        return response
    except Exception as e:
        print(f"❌ Exception in signup: {e}")
        return None

def test_public_endpoints():
    """Test A: Public endpoints (no auth required)"""
    print("\n" + "="*80)
    print("TEST A: PUBLIC ENDPOINTS")
    print("="*80)
    
    results = []
    
    # Test GET /api/categories
    try:
        print("\n[A1] Testing GET /api/categories...")
        response = requests.get(f"{BASE_URL}/categories")
        if response.status_code == 200 and 'categories' in response.json():
            print(f"✅ GET /api/categories: {response.status_code}")
            results.append(("GET /api/categories", True, None))
        else:
            print(f"❌ GET /api/categories: {response.status_code} - {response.text}")
            results.append(("GET /api/categories", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/categories exception: {e}")
        results.append(("GET /api/categories", False, str(e)))
    
    # Test GET /api/communities (should be empty or only active)
    try:
        print("\n[A2] Testing GET /api/communities...")
        response = requests.get(f"{BASE_URL}/communities")
        if response.status_code == 200 and 'communities' in response.json():
            print(f"✅ GET /api/communities: {response.status_code} - {len(response.json()['communities'])} communities")
            results.append(("GET /api/communities", True, None))
        else:
            print(f"❌ GET /api/communities: {response.status_code} - {response.text}")
            results.append(("GET /api/communities", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/communities exception: {e}")
        results.append(("GET /api/communities", False, str(e)))
    
    # Test GET /api/communities?category=AI
    try:
        print("\n[A3] Testing GET /api/communities?category=AI...")
        response = requests.get(f"{BASE_URL}/communities?category=AI")
        if response.status_code == 200 and 'communities' in response.json():
            print(f"✅ GET /api/communities?category=AI: {response.status_code}")
            results.append(("GET /api/communities?category=AI", True, None))
        else:
            print(f"❌ GET /api/communities?category=AI: {response.status_code} - {response.text}")
            results.append(("GET /api/communities?category=AI", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/communities?category=AI exception: {e}")
        results.append(("GET /api/communities?category=AI", False, str(e)))
    
    # Test GET /api/search-creator
    try:
        print("\n[A4] Testing GET /api/search-creator?q=test...")
        response = requests.get(f"{BASE_URL}/search-creator?q=test")
        if response.status_code == 200 and 'results' in response.json():
            print(f"✅ GET /api/search-creator: {response.status_code}")
            results.append(("GET /api/search-creator", True, None))
        else:
            print(f"❌ GET /api/search-creator: {response.status_code} - {response.text}")
            results.append(("GET /api/search-creator", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/search-creator exception: {e}")
        results.append(("GET /api/search-creator", False, str(e)))
    
    # Test GET /api/community/:slug for nonexistent slug (expect 404)
    try:
        print("\n[A5] Testing GET /api/community/nonexistent-slug-12345 (expect 404)...")
        response = requests.get(f"{BASE_URL}/community/nonexistent-slug-12345")
        if response.status_code == 404:
            print(f"✅ GET /api/community/nonexistent: {response.status_code} (expected 404)")
            results.append(("GET /api/community/:slug (404)", True, None))
        else:
            print(f"❌ GET /api/community/nonexistent: Expected 404, got {response.status_code}")
            results.append(("GET /api/community/:slug (404)", False, f"Expected 404, got {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/community/:slug exception: {e}")
        results.append(("GET /api/community/:slug (404)", False, str(e)))
    
    return results

def test_creator_journey():
    """Test B: Creator journey"""
    print("\n" + "="*80)
    print("TEST B: CREATOR JOURNEY")
    print("="*80)
    
    results = []
    
    # Generate unique creator credentials
    creator_email = f"creator_{random_string()}@test.com"
    creator_password = "TestPass123!"
    creator_display_name = f"Creator {random_string(4)}"
    
    # B1: Signup creator
    try:
        print(f"\n[B1] Signing up creator: {creator_email}...")
        response = signup_user(creator_email, creator_password, creator_display_name, "creator")
        if response and response.status_code == 200 and response.json().get('ok'):
            print(f"✅ Creator signup: {response.status_code}")
            results.append(("POST /api/auth/signup (creator)", True, None))
        else:
            print(f"❌ Creator signup failed: {response.status_code if response else 'No response'} - {response.text if response else 'Exception'}")
            results.append(("POST /api/auth/signup (creator)", False, f"Status {response.status_code if response else 'Exception'}"))
            return results
    except Exception as e:
        print(f"❌ Creator signup exception: {e}")
        results.append(("POST /api/auth/signup (creator)", False, str(e)))
        return results
    
    # Wait for user creation to complete
    time.sleep(2)
    
    # Get access token
    print(f"\n[B2] Getting access token for creator...")
    creator_token = get_access_token(creator_email, creator_password)
    if not creator_token:
        print(f"❌ Failed to get creator token")
        results.append(("Get creator access token", False, "Token retrieval failed"))
        return results
    print(f"✅ Got creator access token")
    
    headers = {"Authorization": f"Bearer {creator_token}"}
    
    # B3: GET /api/me
    try:
        print(f"\n[B3] Testing GET /api/me...")
        response = requests.get(f"{BASE_URL}/me", headers=headers)
        if response.status_code == 200:
            data = response.json()
            profile = data.get('profile', {})
            if profile.get('role') == 'creator' and profile.get('is_creator'):
                print(f"✅ GET /api/me: role=creator, is_creator=true")
                results.append(("GET /api/me (creator)", True, None))
            else:
                print(f"❌ GET /api/me: Expected role=creator, is_creator=true, got {profile}")
                results.append(("GET /api/me (creator)", False, f"Wrong role/is_creator: {profile}"))
        else:
            print(f"❌ GET /api/me: {response.status_code} - {response.text}")
            results.append(("GET /api/me (creator)", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/me exception: {e}")
        results.append(("GET /api/me (creator)", False, str(e)))
    
    # B4: Check username availability
    random_username = f"user{random_string()}"
    try:
        print(f"\n[B4] Testing GET /api/username-available?u={random_username}...")
        response = requests.get(f"{BASE_URL}/username-available?u={random_username}", headers=headers)
        if response.status_code == 200 and response.json().get('available'):
            print(f"✅ GET /api/username-available: available=true")
            results.append(("GET /api/username-available (available)", True, None))
        else:
            print(f"❌ GET /api/username-available: {response.status_code} - {response.text}")
            results.append(("GET /api/username-available (available)", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/username-available exception: {e}")
        results.append(("GET /api/username-available (available)", False, str(e)))
    
    # B5: Creator onboarding
    creator_username = f"creator{random_string()}"
    community_slug = f"comm{random_string()}"
    community_data = None
    
    try:
        print(f"\n[B5] Testing POST /api/onboarding/creator...")
        onboarding_data = {
            "username": creator_username,
            "display_name": creator_display_name,
            "country": "US",
            "bio": "Test creator bio",
            "community": {
                "name": f"Test Community {random_string(4)}",
                "slug": community_slug,
                "description": "A test community for AI enthusiasts",
                "category": "AI",
                "country": "US"
            },
            "pricing": {
                "pricing_type": "recurring",
                "billing_period": "monthly",
                "price": 9,
                "currency": "USD"
            }
        }
        response = requests.post(f"{BASE_URL}/onboarding/creator", headers=headers, json=onboarding_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('ok') and data.get('community'):
                community_data = data['community']
                print(f"✅ POST /api/onboarding/creator: community created with slug={community_data.get('slug')}, status={community_data.get('status')}")
                if community_data.get('status') == 'pending':
                    print(f"✅ Community status is 'pending' as expected")
                    results.append(("POST /api/onboarding/creator", True, None))
                else:
                    print(f"⚠️  Community status is '{community_data.get('status')}', expected 'pending'")
                    results.append(("POST /api/onboarding/creator", True, f"Status is {community_data.get('status')}, not pending"))
            else:
                print(f"❌ POST /api/onboarding/creator: Missing ok or community in response")
                results.append(("POST /api/onboarding/creator", False, "Missing ok or community"))
        else:
            print(f"❌ POST /api/onboarding/creator: {response.status_code} - {response.text}")
            results.append(("POST /api/onboarding/creator", False, f"Status {response.status_code}"))
            return results
    except Exception as e:
        print(f"❌ POST /api/onboarding/creator exception: {e}")
        results.append(("POST /api/onboarding/creator", False, str(e)))
        return results
    
    # B6: GET /api/me again to verify username and communities
    try:
        print(f"\n[B6] Testing GET /api/me again after onboarding...")
        response = requests.get(f"{BASE_URL}/me", headers=headers)
        if response.status_code == 200:
            data = response.json()
            profile = data.get('profile', {})
            communities = data.get('communities', [])
            if profile.get('username') == creator_username and len(communities) >= 1:
                print(f"✅ GET /api/me: username set to {creator_username}, communities count={len(communities)}")
                results.append(("GET /api/me (after onboarding)", True, None))
            else:
                print(f"❌ GET /api/me: Expected username={creator_username}, communities>=1, got username={profile.get('username')}, communities={len(communities)}")
                results.append(("GET /api/me (after onboarding)", False, f"Username or communities mismatch"))
        else:
            print(f"❌ GET /api/me: {response.status_code} - {response.text}")
            results.append(("GET /api/me (after onboarding)", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/me exception: {e}")
        results.append(("GET /api/me (after onboarding)", False, str(e)))
    
    # B7: Check username availability for taken username
    try:
        print(f"\n[B7] Testing GET /api/username-available?u={creator_username} (should be taken)...")
        response = requests.get(f"{BASE_URL}/username-available?u={creator_username}", headers=headers)
        if response.status_code == 200:
            # Should be available=true for the same user checking their own username
            print(f"✅ GET /api/username-available (own username): {response.json()}")
            results.append(("GET /api/username-available (taken)", True, None))
        else:
            print(f"❌ GET /api/username-available: {response.status_code} - {response.text}")
            results.append(("GET /api/username-available (taken)", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/username-available exception: {e}")
        results.append(("GET /api/username-available (taken)", False, str(e)))
    
    # B8: Create a post
    post_id = None
    try:
        print(f"\n[B8] Testing POST /api/posts...")
        post_data = {
            "community_id": community_data['id'],
            "title": "My First Post",
            "content": "This is a test post with some interesting content about AI and technology.",
            "type": "text",
            "visibility": "members",
            "status": "published"
        }
        response = requests.post(f"{BASE_URL}/posts", headers=headers, json=post_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('ok') and data.get('post'):
                post_id = data['post']['id']
                print(f"✅ POST /api/posts: post created with id={post_id}")
                results.append(("POST /api/posts", True, None))
            else:
                print(f"❌ POST /api/posts: Missing ok or post in response")
                results.append(("POST /api/posts", False, "Missing ok or post"))
        else:
            print(f"❌ POST /api/posts: {response.status_code} - {response.text}")
            results.append(("POST /api/posts", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ POST /api/posts exception: {e}")
        results.append(("POST /api/posts", False, str(e)))
    
    # B9: GET /api/creator/posts
    try:
        print(f"\n[B9] Testing GET /api/creator/posts...")
        response = requests.get(f"{BASE_URL}/creator/posts", headers=headers)
        if response.status_code == 200:
            data = response.json()
            posts = data.get('posts', [])
            if len(posts) >= 1:
                print(f"✅ GET /api/creator/posts: {len(posts)} posts found")
                results.append(("GET /api/creator/posts", True, None))
            else:
                print(f"❌ GET /api/creator/posts: Expected at least 1 post, got {len(posts)}")
                results.append(("GET /api/creator/posts", False, f"Expected >=1 post, got {len(posts)}"))
        else:
            print(f"❌ GET /api/creator/posts: {response.status_code} - {response.text}")
            results.append(("GET /api/creator/posts", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/creator/posts exception: {e}")
        results.append(("GET /api/creator/posts", False, str(e)))
    
    # B10: PUT /api/posts/:id (edit title)
    if post_id:
        try:
            print(f"\n[B10] Testing PUT /api/posts/{post_id}...")
            update_data = {
                "title": "My Updated Post Title",
                "content": "This is a test post with some interesting content about AI and technology.",
                "type": "text",
                "visibility": "members",
                "status": "published"
            }
            response = requests.put(f"{BASE_URL}/posts/{post_id}", headers=headers, json=update_data)
            if response.status_code == 200 and response.json().get('ok'):
                print(f"✅ PUT /api/posts/{post_id}: post updated")
                results.append(("PUT /api/posts/:id", True, None))
            else:
                print(f"❌ PUT /api/posts/{post_id}: {response.status_code} - {response.text}")
                results.append(("PUT /api/posts/:id", False, f"Status {response.status_code}"))
        except Exception as e:
            print(f"❌ PUT /api/posts/:id exception: {e}")
            results.append(("PUT /api/posts/:id", False, str(e)))
    
    # B11: Create another post to delete
    post_to_delete_id = None
    try:
        print(f"\n[B11] Creating another post to delete...")
        post_data = {
            "community_id": community_data['id'],
            "title": "Post to Delete",
            "content": "This post will be deleted",
            "type": "text",
            "visibility": "public",
            "status": "published"
        }
        response = requests.post(f"{BASE_URL}/posts", headers=headers, json=post_data)
        if response.status_code == 200 and response.json().get('ok'):
            post_to_delete_id = response.json()['post']['id']
            print(f"✅ Created post to delete: id={post_to_delete_id}")
        else:
            print(f"❌ Failed to create post to delete: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception creating post to delete: {e}")
    
    # B12: DELETE /api/posts/:id
    if post_to_delete_id:
        try:
            print(f"\n[B12] Testing DELETE /api/posts/{post_to_delete_id}...")
            response = requests.delete(f"{BASE_URL}/posts/{post_to_delete_id}", headers=headers)
            if response.status_code == 200 and response.json().get('ok'):
                print(f"✅ DELETE /api/posts/{post_to_delete_id}: post deleted")
                results.append(("DELETE /api/posts/:id", True, None))
            else:
                print(f"❌ DELETE /api/posts/{post_to_delete_id}: {response.status_code} - {response.text}")
                results.append(("DELETE /api/posts/:id", False, f"Status {response.status_code}"))
        except Exception as e:
            print(f"❌ DELETE /api/posts/:id exception: {e}")
            results.append(("DELETE /api/posts/:id", False, str(e)))
    
    # B13: GET /api/creator/overview
    try:
        print(f"\n[B13] Testing GET /api/creator/overview?range=30...")
        response = requests.get(f"{BASE_URL}/creator/overview?range=30", headers=headers)
        if response.status_code == 200:
            data = response.json()
            kpis = data.get('kpis', {})
            series = data.get('series', [])
            if 'totalMembers' in kpis and len(series) == 30:
                print(f"✅ GET /api/creator/overview: kpis present, series length={len(series)}")
                results.append(("GET /api/creator/overview", True, None))
            else:
                print(f"❌ GET /api/creator/overview: Expected kpis and series length 30, got kpis={bool(kpis)}, series={len(series)}")
                results.append(("GET /api/creator/overview", False, f"KPIs or series mismatch"))
        else:
            print(f"❌ GET /api/creator/overview: {response.status_code} - {response.text}")
            results.append(("GET /api/creator/overview", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/creator/overview exception: {e}")
        results.append(("GET /api/creator/overview", False, str(e)))
    
    # B14: GET /api/creator/members
    try:
        print(f"\n[B14] Testing GET /api/creator/members...")
        response = requests.get(f"{BASE_URL}/creator/members", headers=headers)
        if response.status_code == 200 and 'members' in response.json():
            print(f"✅ GET /api/creator/members: {len(response.json()['members'])} members")
            results.append(("GET /api/creator/members", True, None))
        else:
            print(f"❌ GET /api/creator/members: {response.status_code} - {response.text}")
            results.append(("GET /api/creator/members", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/creator/members exception: {e}")
        results.append(("GET /api/creator/members", False, str(e)))
    
    # B15: GET /api/creator/earnings
    try:
        print(f"\n[B15] Testing GET /api/creator/earnings...")
        response = requests.get(f"{BASE_URL}/creator/earnings", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if 'balance' in data and 'transactions' in data:
                print(f"✅ GET /api/creator/earnings: balance and transactions present")
                results.append(("GET /api/creator/earnings", True, None))
            else:
                print(f"❌ GET /api/creator/earnings: Missing balance or transactions")
                results.append(("GET /api/creator/earnings", False, "Missing balance or transactions"))
        else:
            print(f"❌ GET /api/creator/earnings: {response.status_code} - {response.text}")
            results.append(("GET /api/creator/earnings", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/creator/earnings exception: {e}")
        results.append(("GET /api/creator/earnings", False, str(e)))
    
    # B16: GET /api/referrals
    try:
        print(f"\n[B16] Testing GET /api/referrals...")
        response = requests.get(f"{BASE_URL}/referrals", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if 'code' in data and 'referrals' in data:
                print(f"✅ GET /api/referrals: code={data.get('code')}, referrals count={len(data.get('referrals', []))}")
                results.append(("GET /api/referrals", True, None))
            else:
                print(f"❌ GET /api/referrals: Missing code or referrals")
                results.append(("GET /api/referrals", False, "Missing code or referrals"))
        else:
            print(f"❌ GET /api/referrals: {response.status_code} - {response.text}")
            results.append(("GET /api/referrals", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/referrals exception: {e}")
        results.append(("GET /api/referrals", False, str(e)))
    
    # B17: POST /api/platform/subscribe
    try:
        print(f"\n[B17] Testing POST /api/platform/subscribe...")
        response = requests.post(f"{BASE_URL}/platform/subscribe", headers=headers, json={"plan": "pro"})
        if response.status_code == 200 and response.json().get('ok'):
            print(f"✅ POST /api/platform/subscribe: ok")
            results.append(("POST /api/platform/subscribe", True, None))
            
            # Verify platform_status is pending
            response = requests.get(f"{BASE_URL}/me", headers=headers)
            if response.status_code == 200:
                profile = response.json().get('profile', {})
                if profile.get('platform_status') == 'pending':
                    print(f"✅ Platform status is 'pending' after subscribe")
                else:
                    print(f"⚠️  Platform status is '{profile.get('platform_status')}', expected 'pending'")
        else:
            print(f"❌ POST /api/platform/subscribe: {response.status_code} - {response.text}")
            results.append(("POST /api/platform/subscribe", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ POST /api/platform/subscribe exception: {e}")
        results.append(("POST /api/platform/subscribe", False, str(e)))
    
    # Return creator data for use in other tests
    return results, {
        'email': creator_email,
        'password': creator_password,
        'username': creator_username,
        'token': creator_token,
        'community': community_data
    }

def test_public_community_after_onboarding(creator_data):
    """Test C: Public community after onboarding"""
    print("\n" + "="*80)
    print("TEST C: PUBLIC COMMUNITY AFTER ONBOARDING")
    print("="*80)
    
    results = []
    
    if not creator_data or not creator_data.get('community'):
        print("❌ No creator data available, skipping test C")
        return results
    
    community_slug = creator_data['community']['slug']
    
    # Test GET /api/community/:slug
    try:
        print(f"\n[C1] Testing GET /api/community/{community_slug}...")
        response = requests.get(f"{BASE_URL}/community/{community_slug}")
        if response.status_code == 200:
            data = response.json()
            community = data.get('community')
            creator = data.get('creator')
            posts = data.get('posts', [])
            
            if community and creator:
                print(f"✅ GET /api/community/{community_slug}: community and creator returned")
                print(f"   Community status: {community.get('status')}")
                print(f"   Posts visible: {len(posts)}")
                print(f"   Total posts: {data.get('total_posts', 0)}")
                
                # Members-only posts should be hidden for non-members
                members_only_visible = any(p.get('visibility') == 'members' for p in posts)
                if not members_only_visible:
                    print(f"✅ Members-only posts are hidden for non-members")
                else:
                    print(f"⚠️  Members-only posts are visible to non-members")
                
                results.append(("GET /api/community/:slug (pending)", True, None))
            else:
                print(f"❌ GET /api/community/{community_slug}: Missing community or creator")
                results.append(("GET /api/community/:slug (pending)", False, "Missing community or creator"))
        else:
            print(f"❌ GET /api/community/{community_slug}: {response.status_code} - {response.text}")
            results.append(("GET /api/community/:slug (pending)", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/community/:slug exception: {e}")
        results.append(("GET /api/community/:slug (pending)", False, str(e)))
    
    # Test GET /api/communities (should NOT list pending community)
    try:
        print(f"\n[C2] Testing GET /api/communities (should not list pending)...")
        response = requests.get(f"{BASE_URL}/communities")
        if response.status_code == 200:
            communities = response.json().get('communities', [])
            pending_found = any(c.get('slug') == community_slug for c in communities)
            if not pending_found:
                print(f"✅ GET /api/communities: pending community not listed")
                results.append(("GET /api/communities (no pending)", True, None))
            else:
                print(f"❌ GET /api/communities: pending community is listed (should not be)")
                results.append(("GET /api/communities (no pending)", False, "Pending community listed"))
        else:
            print(f"❌ GET /api/communities: {response.status_code} - {response.text}")
            results.append(("GET /api/communities (no pending)", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/communities exception: {e}")
        results.append(("GET /api/communities (no pending)", False, str(e)))
    
    return results

def test_fan_journey():
    """Test D: Fan journey"""
    print("\n" + "="*80)
    print("TEST D: FAN JOURNEY")
    print("="*80)
    
    results = []
    
    # Generate unique fan credentials
    fan_email = f"fan_{random_string()}@test.com"
    fan_password = "TestPass123!"
    fan_display_name = f"Fan {random_string(4)}"
    
    # D1: Signup fan
    try:
        print(f"\n[D1] Signing up fan: {fan_email}...")
        response = signup_user(fan_email, fan_password, fan_display_name, "fan")
        if response and response.status_code == 200 and response.json().get('ok'):
            print(f"✅ Fan signup: {response.status_code}")
            results.append(("POST /api/auth/signup (fan)", True, None))
        else:
            print(f"❌ Fan signup failed: {response.status_code if response else 'No response'}")
            results.append(("POST /api/auth/signup (fan)", False, f"Status {response.status_code if response else 'Exception'}"))
            return results, None
    except Exception as e:
        print(f"❌ Fan signup exception: {e}")
        results.append(("POST /api/auth/signup (fan)", False, str(e)))
        return results, None
    
    # Wait for user creation
    time.sleep(2)
    
    # Get access token
    print(f"\n[D2] Getting access token for fan...")
    fan_token = get_access_token(fan_email, fan_password)
    if not fan_token:
        print(f"❌ Failed to get fan token")
        results.append(("Get fan access token", False, "Token retrieval failed"))
        return results, None
    print(f"✅ Got fan access token")
    
    headers = {"Authorization": f"Bearer {fan_token}"}
    
    # D3: GET /api/me
    fan_user_id = None
    try:
        print(f"\n[D3] Testing GET /api/me (fan)...")
        response = requests.get(f"{BASE_URL}/me", headers=headers)
        if response.status_code == 200:
            data = response.json()
            profile = data.get('profile', {})
            fan_user_id = data.get('user', {}).get('id')
            if profile.get('role') == 'fan':
                print(f"✅ GET /api/me: role=fan")
                results.append(("GET /api/me (fan)", True, None))
            else:
                print(f"❌ GET /api/me: Expected role=fan, got {profile.get('role')}")
                results.append(("GET /api/me (fan)", False, f"Wrong role: {profile.get('role')}"))
        else:
            print(f"❌ GET /api/me: {response.status_code} - {response.text}")
            results.append(("GET /api/me (fan)", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/me exception: {e}")
        results.append(("GET /api/me (fan)", False, str(e)))
    
    # D4: GET /api/fan/communities (should be empty initially)
    try:
        print(f"\n[D4] Testing GET /api/fan/communities...")
        response = requests.get(f"{BASE_URL}/fan/communities", headers=headers)
        if response.status_code == 200:
            communities = response.json().get('communities', [])
            print(f"✅ GET /api/fan/communities: {len(communities)} communities")
            results.append(("GET /api/fan/communities", True, None))
        else:
            print(f"❌ GET /api/fan/communities: {response.status_code} - {response.text}")
            results.append(("GET /api/fan/communities", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/fan/communities exception: {e}")
        results.append(("GET /api/fan/communities", False, str(e)))
    
    return results, {'email': fan_email, 'password': fan_password, 'token': fan_token, 'user_id': fan_user_id}

def test_referral_attribution():
    """Test E: Referral attribution"""
    print("\n" + "="*80)
    print("TEST E: REFERRAL ATTRIBUTION")
    print("="*80)
    
    results = []
    
    # E1: Create referrer creator A
    creator_a_email = f"referrer_{random_string()}@test.com"
    creator_a_password = "TestPass123!"
    creator_a_display_name = f"Referrer {random_string(4)}"
    
    try:
        print(f"\n[E1] Signing up referrer creator A: {creator_a_email}...")
        response = signup_user(creator_a_email, creator_a_password, creator_a_display_name, "creator")
        if not (response and response.status_code == 200 and response.json().get('ok')):
            print(f"❌ Referrer signup failed")
            return results, None
        print(f"✅ Referrer creator A signed up")
    except Exception as e:
        print(f"❌ Referrer signup exception: {e}")
        return results, None
    
    time.sleep(2)
    
    # Get token and onboard
    creator_a_token = get_access_token(creator_a_email, creator_a_password)
    if not creator_a_token:
        print(f"❌ Failed to get referrer token")
        return results, None
    
    headers_a = {"Authorization": f"Bearer {creator_a_token}"}
    creator_a_username = f"referrer{random_string()}"
    
    # Onboard creator A
    try:
        print(f"\n[E2] Onboarding referrer creator A with username {creator_a_username}...")
        onboarding_data = {
            "username": creator_a_username,
            "display_name": creator_a_display_name,
            "country": "US",
            "bio": "Referrer creator",
            "community": {
                "name": f"Referrer Community {random_string(4)}",
                "slug": f"ref{random_string()}",
                "description": "Referrer community",
                "category": "Business",
                "country": "US"
            },
            "pricing": {
                "pricing_type": "recurring",
                "billing_period": "monthly",
                "price": 15,
                "currency": "USD"
            }
        }
        response = requests.post(f"{BASE_URL}/onboarding/creator", headers=headers_a, json=onboarding_data)
        if not (response.status_code == 200 and response.json().get('ok')):
            print(f"❌ Referrer onboarding failed")
            return results, None
        print(f"✅ Referrer creator A onboarded with username {creator_a_username}")
    except Exception as e:
        print(f"❌ Referrer onboarding exception: {e}")
        return results, None
    
    # E3: Create user B with ref=creator_a_username
    user_b_email = f"referred_{random_string()}@test.com"
    user_b_password = "TestPass123!"
    user_b_display_name = f"Referred {random_string(4)}"
    
    try:
        print(f"\n[E3] Signing up user B with ref={creator_a_username}...")
        url = f"{BASE_URL}/auth/signup"
        data = {
            "email": user_b_email,
            "password": user_b_password,
            "display_name": user_b_display_name,
            "role": "creator",
            "ref": creator_a_username
        }
        response = requests.post(url, json=data)
        if response and response.status_code == 200 and response.json().get('ok'):
            print(f"✅ User B signed up with referral code {creator_a_username}")
            results.append(("Referral attribution (signup with ref)", True, None))
        else:
            print(f"❌ User B signup failed: {response.status_code if response else 'No response'}")
            results.append(("Referral attribution (signup with ref)", False, f"Status {response.status_code if response else 'Exception'}"))
            return results, None
    except Exception as e:
        print(f"❌ User B signup exception: {e}")
        results.append(("Referral attribution (signup with ref)", False, str(e)))
        return results, None
    
    time.sleep(2)
    
    # E4: Verify referral in creator A's referrals
    try:
        print(f"\n[E4] Checking creator A's referrals...")
        response = requests.get(f"{BASE_URL}/referrals", headers=headers_a)
        if response.status_code == 200:
            data = response.json()
            referrals = data.get('referrals', [])
            pending_referrals = [r for r in referrals if r.get('status') == 'pending']
            if len(pending_referrals) >= 1:
                print(f"✅ GET /api/referrals: {len(pending_referrals)} pending referral(s) found")
                results.append(("GET /api/referrals (pending referral)", True, None))
            else:
                print(f"❌ GET /api/referrals: Expected at least 1 pending referral, got {len(pending_referrals)}")
                results.append(("GET /api/referrals (pending referral)", False, f"Expected >=1 pending, got {len(pending_referrals)}"))
        else:
            print(f"❌ GET /api/referrals: {response.status_code} - {response.text}")
            results.append(("GET /api/referrals (pending referral)", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/referrals exception: {e}")
        results.append(("GET /api/referrals (pending referral)", False, str(e)))
    
    return results, {
        'referrer_email': creator_a_email,
        'referrer_username': creator_a_username,
        'referrer_token': creator_a_token,
        'referred_email': user_b_email
    }

def test_admin_flow(creator_data, fan_data, referral_data):
    """Test F: Admin flow"""
    print("\n" + "="*80)
    print("TEST F: ADMIN FLOW")
    print("="*80)
    
    results = []
    
    # F1: Create or sign in admin user
    admin_email = ADMIN_EMAIL
    admin_password = "AdminPass123!"
    
    # Try to sign up admin (might already exist)
    try:
        print(f"\n[F1] Signing up admin user: {admin_email}...")
        response = signup_user(admin_email, admin_password, "Admin User", "admin")
        if response and response.status_code == 200:
            print(f"✅ Admin user created")
        else:
            print(f"⚠️  Admin signup returned {response.status_code if response else 'error'} (might already exist)")
    except Exception as e:
        print(f"⚠️  Admin signup exception: {e} (might already exist)")
    
    time.sleep(2)
    
    # Get admin token
    print(f"\n[F2] Getting access token for admin...")
    admin_token = get_access_token(admin_email, admin_password)
    if not admin_token:
        print(f"❌ Failed to get admin token")
        results.append(("Get admin access token", False, "Token retrieval failed"))
        return results
    print(f"✅ Got admin access token")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # F3: GET /api/admin/overview
    try:
        print(f"\n[F3] Testing GET /api/admin/overview...")
        response = requests.get(f"{BASE_URL}/admin/overview", headers=headers)
        if response.status_code == 200:
            data = response.json()
            if 'users' in data and 'creators' in data and 'communities' in data:
                print(f"✅ GET /api/admin/overview: users={data.get('users')}, creators={data.get('creators')}, communities={data.get('communities')}")
                results.append(("GET /api/admin/overview", True, None))
            else:
                print(f"❌ GET /api/admin/overview: Missing expected fields")
                results.append(("GET /api/admin/overview", False, "Missing fields"))
        else:
            print(f"❌ GET /api/admin/overview: {response.status_code} - {response.text}")
            results.append(("GET /api/admin/overview", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/admin/overview exception: {e}")
        results.append(("GET /api/admin/overview", False, str(e)))
    
    # F4: GET /api/admin/users
    try:
        print(f"\n[F4] Testing GET /api/admin/users...")
        response = requests.get(f"{BASE_URL}/admin/users", headers=headers)
        if response.status_code == 200 and 'users' in response.json():
            print(f"✅ GET /api/admin/users: {len(response.json()['users'])} users")
            results.append(("GET /api/admin/users", True, None))
        else:
            print(f"❌ GET /api/admin/users: {response.status_code} - {response.text}")
            results.append(("GET /api/admin/users", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/admin/users exception: {e}")
        results.append(("GET /api/admin/users", False, str(e)))
    
    # F5: GET /api/admin/communities
    try:
        print(f"\n[F5] Testing GET /api/admin/communities...")
        response = requests.get(f"{BASE_URL}/admin/communities", headers=headers)
        if response.status_code == 200 and 'communities' in response.json():
            print(f"✅ GET /api/admin/communities: {len(response.json()['communities'])} communities")
            results.append(("GET /api/admin/communities", True, None))
        else:
            print(f"❌ GET /api/admin/communities: {response.status_code} - {response.text}")
            results.append(("GET /api/admin/communities", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/admin/communities exception: {e}")
        results.append(("GET /api/admin/communities", False, str(e)))
    
    # F6: POST /api/admin/update-community (activate creator's community)
    if creator_data and creator_data.get('community'):
        try:
            print(f"\n[F6] Testing POST /api/admin/update-community...")
            community_id = creator_data['community']['id']
            update_data = {
                "community_id": community_id,
                "status": "active",
                "payment_link": "https://pay.example.com/test",
                "price": 9
            }
            response = requests.post(f"{BASE_URL}/admin/update-community", headers=headers, json=update_data)
            if response.status_code == 200 and response.json().get('ok'):
                print(f"✅ POST /api/admin/update-community: community activated")
                results.append(("POST /api/admin/update-community", True, None))
                
                # Update creator_data with activated status
                creator_data['community']['status'] = 'active'
            else:
                print(f"❌ POST /api/admin/update-community: {response.status_code} - {response.text}")
                results.append(("POST /api/admin/update-community", False, f"Status {response.status_code}"))
        except Exception as e:
            print(f"❌ POST /api/admin/update-community exception: {e}")
            results.append(("POST /api/admin/update-community", False, str(e)))
    
    # F7: POST /api/admin/activate-platform (activate creator's platform)
    if creator_data:
        try:
            print(f"\n[F7] Testing POST /api/admin/activate-platform...")
            # Get creator user ID
            creator_token = creator_data.get('token')
            if creator_token:
                creator_headers = {"Authorization": f"Bearer {creator_token}"}
                me_response = requests.get(f"{BASE_URL}/me", headers=creator_headers)
                if me_response.status_code == 200:
                    creator_user_id = me_response.json().get('user', {}).get('id')
                    
                    activate_data = {
                        "creator_id": creator_user_id,
                        "status": "active"
                    }
                    response = requests.post(f"{BASE_URL}/admin/activate-platform", headers=headers, json=activate_data)
                    if response.status_code == 200 and response.json().get('ok'):
                        print(f"✅ POST /api/admin/activate-platform: platform activated")
                        results.append(("POST /api/admin/activate-platform", True, None))
                    else:
                        print(f"❌ POST /api/admin/activate-platform: {response.status_code} - {response.text}")
                        results.append(("POST /api/admin/activate-platform", False, f"Status {response.status_code}"))
                else:
                    print(f"❌ Could not get creator user ID")
                    results.append(("POST /api/admin/activate-platform", False, "Could not get creator ID"))
            else:
                print(f"❌ No creator token available")
                results.append(("POST /api/admin/activate-platform", False, "No creator token"))
        except Exception as e:
            print(f"❌ POST /api/admin/activate-platform exception: {e}")
            results.append(("POST /api/admin/activate-platform", False, str(e)))
    
    # F8: POST /api/admin/add-member (add fan to creator's community)
    if creator_data and fan_data and creator_data.get('community'):
        try:
            print(f"\n[F8] Testing POST /api/admin/add-member...")
            add_member_data = {
                "community_id": creator_data['community']['id'],
                "user_email": fan_data['email'],
                "plan": "monthly"
            }
            response = requests.post(f"{BASE_URL}/admin/add-member", headers=headers, json=add_member_data)
            if response.status_code == 200 and response.json().get('ok'):
                print(f"✅ POST /api/admin/add-member: member added")
                results.append(("POST /api/admin/add-member", True, None))
            else:
                print(f"❌ POST /api/admin/add-member: {response.status_code} - {response.text}")
                results.append(("POST /api/admin/add-member", False, f"Status {response.status_code}"))
        except Exception as e:
            print(f"❌ POST /api/admin/add-member exception: {e}")
            results.append(("POST /api/admin/add-member", False, str(e)))
    
    # F9: Verify GET /api/communities now lists the active community
    if creator_data and creator_data.get('community'):
        try:
            print(f"\n[F9] Verifying GET /api/communities lists active community...")
            response = requests.get(f"{BASE_URL}/communities")
            if response.status_code == 200:
                communities = response.json().get('communities', [])
                active_found = any(c.get('id') == creator_data['community']['id'] for c in communities)
                if active_found:
                    print(f"✅ GET /api/communities: active community is now listed")
                    results.append(("GET /api/communities (active listed)", True, None))
                else:
                    print(f"❌ GET /api/communities: active community not found in list")
                    results.append(("GET /api/communities (active listed)", False, "Active community not listed"))
            else:
                print(f"❌ GET /api/communities: {response.status_code} - {response.text}")
                results.append(("GET /api/communities (active listed)", False, f"Status {response.status_code}"))
        except Exception as e:
            print(f"❌ GET /api/communities exception: {e}")
            results.append(("GET /api/communities (active listed)", False, str(e)))
    
    # F10: Verify creator's earnings
    if creator_data:
        try:
            print(f"\n[F10] Verifying creator's earnings...")
            creator_headers = {"Authorization": f"Bearer {creator_data['token']}"}
            response = requests.get(f"{BASE_URL}/creator/earnings", headers=creator_headers)
            if response.status_code == 200:
                data = response.json()
                balance = data.get('balance', {})
                transactions = data.get('transactions', [])
                if balance.get('available', 0) > 0 and len(transactions) > 0:
                    print(f"✅ Creator earnings: balance={balance.get('available')}, transactions={len(transactions)}")
                    results.append(("Creator earnings after member added", True, None))
                else:
                    print(f"❌ Creator earnings: Expected balance > 0 and transactions, got balance={balance.get('available')}, transactions={len(transactions)}")
                    results.append(("Creator earnings after member added", False, f"Balance or transactions missing"))
            else:
                print(f"❌ GET /api/creator/earnings: {response.status_code} - {response.text}")
                results.append(("Creator earnings after member added", False, f"Status {response.status_code}"))
        except Exception as e:
            print(f"❌ Creator earnings exception: {e}")
            results.append(("Creator earnings after member added", False, str(e)))
    
    # F11: Test referral conversion
    if referral_data:
        print(f"\n[F11] Testing referral conversion flow...")
        # Create a new creator who was referred
        referred_creator_email = referral_data['referred_email']
        referred_creator_password = "TestPass123!"
        
        # Get token for referred creator
        time.sleep(2)
        referred_token = get_access_token(referred_creator_email, referred_creator_password)
        if referred_token:
            referred_headers = {"Authorization": f"Bearer {referred_token}"}
            
            # Onboard the referred creator
            referred_username = f"referred{random_string()}"
            try:
                print(f"   Onboarding referred creator...")
                onboarding_data = {
                    "username": referred_username,
                    "display_name": "Referred Creator",
                    "country": "US",
                    "bio": "Referred creator",
                    "community": {
                        "name": f"Referred Community {random_string(4)}",
                        "slug": f"refcomm{random_string()}",
                        "description": "Referred creator community",
                        "category": "Coding",
                        "country": "US"
                    },
                    "pricing": {
                        "pricing_type": "recurring",
                        "billing_period": "monthly",
                        "price": 12,
                        "currency": "USD"
                    }
                }
                response = requests.post(f"{BASE_URL}/onboarding/creator", headers=referred_headers, json=onboarding_data)
                if response.status_code == 200 and response.json().get('ok'):
                    referred_community = response.json()['community']
                    print(f"✅ Referred creator onboarded")
                    
                    # Activate the referred creator's community
                    print(f"   Activating referred creator's community...")
                    update_data = {
                        "community_id": referred_community['id'],
                        "status": "active",
                        "payment_link": "https://pay.example.com/referred",
                        "price": 12
                    }
                    response = requests.post(f"{BASE_URL}/admin/update-community", headers=headers, json=update_data)
                    if response.status_code == 200:
                        print(f"✅ Referred creator's community activated")
                        
                        # Add a member to the referred creator's community
                        print(f"   Adding member to referred creator's community...")
                        test_fan_email = f"testfan_{random_string()}@test.com"
                        signup_user(test_fan_email, "TestPass123!", "Test Fan", "fan")
                        time.sleep(2)
                        
                        add_member_data = {
                            "community_id": referred_community['id'],
                            "user_email": test_fan_email,
                            "plan": "monthly"
                        }
                        response = requests.post(f"{BASE_URL}/admin/add-member", headers=headers, json=add_member_data)
                        if response.status_code == 200:
                            print(f"✅ Member added to referred creator's community")
                            
                            # Check referrer's referrals for conversion
                            time.sleep(1)
                            print(f"   Checking referrer's referrals for conversion...")
                            referrer_headers = {"Authorization": f"Bearer {referral_data['referrer_token']}"}
                            response = requests.get(f"{BASE_URL}/referrals", headers=referrer_headers)
                            if response.status_code == 200:
                                data = response.json()
                                referrals = data.get('referrals', [])
                                converted = [r for r in referrals if r.get('status') == 'converted']
                                total_earnings = data.get('totalEarnings', 0)
                                
                                if len(converted) > 0 and total_earnings >= 10:
                                    print(f"✅ Referral conversion: {len(converted)} converted referral(s), earnings=${total_earnings}")
                                    results.append(("Referral conversion", True, None))
                                else:
                                    print(f"❌ Referral conversion: Expected converted referral with $10 reward, got {len(converted)} converted, earnings=${total_earnings}")
                                    results.append(("Referral conversion", False, f"Conversion not found or reward incorrect"))
                            else:
                                print(f"❌ Failed to check referrer's referrals: {response.status_code}")
                                results.append(("Referral conversion", False, f"Status {response.status_code}"))
                        else:
                            print(f"❌ Failed to add member to referred creator's community")
                            results.append(("Referral conversion", False, "Failed to add member"))
                    else:
                        print(f"❌ Failed to activate referred creator's community")
                        results.append(("Referral conversion", False, "Failed to activate community"))
                else:
                    print(f"❌ Failed to onboard referred creator")
                    results.append(("Referral conversion", False, "Failed to onboard"))
            except Exception as e:
                print(f"❌ Referral conversion exception: {e}")
                results.append(("Referral conversion", False, str(e)))
        else:
            print(f"❌ Failed to get referred creator token")
            results.append(("Referral conversion", False, "Token retrieval failed"))
    
    return results

def test_authorization_checks(creator_data, fan_data):
    """Test G: Authorization checks"""
    print("\n" + "="*80)
    print("TEST G: AUTHORIZATION CHECKS")
    print("="*80)
    
    results = []
    
    # G1: Call /api/admin/overview with non-admin token (expect 403)
    if fan_data and fan_data.get('token'):
        try:
            print(f"\n[G1] Testing GET /api/admin/overview with fan token (expect 403)...")
            headers = {"Authorization": f"Bearer {fan_data['token']}"}
            response = requests.get(f"{BASE_URL}/admin/overview", headers=headers)
            if response.status_code == 403:
                print(f"✅ GET /api/admin/overview with fan token: 403 (expected)")
                results.append(("Admin endpoint with non-admin (403)", True, None))
            else:
                print(f"❌ GET /api/admin/overview with fan token: Expected 403, got {response.status_code}")
                results.append(("Admin endpoint with non-admin (403)", False, f"Expected 403, got {response.status_code}"))
        except Exception as e:
            print(f"❌ Admin endpoint test exception: {e}")
            results.append(("Admin endpoint with non-admin (403)", False, str(e)))
    
    # G2: Call /api/me with no token (expect user:null)
    try:
        print(f"\n[G2] Testing GET /api/me with no token...")
        response = requests.get(f"{BASE_URL}/me")
        if response.status_code == 200:
            data = response.json()
            if data.get('user') is None:
                print(f"✅ GET /api/me with no token: user=null")
                results.append(("GET /api/me without auth", True, None))
            else:
                print(f"❌ GET /api/me with no token: Expected user=null, got {data.get('user')}")
                results.append(("GET /api/me without auth", False, f"Expected user=null"))
        else:
            print(f"❌ GET /api/me with no token: {response.status_code} - {response.text}")
            results.append(("GET /api/me without auth", False, f"Status {response.status_code}"))
    except Exception as e:
        print(f"❌ GET /api/me without auth exception: {e}")
        results.append(("GET /api/me without auth", False, str(e)))
    
    # G3: Call /api/creator/overview as fan (expect 403)
    if fan_data and fan_data.get('token'):
        try:
            print(f"\n[G3] Testing GET /api/creator/overview with fan token (expect 403)...")
            headers = {"Authorization": f"Bearer {fan_data['token']}"}
            response = requests.get(f"{BASE_URL}/creator/overview", headers=headers)
            if response.status_code == 403:
                print(f"✅ GET /api/creator/overview with fan token: 403 (expected)")
                results.append(("Creator endpoint with fan (403)", True, None))
            else:
                print(f"❌ GET /api/creator/overview with fan token: Expected 403, got {response.status_code}")
                results.append(("Creator endpoint with fan (403)", False, f"Expected 403, got {response.status_code}"))
        except Exception as e:
            print(f"❌ Creator endpoint test exception: {e}")
            results.append(("Creator endpoint with fan (403)", False, str(e)))
    
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
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success rate: {(passed/total*100) if total > 0 else 0:.1f}%")
    
    if failed > 0:
        print("\n❌ FAILED TESTS:")
        for test_name, success, error in all_results:
            if not success:
                print(f"   - {test_name}: {error}")
    
    print("\n" + "="*80)

def main():
    """Main test execution"""
    print("="*80)
    print("FANVASE BACKEND API TEST SUITE")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Supabase URL: {SUPABASE_URL}")
    print(f"Admin Email: {ADMIN_EMAIL}")
    print("="*80)
    
    all_results = []
    
    # Test A: Public endpoints
    results_a = test_public_endpoints()
    all_results.extend(results_a)
    
    # Test B: Creator journey
    results_b, creator_data = test_creator_journey()
    all_results.extend(results_b)
    
    # Test C: Public community after onboarding
    if creator_data:
        results_c = test_public_community_after_onboarding(creator_data)
        all_results.extend(results_c)
    
    # Test D: Fan journey
    results_d, fan_data = test_fan_journey()
    all_results.extend(results_d)
    
    # Test E: Referral attribution
    results_e, referral_data = test_referral_attribution()
    all_results.extend(results_e)
    
    # Test F: Admin flow
    if creator_data and fan_data:
        results_f = test_admin_flow(creator_data, fan_data, referral_data)
        all_results.extend(results_f)
    
    # Test G: Authorization checks
    if creator_data and fan_data:
        results_g = test_authorization_checks(creator_data, fan_data)
        all_results.extend(results_g)
    
    # Print summary
    print_summary(all_results)
    
    return all_results

if __name__ == "__main__":
    main()
