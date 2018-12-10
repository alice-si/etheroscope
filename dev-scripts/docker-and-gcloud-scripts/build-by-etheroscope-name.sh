# Will build docker file with name etheroscope-$1
echo "Will build and push to gcr.io repo docker with name: etheroscope-"first comandline argument" (current: etheroscope-$1)"
if [ $1 = "frontend" ]
then
    docker build -t etheroscope-$1 ../../$1
else
    docker build -t etheroscope-$1 ../../backend/$1
fi
docker tag etheroscope-$1 gcr.io/etheroscope/etheroscope-$1
docker push gcr.io/etheroscope/etheroscope-$1

