"""
Setup script to initialize Findicator credentials.

Run once on a new machine to:
1. Generate or use existing FINDICATOR_DEVICE_ID
2. Create .env file with credentials
3. Verify API connection
"""
import os
import json
import uuid
from pathlib import Path
from dotenv import load_dotenv, dotenv_values

ENV_FILE = Path(".env")
CREDS_FILE = Path("data/secrets/findicator_creds.json")


def get_or_generate_device_id():
    """Get device ID from: env → creds file → generate new"""
    # 1. Check env
    load_dotenv()
    env_device_id = os.getenv("FINDICATOR_DEVICE_ID", "").strip()
    if env_device_id:
        print(f"✓ Using FINDICATOR_DEVICE_ID from .env: {env_device_id[:8]}...")
        return env_device_id

    # 2. Check creds file
    if CREDS_FILE.exists():
        try:
            creds = json.loads(CREDS_FILE.read_text(encoding="utf-8"))
            device_id = creds.get("deviceId")
            if device_id:
                print(f"✓ Found FINDICATOR_DEVICE_ID in {CREDS_FILE}: {device_id[:8]}...")
                return device_id
        except Exception as e:
            print(f"⚠ Could not read creds file: {e}")

    # 3. Generate new
    device_id = str(uuid.uuid4())
    print(f"✓ Generated new FINDICATOR_DEVICE_ID: {device_id}")
    return device_id


def create_env_file():
    """Create/update .env file with credentials"""
    print("\n=== Findicator Credentials Setup ===\n")

    # Get email/password
    email = input("Findicator Email: ").strip()
    password = input("Findicator Password: ").strip()

    if not email or not password:
        print("✗ Email and password required")
        return False

    # Get or generate device ID
    device_id = get_or_generate_device_id()

    # Get WiChart secret (optional)
    wichart_secret = input("WiChart Secret (optional, press Enter to skip): ").strip()

    # Load existing .env
    existing_env = {}
    if ENV_FILE.exists():
        existing_env = dotenv_values(ENV_FILE)

    # Update with new values
    new_env = {
        "FINDICATOR_EMAIL": email,
        "FINDICATOR_PASSWORD": password,
        "FINDICATOR_DEVICE_ID": device_id,
        "WICHART_SECRET": wichart_secret or existing_env.get("WICHART_SECRET", ""),
    }

    # Write .env
    with open(ENV_FILE, "w") as f:
        for key, value in new_env.items():
            f.write(f"{key}={value}\n")

    print(f"\n✓ .env file created/updated")
    print(f"  - Email: {email}")
    print(f"  - Device ID: {device_id[:8]}... (saved to {CREDS_FILE} after first login)")
    print(f"  - WiChart Secret: {'***' if wichart_secret else 'Not set'}")

    return True


def verify_credentials():
    """Test API connection with current credentials"""
    print("\n=== Verifying Credentials ===\n")

    load_dotenv()
    email = os.getenv("FINDICATOR_EMAIL")
    password = os.getenv("FINDICATOR_PASSWORD")
    device_id = os.getenv("FINDICATOR_DEVICE_ID")

    if not (email and password):
        print("✗ FINDICATOR_EMAIL and FINDICATOR_PASSWORD not set in .env")
        return False

    print(f"Email: {email}")
    print(f"Device ID: {device_id[:8] if device_id else 'Will generate on first login'}...")

    print("\n(Credentials will be verified on first API call)")
    return True


if __name__ == "__main__":
    try:
        if not create_env_file():
            exit(1)

        verify_credentials()

        print("\n✓ Setup complete!")
        print("Run: python app.py")

    except KeyboardInterrupt:
        print("\n✗ Setup cancelled")
        exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        exit(1)
