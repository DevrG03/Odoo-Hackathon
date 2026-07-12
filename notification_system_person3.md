# Notification System — Person 3 (Governance)

Implementation guide for the EcoSphere in-app notification system.

The spec marks this as **not optional**. It adds one new table and sends a
notification when any of these events happen:

- a CSR participation is approved (Social module)
- a Challenge participation is approved (Gamification module)
- a compliance issue is raised (Governance — the owner is notified)
- a compliance issue becomes overdue (Governance)

> **Shared-DB warning:** Step 8 runs a migration against the shared Neon
> database. Announce it in the group chat before running `alembic upgrade head`,
> and make sure teammates pull the generated migration file afterward.

---

## File checklist

| File | Action |
|---|---|
| `backend/app/models/notification.py` | create |
| `backend/app/models/__init__.py` | add one import |
| `backend/app/schemas/notification.py` | create |
| `backend/app/core/notifications.py` | create |
| `backend/app/modules/notifications/__init__.py` | create (empty) |
| `backend/app/modules/notifications/router.py` | create |
| `backend/app/main.py` | add router (coordinate) |
| Social / Gamification / Governance routers | add helper calls |

---

## 1. The model

`backend/app/models/notification.py`

```python
"""
Notification model.

Stores in-app notifications for employees. Every notification belongs to one
employee and is created by the system when a significant event happens:
- a CSR or Challenge participation is approved
- a compliance issue is raised (the owner is notified)
- a compliance issue becomes overdue

Notifications start unread (is_read=False) and are marked read when the
employee views them.
"""

from datetime import datetime

from sqlalchemy import String, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # The employee this notification is addressed to.
    # ForeignKey ties it to the employees table so we never notify a
    # non-existent employee.
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))

    # Short headline shown in the notification list (e.g. "Participation approved")
    title: Mapped[str] = mapped_column(String)

    # Longer body text explaining what happened
    message: Mapped[str] = mapped_column(String)

    # False until the employee opens/reads the notification
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    # When the notification was generated. Defaults to the current UTC time.
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
```

---

## 2. Register the model

`backend/app/models/__init__.py` — add this next to the existing model imports.
This is what makes Alembic *see* the new table when autogenerating the
migration. Miss it and the migration comes out empty.

```python
# ... existing model imports above ...
from app.models.notification import Notification  # noqa: F401
```

---

## 3. The response schema

`backend/app/schemas/notification.py`

```python
"""
Pydantic schemas for notifications.

Only a read schema is needed here because notifications are created by the
system (via the create_notification helper), never directly by a client
request. Clients only ever list and read them.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    # from_attributes lets Pydantic build this straight from a SQLAlchemy row
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime
```

---

## 4. The reusable helper

`backend/app/core/notifications.py`

This is the function every other module calls. Putting it in `core/`
(cross-cutting concerns) keeps it neutral — social, gamification, and governance
can all import it without creating a dependency between those modules.

```python
"""
Notification dispatch helper.

create_notification is the single entry point every module uses to send a
notification. Keeping it in one place means the four call sites (social
approval, challenge approval, compliance issue raised, issue overdue) all
behave identically, and if we later add email sending we only change it here.
"""

from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(db: Session, employee_id: int, title: str, message: str) -> Notification:
    """
    Create and persist a single in-app notification.

    Args:
        db: the active SQLAlchemy session (pass the same one the caller is using)
        employee_id: who the notification is for
        title: short headline
        message: longer body text

    Returns:
        The saved Notification row.

    Note:
        The caller is usually already inside its own db.commit() flow. We commit
        here so the notification is saved even if the caller forgets, and refresh
        so the returned object has its generated id and created_at populated.
    """
    notification = Notification(
        employee_id=employee_id,
        title=title,
        message=message,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
```

---

## 5. The notifications router

`backend/app/modules/notifications/router.py`

Create the package folder with an empty `__init__.py` too. The frontend table
references `GET /notifications/{employee_id}`, so these endpoints back that.

```python
"""
Notification endpoints.

Lets the frontend fetch an employee's notifications and mark them as read.
Notifications are never created through this router - they are created by the
system via app.core.notifications.create_notification.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationRead

router = APIRouter()


@router.get("/{employee_id}", response_model=list[NotificationRead])
def list_notifications(
    employee_id: int,
    unread_only: bool = False,
    db: Session = Depends(get_db),
):
    """
    List notifications for one employee, newest first.
    Pass ?unread_only=true to fetch only unread ones (useful for a badge count).
    """
    query = db.query(Notification).filter(Notification.employee_id == employee_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)  # noqa: E712
    return query.order_by(Notification.created_at.desc()).all()


@router.put("/{notification_id}/read", response_model=NotificationRead)
def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    """Mark a single notification as read."""
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/{employee_id}/read-all")
def mark_all_as_read(employee_id: int, db: Session = Depends(get_db)):
    """Mark every unread notification for an employee as read at once."""
    db.query(Notification).filter(
        Notification.employee_id == employee_id,
        Notification.is_read == False,  # noqa: E712
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
```

---

## 6. Register the router in main.py

`backend/app/main.py` is the shared integration file — don't edit it alone in a
way that clobbers a teammate. Add these two lines next to the existing router
imports / includes.

```python
from app.modules.notifications.router import router as notifications_router

app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["Notifications"])
```

---

## 7. Wire the helper into the four call sites

In each file, import the helper at the top:

```python
from app.core.notifications import create_notification
```

Two of these are in **your** governance router. The other two are in teammates'
files (social and gamification) — hand them the snippet or edit with their OK.

### Governance router — inside `create_compliance_issue`, before the return

```python
    # Notify the assigned owner that they now own a compliance issue.
    create_notification(
        db,
        employee_id=issue.owner_id,
        title="New compliance issue assigned",
        message=f"You have been assigned compliance issue #{issue.id} "
                f"(severity: {issue.severity}), due {issue.due_date.date()}.",
    )
    return issue
```

### Governance router — inside `_flag_overdue_issues`, in the status-flip loop

```python
    for issue in overdue:
        issue.status = "Overdue"
        # Tell the owner their issue has passed its due date.
        create_notification(
            db,
            employee_id=issue.owner_id,
            title="Compliance issue overdue",
            message=f"Compliance issue #{issue.id} is now overdue "
                    f"(was due {issue.due_date.date()}).",
        )
    if overdue:
        db.commit()
```

### Social router — inside `approve_participation`, in the Approved branch (Person 2)

```python
    # After marking the participation approved and awarding points:
    create_notification(
        db,
        employee_id=participation.employee_id,
        title="CSR participation approved",
        message="Your CSR activity participation was approved. Points have been awarded.",
    )
```

### Gamification router — inside `approve_challenge_participation`, Approved branch (Person 2)

```python
    create_notification(
        db,
        employee_id=participation.employee_id,
        title="Challenge participation approved",
        message="Your challenge submission was approved. XP has been awarded.",
    )
```

---

## 8. Run the migration (shared-DB step)

Once the model, the `__init__.py` import, and the files are all in place:

```bash
# Announce in the group chat first - this hits the shared Neon DB
alembic revision --autogenerate -m "add notifications table"
alembic upgrade head
```

Then commit the generated migration file in `alembic/versions/` and tell
everyone to pull it. Verify in the Neon dashboard that a `notifications` table
now exists.

---

## 9. Test it end to end

Through Swagger at `http://127.0.0.1:8000/docs`:

1. Create a compliance issue with an `owner_id` of a real employee.
2. `GET /api/v1/notifications/{that_employee_id}` — you should see the
   "New compliance issue assigned" notification.
3. Create another issue with a **past** `due_date`.
4. `GET /api/v1/governance/compliance-issues` to trigger the overdue flag.
5. Check notifications again — a second "overdue" notification should appear.

This exercises both governance hooks.

---

## Note for the demo

The overdue notification fires only when an issue *transitions* to overdue.
Because the status flips from `Open` to `Overdue` on the first flag call, and the
filter only catches `Open` issues, an issue generates **exactly one** overdue
notification — at the moment it crosses the deadline. It will not re-notify on
later calls. That is correct behaviour; good to be able to explain if asked.
