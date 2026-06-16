from fastapi import FastAPI

app = FastAPI(title='Comanda API')

@app.get('/health')
async def healt():
    return {'status': 'ok'}
