

// version No 1 dated :- 25-Apr-2017
package agentUtil
// version No 1 dated :- 25-Apr-2017
import (
  _ "fmt" // for unused variable issue
    "fileUtil"
    "fmt"
    "io/ioutil"
    "net/http"
    "encoding/json"
    "stringUtil"
    "strings"
    "bytes"
)


//const apiUrl_listEnv = "https://1ient24cr3.execute-api.us-west-2.amazonaws.com/dev/listofenvvariables"


func Send_EnVData(){
  // https://gist.github.com/emitle/9768411a6b3e07b4e3bf
  aMap := getEnvDataInMap()
  jsonString, _ := json.Marshal(aMap)
  var byteData = []byte(jsonString)

  rsp, err := http.Post(apiUrl_listEnv, "application/json", bytes.NewBuffer(byteData))
  if err != nil {
    panic(err)
  }
  defer rsp.Body.Close()
  body_byte, err := ioutil.ReadAll(rsp.Body)
  if err != nil {
    panic(err)
  }

  fmt.Println("========== Response ==================\n")
  fmt.Println(string(body_byte))

 
  }//HitUrlWithJOSNData

 
  func getEnvDataInMap() (map[string]string) {
    ExecComand("printenv > /tmp/env.txt ", "Process_Env_Mgmt.getEnvDataInMap() L53")
    env := fileUtil.ReadFile("/tmp/env.txt", false);
    list := stringUtil.SplitData(env, "\n");
    fmt.Println("List size = : ", len(list))
    var aMap map[string]string
    aMap = make(map[string]string)
    
    for i := 0; i < len(list); i++ {
      if((strings.Count(list[i], "=")) == 1){
          data := stringUtil.SplitData(list[i], "=");
          if(data != nil && len(data) == 2 ){
              aMap[data[0]] = data[1]
          }
       
      }
    }
    return aMap
}//getEnvInMap
// 
func SetEnvData(userName, envKey, envVal string) string{
  // https://www.digitalocean.com/community/tutorials/how-to-read-and-set-environmental-and-shell-variables-on-a-linux-vps#printing-shell-and-environmental-variables
  
  status := ExecComand("id "+userName, "Process_Env_Handler.SetEnvData() L68");
  fmt.Println("33. Process_Env_Handler.SetEnvData()  isUserExist = : ", status)

  if(status == "fail"){
    return "1"
  }

  cmd := "getent passwd "+userName+" | cut -d: -f6"
  usrHomeDir := ExecComand(cmd, "Process_Env_Mgmt.setEnv() L72")
  if(len(usrHomeDir) == 0){
    return "1"
  }

 //su - piyush -c env | grep HOME


  cmd = "su - "+userName+" -c env | grep HOME"
  usrHomeDir2 := ExecComand(cmd, "Process_Env_Mgmt.setEnv() L85")
  fmt.Println("87 -------------------- usrHomeDir2 = : ", usrHomeDir2)

  if(len(usrHomeDir) == 0){
    return "1"
  }




  bashRcPath := usrHomeDir+"/.bashrc"
  bashRcPath = strings.Replace(bashRcPath, "\n","",-1)
  fmt.Println("75. bashRcPath = : ", bashRcPath)

  cmd = "echo 'export "+envKey+"="+envVal+"' >> "+bashRcPath
  status = ExecComand(cmd, "Process_Env_Mgmt.setEnv() L100")
  fmt.Println("82. set Env status = : ", status)

  cmd = "source "+bashRcPath
  status = ExecComand(cmd, "Process_Env_Mgmt.setEnv() L104")
  fmt.Println("89. After sourcing  status = : ", status)

  if(status == "success"){
    return "0"
  }

  return "1"

}

