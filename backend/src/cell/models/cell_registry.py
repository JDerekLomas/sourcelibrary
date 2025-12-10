import os, re
from pydantic import BaseModel, field_validator
from enum import StrEnum

class CellID(StrEnum):
    CELL_DEFAULT = "cell-default"
    CELL_EU = "cell-eu"
    

class CellConfig(BaseModel):
    cell_id: str
    mongo_uri: str | None
    mongo_db_name: str | None
    s3_access_key: str | None
    s3_secret_key: str | None
    s3_bucket: str | None
    s3_region: str | None

    @field_validator("cell_id")
    @classmethod
    def validate_id(cls, value):
        id_pattern = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
        if not id_pattern.match(value):
            raise ValueError("Invalid cell ID format")
        return value

def _get_cell_config(cell_id: str) -> CellConfig:
    suffix = cell_id.replace("-", "_").upper()
    return CellConfig(
        cell_id=cell_id,
        mongo_uri=os.getenv(f"MONGO_URI_{suffix}"),
        mongo_db_name=os.getenv(f"MONGO_DB_{suffix}"),
        s3_access_key=os.getenv("AWS_ACCESS_KEY_ID"),
        s3_secret_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        s3_bucket=os.getenv(f"S3_BUCKET_{suffix}"),
        s3_region=os.getenv(f"S3_REGION_{suffix}")
    )

CELL_REGISTRY = {
    CellID.CELL_DEFAULT: _get_cell_config("cell-default"),
}