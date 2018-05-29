

// version No 1 dated :- 03-Apr-2017
package agentUtil
// version No 1 dated :- 03-Apr-2017
import (
    "os/exec"
  _ "fmt" // for unused variable issue
    "fileUtil"
    "fmt"
    "io/ioutil"
    "net/http"
    "strings"
    "stringUtil"
    "net/url"
    "strconv"
  
)

func ExecComand(cmd, fromFile string) string {
    
    cmdStatus,err := exec.Command("bash","-c",cmd).Output()
    execStatus := "success"
    if err != nil {
        errorMsg := "Cmd executed = : "+cmd +" : execStatus = : fail. fromFile. = :"+fromFile
        fileUtil.WriteIntoLogFile(errorMsg)
        execStatus = "fail"
        fmt.Println("34. AgentUtil.ExecComand()  errorMsg = : ", errorMsg)

    }

    if (len(string(cmdStatus)) > 0){
        execStatus =  string(cmdStatus)  
    }
    return execStatus
}
func ExecComandCurl(cmd, fromFile string) string {
    
    cmdStatus,err := exec.Command("bash","-c","curl",cmd).Output()
    execStatus := "success"
    if err != nil {
        errorMsg := "Cmd executed = : "+cmd +" : execStatus = : fail. fromFile. = :"+fromFile
        fileUtil.WriteIntoLogFile(errorMsg)
        execStatus = "fail"
        fmt.Println("34. AgentUtil.ExecComand()  errorMsg = : ", errorMsg)

    }

    if (len(string(cmdStatus)) > 0){
        execStatus =  string(cmdStatus)  
    }
    return execStatus
}  
  func SendExecutionStatus(serverUrl string, status string, id, localQryStr string) string{
   serverIp := ExecComand("curl -s http://169.254.169.254/latest/meta-data/local-ipv4", "AgentUtil.SendExecutionStatus.go 38")
   serverIp = strings.TrimSpace(serverIp)
   localQryStr = strings.TrimSpace(localQryStr) 
   info := "AgentUtil.sendExecutionStatus(). "
  
   localQryStr = url.QueryEscape(localQryStr); // Newly added
   qryStr := "?serverIp="+serverIp+"&id="+id

  if(status == "success" || status == "0"){
    qryStr = qryStr + "&status=0"
  }else{
    qryStr = qryStr + "&status=1"
  }
  if(len(localQryStr) > 0){
    localQryStr = "&"+localQryStr
  }
  serverUrl = serverUrl + qryStr+localQryStr
  serverUrl = strings.Replace(serverUrl, "\n","",-1)
  res, err := http.Get(serverUrl)
 
  if err != nil {
      info = info+"L 57. Error. > Error = : "+err.Error() +" > serverUrl "+serverUrl
      fileUtil.WriteIntoLogFile(info)
      fmt.Println(info)
      status =  "1"
     
  }
  _, error := ioutil.ReadAll(res.Body)
  if error != nil {
     info = info+"L 68. Error. > Error = : "+err.Error() +" > serverUrl "+serverUrl
    fileUtil.WriteIntoLogFile(info)
    fmt.Println(info)
     status =  "1"
  }
  info = info + "L 73. Response Successfully Sent to this url -> "+serverUrl
  fileUtil.WriteIntoLogFile(info)
  fmt.Println(info) 
  status =  "0"


  return status

}//sendExecutionStatus


  func SendExecutionStatusForSSH(serverUrl string, status string, id, localQryStr string) string{
   serverIp := ExecComand("curl -s http://169.254.169.254/latest/meta-data/local-ipv4", "AgentUtil.SendExecutionStatus.go 38")
   serverIp = strings.TrimSpace(serverIp)
   localQryStr = strings.TrimSpace(localQryStr) 
   info := "AgentUtil.sendExecutionStatus(). "
  
   localQryStr = url.QueryEscape(localQryStr); // Newly added
   qryStr := "?serverIp="+serverIp+"&id="+id

  if(status == "success" || status == "0"){
    qryStr = qryStr + "&status=0"
  }else{
    qryStr = qryStr + "&status=1"
  }
  if(len(localQryStr) > 0){
    localQryStr = "&commandOutput="+localQryStr
  }
  serverUrl = serverUrl + qryStr+localQryStr
  serverUrl = strings.Replace(serverUrl, "\n","",-1)
  res, err := http.Get(serverUrl)
 
  if err != nil {
      info = info+"L 57. Error. > Error = : "+err.Error() +" > serverUrl "+serverUrl
      fileUtil.WriteIntoLogFile(info)
      fmt.Println(info)
      status =  "1"
     
  }
  _, error := ioutil.ReadAll(res.Body)
  if error != nil {
     info = info+"L 68. Error. > Error = : "+err.Error() +" > serverUrl "+serverUrl
    fileUtil.WriteIntoLogFile(info)
    fmt.Println(info)
     status =  "1"
  }
  info = info + "L 73. Response Successfully Sent to this url -> "+serverUrl
  fileUtil.WriteIntoLogFile(info)
  fmt.Println(info) 
  status =  "0"


  return status

}//sendExecutionStatus





func ReadPropertyFile() map[string]string {
  var values, rows []string
  var propertyMap map[string]string
  propertyMap = make(map[string]string)
 
  data := fileUtil.ReadFile(propertyFilePath, false) 
  data = strings.Replace( data, "\"","",-1)  // Remove dbl quotes

  rows = stringUtil.SplitData(data, "\n")
  for _, row := range rows {
    row = strings.TrimSpace(row)
    
    // Ignore row which starts with letter '#'
    if(strings.HasPrefix(row, "#")){
      continue
    }
    if(strings.Contains(row, "=")){
       values = stringUtil.SplitData(row, "=")
       if(len(values) == 2){
         propertyMap[values[0]] = values[1] 
       }
       
    }
  }


  if(propertyMap != nil && len(propertyMap) > 0){
    return propertyMap  
  }
  return nil
  
}


func GetValueFromPropertyMap(propMap map[string]string, key string) string{
  msg := "AgentUtil.GetValueFromPropertyMap(). Going to get value for key = : "+key+". "

  if(propMap == nil || len(propMap) == 0){
     fileUtil.WriteIntoLogFile(msg+ " >> PropMap is empty")
     return ""
  }


  if(len(key) >0){
    if(len(propMap[key]) >0 ){
      return propMap[key]
    }else{
       msg := msg +"Value not found. "
       fileUtil.WriteIntoLogFile(msg)
       fmt.Println(msg)
    }  
  }
  fileUtil.WriteIntoLogFile(msg+"Value not found. Check Key")
  fmt.Println(msg+"Value not found. Check Key")

  return ""
}

/*
  Since different distro have different sudo group. e.g in ubuntu it is 'sudo'
  wheaeas  in fedora , sudo group is 'wheel' group
  It is assumed that sudoers group either sudo/wheel are uncommented wherever applicable.
*/
func GetSudo_GrpName()string{
  rootPrivGrpName := ""
     status := ExecComand("getent group sudo", "UserHandler.GetSudo_GrpName() L211")
        if(status == "fail"){
            status = ExecComand("getent group wheel", "UserHandler.GetSudo_GrpName() L213")
            if(status != "fail"){
              rootPrivGrpName = "wheel"
            }
        }else{
          rootPrivGrpName = "sudo"
        }

         
    if(len(rootPrivGrpName) ==0){
      fileUtil.WriteIntoLogFile("AgentUtil.GetSudo_GrpName. Unable to locate sudo/wheel group. ")
    }    
   return rootPrivGrpName    
}

// get all those group name in which user is a member
func GetUser_AllGrp(usrName string) string{  
  groupNames := ExecComand("id -nG "+usrName, "AgentUtil.GetUser_AllGrp() L225")
  return groupNames
}

func GetUserHomeDirectory(userName string)string{
  cmd := "getent passwd "+userName+" | cut -d: -f6"
  msg := "AgentUtil.GetUserHomeDirectory(). Going to search usrHomeDir for user = : "+userName
  
  usrHomeDir := ExecComand(cmd, "AgentUtil.GetUserHomeDirectory() L149")
  if(usrHomeDir == "success"){
    msg = "Home directory NOT found for user "+userName
    fileUtil.WriteIntoLogFile(msg)
    fmt.Println(msg)
    return ""
  }
 return usrHomeDir
}

func IsUserHasRootLevelAccess(usrName string)string{
  rootPrivGrpName := GetSudo_GrpName() // it may be either 'sudo' or 'wheel'
  if(len(rootPrivGrpName) > 0){
      grpOfUser := GetUser_AllGrp(usrName) 
      isUsrHasRootPriv := strings.Contains(grpOfUser, rootPrivGrpName)
      if(isUsrHasRootPriv == true){
        return "yes"
      }
  }
  return "no"
}


 func RemoveLineFromFile(envKey, fileFullPath string)string{
   info := "FileHandlerUtil.RemoveLineFromFile(). envKey = : "+envKey +" >> fileFullPath = : "+fileFullPath+". "
   fileName := ""
   values := strings.Split(fileFullPath, "/")
   fileName = values[len(values)-1]

   cmd := "grep -v \"export "+envKey+"=\" "+ fileFullPath +" > /tmp/"+fileName
   
   status := ExecComand(cmd, info+" L207")
   fileUtil.WriteIntoLogFile(cmd+" > Status = : "+status+" L207")
   fmt.Println("47. cmd = : ", cmd)
   
   if(status == "success"){
    cmd = "mv /tmp/"+fileName + " "+ fileFullPath
    status := ExecComand(cmd, info+" L211")
    if(status == "success"){
      return "0"
    }else{
      info = info+" Unable to move from /tmp to "+fileName
      fileUtil.WriteIntoLogFile(info+" L217")
      fmt.Println(info)
      return "1"
    }
   }else{
      info = info+ " cmd - "+cmd+" not executed successfully. L222 "
      fileUtil.WriteIntoLogFile(info+" L223")
      fmt.Println(status)
      return "1"
   }
   return "1"

 }

func GetValueInDblQuotes(data string)string{
  return "\""+data+"\""
}

/* If returned value is >= 0, then it is assumed that account is expired
   If user does not exists, then below method also return 0.
*/
func GetElapsedDays_ifAcExpired(usrName string)int64 {
   if(len(GetUserHomeDirectory(usrName)) == 0){
     return 0
   }
   info := "AgentUtil.GetElapsedDays_ifAcExpired()."
   cmd := "grep "+usrName+" /etc/shadow | cut -d: -f2,8 | sed /:$/d > /tmp/expirelist.txt"
   ExecComand(cmd, "AgentUtil.getElapsedDays_ifAcExpired() L252") 
   

   values := stringUtil.SplitData(fileUtil.ReadFile("/tmp/expirelist.txt", false) , ":")
   if(values != nil ){
     elapsedDay, _ := strconv.ParseInt(values[1], 10, 0) 
     if(elapsedDay >= 0){
       info = info + " Ago "+values[1]+" day, Account already expired for user = : "+usrName
       fileUtil.WriteIntoLogFile(info)
       fmt.Println(info)
       return elapsedDay
     }

   }
   return -1
}


/* If returned value true, means pwd is  locked for the given user i.e not authorise to login
   If user does not exists, then below method also return true.
*/
func IsPwdLocked(usrName string)bool{
  info := "AgentUtil.IsPwdLocked(). "
  cmd := "grep "+usrName+" /etc/shadow | cut -d: -f1,2 | sed /:$/d > /tmp/expirelist.txt"
   if(len(GetUserHomeDirectory(usrName)) == 0){
     return true
   }

  ExecComand(cmd, "AgentUtil.isPwdLocked() L268") 
  values := stringUtil.SplitData(fileUtil.ReadFile("/tmp/expirelist.txt", false) , ":")
  if(values != nil && strings.HasPrefix(values[1], "!")){
    info = info + "Pwd is locked for user = : "+usrName
    fileUtil.WriteIntoLogFile(info)
    fmt.Println(info)
    return true; 
  }
  return false
}





             