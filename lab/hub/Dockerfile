# HVR Hub is only officially supported on Linux and Windows (never macOS), so on a Mac we run it
# inside a Linux container. HVR's Linux binaries target glibc 2.28+ (RHEL 8+/SUSE 15+ class) —
# Debian 12 ships glibc 2.36, so it's a safe base. This is NOT a documented-supported deployment
# path; treat it as "should work, unofficial" and watch for missing OS-level prerequisites.
FROM debian:12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tar gzip \
    perl libio-socket-ssl-perl \
    postgresql-client \
    procps \
    curl \
  && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash hvr
USER hvr
WORKDIR /home/hvr

ENV HVR_HOME=/home/hvr/hvr_home
ENV HVR_CONFIG=/home/hvr/hvr_config
ENV HVR_TMP=/home/hvr/hvr_tmp
ENV PATH="${HVR_HOME}/bin:${PATH}"

COPY --chown=hvr:hvr entrypoint.sh /home/hvr/entrypoint.sh
RUN chmod +x /home/hvr/entrypoint.sh

EXPOSE 4340
ENTRYPOINT ["/home/hvr/entrypoint.sh"]
