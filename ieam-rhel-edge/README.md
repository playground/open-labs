# Edge Computing, Setup IEAM to run on RHEL for Edge

  * Install RHEL 8.4 in a vm(edge-server), use ImageBuilder to build the initial rhel-edge-commit 
    * Download rhel-edge-commit tar file 
    * Tar –xvf rhel-edge-commit tar 
    * Create Dockerfile and kickstart(edge.ks) file (NOTE: available in setup folder)
    * Build docker image 
    * podman run --name rhel-edge-ieam -d -p 8080:80 rhel-edge-ieam 

  * In a second vm(edge-node) RHEL 8.4
    * Boot up with rhel for the first time, specify inst-ks=<ip-to-edge-server>:8080/edge.ks 
    * Install complete, reboot 

  * Since Podman is included in the base OS and ImageBuilder does provide a way to remove podman packages nor does it provide docker packages, we will have run the following commands to remove podman packages and install docker
  (NOTE:  rpm packages are in setup folder) 
    * rpm-ostree override remove runc podman containers-common podman-catatonit skopeo 
    * rpm-ostree install containerd.io-1.4.9-3.1.el8.x86_64.rpm docker-ce-20.10.9-3.el8.x86_64.rpm docker-ce-cli-20.10.9-3.el8.x86_64.rpm docker-ce-rootless-extras-20.10.9-3.el8.x86_64.rpm docker-scan-plugin-0.9.0-3.el8.x86_64.rpm libcgroup-0.41-19.el8.x86_64.rpm 
    * rpm-ostree install net-tools-2.0-0.52.20160912git.el8.x86_64.rpm 
    * rpm-ostree install nodejs-14.16.0-2.module_el8.4.0+716+f63d6d3d.x86_64.rpm npm-6.14.11-1.14.16.0.2.module_el8.4.0+716+f63d6d3d.x86_64.rpm 

    * systemctl reboot to pickup the changes.

  * After reboot, run the following commands to setup environment and register agent
    * sudo ostree admin unlock --hotfix 
    * sudo npm i –g hzn-cli 
    * export SUPPORTED_REDHAT_VERSION_APPEND=8.4 
    * oh deploy setup 
    * oh deploy registerAgent

    * NOTE: refer to https://github.com/playground/hzn-cli for more info on "oh' or type "oh deploy -h" for help 

  [![Watch the video](https://i9.ytimg.com/vi/5UaxlHa1P2U/mq3.jpg?sqp=CJiKmo0G&rs=AOn4CLBcddkPtX-9UXKiec9kp_Z-a3i6dA)](https://youtu.be/5UaxlHa1P2U)  