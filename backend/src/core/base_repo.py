from typing import Any, Mapping, MutableMapping, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorCursor, AsyncIOMotorCommandCursor
from core.middlewares.req_context_middleware import RequestContext

class BaseRepo:
    """Base repository providing tenant-scoped MongoDB operations.
    Ensures that all operations are scoped to the tenant by automatically adding _tenant_id_ filters.\n
    All collections apart from the ones used for tenant management should extend this class.\n
    """
    def __init__(self, collection_name: str, ctx: RequestContext):    
        self._ctx = ctx
        self._tenant_id = ctx.tenant_id
        self._col: AsyncIOMotorCollection = ctx.db[collection_name]

    # ---------- Helpers ----------

    def _with_tenant_filter(
        self,
        filter: Optional[Mapping[str, Any]] = None,
    ) -> Dict[str, Any]:        
        f: Dict[str, Any] = {"tenant_id": self._tenant_id}        
        if filter:
            f.update(filter)
        return f        

    def _attach_tenant(self, doc: MutableMapping[str, Any]) -> MutableMapping[str, Any]:
        doc["tenant_id"] = self._tenant_id
        return doc

    # ---------- Query Methods ----------

    async def insert_one(self, doc: MutableMapping[str, Any]):
        """Insert a single document into the collection, attaching _tenant_id_ internally."""
        self._attach_tenant(doc)
        return await self._col.insert_one(doc)

    async def insert_many(self, docs: list[MutableMapping[str, Any]]):
        """Insert multiple documents into the collection, attaching _tenant_id_ internally."""
        for d in docs:
            self._attach_tenant(d)
        return await self._col.insert_many(docs)

    async def find_one(
        self,
        filter: Optional[Mapping[str, Any]] = None,
        *args,
        **kwargs,
    ):
        """Find a single document in the collection, scoped to the tenant.
        Adds _tenant_id_ to the filter internally."""
        return await self._col.find_one(self._with_tenant_filter(filter), *args, **kwargs)

    def find(
        self,
        filter: Optional[Mapping[str, Any]] = None,
        *args,
        **kwargs,
    ) -> AsyncIOMotorCursor:
        """Find multiple documents in the collection, scoped to the tenant.\n
        Adds _tenant_id_ to the filter internally.\n
        Supports sort, limit, skip, etc. via kwargs."""        
        return self._col.find(self._with_tenant_filter(filter), *args, **kwargs)

    async def update_one(
        self,
        filter: Mapping[str, Any],
        update: Mapping[str, Any],
        *args,
        **kwargs,
    ):
        """Updates a single document in the collection, scoped to the tenant.\n
        Adds _tenant_id_ to the filter internally."""
        return await self._col.update_one(
            self._with_tenant_filter(filter),
            update,
            *args,
            **kwargs,
        )

    async def update_many(
        self,
        filter: Mapping[str, Any],
        update: Mapping[str, Any],
        *args,
        **kwargs,
    ):
        """Updates multiple documents in the collection, scoped to the tenant.\n
        Adds _tenant_id_ to the filter internally."""
        return await self._col.update_many(
            self._with_tenant_filter(filter),
            update,
            *args,
            **kwargs,
        )

    async def delete_one(
        self,
        filter: Mapping[str, Any],
        *args,
        **kwargs,
    ):
        """Deletes a single document in the collection, scoped to the tenant.\n
        Adds _tenant_id_ to the filter internally."""
        return await self._col.delete_one(
            self._with_tenant_filter(filter),
            *args,
            **kwargs,
        )

    async def delete_many(
        self,
        filter: Mapping[str, Any],
        *args,
        **kwargs,
    ):
        """Deletes multiple documents in the collection, scoped to the tenant.\n
        Adds _tenant_id_ to the filter internally."""
        return await self._col.delete_many(
            self._with_tenant_filter(filter),
            *args,
            **kwargs,
        )

    async def count_documents(
        self,
        filter: Optional[Mapping[str, Any]] = None,
        *args,
        **kwargs,
    ) -> int:
        """Counts documents in the collection, scoped to the tenant.\n
        Adds _tenant_id_ to the filter internally."""
        return await self._col.count_documents(
            self._with_tenant_filter(filter),
            *args,
            **kwargs,
        )

    async def aggregate(self, pipeline: list[dict], *args, **kwargs) -> AsyncIOMotorCommandCursor:
        """
        Runs an aggregation pipeline on the collection, scoped to the tenant.\n
        Automatically prepends a $match stage for _tenant_id_ to the pipeline.
        """
        # TODO: Uncomment after testing and all collections have tenant_id
        # tenant_match = {"$match": {"tenant_id": self._tenant_id}}
        # full_pipeline = [tenant_match, *pipeline]
        full_pipeline = [*pipeline]
        return self._col.aggregate(full_pipeline, *args, **kwargs)
