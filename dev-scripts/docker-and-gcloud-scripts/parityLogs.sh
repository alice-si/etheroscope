parity=$(./parityPodName.sh)
echo $parity
for pod in $parity; do
    kubectl logs $pod
done
