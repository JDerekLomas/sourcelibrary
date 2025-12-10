from functools import lru_cache

from cell.services.mongo_service import MongoService

from cell.models.cell_registry import CellConfig, CELL_REGISTRY, CellID

class Cell:
    def __init__(self, config: CellConfig):
        self.config = config
        
        self.mongo_service = MongoService(
            mongo_uri=config.mongo_uri,
            mongo_db_name=config.mongo_db_name
        )

@lru_cache()
def get_cell(cell_id: CellID) -> Cell:
    config = CELL_REGISTRY.get(cell_id)
    if not config:
        raise ValueError(f"Cell with ID '{cell_id}' not found in registry")
    return Cell(config)