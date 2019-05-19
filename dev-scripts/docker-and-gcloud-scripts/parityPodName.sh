kubectl get pods > temp_pods;
awk '/parity/ {print $1}' temp_pods;
rm temp_pods
