FROM rabbitmq

# Define environment variables.
ENV RABBITMQ_USER test
ENV RABBITMQ_PASSWORD test

WORKDIR /etc/rabbitmq/rabbitmq.conf
ADD init.sh /init.sh
EXPOSE 15672


# Copy config file
COPY rabbitmq.conf ./rabbitmq.conf



