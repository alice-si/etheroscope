docker rmi -f $(docker images --all | awk 'NR>1{print $3;}' | head -n -1 | tr '\n' ' ')