# Suport Role Enhancements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 4 features to the suport role: (A) support dashboard with KPIs + urgent items, (B) internal notes on service/return tickets, (C) client 360° history view, (D) priority/urgency badges with inline dropdown on service + return rows.

**Architecture:** Backend adds a `support_notes` table, `priority` column on `service_requests` and `retururi`, and a `/support/notes` router plus a client-history endpoint. Frontend adds a `suport_dashboard` section and enhances the service, retururi, and clients panels in Admin.jsx with priority dropdowns, notes panels, and tabbed client history.

**Tech Stack:** FastAPI + SQLAlchemy + PostgreSQL (backend), React 19 + Vite + inline styles matching existing Admin.jsx pattern (frontend)

---

## Files Changed

**Backend (c:\PCShop)**
- Modify: `app/models/service.py` — add `priority` column
- Modify: `app/models/retur.py` — add `priority` column
- Create: `app/models/support_note.py` — SupportNote model
- Modify: `app/models/__init__.py` — import SupportNote
- Modify: `app/routers/service.py` — add `PATCH /{id}/priority`
- Modify: `app/routers/retururi.py` — add `PATCH /{id}/priority`
- Create: `app/routers/support.py` — notes CRUD
- Modify: `app/routers/auth.py` — add `GET /clients/{user_id}/history`
- Modify: `app/main.py` — include support router

**Frontend (c:\pcshop-frontend)**
- Modify: `src/services/api.js` — add supportAPI + priority patch methods
- Modify: `src/pages/Admin.jsx` — dashboard, priority UI, notes UI, client 360

---

## Task 1: DB Models — priority + support_notes

**Files:**
- Modify: `c:\PCShop\app\models\service.py`
- Modify: `c:\PCShop\app\models\retur.py`
- Create: `c:\PCShop\app\models\support_note.py`
- Modify: `c:\PCShop\app\models\__init__.py`

- [ ] Add `priority` to ServiceRequest model (default `'normal'`)
- [ ] Add `priority` to Retur model (default `'normal'`)
- [ ] Create SupportNote model
- [ ] Import SupportNote in `__init__.py`
- [ ] Run ALTER TABLE migrations

---

## Task 2: Priority endpoints

**Files:**
- Modify: `c:\PCShop\app\routers\service.py`
- Modify: `c:\PCShop\app\routers\retururi.py`

- [ ] Add `PATCH /service/{id}/priority` — sets priority field
- [ ] Add `PATCH /retururi/{id}/priority` — sets priority field
- [ ] Include priority in `get_all_service` and `get_all_retururi` responses

---

## Task 3: Support notes router

**Files:**
- Create: `c:\PCShop\app\routers\support.py`
- Modify: `c:\PCShop\app\main.py`

- [ ] Create `/support/notes/{entity_type}/{entity_id}` GET — list notes
- [ ] Create `/support/notes` POST — add note (requires staff auth)
- [ ] Include router in main.py

---

## Task 4: Client history endpoint + api.js

**Files:**
- Modify: `c:\PCShop\app\routers\auth.py`
- Modify: `c:\pcshop-frontend\src\services\api.js`

- [ ] Add `GET /auth/clients/{user_id}/history` — returns {orders, retururi, service}
- [ ] Add `supportAPI` to api.js (notes CRUD)
- [ ] Add `serviceAPI.setPriority`, `retururiAPI.setPriority`
- [ ] Add `clientsAPI.history`

---

## Task 5: Frontend — Support Dashboard

**Files:**
- Modify: `c:\pcshop-frontend\src\pages\Admin.jsx`

- [ ] Add `suport_dashboard` to ROLE_SECTIONS.suport + MENU_ALL
- [ ] Add KPI stats computation (pending orders, pending retururi, pending service, pending reviews)
- [ ] Add urgent items computation (items with priority=urgent or priority=ridicat)
- [ ] Render `suport_dashboard` section

---

## Task 6: Frontend — Priority dropdown

- [ ] Add state: `priorityDropOpen` (id of row with open dropdown, or null)
- [ ] Add handler: `handleSetPriority(type, id, priority)`
- [ ] Add inline priority dropdown component to service rows
- [ ] Add inline priority dropdown component to retururi rows
- [ ] Update `loadAll` to include priority in service/retururi data (already returned by backend after Task 2)

---

## Task 7: Frontend — Notes panel

- [ ] Add state: `notesByEntity` (Record<entityId, Note[]>), `openNotesFor`, `noteText`, `noteSaving`
- [ ] Add handlers: `loadNotes(type, id)`, `saveNote(type, id)`
- [ ] Add notes toggle button to service rows (shows count if notes exist)
- [ ] Add notes toggle button to retururi rows
- [ ] Render expanded notes panel below each row when open

---

## Task 8: Frontend — Client 360° view

- [ ] Add state: `clientHistory` (per user_id), `clientHistoryTab` (orders/retururi/service), `loadingHistory`
- [ ] Add handler: `loadClientHistory(userId)`
- [ ] Update clients section to call `loadClientHistory` when selecting a client
- [ ] Render tabbed history panel (Comenzi / Retururi / Service + stats footer)
