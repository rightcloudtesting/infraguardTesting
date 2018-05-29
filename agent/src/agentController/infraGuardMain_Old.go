

package main
// version No 2 dated :- 10-May-2017
import (
    
  
 //   "stringUtil"
    //"serverMgmt"
    "fmt"
    "fileUtil"
  //  "userMgmt"
    "agentUtil"
   // "github.com/jasonlvhit/gocron"  // go get github.com/robfig/cron
  
   //  "strings"
    //"strconv"
 //    "time"
  //   "log"
)



var propertyMap map[string]string
func main() {
 
/*  usrName := "rhel23"
  days := agentUtil.GetElapsedDays_ifAcExpired(usrName)
  isPwdLocked := agentUtil.IsPwdLocked(usrName)
  fmt.Println("Elapsed no of days = : ", days)
  fmt.Println("isPwdLocked = : ", isPwdLocked)*/
  
  


  //removeLineFromFile("", "")
  propertyMap = agentUtil.ReadPropertyFile()
  responseStatus := agentUtil.HandleEnvRequest("", "", "", "", "", propertyMap)
  fmt.Println("\n")
  fileUtil.WriteIntoLogFile("\n\n")
  fileUtil.WriteIntoLogFile("InfraGuardMain_old.main(). responseStatus = : "+responseStatus)
  return

 }

