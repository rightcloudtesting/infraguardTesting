

package agentUtil

import (
    
   // "fmt"
    "os/exec"
  _ "fmt" // for unused variable issue
    "fileUtil"
  //   "log"
   // "strings"
   
       
)



func ExecComand(cmd, fromFile string) string {
    
    cmdStatus,err := exec.Command("bash","-c",cmd).Output()
    execStatus := "success"
    
    if err != nil {
        errorMsg := "Cmd executed = : "+cmd +" : execStatus = : fail. fromFile. = :"+fromFile
        fileUtil.WriteIntoLogFile(errorMsg, "sudo")
        execStatus = "fail"
    }

    if (len(string(cmdStatus)) > 0){
        //fmt.Println("Execution Status :- ", (string(cmdStatus)))
        execStatus =  string(cmdStatus)  
    }
    
    fileUtil.WriteIntoLogFile("Cmd executed = : "+cmd +" : execStatus = : "+execStatus, "")
    return execStatus
}





