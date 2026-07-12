from pydantic import BaseModel, ConfigDict
from datetime import datetime

class NotificationRead(BaseModel):
    """
    Schema used to serialize the Notification database model into JSON
    when sending it to the frontend client.
    """
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime
