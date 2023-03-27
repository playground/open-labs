# IBM Code Engine for IEAM Service
Set up local environment

## Create IBM Cloud account
https://www.ibm.com/cloud

## Install ibmcloud CLI
https://cloud.ibm.com/docs/cli?topic=cloud-cli-getting-started

## Local environment setup
### ibmcloud plugins
- ibmcloud plugin repo-plugins -r "IBM Cloud"
- ibmcloud plugin install code-engine container-registry

### Show list of plugins installed 
- ibmcloud plugin list
```
Plugin Name                         Version   Status             Private endpoints supported
cloud-object-storage                1.6.0                        false
code-engine[ce]                     1.42.0    Update Available   true
container-registry[cr]              1.0.6                        true
```

### Login
- ibmcloud login --sso
- ibmcloud target -g Default
- ibmcloud ce project create --name ieam
- ibmcloud cr region-set us-south
- ibmcloud cr namespace-add jeff-lu

### Once your local environment is setup, subsequent login can be done with
- npm run ibm-login

### Create region policy with role for resource in order to be able to push images to container registry
- ibmcloud iam user-policy-create ljeff@us.ibm.com --service-name container-registry --region us-east --roles Administrator --resource-type namespace --resource ieam

## Development
- npm install
- Make a copy of env-example.json and it to .env-local.json and fill in the values for each environment as needed
- npm run watch:start - will run service locally and hot reload when there are code changes
