from fastapi import APIRouter, Query, Response, HTTPException
import httpx

router = APIRouter()

@router.get("/")
async def image_proxy(url: str = Query(...)):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Image not found")
            content_type = resp.headers.get("content-type", "image/jpeg")
            return Response(
                content=resp.content,
                media_type=content_type,
                headers={"Access-Control-Allow-Origin": "*"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching image: {e}")

@router.head("/")
async def image_proxy_head(url: str = Query(...)):
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.head(url)
            if resp.status_code != 200:
                raise HTTPException(status_code=404, detail="Image not found")
            content_type = resp.headers.get("content-type", "image/jpeg")
            return Response(
                status_code=200,
                media_type=content_type,
                headers={"Access-Control-Allow-Origin": "*"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching image: {e}")