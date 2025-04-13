from abc import ABC
from enum import Enum

class NginxContext(Enum):
    MAIN = "main"
    HTTP = "http"
    SERVER = "server"
    LOCATION = "location"
    EVENTS = "events"
    # TODO: Add more contexts

    @staticmethod
    def all():
        return [e for e in NginxContext if e != NginxContext.all]
        

class NginxDirective(ABC):
    """ Contains main context directives.

    """
    _directive_classes = {}

    def __init__(self, name, arg=None, blocks=None, context=None):
        self.name = name
        self.arg = arg
        self.blocks = blocks
        self.context = context

    def __init_subclass__(cls, **kwargs):
        """Automatically register all subclasses."""
        super().__init_subclass__(**kwargs)
        # Convert class name to snake_case for directive name
        name = cls.__name__
        directive_name = name[0].lower()
        for char in name[1:]:
            if char.isupper():
                directive_name += '_' + char.lower()
            else:
                directive_name += char
        NginxDirective._directive_classes[directive_name] = cls

    
    def __str__(self):
        block_names = [block.name for block in self.blocks]
        return f"[{self.context}] {self.name} {self.arg} {block_names}"

    @classmethod
    def get_directive_class(cls, directive_name: str) -> 'NginxDirective':
        """Returns the appropriate directive class based on the directive name."""
        return cls._directive_classes.get(directive_name)

class Events(NginxDirective):
    def __init__(self, arg=None, blocks=None):
        super().__init__("events", arg, blocks, NginxContext.MAIN)

class WorkerProcesses(NginxDirective):
    def __init__(self, arg=None, blocks=None):
        super().__init__("worker_processes", arg, blocks, NginxContext.MAIN)

class Http(NginxDirective):
    def __init__(self, arg=None, blocks=None):
        super().__init__("http", arg, blocks, NginxContext.MAIN)

class Server(NginxDirective):
    def __init__(self, arg=None, blocks=None):
        super().__init__("server", arg, blocks, NginxContext.HTTP)

class Location(NginxDirective):
    def __init__(self, arg=None, blocks=None):
        super().__init__("location", arg, blocks, NginxContext.SERVER)

class WorkerConnections(NginxDirective):
    def __init__(self, arg=None, blocks=None):
        super().__init__("worker_connections", arg, blocks, NginxContext.EVENTS)
