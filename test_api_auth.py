#!/usr/bin/env python3
"""Test API endpoints with saved credentials"""

import json
import requests
import sys
from pathlib import Path

def load_credentials():
    """Load credentials from file"""
    cred_file = r"f:\PROJECTS\sector-hub\data\secrets\findicator_creds.json"
    with open(cred_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_token():
    """Load JWT token"""
    token_file = r"f:\PROJECTS\sector-hub\data\secrets\findicator_token.txt"
    with open(token_file, 'r', encoding='utf-8') as f:
        return f.read().strip()

def test_endpoints(creds, token):
    """Test various API endpoints"""
    base_url = "https://api.findicator.vn"
    
    device_id = creds['deviceId']
    
    # Test endpoints
    endpoints = [
        {
            'name': 'Auth Check',
            'url': f'/api/auth?deviceId={device_id}',
            'method': 'GET'
        },
        {
            'name': 'Corp List',
            'url': '/api/enterprise/corp-list',
            'method': 'GET'
        },
        {
            'name': 'Finance Data Range',
            'url': '/api/enterprise/finance-data-range',
            'method': 'GET'
        },
        {
            'name': 'Lake Level',
            'url': '/api/electricity/lake-level?lakeId=45',
            'method': 'GET'
        },
        {
            'name': 'Steel Legend',
            'url': '/api/steel/legend',
            'method': 'GET'
        }
    ]
    
    print("=" * 100)
    print("TESTING API ENDPOINTS WITH SAVED CREDENTIALS")
    print("=" * 100)
    print(f"Device ID: {device_id}")
    print(f"Token: {token[:50]}...")
    print()
    
    headers = {
        'Authorization': f'Bearer {token}',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json'
    }
    
    results = []
    
    for endpoint in endpoints:
        print(f"\n[TEST] {endpoint['name']}")
        print(f"  URL: {endpoint['url']}")
        
        try:
            full_url = base_url + endpoint['url']
            response = requests.get(full_url, headers=headers, timeout=10)
            
            print(f"  Status: {response.status_code}")
            
            # Try to parse response
            try:
                data = response.json()
                
                # Check for errors
                if 'error' in data or 'errors' in data:
                    print(f"  Error in response: {data}")
                    results.append({
                        'endpoint': endpoint['name'],
                        'status': response.status_code,
                        'has_error': True
                    })
                else:
                    # Check response structure
                    if 'hashCode' in data:
                        print(f"  Data: ENCRYPTED (hashCode present)")
                        print(f"  Encrypted value length: {len(data['hashCode'])} chars")
                        results.append({
                            'endpoint': endpoint['name'],
                            'status': response.status_code,
                            'has_error': False,
                            'is_encrypted': True
                        })
                    elif 'data' in data:
                        print(f"  Data structure: OK")
                        if isinstance(data['data'], list):
                            print(f"  Items: {len(data['data'])}")
                        elif isinstance(data['data'], dict):
                            print(f"  Keys: {list(data['data'].keys())[:5]}")
                        results.append({
                            'endpoint': endpoint['name'],
                            'status': response.status_code,
                            'has_error': False
                        })
                    else:
                        print(f"  Response keys: {list(data.keys())}")
                        results.append({
                            'endpoint': endpoint['name'],
                            'status': response.status_code,
                            'has_error': False
                        })
                        
            except json.JSONDecodeError:
                print(f"  Response: {response.text[:100]}")
                results.append({
                    'endpoint': endpoint['name'],
                    'status': response.status_code,
                    'parse_error': True
                })
                
        except requests.exceptions.RequestException as e:
            print(f"  ERROR: {str(e)}")
            results.append({
                'endpoint': endpoint['name'],
                'error': str(e)
            })
    
    # Summary
    print("\n\n" + "=" * 100)
    print("SUMMARY")
    print("=" * 100)
    
    successful = len([r for r in results if r.get('status') == 200])
    encrypted = len([r for r in results if r.get('is_encrypted')])
    errors = len([r for r in results if r.get('has_error')])
    
    print(f"Total Tests: {len(results)}")
    print(f"Successful (200): {successful}")
    print(f"Encrypted responses: {encrypted}")
    print(f"With errors: {errors}")
    
    if successful > 0:
        print("\n✓ Authentication working!")
    
    if encrypted > 0:
        print("\n⚠ Data is encrypted - need decryption key/algorithm")

if __name__ == '__main__':
    try:
        creds = load_credentials()
        token = load_token()
        test_endpoints(creds, token)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)
