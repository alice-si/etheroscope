docker build -t etheroscope-micro-service ../../deploy-scripts/dockerfiles/etheroscope-micro-service
docker tag etheroscope-micro-service gcr.io/etheroscope/etheroscope-micro-service
docker push gcr.io/etheroscope/etheroscope-micro-service

