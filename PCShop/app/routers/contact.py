from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

from app.database import get_db
from app.models.contact import ContactMessage
from app.models.support_note import SupportNote
from app.dependencies import require_staff, require_role
from app.models.user import User

router = APIRouter(prefix="/contact", tags=["Contact"])

_require_staff = require_role("admin", "manager", "suport")


class ContactSend(BaseModel):
    name:    str
    email:   str
    subject: str
    message: str

class NoteAdd(BaseModel):
    note_text: str


def _msg_dict(m: ContactMessage, notes: list = None):
    return {
        "id":               str(m.id),
        "name":             m.name,
        "email":            m.email,
        "subject":          m.subject,
        "message":          m.message,
        "is_resolved":      m.is_resolved,
        "resolved_by_name": m.resolved_by_name,
        "resolved_at":      m.resolved_at.isoformat() if m.resolved_at else None,
        "created_at":       m.created_at.isoformat() if m.created_at else None,
        "notes":            notes or [],
    }


# ── Public: salveaza mesajul din formularul de contact ──────────────
@router.post("/send", status_code=201)
def send_message(req: ContactSend, db: Session = Depends(get_db)):
    if not req.name.strip() or not req.email.strip() or not req.subject.strip() or not req.message.strip():
        raise HTTPException(400, "Toate campurile sunt obligatorii")
    msg = ContactMessage(
        name    = req.name.strip(),
        email   = req.email.strip(),
        subject = req.subject.strip(),
        message = req.message.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"message": "Mesaj trimis cu succes", "id": str(msg.id)}


# ── Staff: lista toate mesajele (desc created_at) ──────────────────
@router.get("/messages")
def list_messages(
    db:      Session = Depends(get_db),
    current: User    = Depends(_require_staff),
):
    msgs = db.query(ContactMessage).order_by(desc(ContactMessage.created_at)).all()
    result = []
    for m in msgs:
        notes = (
            db.query(SupportNote)
            .filter(SupportNote.entity_type == "contact", SupportNote.entity_id == m.id)
            .order_by(SupportNote.created_at.asc())
            .all()
        )
        note_list = [
            {
                "id":         str(n.id),
                "staff_name": n.staff_name,
                "note_text":  n.note_text,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notes
        ]
        result.append(_msg_dict(m, note_list))
    return result


# ── Staff: toggle rezolvat ──────────────────────────────────────────
@router.patch("/messages/{msg_id}/resolve")
def toggle_resolve(
    msg_id:  UUID,
    db:      Session = Depends(get_db),
    current: User    = Depends(_require_staff),
):
    msg = db.query(ContactMessage).filter(ContactMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(404, "Mesaj negasit")
    msg.is_resolved = not msg.is_resolved
    if msg.is_resolved:
        msg.resolved_by_name = current.name
        msg.resolved_at      = datetime.now(timezone.utc)
    else:
        msg.resolved_by_name = None
        msg.resolved_at      = None
    db.commit()
    db.refresh(msg)
    return {"is_resolved": msg.is_resolved, "resolved_by_name": msg.resolved_by_name}


# ── Staff: adauga nota interna pe un mesaj ─────────────────────────
@router.post("/messages/{msg_id}/notes", status_code=201)
def add_note(
    msg_id:  UUID,
    req:     NoteAdd,
    db:      Session = Depends(get_db),
    current: User    = Depends(_require_staff),
):
    msg = db.query(ContactMessage).filter(ContactMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(404, "Mesaj negasit")
    if not req.note_text.strip():
        raise HTTPException(400, "Nota nu poate fi goala")
    note = SupportNote(
        entity_type = "contact",
        entity_id   = msg_id,
        staff_id    = current.id,
        staff_name  = current.name,
        note_text   = req.note_text.strip(),
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return {
        "id":         str(note.id),
        "staff_name": note.staff_name,
        "note_text":  note.note_text,
        "created_at": note.created_at.isoformat() if note.created_at else None,
    }
