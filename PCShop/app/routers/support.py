from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.models.support_note import SupportNote
from app.dependencies import require_role
from app.models.user import User

_require_staff = require_role("admin", "manager", "achizitii", "marketing", "suport")

router = APIRouter(prefix="/support", tags=["Suport"])

class NoteCreate(BaseModel):
    entity_type: str   # order | service | retur
    entity_id:   UUID
    note_text:   str

# Returneaza notele interne pentru un tichet/comanda/retur
@router.get("/notes/{entity_type}/{entity_id}")
def get_notes(
    entity_type: str, entity_id: UUID,
    db: Session = Depends(get_db),
    current: User = Depends(_require_staff),
):
    notes = (
        db.query(SupportNote)
        .filter(SupportNote.entity_type == entity_type, SupportNote.entity_id == entity_id)
        .order_by(SupportNote.created_at.asc())
        .all()
    )
    return [
        {
            "id":         str(n.id),
            "staff_name": n.staff_name,
            "note_text":  n.note_text,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notes
    ]

# Adauga o nota interna pe un tichet/comanda/retur
@router.post("/notes", status_code=201)
def add_note(
    req: NoteCreate,
    db: Session = Depends(get_db),
    current: User = Depends(_require_staff),
):
    if req.entity_type not in ("order", "service", "retur"):
        raise HTTPException(400, "entity_type trebuie sa fie: order, service, retur")
    note = SupportNote(
        entity_type = req.entity_type,
        entity_id   = req.entity_id,
        staff_id    = current.id,
        staff_name  = current.name,
        note_text   = req.note_text,
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
