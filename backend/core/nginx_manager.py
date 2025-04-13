import json
import os
import shutil

import crossplane
from core.nginx_directives import NginxDirective

class NginxManager:
    """
    Manages Nginx configurations, including backup, parsing, and saving.
    - Not production ready, just for development purposes
    """
    def __init__(self):
        self.nginx_path = "/etc/nginx/"
        self.is_backup_conf = False
        self.nginx_conf_dirs = self._get_nginx_conf_dirs()
        self.nginx_conf_files = self._get_nginx_conf_files()
        self.nginx_conf_tree = {}
        self.main_directives = {}
        

        if not self._check_nginx_conf_backup_present():
            self._backup_nginx_conf()
        self._parse_nginx_conf()
        self._init_main_directives()

        print("Nginx Manager initialized \nnginx_path: ", self.nginx_path, "\nnginx_conf_dirs: ", self.nginx_conf_dirs, "\nnginx_conf_files: ", self.nginx_conf_files, "\nis_backup_conf: ", self.is_backup_conf)
    

    def _get_nginx_conf_dirs(self) -> list:
        self.nginx_conf_dirs = []
        for file in os.listdir(self.nginx_path):
            if os.path.isdir(os.path.join(self.nginx_path, file)):
                self.nginx_conf_dirs.append(file)
        return self.nginx_conf_dirs
    
    def _get_nginx_conf_files(self) -> list:
        self.nginx_conf_files = []
        for file in os.listdir(self.nginx_path):
            if os.path.isfile(os.path.join(self.nginx_path, file)):
                self.nginx_conf_files.append(file)
        return self.nginx_conf_files
    
    def _check_nginx_conf_backup_present(self) -> bool:
        for file in self.nginx_conf_files:
            if file.endswith(".conf.backup"):
                self.is_backup_conf = True
                break
        return self.is_backup_conf
    
    def _backup_nginx_conf(self) -> None:
        for file in self.nginx_conf_files:
            if file.endswith("nginx.conf"):
                shutil.copy(os.path.join(self.nginx_path, file), os.path.join(self.nginx_path, file + ".backup"))
    
    
    def save_nginx_conf(self, new_conf_data: dict, file_name: str = "nginx.conf"):
        # dict to json
        new_conf_json = json.dumps(new_conf_data, indent=4)
        updated_nginx_conf = crossplane.build(new_conf_json)
        # write to file
        with open(os.path.join(self.nginx_path, file_name), "w") as f:
            f.write(updated_nginx_conf)
    
    def _parse_nginx_conf(self, file_name: str = "nginx.conf"):
        file_path = os.path.join(self.nginx_path, file_name)
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File {file_name} not found in {self.nginx_path}")
        self.nginx_conf_tree = crossplane.parse(file_path)
    
    def get_nginx_conf_tree(self):
        return self.nginx_conf_tree
    
    def _parse_directive_block(self, block_data):
        """Recursively parse directive blocks and their nested directives."""
        # base case
        if not block_data:
            return []
        
        parsed_blocks = []
        for item in block_data:
            directive_class = NginxDirective.get_directive_class(item["directive"])
            if directive_class:
                # Recursively parse nested blocks
                nested_blocks = self._parse_directive_block(item.get("block", []))
                directive_instance = directive_class(
                    arg=item.get("args", []),
                    blocks=nested_blocks
                )
                parsed_blocks.append(directive_instance)
        return parsed_blocks

    def _init_main_directives(self):
        nginx_conf:list = list(self.nginx_conf_tree["config"])
        nginx_conf_directives = next((x for x in nginx_conf if x["file"] == "/etc/nginx/nginx.conf"), None)
        if "parsed" not in nginx_conf_directives:
            raise Exception("No directives found in nginx.conf")
        directives = {}
        for directive in nginx_conf_directives["parsed"]:
            directive_class = NginxDirective.get_directive_class(directive["directive"])
            if directive_class:
                # Parse nested blocks recursively
                parsed_blocks = self._parse_directive_block(directive.get("block", []))
                directives[directive["directive"]] = directive_class(
                    arg=directive.get("args", []),
                    blocks=parsed_blocks
                )
        self.main_directives = directives
        return directives
    
    def get_main_directives(self):
        return self.main_directives

        