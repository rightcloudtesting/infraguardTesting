#!/bin/bash


get_osflavor(){

    if [[ -f "/etc/lsb-release" ]]
        then
            os="ubuntu"
            fileAgentController="agent_controller_ubuntu.sh"
        elif [[ -f "/etc/redhat-release" ]]
        then
            os="rpm"
        elif [[ -f "/etc/debian_version" ]]
        then
            os="debian"
        else
            #echo "ERROR: Cannot get the system type. Aborting entire process."
            os="unknown"
            #exit 1
    fi
  


}

<<"COMMENT"

start() {
(

prog=awslogs
exec="/usr/sbin/awslogsd"
lockfile=/var/lock/subsys/awslogs
pidfile=/var/run/awslogs.pid
mutexfile=/var/lock/awslogs.mutex

[ -x $exec ] || exit 5
echo -n $"Starting $prog: "
daemon $NICELEVEL --pidfile=$pidfile --check=${prog} "nohup $exec >/dev/null 2>&1 &"
retval=$?
echo [ $retval -eq 0 ] && touch $lockfile
) 9>${mutexfile}
rm -f ${mutexfile}
}



COMMENT

create_InfraGuardDirectories(){
    echo "Creating directories in /opt ..."
    exec="mkdir -p /opt/infraguard/sbin"
    $exec

    exec="mkdir -p /opt/infraguard/etc"
    $exec

    exec="mkdir -p /var/logs/infraguard"
    $exec

    exec="touch  /var/logs/infraguard/activityLog"
    $exec

    exec="chmod 777 /var/logs/infraguard/activityLog"
    $exec

    exec="chmod 777 /opt/infraguard/sbin"
    $exec

    exec="chmod 777 /opt/infraguard/etc"
    $exec

    exec="chmod 777 /var/logs/infraguard"
    $exec
    
    echo "completed Directories Creation"


#######################################################################

#######################################################################










}

#sudo chown root:root /path/to/application
#sudo chmod 700 /path/to/application

install_daemon(){
    echo 'Attempting Daemon Installation'
    cd /tmp
    if [[ "$os" = "debian"  || "$os" = "ubuntu" ]]
        then
        wget -q https://github.com/terminalcloud/terminal-tools/raw/master/daemon_0.6.4-2_amd64.deb || exit -1
        dpkg -i daemon_0.6.4-2_amd64.deb
        echo "Daemon Installation Done Successfully on debian/ununtu"
    else
        wget -q http://libslack.org/daemon/download/daemon-0.6.4-1.x86_64.rpm || exit -1
        rpm -i daemon-0.6.4-1.x86_64.rpm
        echo "Daemon Installation Done Successfully on rpm"
    fi
}

downloadFiles_FromGitHub() {
    
    echo "Downloading $fileAgentController  > This file will act as a process"
    local url="wget -O /tmp/$fileAgentController https://raw.githubusercontent.com/agentinfraguard/agent/master/scripts/$fileAgentController"
    wget $url--progress=dot $url 2>&1 | grep --line-buffered "%" | sed -u -e "s,\.,,g" | awk '{printf("\b\b\b\b%4s", $2)}'
    command="mv /tmp/$fileAgentController  /etc/init.d"
    $command
      
   
   
    command="chmod 777 /etc/init.d/$fileAgentController"
    $command
    
    echo ""
    echo "Downloading infraGuardMain executable. It will take time. Please wait...."
    url="wget -O /opt/infraguard/sbin/infraGuardMain https://raw.githubusercontent.com/agentinfraguard/agent/master/go/src/agentController/infraGuardMain"
    
    #url="wget -O /opt/infraguard/sbin/infraGuardMain https://raw.githubusercontent.com/agentinfraguard/agent/master/go/src/test/infraGuardMain"
    wget $url--progress=dot $url 2>&1 | grep --line-buffered "%" | sed -u -e "s,\.,,g" | awk '{printf("\b\b\b\b%4s", $2)}'
    echo "infraGuardMain downloaded."
    command="chmod 777 /opt/infraguard/sbin/infraGuardMain"
    $command


    echo "create  /tmp/serverInfo.txt with following data $serverName:$projectId:$licenseKe >> It will remove after server regn."
    echo "$serverName:$projectId:licenseKey" > /tmp/serverInfo.txt

    echo "Downloading /opt/infraguard/etc/sudoAdder.sh ..."

    local url="wget -O /opt/infraguard/etc/sudoAdder.sh https://raw.githubusercontent.com/agentinfraguard/agent/master/scripts/sudoAdder.sh"
    wget $url--progress=dot $url 2>&1 | grep --line-buffered "%" | sed -u -e "s,\.,,g" | awk '{printf("\b\b\b\b%4s", $2)}'
    command="chmod 777 /opt/infraguard/etc/sudoAdder.sh"
    $command




    echo ""
    echo "Downloading property file i.e agentConstants.txt ...."
    url="wget -O /opt/infraguard/etc/agentConstants.txt https://raw.githubusercontent.com/agentinfraguard/agent/master/go/src/agentConstants.txt"
    wget $url--progress=dot $url 2>&1 | grep --line-buffered "%" | sed -u -e "s,\.,,g" | awk '{printf("\b\b\b\b%4s", $2)}'
    echo "agentConstants.txt downloaded."
   
    command="chmod 777 /opt/infraguard/etc/agentConstants.txt"
    $command



     if [[ "$os" = "debian"  || "$os" = "ubuntu" ]] ;then
            echo " ------- going to call  update-rc.d for agent_controller.sh --------"
            #update-rc.d agent_controller.sh defaults
            update-rc.d $fileAgentController defaults
     else
            echo " ------- going to call  chkconfig for agent_controller.sh --------"
            #chkconfig --add /etc/init.d/agent_controller.sh       
            chkconfig --add /etc/init.d/$fileAgentController
     fi


    export start="start"
    #export command="/etc/init.d/agent_controller.sh"
    export command="/etc/init.d/$fileAgentController"
        
    sh $command ${start}
   
    }

    checkUserPrivileges(){
        if [ `id -u` -ne 0 ] ; then
            echo "error: requested operation requires superuser privilege"
            exit 1
        fi
    }

if [ $# -ne 3 ] ; then
    echo "Insufficient arguments. Usage: $0 serverName projectId licenseKey"
    exit 1
fi


pId=$(ps -ef | grep 'infraGuardMain' | grep -v 'grep' | awk '{ printf $2 }')
echo "infraGuardMain pid = : $pId"

pId=$(ps -ef | grep 'fakeProcess' | grep -v 'grep' | awk '{ printf $2 }')
echo "fakeProcess pid = : $pId"

return

checkUserPrivileges
# Read arguments, it will saved into /tmp/serverInfo.txt & then serverMgmt/ServerHandler.go will read.
serverName=$1
projectId=$2
licenseKey=$3

os=""
fileAgentController="agent_controller.sh"
get_osflavor
#install_daemon
echo "os found = : $os"
create_InfraGuardDirectories
downloadFiles_FromGitHub






