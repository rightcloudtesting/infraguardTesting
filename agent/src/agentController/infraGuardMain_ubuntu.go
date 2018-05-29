

package main
// version No 2 dated :- 10-May-2017
import (
    //"fmt"
    "fileUtil"
    "github.com/jasonlvhit/gocron"  // go get github.com/robfig/cron
)

var freqToHitApi_InSeconds uint64 = 20

var propertyMap map[string]string
func main() {
  scheduleAgentjob()
  
}//main


func scheduleAgentjob(){
  scheduler := gocron.NewScheduler()
  scheduler.Every(freqToHitApi_InSeconds).Seconds().Do(seekNextWork)
  <- scheduler.Start()
}


func seekNextWork(){
    fileUtil.WriteIntoLogFile("Fired after 20 seconds")
 
}

