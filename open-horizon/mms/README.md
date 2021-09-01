# MMS (Modle Management System) build with Node JS

This is a port over of https://github.com/TheMosquito/MMS_Helper repo for Node JS.

A simple Horizon sample edge service that shows how to use a Model Management System (MMS) service with your service.  The idea is to be able to deliver updates to the applications/services that are running on the edge node.  The update could be a new ML model file or a config json file with relevant information for the application to consume and/or take appropriate actions. This project provides a script that consists of all the steps neccessary to build the docker image for the MMS services with all the required environment variables and parameters all the way through registering the agent with Management Hub.  Once the agent is registered with the Management Hub and if all goes well, MMS service will start up and it will periodically check for a new update using the local MMS API (aka ESS) that the Horizon agent provides to services. If an update is available, it will fetch the update and make it available for your applications/services. 

### Note:  Make a copy of env-hzn.json and name it as .env-hzn.json on your local machine and fill in all the required values in the .env-hzn.json file


The deploy.js script will perform the following tasks:
* Build docker image
* Push docker image
* Publish MMS service
* Publish MMS pattern
* Register agent
* Unregister agent
* Publish new updates using MMS



# NPM commands

## npm run register-agent
- Will perform all of the following commands

## npm run builld
- Builds the docker image

## npm run push
- Pushes the docker image to Docker Hub

## npm run publish-service
- Publishes MMS Service 

## npm run publish-pattern
- Publishes MMS Pattern

## npm run agent-run
- Registers agent with Management Hub 

## npm run unregister-agent
- Unregisgers agent

## Publish new/update model
- hzn mms object publish --type=object_detection --id=config.json --object=/demo-model/demo/version1/model.zip --pattern=pattern-pi-mms-service-arm