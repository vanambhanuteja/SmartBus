# Used for the cloud (ACI) deployment, where bind-mounting the SQL files is not possible.
# Local docker compose mounts the same files instead of building this image.
FROM postgres:16-alpine
COPY 01_schema.sql 02_seed.sql /docker-entrypoint-initdb.d/
