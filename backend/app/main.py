from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.dependencies.auth import get_current_business
from app.models.business import Business

from app.routers.business import router as business_router
from app.routers.product import router as product_router
from app.routers.item import router as item_router
from app.routers.restock import router as restock_router
from app.routers.customer import router as customer_router
from app.routers.order import router as order_router 

app = FastAPI(title='Comanda API')

origins = [
    "http://localhost:5173",
    "https://la-comanda-manager.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(business_router)
app.include_router(product_router)
app.include_router(item_router)
app.include_router(restock_router)
app.include_router(customer_router)
app.include_router(order_router)

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
