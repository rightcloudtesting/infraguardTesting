

package serverMgmt

import (
    //"log"
    "strings"
    "encoding/json"
    "net/http"
    "agentUtil"
    "stringUtil"
   // "fileUtil"
  _ "fmt" // for unused variable issue
    "fmt" 
    "io/ioutil"
    "strconv"
    
)
/*{"fieldCount":0,"affectedRows":1,"insertId":44,
  "serverStatus":2,"warningCount":0,"message":"","protocol41":true,"changedRows":0}*/



//const baseUrl := "https://ojf489mkrc.execute-api.us-west-2.amazonaws.com/dev/registerserver"
const url2 = "https://ojf489mkrc.execute-api.us-west-2.amazonaws.com/dev/registerserver?serverName=demoServer206&serverIp=12.12.12.12&hostName=linuxAMI&projectId=5&userList=aaa,bbb,ccc"

const baseUrl = "https://ojf489mkrc.execute-api.us-west-2.amazonaws.com/dev/registerserver"


/*func get_content2() {
    // json data
   
   
   // qryStr := getQueryString()
   // url = baseUrl + qryStr
    url := url2

    res, err := http.Get(url)
    if err != nil {
        panic(err.Error())
    }
    body, err := ioutil.ReadAll(res.Body)
    if err != nil {
        panic(err.Error())
    }
    var data interface{} // TopTracks
    err = json.Unmarshal(body, &data)
    if err != nil {
        panic(err.Error())
    }
    fmt.Printf("Results: %v\n", data)

    md, _ := data.(map[string]interface{})
    fmt.Println(md["affectedRows"])

    //os.Exit(0)
}
*/




func DoServerRegnProcess() (string){
   // url := url2
    url := baseUrl + getQueryString()

    res, err := http.Get(url)
    if err != nil {
        panic(err.Error())
    }
    body, err := ioutil.ReadAll(res.Body)
    if err != nil {
        panic(err.Error())
    }
    var data interface{} 
    err = json.Unmarshal(body, &data)
    if err != nil {
        panic(err.Error())
    }
    fmt.Printf("Results: %v\n", data)

    infraGuardResp, _ := data.(map[string]interface{})
    fmt.Println(infraGuardResp["affectedRows"])

   /* if(md["affectedRows"] > 0){
      return "0"      
    }*/
    var statusCode int
    statusCode = infraGuardResp["affectedRows"]
    s2 := strconv.Itoa(int(statusCode))
    return s2

    //return infraGuardResp["affectedRows"]
    //return "0"
  
  

}

func getQueryString()(string){
   serverIp := agentUtil.ExecComand("hostname --all-ip-addresses", "ServerHandler.go 78")
   hostName := agentUtil.ExecComand("hostname", "ServerHandler.go 79")
    
   serverIp = strings.TrimSpace(serverIp)
   hostName = strings.TrimSpace(hostName)
   
   userList := agentUtil.ExecComand("cat /etc/passwd | grep '/home' | cut -d: -f1", "ServerHandler.go 84")
   userList2 := strings.Split(userList,"\n")

  
   max := 5
   if(len(userList2) < max){
    max = len(userList2)
   }

  users := ""
  for i := 0; i <  max; i++ {
    if(len(users) ==0){
      users = userList2[i]
    }else{
      users = users +","+userList2[i]
    }
 
  }
 users = strings.TrimSpace(users)

 cpuDetails := agentUtil.ExecComand("lscpu", "ServerHandler.go 105")
 cpuDetails = stringUtil.FindKey(cpuDetails)

 kernelDetails := agentUtil.ExecComand("cat /etc/*-release", "ServerHandler.go 108")
 kernelDetails = stringUtil.FindKey(kernelDetails)
 
 
 //qryStr := "?serverName=demoServer3&serverIp="+serverIp+"&hostName="+hostName+"&projectId=5&users="+users +"&cpuDetails="+cpuDetails+"&kernelDetails="+kernelDetails;
 qryStr := "?serverName=testingServer507&serverIp="+serverIp+"&hostName="+hostName+"&projectId=5&userList="+users
 qryStr = strings.Replace(qryStr, "\n","",-1)
 return qryStr


}



