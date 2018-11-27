docker build -t etheroscope-mysql-initiator ../../deploy-scripts/dockerfiles/etheroscope-mysql-initiator
docker tag etheroscope-mysql-initiator gcr.io/etheroscope/etheroscope-mysql-initiator
docker push gcr.io/etheroscope/etheroscope-mysql-initiator

