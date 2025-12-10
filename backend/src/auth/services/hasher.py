import os
from argon2 import PasswordHasher
from hashlib import sha256
import hmac


PEPPER = os.getenv("PASSWORD_PEPPER")

pepper_warning: str = """WARNING: PEPPER environment variable is not set.
Without the pepper, CAN'T VERIFY the passwords.
Don't lose or rotate it without re-hashing all passwords!"""

pw_hasher = PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2)

def _pepper_and_hash(plain_password: str, pepper: str) -> str:    
    """ Combines the plain password with a pepper using HMAC-SHA256. 
    HMAC: Hash-based Message Authentication Code. """
    peppered_pw = hmac.new(
        key=pepper.encode(),
        msg=plain_password.encode(),
        digestmod=sha256
    )
    return peppered_pw.hexdigest()

def hash_password(plain_password: str) -> str:
    """ Hashes the password using Argon2 with an additional pepper for security.
    By default uses it's own random salt."""
    
    if not PEPPER:
        raise ValueError(pepper_warning)
    
    peppered_hash = _pepper_and_hash(plain_password, PEPPER)
    return pw_hasher.hash(peppered_hash)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ Verifies the password against the stored hash using Argon2 and pepper. """
    
    if not PEPPER:
        raise ValueError(pepper_warning)
    
    peppered_hash = _pepper_and_hash(plain_password, PEPPER)
    try:
        return pw_hasher.verify(hashed_password, peppered_hash)
    except:
        return False