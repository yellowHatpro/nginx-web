from fastapi import FastAPI
import uvicorn

from routes import nginx_routes

app = FastAPI()

app.include_router(nginx_routes.nginx_router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)