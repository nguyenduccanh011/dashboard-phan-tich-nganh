# Setup Guide - Sector Hub

## Quick Start (New Machine)

### 1. Clone & Install
```bash
git clone <repo>
cd sector-hub
pip install -r requirements.txt
```

### 2. Setup Credentials
```bash
python setup_credentials.py
```

This will:
- Prompt for Findicator email/password
- Generate or use existing `FINDICATOR_DEVICE_ID` (fixed across machines)
- Create `.env` file with credentials
- Optionally set WiChart secret

### 3. Run Server
```bash
python app.py
```

Open: `http://localhost:8000`

---

## Device ID Strategy

**Problem:** Findicator API may block requests from different devices. If you move to a new machine, you need the same Device ID.

**Solution:** Store Device ID in `.env` environment variable

### How it works:

1. **First machine:**
   - Run `setup_credentials.py`
   - Generates random UUID as `FINDICATOR_DEVICE_ID`
   - Saves to `.env` file
   - Also cached in `data/secrets/findicator_creds.json`

2. **Second machine (NEW):**
   - Copy the `FINDICATOR_DEVICE_ID` value from first machine's `.env`
   - Run `setup_credentials.py` on new machine
   - Paste the saved Device ID when prompted (or edit `.env` directly)
   - Server will use the same Device ID → Findicator won't block

### Example:

**Machine 1 - Original setup:**
```bash
$ python setup_credentials.py
Findicator Email: user@example.com
Findicator Password: ****
✓ Generated new FINDICATOR_DEVICE_ID: 550e8400-e29b-41d4-a716-446655440000
✓ .env file created
```

**Machine 2 - New machine:**
```bash
$ cp Machine1/.env . # OR manually copy FINDICATOR_DEVICE_ID value

$ python setup_credentials.py
Findicator Email: user@example.com
Findicator Password: ****
✓ Using FINDICATOR_DEVICE_ID from .env: 550e8400...
✓ .env file created/updated
```

**Result:** Both machines use same Device ID → No API blocking

---

## .env Configuration

### Template:
```env
FINDICATOR_EMAIL=your@email.com
FINDICATOR_PASSWORD=yourpassword
FINDICATOR_DEVICE_ID=550e8400-e29b-41d4-a716-446655440000
WICHART_SECRET=your-wichart-secret
```

### Environment Variable Priority (for Device ID):

1. **`FINDICATOR_DEVICE_ID` from `.env`** ← Use this to maintain same ID across machines
2. **Cached in `data/secrets/findicator_creds.json`** ← Auto-created on first login
3. **Auto-generate** ← If neither exists

### To maintain same Device ID:
- **Keep `.env` file secure** (contains password & device ID)
- **Never commit `.env` to git** (add to `.gitignore`)
- **Share Device ID separately** from passwords if setting up another machine

---

## What Gets Cached

After first successful login:
- `data/secrets/findicator_creds.json` - Device ID + token UUID (auto-generated, safe to delete)
- `data/secrets/findicator_token.txt` - API access token (expires ~72h, auto-refreshes)
- `cache/*.json` - Sector data (auto-refreshed daily at 7:30 AM ICT)

**Safe to delete:** Any `data/secrets/*` or `cache/*` files - they'll be regenerated on next run.

---

## Troubleshooting

### "API blocked / 403 error"
- Device ID may be different across machines
- **Fix:** Use same `FINDICATOR_DEVICE_ID` value in `.env`
- Run: `python setup_credentials.py`

### "Invalid credentials"
- Check email/password in `.env`
- Verify Findicator account is active
- Try login in browser first

### "Token expired"
- Auto-refreshes on next API call
- Delete `data/secrets/findicator_token.txt` to force new login

### "WiChart data missing"
- WiChart secret is optional
- If set, put in `.env` as `WICHART_SECRET`
- Some sectors don't use WiChart data

---

## Architecture

```
.env (credentials + device ID) 
  ↓
collectors/base.py (_load_device_creds)
  ├─ Check FINDICATOR_DEVICE_ID from env
  ├─ Check cached file
  └─ Generate if needed
  ↓
Findicator API login with fixed Device ID
  ↓
Access token cached → Collectors run
  ↓
cache/*.json (sector data)
  ↓
FastAPI server → Browser dashboard
```

---

## Share Device ID Across Team

If your team wants to use same Findicator account:

1. **Person A (original setup):**
   ```bash
   python setup_credentials.py
   # Copy FINDICATOR_DEVICE_ID from .env
   ```

2. **Person B (share credentials):**
   ```bash
   # Manually create .env with shared Device ID:
   FINDICATOR_EMAIL=shared@email.com
   FINDICATOR_PASSWORD=sharedpassword
   FINDICATOR_DEVICE_ID=550e8400-e29b-41d4-a716-446655440000
   ```

3. **Both run:**
   ```bash
   python app.py
   ```

**Note:** Same Device ID = API won't rate-limit across team if using same account (depends on Findicator API limits)

---

## Security

- **`.env` is secret** - Never commit, never share publicly
- **Device ID alone is NOT sensitive** - It's just a UUID identifier, not a credential
- **Access tokens are temporary** - Auto-refresh, expired tokens deleted
- **All API responses are encrypted** - AES-256-CBC decryption in base.py

