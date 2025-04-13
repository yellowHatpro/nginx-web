from fastapi import FastAPI
from core.nginx_manager import NginxManager

def init_app():
    nginx_manager = NginxManager()
    app = FastAPI()
    


if __name__ == "__main__":
    init_app()
