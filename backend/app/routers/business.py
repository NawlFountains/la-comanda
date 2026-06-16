from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Business
from app.schemas.business import BusinessCreate, BusinessResponse
from app.dependencies.auth import get_current_business, supabase
import uuid

router = APIRouter(prefix="/businesses", tags=["businesses"])

bearer_scheme = HTTPBearer()

@router.post("", response_model=BusinessResponse, status_code=201)
async def create_business(
        data: BusinessCreate,
        credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
        db: AsyncSession = Depends(get_db)
):
        token = credentials.credentials
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token"
                    )
        user_id = response.user.id

        business = Business(
                id=uuid.uuid4(),
                user_id=uuid.UUID(user_id),
                **data.model_dump()
                )
        db.add(business)
        await db.commit()
        await db.refresh(business)
        return business

@router.get("/me", response_model=BusinessResponse)
async def get_me(
        business: Business = Depends(get_current_business)
):
        return business
