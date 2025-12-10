from motor.motor_asyncio import AsyncIOMotorClient
from datetime import timezone
import certifi

class MongoService:
    def __init__(self, mongo_uri: str | None, mongo_db_name: str | None):
        if not mongo_uri:
            raise ValueError("MongoDB URI must be provided")
        if not mongo_db_name:
            raise ValueError("MongoDB database name must be provided")
        
        self.client = AsyncIOMotorClient(
            mongo_uri,
            tlsCAFile=certifi.where(),
            tz_aware=True,
            tzinfo=timezone.utc
        )
        
        self.db = self.client.get_database(mongo_db_name)

    def get_db(self):
        return self.db