#!/usr/bin/env python3
"""Test API with correct endpoints and decrypt data"""

import json
import requests
import base64
from Crypto.Cipher import AES
from Crypto.Hash import MD5

# AES secret from base.py
AES_SECRET = b"b6efdbe6b92fa5221531e85082aa015f3fe407538b7ed1b2f68d70519028a9d5"

def decrypt_hashcode(ciphertext_b64: str) -> dict:
    """Decrypt AES-256-CBC encrypted hashCode"""
    try:
        raw = base64.b64decode(ciphertext_b64)
        if raw[:8] != b"Salted__":
            return {"error": "Invalid format"}
        
        salt = raw[8:16]
        ct = raw[16:]
        
        # EVP_BytesToKey
        d, d_i = b"", b""
        while len(d) < 48:
            d_i = MD5.new(d_i + AES_SECRET + salt).digest()
            d += d_i
        
        key, iv = d[:32], d[32:48]
        pt = AES.new(key, AES.MODE_CBC, iv).decrypt(ct)
        
        # Remove PKCS7 padding
        return json.loads(pt[:-pt[-1]])
    except Exception as e:
        return {"error": str(e)}

def load_credentials():
    cred_file = r"f:\PROJECTS\sector-hub\data\secrets\findicator_creds.json"
    with open(cred_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def test_endpoints():
    """Test with correct endpoint paths"""
    base_url = "https://api.findicator.vn/api"
    creds = load_credentials()
    device_id = creds['deviceId']
    
    # Test with corrected endpoints
    endpoints = [
        {
            'name': 'Corp List',
            'path': 'enterprise/corp-list',
        },
        {
            'name': 'Finance Data Range (Correct Path)',
            'path': 'enterprise/v2/finance-data-range',
            'params': {'ticket': 'REE', 'period': 'quarter', 'tableName': 'TRAILING'}
        },
        {
            'name': 'Finance Ticket Data',
            'path': 'enterprise/v2/finance-ticket-data',
            'params': {'ticket': '["REE"]', 'period': 'quarter', 'tableName': 'TRAILING'}
        },
        {
            'name': 'Lake Level',
            'path': 'electricity/lake-level',
            'params': {'lakeId': '45'}
        },
    ]
    
    print("=" * 120)
    print("TESTING API ENDPOINTS WITH DECRYPTION")
    print("=" * 120)
    print()
    
    for endpoint in endpoints:
        print(f"\n[TEST] {endpoint['name']}")
        print(f"  Path: {endpoint['path']}")
        
        try:
            url = f"{base_url}/{endpoint['path']}"
            params = endpoint.get('params', {})
            
            response = requests.get(url, params=params, timeout=10)
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                if 'hashCode' in data:
                    print(f"  Response: ENCRYPTED (hashCode present)")
                    print(f"  Encrypted length: {len(data['hashCode'])} chars")
                    
                    # Try to decrypt
                    decrypted = decrypt_hashcode(data['hashCode'])
                    
                    if 'error' not in decrypted:
                        print(f"  Decrypted successfully!")
                        
                        # Show sample
                        if isinstance(decrypted, dict):
                            print(f"  Keys: {list(decrypted.keys())}")
                            if 'data' in decrypted and isinstance(decrypted['data'], list):
                                print(f"  Items: {len(decrypted['data'])}")
                                if decrypted['data']:
                                    first = decrypted['data'][0]
                                    if isinstance(first, dict):
                                        print(f"  Sample item: {json.dumps(first, ensure_ascii=False)[:100]}")
                        elif isinstance(decrypted, list):
                            print(f"  Array with {len(decrypted)} items")
                            if decrypted:
                                print(f"  Sample: {json.dumps(decrypted[0], ensure_ascii=False)[:100]}")
                    else:
                        print(f"  Decryption failed: {decrypted['error']}")
                        
                elif 'data' in data:
                    print(f"  Response: UNENCRYPTED")
                    print(f"  Keys: {list(data.keys())}")
                else:
                    print(f"  Response: {json.dumps(data, ensure_ascii=False)[:100]}")
            else:
                print(f"  Error: {response.status_code}")
                print(f"  Response: {response.text[:200]}")
                
        except Exception as e:
            print(f"  Exception: {str(e)}")

if __name__ == '__main__':
    test_endpoints()
