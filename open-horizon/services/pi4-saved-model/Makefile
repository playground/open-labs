#
# Edit the Makefile variables below as described:
#
# PATTERN_NAME      - a name of your choice for your open-horizon Pattern
# SERVICE_NAME      - a name of your choice for your open-horizon Service
# SERVICE_VERSION   - version (in format N.N.N) for your open-horizon Service
# SERVICE_CONTAINER - your full container ID (registry/repo:version)
# CONTAINER_CREDS   - optional container access creds (registry/repo:user:token)
# ARCH              - an open-horizon architecture (see `hzn architecture`)
#

PATTERN_NAME:="pattern-pi-model-service"
SERVICE_NAME:="pi-model-service"
SERVICE_VERSION:="1.0.9"
SERVICE_CONTAINER:="playbox21/pi-model-service:1.0.9"
CONTAINER_CREDS:=
ARCH:="arm"
MMS_HELPER_SHARED_VOLUME:=demo_model_mms_helper_shared_volume

publish-service: validate-org
	@ARCH=$(ARCH) \
        SERVICE_NAME="$(SERVICE_NAME)" \
        SERVICE_VERSION="$(SERVICE_VERSION)"\
        SERVICE_CONTAINER="$(SERVICE_CONTAINER)" \
	MMS_HELPER_SHARED_VOLUME="$(MMS_HELPER_SHARED_VOLUME)"\
        hzn exchange service publish -O $(CONTAINER_CREDS) -f service.json --pull-image

publish-pattern: validate-org
	@ARCH=$(ARCH) \
        SERVICE_NAME="$(SERVICE_NAME)" \
        SERVICE_VERSION="$(SERVICE_VERSION)"\
        PATTERN_NAME="$(PATTERN_NAME)" \
	hzn exchange pattern publish -f pattern.json

register-pattern: validate-org
	hzn register --pattern "${HZN_ORG_ID}/$(PATTERN_NAME)"

validate-org:
	@if [ -z "${HZN_ORG_ID}" ]; \
          then { echo "***** ERROR: \"HZN_ORG_ID\" is not set!"; exit 1; }; \
          else echo "Using Exchange Org ID: \"${HZN_ORG_ID}\""; \
        fi
	@sleep 1

clean:
	-hzn unregister -f
	-hzn exchange pattern remove -f "${HZN_ORG_ID}/$(PATTERN_NAME)"
	-hzn exchange service remove -f "${HZN_ORG_ID}/$(SERVICE_NAME)_$(SERVICE_VERSION)_$(ARCH)"
	-docker rmi -f "$(SERVICE_CONTAINER)"

.PHONY: publish-service publish-pattern register-pattern validate-org clean

