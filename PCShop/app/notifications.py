import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM


def _send(to_email: str, subject: str, html: str):
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = MAIL_FROM
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.sendmail(MAIL_FROM, to_email, msg.as_string())
    except Exception:
        pass  # nu blocam operatia daca emailul esueaza


def _base(content: str) -> str:
    return f"""
    <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f172a;border-radius:16px;padding:40px;color:#e2e8f0">
      <p style="color:#0ef6ff;font-size:20px;font-weight:bold;margin-top:0">PCShop</p>
      {content}
      <hr style="border:none;border-top:1px solid #1e293b;margin:28px 0">
      <p style="color:#475569;font-size:12px;margin:0">PCShop &mdash; magazin componente PC</p>
    </div>
    """


def notify_order_placed(to_email: str, name: str, order_id: str, invoice: str, total: float, items: list, payment_method: str):
    method_label = {"cod": "Ramburs la livrare", "card": "Card online", "transfer": "Transfer bancar"}.get(payment_method, payment_method)
    rows = "".join(
        f'<tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">{i["name"]}</td>'
        f'<td style="padding:8px 0;text-align:right;color:#e2e8f0;font-size:13px">x{i["quantity"]} &mdash; {float(i["unit_price"]) * i["quantity"]:.2f} RON</td></tr>'
        for i in items
    )
    html = _base(f"""
      <h2 style="color:#e2e8f0;margin-bottom:4px">Comanda confirmată!</h2>
      <p style="color:#94a3b8;font-size:14px">Salut <strong style="color:#e2e8f0">{name}</strong>, comanda ta a fost înregistrată cu succes.</p>
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0 0 4px 0;font-size:12px;color:#64748b">NUMĂR COMANDĂ</p>
        <p style="margin:0;font-size:18px;font-weight:bold;color:#0ef6ff;font-family:monospace">#{order_id[:8].upper()}</p>
        <p style="margin:8px 0 4px 0;font-size:12px;color:#64748b">FACTURĂ</p>
        <p style="margin:0;font-size:14px;color:#e2e8f0">{invoice}</p>
      </div>
      <table style="width:100%;border-collapse:collapse">{rows}</table>
      <div style="border-top:1px solid #334155;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between">
        <span style="font-weight:bold;color:#e2e8f0">Total</span>
        <span style="font-weight:bold;color:#0ef6ff;font-size:18px">{total:.2f} RON</span>
      </div>
      <p style="color:#94a3b8;font-size:13px;margin-top:16px">Metodă de plată: <strong style="color:#e2e8f0">{method_label}</strong></p>
    """)
    _send(to_email, f"Comanda #{order_id[:8].upper()} confirmată — PCShop", html)


def notify_order_status(to_email: str, name: str, order_id: str, status: str):
    labels = {
        "confirmed":  ("Comandă confirmată",    "#0ef6ff", "Comanda ta a fost confirmată și este în procesare."),
        "processing": ("În procesare",           "#f59e0b", "Comanda ta este în curs de pregătire."),
        "shipped":    ("Expediată",              "#00e676", "Comanda ta a fost expediată și este pe drum!"),
        "delivered":  ("Livrată",               "#00e676", "Comanda ta a fost livrată. Spor la utilizare!"),
        "cancelled":  ("Anulată",               "#f87171", "Comanda ta a fost anulată."),
    }
    label, color, desc = labels.get(status, (status, "#94a3b8", ""))
    html = _base(f"""
      <h2 style="color:{color};margin-bottom:4px">Status comandă: {label}</h2>
      <p style="color:#94a3b8;font-size:14px">Salut <strong style="color:#e2e8f0">{name}</strong>, {desc}</p>
      <div style="background:#1e293b;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:0;font-size:12px;color:#64748b">COMANDĂ</p>
        <p style="margin:4px 0 0;font-size:16px;font-weight:bold;color:#0ef6ff;font-family:monospace">#{order_id[:8].upper()}</p>
      </div>
    """)
    _send(to_email, f"Comanda #{order_id[:8].upper()} — {label} — PCShop", html)


def notify_retur_created(to_email: str, name: str, retur_id: str, product_name: str):
    html = _base(f"""
      <h2 style="color:#e2e8f0;margin-bottom:4px">Cerere retur înregistrată</h2>
      <p style="color:#94a3b8;font-size:14px">Salut <strong style="color:#e2e8f0">{name}</strong>, cererea ta de retur a fost înregistrată.</p>
      <div style="background:#1e293b;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:0;font-size:12px;color:#64748b">PRODUS</p>
        <p style="margin:4px 0 8px;font-size:15px;color:#e2e8f0">{product_name}</p>
        <p style="margin:0;font-size:12px;color:#64748b">ID RETUR</p>
        <p style="margin:4px 0 0;font-size:14px;font-family:monospace;color:#0ef6ff">{retur_id[:8].upper()}</p>
      </div>
      <p style="color:#94a3b8;font-size:13px">Echipa noastră va analiza cererea și te va contacta în 1-2 zile lucrătoare.</p>
    """)
    _send(to_email, "Cerere retur înregistrată — PCShop", html)


def notify_retur_status(to_email: str, name: str, retur_id: str, product_name: str, status: str):
    labels = {
        "aprobat":   ("Retur aprobat",   "#00e676", "Cererea ta de retur a fost aprobată."),
        "respins":   ("Retur respins",   "#f87171", "Cererea ta de retur a fost respinsă."),
        "primit":    ("Produs primit",   "#0ef6ff", "Am primit produsul returnat."),
        "rezolvat":  ("Retur rezolvat",  "#00e676", "Returul a fost procesat și rezolvat."),
    }
    label, color, desc = labels.get(status, (status, "#94a3b8", f"Status actualizat la: {status}"))
    html = _base(f"""
      <h2 style="color:{color};margin-bottom:4px">{label}</h2>
      <p style="color:#94a3b8;font-size:14px">Salut <strong style="color:#e2e8f0">{name}</strong>, {desc}</p>
      <div style="background:#1e293b;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:0;font-size:12px;color:#64748b">PRODUS</p>
        <p style="margin:4px 0 8px;font-size:15px;color:#e2e8f0">{product_name}</p>
        <p style="margin:0;font-size:12px;color:#64748b">ID RETUR</p>
        <p style="margin:4px 0 0;font-size:14px;font-family:monospace;color:#0ef6ff">{retur_id[:8].upper()}</p>
      </div>
    """)
    _send(to_email, f"Retur {label} — PCShop", html)


def notify_service_created(to_email: str, name: str, ticket: str, product_name: str):
    html = _base(f"""
      <h2 style="color:#e2e8f0;margin-bottom:4px">Cerere service înregistrată</h2>
      <p style="color:#94a3b8;font-size:14px">Salut <strong style="color:#e2e8f0">{name}</strong>, cererea ta de service a fost înregistrată.</p>
      <div style="background:#1e293b;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:0;font-size:12px;color:#64748b">PRODUS</p>
        <p style="margin:4px 0 8px;font-size:15px;color:#e2e8f0">{product_name}</p>
        <p style="margin:0;font-size:12px;color:#64748b">TICKET</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:bold;font-family:monospace;color:#0ef6ff">{ticket}</p>
      </div>
      <p style="color:#94a3b8;font-size:13px">Echipa noastră va analiza cererea și te va contacta în cel mai scurt timp.</p>
    """)
    _send(to_email, f"Cerere service {ticket} înregistrată — PCShop", html)


def notify_service_status(to_email: str, name: str, ticket: str, product_name: str, status: str):
    labels = {
        "in_lucru":  ("În lucru",        "#f59e0b", "Produsul tău este în curs de reparație."),
        "rezolvat":  ("Rezolvat",        "#00e676", "Produsul tău a fost reparat cu succes."),
        "nerezolvat":("Nerezolvat",      "#f87171", "Din păcate nu am putut repara produsul. Te contactăm pentru detalii."),
        "returnat":  ("Produs returnat", "#0ef6ff", "Produsul tău a fost expediat înapoi."),
    }
    label, color, desc = labels.get(status, (status, "#94a3b8", f"Status actualizat la: {status}"))
    html = _base(f"""
      <h2 style="color:{color};margin-bottom:4px">Service: {label}</h2>
      <p style="color:#94a3b8;font-size:14px">Salut <strong style="color:#e2e8f0">{name}</strong>, {desc}</p>
      <div style="background:#1e293b;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:0;font-size:12px;color:#64748b">PRODUS</p>
        <p style="margin:4px 0 8px;font-size:15px;color:#e2e8f0">{product_name}</p>
        <p style="margin:0;font-size:12px;color:#64748b">TICKET</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:bold;font-family:monospace;color:#0ef6ff">{ticket}</p>
      </div>
    """)
    _send(to_email, f"Service {ticket} — {label} — PCShop", html)


def notify_back_in_stock(to_email: str, product_name: str, product_url: str, price: float):
    html = _base(f"""
      <h2 style="color:#00e5a0;margin-bottom:4px">Produsul este din nou disponibil!</h2>
      <p style="color:#94a3b8;font-size:14px">Produsul pe care l-ai urmărit a revenit în stoc.</p>
      <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0;font-size:12px;color:#64748b">PRODUS</p>
        <p style="margin:4px 0 8px;font-size:15px;font-weight:bold;color:#e2e8f0">{product_name}</p>
        <p style="margin:0;font-size:12px;color:#64748b">PREȚ</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:bold;font-family:monospace;color:#ff8c00">{price:.2f} RON</p>
      </div>
      <a href="{product_url}" style="display:inline-block;background:#0ef6ff;color:#050910;font-weight:bold;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px">
        Cumpără acum →
      </a>
      <p style="color:#475569;font-size:12px;margin-top:20px">
        Ai primit acest email pentru că te-ai abonat la notificări de stoc pentru acest produs.
      </p>
    """)
    _send(to_email, f"⚡ {product_name} este din nou disponibil — PCShop", html)
