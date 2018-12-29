# only pods with $1 phrse phrase in name

echo "will delete (update) pods with thirsd argument from command line (\"$1\") phrase in name"

pods=$(kubectl get pods | grep $1 | awk '{print $1;}' )

for pod in $pods
do
    echo "will exec: kubectl delete pod $pod"
    kubectl logs $pod
done

echo "logs print done"
