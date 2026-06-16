import sys
import os 
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

@pytest.fixture(scope="session")
def event_loop_policy():
    import asyncio
    return asyncio.DefaultEventLoopPolicy()
