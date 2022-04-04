#! /home/xs943721/miniconda3/envs/typspace/bin/python
from wsgiref.handlers import CGIHandler
from helloFlask import app
CGIHandler().run(app)