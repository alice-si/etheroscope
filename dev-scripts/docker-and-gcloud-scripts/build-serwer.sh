docker build -t etheroscope-serwer ../../deploy-scripts/dockerfiles/etheroscope-serwer
docker tag etheroscope-serwer gcr.io/etheroscope/etheroscope-serwer
docker push gcr.io/etheroscope/etheroscope-serwer

