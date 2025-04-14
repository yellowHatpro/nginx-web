# Manages the registry of all directives
class NginxDirective:

    def __init__(self, directive, args=None, block=None):
        self.directive = directive
        self.args = args
        if block == []:
            self.block = None
        else:
            self.block = block
    
    def set_args(self, args):
        self.args = args
    
    def set_block(self, block):
        self.block = block

    def get_dict(self):
        return {
            "directive": self.directive,
            "args": self.args,
            "block": self.block
        }
        

