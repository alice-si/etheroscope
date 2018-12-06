# only pods with $1 phrse phrase in name

echo "will delete (update) pods with thirsd argument from command line (\"$1\") phrase in name"

pods=$(kubectl get pods | grep $1 | awk '{print $1;}' )

for pod in $pods
do
    echo "will exec: kubectl delete pod $pod"
    kubectl delete pod $pod
done

echo "deleteing done"


if [ $1 == "micro" ]
then
	echo "will sleep 10 seconds"
	sleep 10
	echo "woke up"

	micro_pods=$(kubectl get pods | grep $1 | grep micro-service | awk '{print $1;}' )

	for pod in $micro_pods
	do
	    echo "you are deleteing micro-service pod will exec: kubectl delete pod $pod"
	    kubectl delete pod $pod
	done
fi
