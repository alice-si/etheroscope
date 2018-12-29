#!/usr/bin/env bash

docker-compose -f ../../dependencies/mariadb/docker-compose.yml up -d &\

cd ../../frontend &&\
./startFrontend.sh &\

cd ../../backend &&\
./startBackend.sh



