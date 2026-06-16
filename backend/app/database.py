from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv
from typing import AsyncGenerator
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env")

assert DATABASE_URL is not None

class Base(DeclarativeBase):
    pass

def get_engine():
    return create_async_engine(DATABASE_URL, echo=True)

def get_session_maker():
    return async_sessionmaker(get_engine(), expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
