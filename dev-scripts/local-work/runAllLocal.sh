#!/usr/bin/env bash

# 19.12.2018 18:19

geth --datadir Yourdatadirforgethblockchain --rinkeby --rpc --console --nodiscover &\
docker-compose -f ../../dependencies/mariadb/docker-compose.yml up -d &\
../../frontend/startFrontend.sh &\
../../backend/startBackend.sh



