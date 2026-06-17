import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Business
import anyio

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_URL or SUPABASE_SERVICE_KEY is not set")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

bearer_scheme = HTTPBearer()

async def get_current_business(
        credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
        db: AsyncSession = Depends(get_db)
        ) -> Business:
    token = credentials.credentials
    try:
        response = await anyio.to_thread.run_sync(supabase.auth.get_user, token)
        if response and response.user.id:
            user_id = response.user.id
        else:
            raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token"
                )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    result = await db.execute(select(Business).where(Business.user_id == user_id))
    business = result.scalar_one_or_none()

    if not business:
        raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Business not found for this user"
                )

    return business
