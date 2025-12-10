import os
import httpx
from typing import Dict, Any

class TurnstileService:
    """Service for verifying Cloudflare Turnstile tokens"""
    
    def __init__(self):
        self.secret_key = os.getenv("TURNSTILE_SECRET_KEY")
        self.verify_url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    
    async def verify_token(self, token: str, remote_ip: str) -> Dict[str, Any]:
        """
        Verify a Turnstile token with Cloudflare
        
        Args:
            token: The Turnstile token from the frontend
            remote_ip: Optional client IP address
            
        Returns:
            Dict containing verification result
        """
        if not self.secret_key:
            raise ValueError("TURNSTILE_SECRET_KEY environment variable not set")
        
        data = {
            "secret": self.secret_key,
            "response": token
        }
        
        if remote_ip:
            data["remoteip"] = remote_ip
        
        # This is the critical Siteverify API call that Cloudflare requires
        async with httpx.AsyncClient() as client:
            response = await client.post(self.verify_url, data=data)
            response.raise_for_status()
            return response.json()
    
    async def is_token_valid(self, token: str, remote_ip: str) -> bool:
        """
        Check if a Turnstile token is valid
        
        Args:
            token: The Turnstile token from the frontend
            remote_ip: Optional client IP address
            
        Returns:
            True if token is valid, False otherwise
        """
        try:
            result = await self.verify_token(token, remote_ip)
            return result.get("success", False)
        except Exception:
            return False
