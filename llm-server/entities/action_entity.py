from typing import Optional, Dict
from pydantic import BaseModel

from entities.flow_entity import generate_operation_id_from_name


class ActionDTO(BaseModel):
    bot_id: str
    name: str
    api_endpoint: str
    request_type: str
    description: Optional[str]
    operation_id: Optional[str] = None  # Set as None initially
    payload: Dict = {}

    # Additional Pydantic configuration
    class Config:
        extra = "allow"

    def __init__(self, **data):
        super().__init__(**data)
        # Generate and assign operation_id if name is provided
        if self.name and not self.operation_id:
            self.operation_id = generate_operation_id_from_name(self.name)
