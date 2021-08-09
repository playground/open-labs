# IBM Cloud Functions
Set up local environment

### 
Install ibmcloud cli - https://cloud.ibm.com/docs/cli?topic=cloud-cli-getting-started

### Install wskdeploy
brew install wskdeploy

### ibmcloud plugins
ibmcloud plugin repo-plugins -r "IBM Cloud"
ibmcloud plugin install cloud-functions

ibmcloud plugin list
Plugin Name                            Version   Status             Private endpoints supported   
cloud-functions/wsk/functions/fn       1.0.49    Update Available   false   
cloud-object-storage                   1.2.1     Update Available   false   
container-registry                     0.1.497   Update Available   false   
sdk-gen                                0.1.12                       false   


### Token expired
delete /Users/<username>/.wskprops then run "ibmcloud fn package list"

### Environment variables for COS
Make a copy of env-example, rename it to .env-local and fill in the values for each environment as needed

### Demo Cloud Functions
demo-action in demo folder provides examples of GET, POST and interacting with COS Buckets. 