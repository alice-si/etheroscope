# only pods with $1 phrse phrase in name
# echo "Full names of pods with (\"$1\") phrase in name"

kubectl get pods | grep $1 | awk '{print $1;}'