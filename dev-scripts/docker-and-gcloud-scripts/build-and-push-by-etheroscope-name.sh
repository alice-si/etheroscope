# Will build docker file with name etheroscope-$1
echo "Will build and push to gcr.io repo docker with name: etheroscope-"first comandline argument" (current: etheroscope-$1)"
if [ $1 = "frontend" ]
then
    docker build -t etheroscope-$1 ../../$1
elif [ "$1" = "server" ]
then
    docker build -t etheroscope-$1 ../../backend/ --target serverEtheroscope
elif [ $1 = "micro-service" ]
then
    docker build -t etheroscope-$1 ../../backend/ --target microServiceEtheroscope
elif [ $1 = "database-initiator" ]
then
    docker build -t etheroscope-$1 ../../backend/ --target databaseInitiatorEtheroscope

elif [ $1 = "process-contract-service" ]
then
    docker build -t etheroscope-$1 ../../backend/ --target processContractService
elif [ $1 = "rabbitmq" ]
then
    docker build -t rabbitmq_test_user ../../dependencies/rabbitmq/
    docker tag rabbitmq_test_user gcr.io/etheroscope/rabbitmq_test_user
    docker push gcr.io/etheroscope/rabbitmq_test_user
    echo "script done"
    exit 0
else
    echo "docker image unrecognized, got: $1"
    exit 1
fi

docker tag etheroscope-$1 gcr.io/etheroscope/etheroscope-$1
docker push gcr.io/etheroscope/etheroscope-$1
echo "script done"
exit 0

