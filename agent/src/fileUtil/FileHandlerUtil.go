

package fileUtil
// version No 1 dated :- 03-Apr-2017
import (
    
    "fmt"
    "io/ioutil"
    "os"
    _ "fmt" // for unused variable issue
 
    "log"
    "strings"
    "bufio"
	"bytes"
    

)



const logFilePath = "/var/logs/infraguard/activityLog"  
//const logFilePath = "/tmp/activityLog"   
func IsFileExisted(filePath string) (bool) {
   _, err := os.Stat(filePath)
    if err != nil {
        if os.IsNotExist(err) {
            return false;
        }
    }
    return true;
}


/*
   Read any type of file. If isAbortOnError = true and error occur, then
   further execution stop. 

   It returns data in String even in case of error if 'isAbortOnError' = false.
   Note :- This method does not check whether FILE EXIST OR NOT. In that case, it may
   also returns empty string.
*/
func ReadFile(filePath string, isAbortOnError bool) (string) {
     data, err := ioutil.ReadFile(filePath)
    if err != nil {
        fmt.Println("errorMsg = : ", err.Error()) 
        if(isAbortOnError){
            panic(err)    
        }else{
            return "";
        }
    }
    return string(data)
}

/*
 Below method REPLACES new contents if file already exists.
 If 'forceCreate' is false and file does not existed beforehand, then this method
 simply retuns to caller else file is created and data will write.
 
 This method will abort if error occur while writing data.

 Note :- It is up to the caller to ensure the data which is going to write is in good format and meaningful. 
*/
func WriteIntoFile(filePath string, dataToWrite string, isAppendMode bool, forceCreate bool ){
   var err error
  if(IsFileExisted(filePath) == false){
    if(forceCreate == true){
       _, err := os.Create(filePath)
      if err != nil {
      errorMsg := " Error While writing into file at = : "+filePath +" Msg = : "+err.Error()
      WriteIntoLogFile(errorMsg)
      panic(err)
     }
    }else{
      return
    }
 }

 
  if(isAppendMode){ 
    fmt.Println("condition matched at 78. FHandlerUtil.WriteIntoFile isAppendMode = : ",isAppendMode)
    f, err := os.OpenFile(filePath, os.O_APPEND|os.O_WRONLY, 0644)
    if err != nil {
     // panic(err)
      errorMsg := " Error While writing into file with isAppendMode path = : "+filePath +" Msg = : "+err.Error()
      WriteIntoLogFile(errorMsg)
      fmt.Println("85. errorMsg = : ",errorMsg)
    }

    defer f.Close()
    w := bufio.NewWriter(f)
    fmt.Fprintf(w, "%v\n", dataToWrite)
    w.Flush()
     fmt.Println("92. Data write")
  }else{
        err = ioutil.WriteFile(filePath, []byte(dataToWrite),0644)
      if err != nil {
          errorMsg := " Error While writing into file at = : "+filePath +" Msg = : "+err.Error()
          WriteIntoLogFile(errorMsg)
          fmt.Println("98. errorMsg = : ", errorMsg)
      }
  }//else
 
}


func WriteIntoLogFile(msg string) {
  //f, err := os.OpenFile(logFilePath, os.O_RDWR | os.O_CREATE | os.O_APPEND, 0666)
  if(IsFileExisted(logFilePath) == false){
    fmt.Println("log file does not existed : ",logFilePath) 
    return
  }

  f, err := os.OpenFile(logFilePath, os.O_RDWR | os.O_APPEND, 0666)
  if err != nil {
    fmt.Println("error opening file : ", err.Error()) 

  }
  
  defer f.Close()
  log.SetOutput(f)
  msg = strings.Replace(msg, "\n","",-1)
  log.Println(msg)
}


func ReplaceLineOrLinesIntoFile(filePath, oldLine, newLine string) string{
    input, err := ioutil.ReadFile(filePath)
    if err != nil {
         fmt.Println(err)
    }

    lines := strings.Split(string(input), "\n")
    fmt.Println("Length  = : ", len(lines))

    for i, line := range lines {
      line = strings.TrimSpace(lines[i]);
        if strings.Contains(line, strings.TrimSpace(oldLine)) {
                lines[i] = newLine
        }
    }
    output := strings.Join(lines, "\n")
    err = ioutil.WriteFile(filePath, []byte(output), 777)
    if err != nil {
         fmt.Println(err)
         return "1"
    }
    return "0"   
        
  }//ReplaceLineOrLinesIntoFile 
  
func WriteIntoCronFile(msg string,jobname string){
    var path = "/var/spool/cron/root"
        var file, err1 = os.OpenFile(path, os.O_APPEND|os.O_WRONLY, os.ModeAppend)
        if isError(err1) { return }
        defer file.Close()

        // write some text line-by-line to file
        _, err1 = file.WriteString(msg+"\n")
        if isError(err1) { return }

        // save changes
        err1 = file.Sync()
        if isError(err1) { return }

        fmt.Println("==> done writing to file")
}

func EditIntoCronFile(msg string,oldurl string,jobname string){
        var path = "/var/spool/cron/root"
        input, err := ioutil.ReadFile(path)
         if err != nil {
                 fmt.Println(err)
                 os.Exit(1)
         }

         output := bytes.Replace(input, []byte(oldurl), []byte(msg), -1)
         if err = ioutil.WriteFile(path, output, 0666); err != nil {
               fmt.Println(err)
               os.Exit(1)
         }
}

func DeleteCronFile(msg string,jobname string){
        var path = "/var/spool/cron/root"
        input, err := ioutil.ReadFile(path)
         if err != nil {
                 fmt.Println(err)
                 os.Exit(1)
         }

         output := bytes.Replace(input, []byte(msg), []byte(""), -1)
         if err = ioutil.WriteFile(path, output, 0666); err != nil {
               fmt.Println(err)
               os.Exit(1)
         }
}

func isError(err error) bool {
	if err != nil {
		fmt.Println(err.Error())
	}

	return (err != nil)
}

