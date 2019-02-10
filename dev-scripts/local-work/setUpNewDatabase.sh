#!/usr/bin/env bash

sudo docker-compose -f ../../dependencies/mariadb/docker-compose.yml up -d &\

cd ../../backend/database-initiator &&\
node setupNewDatabase.js
