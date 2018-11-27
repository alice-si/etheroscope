docker build -t etheroscope-frontend ../../deploy-scripts/dockerfiles/etheroscope-frontend
docker tag etheroscope-frontend gcr.io/etheroscope/etheroscope-frontend
docker push gcr.io/etheroscope/etheroscope-frontend

