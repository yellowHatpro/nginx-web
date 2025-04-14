from fastapi import APIRouter, Depends

from core.nginx_manager import NginxManager
from dependencies import get_nginx_manager

nginx_router = APIRouter(prefix="/nginx")

@nginx_router.get("/conf")
def get_nginx_conf(nginx_manager : NginxManager = Depends(get_nginx_manager)):
    return nginx_manager.get_nginx_conf_tree()

@nginx_router.post("/conf")
def update_nginx_conf(nginx_manager : NginxManager = Depends(get_nginx_manager)):
    nginx_manager.save_nginx_conf()
    return {"message": "Nginx configuration updated"}

@nginx_router.get("/directives")
def get_nginx_directives(nginx_manager : NginxManager = Depends(get_nginx_manager)):
    return nginx_manager.get_main_directives()