import json
import os
import shutil

import crossplane


class NginxManager:
    def __init__(self):
        self.nginx_path = "/etc/nginx/"
        self.is_backup_conf = False
        self.nginx_conf_dirs = self._get_nginx_conf_dirs()
        self.nginx_conf_files = self._get_nginx_conf_files()
        if not self._check_nginx_conf_backup_present():
            self._backup_nginx_conf()
    

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
    
    def parse_nginx_conf(self, file_name: str = "nginx.conf"):
        parsed_conf = None
        with open(os.path.join(self.nginx_path, file_name), "r") as f:
            parsed_conf = crossplane.parse(f.read())
        # json to dict
        parsed_conf_dict = json.loads(parsed_conf)
        return parsed_conf_dict
    