# NGINX-WEB

## GOAL

The idea is to create a web frontend over the nginx configuration, that can interact with a backend service that provides an easy interface to edit and update different nginx directives. This project can evolve to have more complex architecture, given the requirements and todos, or to nothing given my mood.

## Current Implementation
- I have a basic backend implementation, which parses nginx config, and one read/write the config. Currently using `crossplane` python package to parse conf. More or less, this is working. More to work on frontend, will do ..erm, soon, maybe later, idk. 
