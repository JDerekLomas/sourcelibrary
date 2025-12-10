from dataclasses import dataclass
from typing import Optional, List
from core.models.primitives_model import RoleName
from cell.services.cell_manager import Cell

@dataclass
class RequestContext:
    tenant_id: str
    tenant_slug: str
    tenant_name: str
    tenant_permissions: dict[str, dict]  # role -> {resource_type: [action_type]}
    cell: Cell    
    user_id: Optional[str]
    user_roles: List[RoleName]

    db = property(lambda self: self.cell.mongo_service.get_db())
    s3 = property(lambda self: self.cell.s3_service)