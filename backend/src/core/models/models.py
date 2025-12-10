from pydantic import BaseModel
from typing import Optional

class Tenant(BaseModel):
    """ Represents a tenant in a multi-tenant system.

    Attributes:        
        name: Name of the tenant.
        external_id: Optional external identifier to link to an external/3rd party system's code.    
    """    
    name: str
    external_id: Optional[str] = None    

