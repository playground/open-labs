# IEAM / Open Horizon Toolkit
Open Horizon toolkit help streamline the process of preparing node agents and perform tasks between orgs environments. 

Build-bundle will generate two executables under lib directory
  - lib/mms-deploy  
  - lib/service-deploy

### This toolkit comes with the following convenient commnands 

  - build: compiles typescript source files
  - bundle: generate executables
  - build-bundle: compile & bundle
  - build-image: builds MMS docker image
  - push-image: push MMS docker image
  - publish-service: publish MMS service
  - publish-pattern: publish MMS pattern
  - agent-run: register agent
  - register-agent: single command will perform the above tasks sequentially
  - publish-object: publish update object file via MMS
  - unregister-agent: unregister agent
  - show-horizon-info: display Horizon Info on device
  - update-horizon-info: prompt to update Horizon Info for device
  - list-service: list available services or list service by name and by org
  - list-pattern: list available patterns or list pattern by name and by org
  - list-node: list available nodes or list node by name and by org
  - list-object: list available MMS object files and by org
  - create-hzn-key: generate Horizon Keys
  - list-deployment-policy: list available deployment policies or list policy by name and by org
  - check-config-state: check node config state 
  - list-node-pattern: list node patterns or list node pattern by name
  - get-device-arch: get device architecture
  - test: simple toolkit test 

### Note:  Make a copy of env-hzn.json and name it as .env-hzn.json on your local machine and fill in all the required values in the .env-hzn.json file


## NPM command examples

### npm run list-deployment-policy --env=demo --name=demo/policy-ibm.cpu2evtstreams_1.4.3
- To list deployment policy by name and by organization

### npm run register-agent
- Will perform all of the following commands

### npm run builld
- Builds the docker image

### npm run push
- Pushes the docker image to Docker Hub

### npm run publish-service
- Publishes MMS Service 

### npm run publish-pattern
- Publishes MMS Pattern

### npm run agent-run
- Registers agent with Management Hub 

### npm run unregister-agent
- Unregisgers agent

### Publish new/update model
- hzn mms object publish --type=object_detection --id=config.json --object=/demo-model/demo/version1/model.zip --pattern=pattern-pi-mms-service-arm
