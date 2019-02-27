#!/usr/bin/env bash

# TODO
echo "TODO need to write this script"
echo "set your environment variables like below, but with your local addresses"
echo "(on Windows: this computer -> properties -> advanced settings -> environment variables -> ...)"
echo "(on Linux: I don\`t know how)"
echo "        - name: ETHEROSCOPEPARITYMAINNET
          value: \"35.230.140.68:8545\"  # this remains same for local work and for work on server !!!!!!
        - name: ETHEROSCOPEGETHHOST
          value: \"10.3.240.197:8545\"
        - name: ETHEROSCOPEMARIADB
          value: \"10.3.240.97:8083\"
        - name: ETHEROSCOPEDATAPOINTSSERVICE
          value: \"35.246.65.214:80\"
        - name: ETHEROSCOPESERVER
          value: \"35.246.120.150:8080\"
        - name: ETHEROSCOPEFRONTEND
          value: \"35.242.161.116:80\"
        - name: ETHEROSCOPEBLOCKCHAIN
          value: \"/blockchain/geth/chaindata\"
          "
export ETHEROSCOPEGETHHOST="localhost:8545"
export ETHEROSCOPEMARIADB="localhost:8083"
export ETHEROSCOPEMICROSERVICE="localhost:8081"
export ETHEROSCOPESERVER="localhost:8082"
export ETHEROSCOPEFRONTEND="localhost:1234"
export ETHEROSCOPEBLOCKCHAIN="/home/marcin/WebstormProjects/etheroscope/geth-blockchains/fastRinkebyBlockchain"
export ETHEROSCOPEPARITYMAINNET="35.230.140.68:8545"

