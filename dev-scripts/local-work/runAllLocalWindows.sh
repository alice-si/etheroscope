#!/usr/bin/env bash

echo "remember to tern on mariadb server" &&\
cd ../../frontend &&\
./startFrontend.sh &\

cd ../../backend &&\
./startBackend.sh



