import requests
import json
import sys

BASE = "http://localhost:8000"
USER_ID = "2c58f107-3cae-4af5-886e-8ad23314f2c7"

results = []

def test(name, method, url, **kwargs):
    try:
        resp = getattr(requests, method)(url, timeout=10, **kwargs)
        try:
            body = resp.json()
        except Exception:
            body = resp.text[:200]

        # Determine if valid
        ok = resp.status_code < 400
        summary = ""
        if isinstance(body, list):
            summary = f"list({len(body)} items)"
            if len(body) > 0:
                summary += f" first={str(body[0])[:100]}"
        elif isinstance(body, dict):
            keys = list(body.keys())
            summary = f"dict keys={keys[:5]}"
        else:
            summary = str(body)[:150]

        status = "OK" if ok else "ERROR"
        results.append((name, resp.status_code, status, summary))
        return body
    except requests.exceptions.ConnectionError as e:
        results.append((name, "N/A", "CONNECTION_ERROR", str(e)[:100]))
        return None
    except Exception as e:
        results.append((name, "N/A", "EXCEPTION", str(e)[:100]))
        return None

# 1. AUTH
print("Testing AUTH...")
# Register new user
reg_data = {
    "email": "testuser_pcshop_2026@test.com",
    "password": "Test1234!",
    "nume": "Test",
    "prenume": "User",
    "telefon": "0740000000"
}
test("POST /auth/register", "post", f"{BASE}/auth/register", json=reg_data)

# Login with existing user (try admin or known user)
login_data = {"email": "admin@pcshop.ro", "password": "admin123"}
login_resp = test("POST /auth/login (admin)", "post", f"{BASE}/auth/login", json=login_data)

# Try another common login
login_data2 = {"email": "test@test.com", "password": "test123"}
test("POST /auth/login (test user)", "post", f"{BASE}/auth/login", json=login_data2)

test("GET /auth/clients", "get", f"{BASE}/auth/clients")

# 2. PRODUCTS
print("Testing PRODUCTS...")
prods = test("GET /products/", "get", f"{BASE}/products/")
test("GET /products/?category=procesoare&limit=5", "get", f"{BASE}/products/", params={"category": "procesoare", "limit": 5})

# Get first product id
first_product_id = None
if isinstance(prods, list) and len(prods) > 0:
    first_product_id = prods[0].get("id") or prods[0].get("_id")
elif isinstance(prods, dict):
    items = prods.get("items") or prods.get("products") or prods.get("data")
    if items and len(items) > 0:
        first_product_id = items[0].get("id") or items[0].get("_id")

if first_product_id:
    test(f"GET /products/{first_product_id}", "get", f"{BASE}/products/{first_product_id}")
else:
    results.append(("GET /products/{id}", "N/A", "SKIP", "Could not determine product ID"))

# 3. CART
print("Testing CART...")
test(f"GET /cart/{USER_ID}", "get", f"{BASE}/cart/{USER_ID}")

# 4. ORDERS
print("Testing ORDERS...")
test(f"GET /orders/user/{USER_ID}", "get", f"{BASE}/orders/user/{USER_ID}")
test("GET /orders/admin/all", "get", f"{BASE}/orders/admin/all")

# 5. VOUCHERS
print("Testing VOUCHERS...")
test("GET /vouchers/admin/all", "get", f"{BASE}/vouchers/admin/all")
test(f"GET /vouchers/my/{USER_ID}", "get", f"{BASE}/vouchers/my/{USER_ID}")
voucher_data = {"code": "SUMMER15", "user_id": USER_ID, "subtotal": 500}
test("POST /vouchers/validate", "post", f"{BASE}/vouchers/validate", json=voucher_data)

# 6. REVIEWS
print("Testing REVIEWS...")
if first_product_id:
    test(f"GET /reviews/product/{first_product_id}", "get", f"{BASE}/reviews/product/{first_product_id}")
else:
    results.append(("GET /reviews/product/{id}", "N/A", "SKIP", "No product ID"))
test("GET /reviews/admin/pending", "get", f"{BASE}/reviews/admin/pending")

# 7. WISHLIST
print("Testing WISHLIST...")
test(f"GET /wishlist/{USER_ID}", "get", f"{BASE}/wishlist/{USER_ID}")

# 8. PROFILE
print("Testing PROFILE...")
test(f"GET /profile/{USER_ID}/addresses", "get", f"{BASE}/profile/{USER_ID}/addresses")

# 9. RETURURI
print("Testing RETURURI...")
test(f"GET /retururi/user/{USER_ID}", "get", f"{BASE}/retururi/user/{USER_ID}")

# 10. SERVICE
print("Testing SERVICE...")
test(f"GET /service/user/{USER_ID}", "get", f"{BASE}/service/user/{USER_ID}")

# 11. CATEGORIES
print("Testing CATEGORIES...")
test("GET /categories/", "get", f"{BASE}/categories/")

# 12. CHAT
print("Testing CHAT...")
chat_data = {"user_id": USER_ID, "message": "ce procesoare aveti?"}
test("POST /chat", "post", f"{BASE}/chat", json=chat_data)

# Print report
print("\n" + "="*80)
print("RAPORT COMPLET TESTARE API PCShop")
print("="*80)
print(f"{'Endpoint':<45} {'Status':<8} {'Result':<18} {'Details'}")
print("-"*80)

ok_count = 0
error_count = 0
for name, code, status, details in results:
    icon = "PASS" if status == "OK" else ("SKIP" if status == "SKIP" else "FAIL")
    if status == "OK":
        ok_count += 1
    elif status != "SKIP":
        error_count += 1
    print(f"{name:<45} {str(code):<8} {status:<18} {details[:60]}")

print("-"*80)
print(f"\nTotal: {len(results)} teste | PASS: {ok_count} | FAIL: {error_count} | SKIP: {len(results)-ok_count-error_count}")
