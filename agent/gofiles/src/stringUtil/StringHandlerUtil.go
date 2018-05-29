

package stringUtil

import (
  _ "fmt" // for unused variable issue
    "strings"
)



func RemoveSpace(words string)(string){

  words = strings.TrimSpace(words)
  list := strings.Split(words," ")
  if(len(list) == 0){
    return words;
  }
  sent := ""

  for i := 0; i <  len(list); i++ {
     if(len(sent) ==0){
       sent = strings.TrimSpace(list[i]);
     }else{
       sent = sent+"-"+strings.TrimSpace(list[i]);
     }
  }
  return sent;
}

func FindKey(info string)(string){
  keys := [6]string{"Architecture", "Model name", "CPU(s)", "ID", "ID_LIKE", "PRETTY_NAME"}
  val := ""
  info = strings.TrimSpace(info)
  list := strings.Split(info,"\n")
  for i := 0; i <  len(list); i++ {
     data := list[i];

      if(strings.Contains(data, ":")){
       data = strings.Replace(data, ":", "=", -1)
      } 

       list2 := strings.Split(data,"=")
       for j := 0 ; j < len(keys); j++{
          if(strings.TrimSpace(list2[0] ) == keys[j]){
            formattedKey := RemoveSpace(keys[j])
            formattedValue := RemoveSpace(list2[1])
            if(len(val) ==0){
              val = formattedKey +":"+formattedValue
            }else{
              val = val + ","+formattedKey +":"+formattedValue
            }
          }

        }
   }
   val = strings.Replace(val, "\"", "", -1)
   return val;
}



