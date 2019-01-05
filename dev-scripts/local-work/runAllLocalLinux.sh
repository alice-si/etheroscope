#!/usr/bin/env bash

if [[ "$#" -ne 1 ]]; then
    echo "usage: ./runLocalLinux.sh <geth directory>"
    exit 1
fi

export ETHEROSCOPEGETHHOST="localhost:8545"
export ETHEROSCOPEMARIADB="localhost:8083"
export ETHEROSCOPEMICROSERVICE="localhost:8081"
export ETHEROSCOPESERVER="localhost:8082"
export ETHEROSCOPEFRONTEND="localhost:1234"
export ETHEROSCOPEBLOCKCHAIN=$1
export ETHEROSCOPEPARITYMAINNET="35.230.140.68:8545"

docker-compose -f ../../dependencies/mariadb/docker-compose.yml up -d &\

cd ../../frontend &&\
./startFrontend.sh &\

cd ../../backend &&\
./startBackend.sh



