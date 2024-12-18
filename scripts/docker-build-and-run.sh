docker build --no-cache -t ccs . && \
docker run -d -p $CCS_PORT:$CCS_PORT --name ccs --restart always \
-e CCS_PORT=$CCS_PORT \
-e CCS_ENABLE_SWAGGER=$CCS_ENABLE_SWAGGER \
-e CCS_ALLOWED_REST_ORIGINS=$CCS_ALLOWED_REST_ORIGINS \
-e CCS_ACCEPT_UNKNOWN_ORIGINS=$CCS_ACCEPT_UNKNOWN_ORIGINS \
-e CCS_VERBOSE_REQUESTS_LOGGING=$CCS_VERBOSE_REQUESTS_LOGGING \
ccs:latest