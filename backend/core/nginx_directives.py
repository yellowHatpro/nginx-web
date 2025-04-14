# Manages the registry of all directives
class NginxDirective:

    def __init__(self, name, arg=None, blocks=None):
        self.name = name
        self.arg = arg
        self.blocks = blocks
    
    def set_arg(self, arg):
        self.arg = arg
    
    def set_blocks(self, blocks):
        self.blocks = blocks

