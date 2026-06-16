from fastapi import Depends, FastAPI

from app.dependencies.auth import get_current_business
from app.models.business import Business

from app.routers.business import router as business_router

app = FastAPI(title='Comanda API')

app.include_router(business_router)

@app.get('/health')
async def healt():
    return {'status': 'ok'}

@app.get('/test-auth')
async def test_auth(business: Business = Depends(get_current_business)):
    return {
        "message": "Auth working",
        "business_id": business.id,
        "business_name": business.name,
        "business_user_id": business.user_id
    }
