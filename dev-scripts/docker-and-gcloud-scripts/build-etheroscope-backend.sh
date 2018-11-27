docker build -t etheroscope-backend ../../deploy-scripts/dockerfiles/etheroscope-backend
docker tag etheroscope-backend gcr.io/etheroscope/etheroscope-backend
docker push gcr.io/etheroscope/etheroscope-backend

