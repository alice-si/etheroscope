FROM rabbitmq

# Define environment variables.
ENV RABBITMQ_USER test
ENV RABBITMQ_PASSWORD test

ADD init.sh ./init.sh
EXPOSE 15672

# Define default command
CMD ["/init.sh"]



