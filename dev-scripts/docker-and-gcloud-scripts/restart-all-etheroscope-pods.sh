# only pods with "etheroscope" phrase in name
echo "only pods with "etheroscope" phrase in name"
pods=$(kubectl get pods | grep etheroscope | awk '{print $1;}' )
for pod in $pods
do
    echo "will exec: kubectl delete pod $pod"
    kubectl delete pod $pod
done
