


package agentUtil
// version No 2 dated :- 11-July-2017
import (
  _ "fmt" 
    "fileUtil"
    "fmt"
    "io/ioutil"
    "net/http"
    "encoding/json"
    "stringUtil"
    "strings"
    "bytes"
    
)

func HandleEnvRequest(activityName string, nextWork []string, 
                           callerLoopCntr int, propertyMap map[string]string) (int){
  
  responseUrl := GetValueFromPropertyMap(propertyMap, "responseUrl_"+activityName)
  
  if(len(responseUrl) ==0){
       fileUtil.WriteIntoLogFile("There is no response url found for activityName =:"+activityName)
  }


  var usrName, envScope, envKey, envVal, id string
  var values []string
  isConditionMatched := false
  if(activityName == "getEnv"){
     values = stringUtil.SplitData(nextWork[callerLoopCntr+1], Delimiter)
     usrName = values[1]

     values = stringUtil.SplitData(nextWork[callerLoopCntr+2], Delimiter)
     envScope = values[1]

     values = stringUtil.SplitData(nextWork[callerLoopCntr+3], Delimiter)
     id = values[1]

     callerLoopCntr += 3
     isConditionMatched = true;
  }

  if(activityName == "setEnv"){
     values = stringUtil.SplitData(nextWork[callerLoopCntr+1], Delimiter)
     usrName = values[1]

     values = stringUtil.SplitData(nextWork[callerLoopCntr+2], Delimiter)
     envScope = values[1]

     values = stringUtil.SplitData(nextWork[callerLoopCntr+3], Delimiter)
     envKey = values[1]


     values = stringUtil.SplitData(nextWork[callerLoopCntr+4], Delimiter)
     envVal = values[1]

     values = stringUtil.SplitData(nextWork[callerLoopCntr+5], Delimiter)
     id = values[1]

     callerLoopCntr += 5
     isConditionMatched = true;

  }


  if(isConditionMatched && len(responseUrl) > 0 ){
    status := process(activityName, usrName, envScope, envKey, envVal, propertyMap )
    if(status == "1" || status == "0"){
        SendExecutionStatus(responseUrl, status , id, "")
    }else{
        qryString := "envList="+status
        SendExecutionStatus(responseUrl, "0" , id, qryString)
    }
  }

 return callerLoopCntr


}//HandleEnvRequest
/*
 activityName may be = getEnv, setEnv, unsetEnv
 envScope may be = user_speciifc, system_speciifc
 envKey is required for set & unset
 envVal is required for set
 propertyMap also contains which file will be consider to manipulate env data
*/


func process(activityName, usrName, envScope, envKey, envVal string, propertyMap map[string]string)string{

   logMsg := "activityName = : "+activityName+" >> usrName = : "+usrName+" >> envScope = : "+envScope+" >> envKey = : "+envKey+" >> envVal = : "+envVal
   fileUtil.WriteIntoLogFile("Executing EnvHandler.HandleEnvRequest() with Params = : "+logMsg)
 

  if(IsActiveUser(usrName) == false){
    return "1"
  }

  isInvalidParams := checkParams(activityName, envKey, envVal, envScope)
  if(isInvalidParams == "1"){
    return "1"
  }

 isUserHasRight := checkEnvScopeAndPermission(envScope,usrName ) 
 info := "EnvHandler.HandleEnvRequest(). "
 if(isUserHasRight != "yes"){
     info = info + "User -> "+usrName+" has not root priv to execute getEnv/setEnv/unsetEnv on system env file."+
     " Abort further process. L 38"
     fileUtil.WriteIntoLogFile(info)
     fmt.Println(info)
     return "1"
 }


 fileNameToManipulate := GetEnvFileToManipulate(usrName, envScope, propertyMap )
 if(len(fileNameToManipulate) == 0){
    info = info +"GetEnvFileToManipulate return null. Abort process. L49"
    fileUtil.WriteIntoLogFile(info)
    fmt.Println(info)
    return "1"
 }
 

fileUtil.WriteIntoLogFile("fileNameToManipulate = : "+fileNameToManipulate)
fmt.Println("fileNameToManipulate = : "+fileNameToManipulate)

 if(activityName == "getEnv"){
   jsonStr := convertDataInto_JsonString(getExportedData(fileNameToManipulate))
    if(len(jsonStr) > 0){
      SendExecutionStatus(apiUrl_listEnv, "0", "11", "data="+jsonStr) 
      printApiResponse(jsonStr)
      return jsonStr
    }else{
        return "0"
    }
   //return exportedData
 }

if(activityName == "setEnv" || activityName == "unsetEnv"){
 status := handle_setOrUnset_Request(activityName, fileNameToManipulate, envKey, envVal)
 return status
} 

return "1"

}//HandleEnvRequest

func printApiResponse(fullUrl string){
  jsonString, _ := json.Marshal(fullUrl)
      rsp, err := http.Post(apiUrl_listEnv, "application/json", bytes.NewBuffer(jsonString))
      if err != nil {
         panic(err)
      }
  defer rsp.Body.Close()
  body_byte, err := ioutil.ReadAll(rsp.Body)
  if err != nil {
    panic(err)
  }
  fmt.Println("\n**********See below printApiResponse *******\n")
  fmt.Println(string(body_byte))


}

func IsActiveUser(userName string)bool{
  homeDir := GetUserHomeDirectory(userName)  
   if(len(homeDir) == 0){
     return false
   }

   aCExpiredDays := GetElapsedDays_ifAcExpired(userName)
   if(aCExpiredDays < 0 ){
     if(IsPwdLocked(userName)){
       return false
     }

   }else{
     return false
   }

   return true;
}



func GetEnvFileToManipulate(userName, envScope string, propertyMap map[string]string)string{
   fileName :=""
    homeDir := GetUserHomeDirectory(userName)  
   if(envScope == "user_speciifc"){
    fileName = GetValueFromPropertyMap(propertyMap, "user_specific_envFile")
   }
   if(envScope == "system_speciifc"){
     fileName = GetValueFromPropertyMap(propertyMap, "system_specific_envFile")
     homeDir = "/etc"
   }

   if(len(fileName) > 0){
    values := stringUtil.SplitData(fileName, ",")
    for i := 0; i < len(values); i++ {
       path := homeDir+"/"+values[i]
       path = strings.TrimSpace(strings.Replace(path, "\n","",-1))

       if(fileUtil.IsFileExisted(path)){
          return path
       }

       if(".bashrc" == values[i] && envScope == "user_speciifc"){
        ExecComand("cp /etc/skel/.bashrc "+ path, "AgentUtil.GetEnvFileToManipulate L303")
        if(fileUtil.IsFileExisted(homeDir+"/.bashrc") == false){ // Check whether file copied or not
             dummyText := "# Infraguard User Specific Env Variables"
             fileUtil.WriteIntoFile(homeDir+"/.bashrc", dummyText, false, true )
          }
          return homeDir+"/.bashrc"
       }
    }// for

  }
  return ""
}//getEnvFileToManipulate


func convertDataInto_JsonString(envExportedData []string)string{
  if(envExportedData == nil || len(envExportedData) == 0){
    return ""
  }

  var aMap map[string]string
  aMap = make(map[string]string)
  
  for i := 0; i < len(envExportedData); i++ {
    values := stringUtil.SplitData(envExportedData[i], "=")
    if(len(values)==2){
      aMap[values[0]] = values[1]
    }

  }
  var map2 map[string]map[string]string
  map2 = make(map[string]map[string]string)
  map2["envList"] = aMap
  jsonStr := ""
  out, _ := json.Marshal(map2)
  jsonStr = string(out)
  info := "EnvHandler.convertDataInto_JsonString(). Returned JSON String :- "+jsonStr
  fileUtil.WriteIntoLogFile(info)
  fmt.Println(info)

  return jsonStr
}

func checkEnvScopeAndPermission(envScope,usrName string)string{
    if(envScope == "system_speciifc"){
      isUsrHasRootPriv := IsUserHasRootLevelAccess(usrName)
      return isUsrHasRootPriv
    }

    if(envScope == "user_speciifc"){
      return "yes"
    }
    return "no"
  
}
func isReservedKey(envKey string, propertyMap map[string]string)string{
  restricted_env_variables := GetValueFromPropertyMap(propertyMap, "restricted_env_variables")
  values := stringUtil.SplitData(restricted_env_variables, ",")
  for i := 0; i < len(values); i++ {
    if(envKey == values[i]){
      return "yes"
    }
  }
  return "no"

 }// isReservedKey



 func getExportedData(fileName string)([]string){
  
  var arr = make([]string, 500) 
  data := fileUtil.ReadFile(fileName, false) 
  isInvalidData := stringUtil.IsInvalidString(data, 4, -1, "yes")
  if(isInvalidData == "yes"){
    fileUtil.WriteIntoLogFile("EnvHandler.getExportedData(). There is no data found at "+fileName)
    fmt.Println("EnvHandler.getExportedData(). There is no data found at ",fileName)
    return nil;
  }


  values := stringUtil.SplitData(data, "\n")
  cnt := 0
  for i := 0; i < len(values); i++ {
      line := strings.TrimSpace(values[i])
      if(strings.HasPrefix(line, "export") && strings.Contains(line, "=") ){
        exportIdx := strings.Index(line, "export")
        if(exportIdx >= 0){
          substring := line[exportIdx+len("export"):len(line)]
          substring = strings.TrimSpace(substring)
          arr[cnt] = substring
          cnt++;
        }
      }
  }
  // Trim to actual size
   if(cnt > 0){
    var tmp = arr[0:cnt]
    arr = tmp
    return arr
   }

  return nil;
 
 }
 func checkParams(requestFor, envKey, envVal, envScope string)string{
   info := "EnvHandler.checkParams(). failed. "
   
   if(!(requestFor == "getEnv" || requestFor == "setEnv" || requestFor == "unsetEnv")){
       info = info + "requestFor should be getEnv/setEnv/unsetEnv but found - "+requestFor
       fileUtil.WriteIntoLogFile(info)
       fmt.Println(info)
       return "1"
    }
   removeBlankSpaces := "yes"

   isInvalidData := stringUtil.IsInvalidString(envScope, 4, -1, removeBlankSpaces)
   if(isInvalidData != "yes"){
    if(requestFor == "setEnv" || requestFor == "unsetEnv" ){
         isInvalidData = stringUtil.IsInvalidString(envKey, 2, -1, removeBlankSpaces)
          if(isInvalidData != "yes" && requestFor == "set"){
              isInvalidData = stringUtil.IsInvalidString(envVal, 1, -1, removeBlankSpaces)
            }
    }
   }

  if(isInvalidData == "yes"){
     info = info + "Check requestFor "+requestFor+ " > envKey = : "+envKey+" > envVal = : "+envVal+
       " > envScope = : "+envScope
     fileUtil.WriteIntoLogFile(info)
     fmt.Println(info)
     return "1"

  }
  return "0"
}

func handle_setOrUnset_Request(requestFor, fileNameToManipulate, envKey, envVal string)string{
  info := "EnvHandler.handle_setOrUnset_Request(). "
  
  // To SETor UNSET, first remove such key from .bashrc/profile file
   status := RemoveLineFromFile(envKey, fileNameToManipulate)
   if(status == "1" || requestFor == "unsetEnv"){
     return status
   }

  // if requestFor == 'setEnv' then set the newly env variable
  cmd := "echo 'export "+envKey+"="+GetValueInDblQuotes(envVal)+"' >> "+fileNameToManipulate
  status = ExecComand(cmd, info+" L297")
  if(status == "success"){
     cmd = "source "+fileNameToManipulate
     status = ExecComand(cmd, "Process_Env_Mgmt.SetEnvData() L289")
     if(status == "fail"){
       fileUtil.WriteIntoLogFile("\n")
       info = info + " Problem while sourcing concerned env file. This may be syntax issue with key or value. Check key/value."
       fileUtil.WriteIntoLogFile(info)
       fileUtil.WriteIntoLogFile("Going to undo everything...")

       RemoveLineFromFile(envKey, fileNameToManipulate)
       return "1"
     }
     return "0"
  }
  return "1"
}
