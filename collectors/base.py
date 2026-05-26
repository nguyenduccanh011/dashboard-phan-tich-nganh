"""
FindicatorClient và WiChartClient — base HTTP clients.

Findicator auth flow:
  POST /api/auth/login-user → {accessToken, refreshToken}  (body cần token+deviceId UUID cố định)
  Token cache: data/secrets/findicator_token.txt (expire ~72h)
  Tất cả response bọc trong {"hashCode":"..."} — AES-256-CBC decrypt bằng SECRET

WiChart:
  Base URL: https://api.wichart.vn/vietnambiz/vi-mo
  Params: key={KEY}, name={NAME}
"""
import os, json, uuid, base64, asyncio
from pathlib import Path
from datetime import datetime
import httpx
from Crypto.Cipher import AES
from Crypto.Hash import MD5

CACHE_DIR = Path("cache")
CACHE_DIR.mkdir(exist_ok=True)
SECRETS_DIR = Path("data/secrets")
SECRETS_DIR.mkdir(parents=True, exist_ok=True)

FINDICATOR_BASE = "https://api.findicator.vn/api"
WICHART_BASE = "https://api.wichart.vn/vietnambiz/vi-mo"

# AES secret — OpenSSL EVP_BytesToKey, MD5, AES-256-CBC
_AES_SECRET = b"b6efdbe6b92fa5221531e85082aa015f3fe407538b7ed1b2f68d70519028a9d5"

# factTable + period + valueType mặc định cho từng macroItemId
# dùng khi gọi macro-data/macro-item-detail (compat alias)
_MACRO_META = {
    35:  ("comdty",                         "date",    "value"),
    52:  ("macro_vn_exchangerate_usd",       "date",    "value"),
    53:  ("macro_vn_exchangerate_others",    "date",    "value"),
    4:   ("macro_vn_cpi",                   "month",   "yoy"),
    6:   ("macro_vn_prd_pmi",               "month",   "value"),
    7:   ("macro_vn_prd_iip",               "month",   "yoy"),
    8:   ("macro_vn_prd_industrialproduct", "month",   "value"),
    12:  ("macro_vn_dim_index_consumption", "quarter", "value"),
    13:  ("macro_vn_dim_index_inventory",   "quarter", "value"),
    15:  ("macro_vn_fdi_sector",            "month",   "value"),
    20:  ("macro_vn_capital_understate",    "month",   "value"),
    23:  ("macro_vn_retailsales",           "month",   "value"),
    25:  ("macro_vn_exim_excomdty",         "month",   "value"),
    26:  ("macro_vn_exim_imcomdty",         "month",   "value"),
    29:  ("macro_vn_trans_carriedpassenger","month",   "value"),
    31:  ("macro_vn_trans_trafficpassenger","month",   "value"),
    46:  ("macro_vn_liquidity",             "month",   "value"),
    47:  ("macro_vn_credit_growth",         "month",   "value"),
    48:  ("macro_vn_interestrate_commercialbank", "date", "value"),
    50:  ("macro_vn_omo",                   "date",    "value"),
    54:  ("macro_global_bond",              "date",    "value"),
    55:  ("macro_vn_reserves",              "month",   "value"),
    61:  ("macro_vn_internationalvisitor",  "month",   "value"),
    96:  ("macro_us_interestrate",          "date",    "value"),
    97:  ("macro_us_fed_asset",             "date",    "value"),
    70:  ("macro_us_cpi",                  "month",   "yoy"),
    71:  ("macro_us_ppi",                  "month",   "yoy"),
    78:  ("macro_us_prd_pmi",              "month",   "value"),
    84:  ("macro_us_retailsales_sales",    "month",   "value"),
    115: ("macro_cn_prd_pmi",              "month",   "value"),
    119: ("macro_cn_prd_industrial",       "month",   "value"),
    121: ("macro_cn_realestate_invest",    "month",   "value"),
    122: ("macro_cn_realestate_area",      "month",   "value"),
    123: ("macro_cn_realestate_sales",     "month",   "value"),
    125: ("macro_cn_fixed_asset",          "month",   "yoy"),
    126: ("macro_cn_retailsales",          "month",   "value"),
    127: ("macro_cn_exim",                 "month",   "value"),
    134: ("macro_vn_stock",                "date",    "value"),
    139: ("macro_us_gdp_forecast",         "date",    "value"),
    # Vĩ mô VN — đầu tư & vận tải
    18:  ("macro_vn_fdi_realized",         "month",   "value"),
    21:  ("macro_vn_capital_society",      "month",   "value"),
    32:  ("macro_vn_trans_carriedgoods",   "month",   "value"),
    33:  ("macro_vn_transport_price",      "quarter", "yoy"),
    56:  ("macro_vn_balance_payment",      "month",   "value"),
    87:  ("macro_us_exim",                 "month",   "value"),
    140: ("macro_vn_exim_comdty_net",      "month",   "value"),
}
_TOKEN_FILE = SECRETS_DIR / "findicator_token.txt"
_CREDS_FILE = SECRETS_DIR / "findicator_creds.json"


def _unwrap(body: any) -> any:
    """hashCode có thể là string (AES encrypted) hoặc dict/list (data trực tiếp)."""
    if not isinstance(body, dict) or "hashCode" not in body:
        return body
    hc = body["hashCode"]
    if isinstance(hc, str):
        return _decrypt(hc)
    return hc  # enterprise endpoints trả data trực tiếp trong hashCode


def _decrypt(ciphertext_b64: str) -> any:
    raw = base64.b64decode(ciphertext_b64)
    assert raw[:8] == b"Salted__", "Unexpected response format"
    salt, ct = raw[8:16], raw[16:]
    d, d_i = b"", b""
    while len(d) < 48:
        d_i = MD5.new(d_i + _AES_SECRET + salt).digest()
        d += d_i
    key, iv = d[:32], d[32:48]
    pt = AES.new(key, AES.MODE_CBC, iv).decrypt(ct)
    return json.loads(pt[:-pt[-1]])


def _load_device_creds() -> dict:
    """Load hoặc tạo mới deviceId + token UUID cố định."""
    if _CREDS_FILE.exists():
        return json.loads(_CREDS_FILE.read_text(encoding="utf-8"))
    creds = {
        "deviceId": str(uuid.uuid4()),
        "token": str(uuid.uuid4()),
        "deviceInfo": json.dumps({
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "platform": "Win32",
            "vendor": "Google Inc.",
        }),
    }
    _CREDS_FILE.write_text(json.dumps(creds, indent=2), encoding="utf-8")
    return creds


class FindicatorClient:
    def __init__(self):
        self.email = os.getenv("FINDICATOR_EMAIL")
        self.password = os.getenv("FINDICATOR_PASSWORD")
        self.access_token: str | None = None
        self._load_cached_token()

    def _load_cached_token(self):
        if _TOKEN_FILE.exists():
            self.access_token = _TOKEN_FILE.read_text(encoding="utf-8").strip() or None

    async def login(self):
        creds = _load_device_creds()
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(f"{FINDICATOR_BASE}/auth/login-user", json={
                "email": self.email,
                "password": self.password,
                "token": creds["token"],
                "deviceId": creds["deviceId"],
                "deviceInfo": creds["deviceInfo"],
            })
            if r.status_code not in (200, 201):
                raise RuntimeError(f"Login failed {r.status_code}: {r.text[:200]}")
            data = r.json()
            token = data.get("data", {}).get("accessToken") or data.get("accessToken")
            if not token:
                raise RuntimeError(f"No accessToken in response: {data}")
            self.access_token = token
            _TOKEN_FILE.write_text(token, encoding="utf-8")

    async def _macro_metric(self, macro_item_id: int, name_id: int, filter_: str, client, headers) -> list:
        """Gọi macro/metric-data cho một nameId, trả list rows."""
        meta = _MACRO_META.get(macro_item_id)
        if not meta:
            return []
        fact_table, period, value_type = meta
        extend_id = f"{fact_table}-{name_id}-{period}-{value_type}-null-"
        r = await client.get(f"{FINDICATOR_BASE}/macro/metric-data", headers=headers, params={
            "macroItemId": macro_item_id,
            "nameId": name_id,
            "extendID": extend_id,
            "period": period,
            "valueType": value_type,
            "filter": filter_,
            "ticket": "",
            "isSamePeriod": "false",
        })
        if r.status_code != 200:
            return []
        body = r.json()
        data = _unwrap(body)
        # macro/metric-data trả {"data": [...]} hoặc list trực tiếp
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return data if isinstance(data, list) else []

    async def _get_macro_compat(self, params: dict) -> list:
        """Translate macro-data/macro-item-detail params → macro/metric-data calls."""
        raw_macro = str(params.get("macroItemId", "0"))
        macro_ids = [int(x.strip()) for x in raw_macro.split(",") if x.strip()]
        raw_ids = str(params.get("nameId", "1"))
        name_ids = [int(x.strip()) for x in raw_ids.split(",") if x.strip()]
        filter_ = params.get("year", params.get("filter", "5Y")).upper()
        if filter_ not in ("1Y", "3Y", "5Y", "MAX"):
            filter_ = "5Y"

        headers = {}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"

        combined = []
        async with httpx.AsyncClient(timeout=30) as client:
            for macro_id in macro_ids:
                tasks = [self._macro_metric(macro_id, nid, filter_, client, headers) for nid in name_ids]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                for rows in results:
                    if isinstance(rows, list):
                        combined.extend(rows)
        return combined

    async def get(self, path: str, params: dict = None) -> any:
        # Compat alias: macro-data/macro-item-detail → macro/metric-data
        if path == "macro-data/macro-item-detail":
            return await self._get_macro_compat(params or {})

        # Auto-inject period+date for finance-ticket-data if missing
        params = dict(params or {})
        if path == "enterprise/v2/finance-ticket-data" and "date" not in params:
            q_month = ((datetime.now().month - 1) // 3) * 3 + 1
            params.setdefault("period", "quarter")
            params["date"] = f"{q_month:02d}/01/{datetime.now().year}"

        headers = {}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"

        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(f"{FINDICATOR_BASE}/{path}", headers=headers, params=params)

            if r.status_code == 401:
                await self.login()
                headers["Authorization"] = f"Bearer {self.access_token}"
                r = await client.get(f"{FINDICATOR_BASE}/{path}", headers=headers, params=params)

            r.raise_for_status()
            return _unwrap(r.json())

    def save_cache(self, filename: str, data: dict):
        path = CACHE_DIR / filename
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def load_cache(self, filename: str) -> dict | None:
        path = CACHE_DIR / filename
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
        return None

    @staticmethod
    def normalize_block_f(raw: dict, ticker: str) -> dict:
        """Đảm bảo output luôn là {ticker: {ticker: [rows]}}"""
        rows = raw.get(ticker, [])
        if isinstance(rows, list):
            return {ticker: {ticker: rows}}
        return {ticker: rows}  # đã đúng format

    @staticmethod
    def normalize_block_e_analyst(analyst_raw) -> list:
        """Đảm bảo analyst luôn là list với field 'recommend'"""
        if analyst_raw is None:
            return []
        item = analyst_raw[0] if isinstance(analyst_raw, list) else analyst_raw
        if 'recommendation' in item and 'recommend' not in item:
            item['recommend'] = item.pop('recommendation')
        return [item] if not isinstance(analyst_raw, list) else analyst_raw


class WiChartClient:
    def __init__(self):
        self.secret = os.getenv("WICHART_SECRET", "")

    async def get(self, key: str, name: str, params: dict = None) -> any:
        p = {"key": key, "name": name, **(params or {})}
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(WICHART_BASE, params=p)
            r.raise_for_status()
            body = r.json()
            return _unwrap(r.json())


# Singleton instances — import từ đây
findicator = FindicatorClient()
wichart = WiChartClient()
