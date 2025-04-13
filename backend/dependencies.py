from core.nginx_manager import NginxManager

nginx_manager = NginxManager()

# Dependency function to get the nginx_manager instance
def get_nginx_manager() -> NginxManager:
    return nginx_manager 