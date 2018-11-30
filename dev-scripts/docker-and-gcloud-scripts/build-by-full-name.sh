# Will build docker file with name $1
echo "Will build and push to gcr.io repo docker with name: "first comandline argument" (current: $1)"
docker build -t $1 ../../deploy-scripts/dockerfiles/$1
docker tag $1 gcr.io/etheroscope/$1
docker push gcr.io/etheroscope/$1

