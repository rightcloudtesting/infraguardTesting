

package stringUtil

import (
  _ "fmt" // for unused variable issue
    "strings"
    "math/rand"
    "time"
)

const zigZagWords = "abcdeFGHijkLMNOpqrstuvwXYZ0123456789"
var r *rand.Rand 

func SplitData(data, delim string)([]string){
   data = strings.TrimSpace(data)
   if(len(data) > 0 ){
    return strings.Split(data, delim)
  }else{
    return nil
  }
}

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



func init() {
  r = rand.New(rand.NewSource(time.Now().UnixNano()))
}

func GetRandomString(strlen int) string {
  result := make([]byte, strlen)
  for i := range result {
    result[i] = zigZagWords[r.Intn(len(zigZagWords))]
  }
  return string(result)
}


func RemoveSymplos(word string, symbols... string)(string){
    for _, v := range symbols {
         word = strings.Replace(word, v, "", -1)
    }
    return word
}

func IsInvalidString(data string, requiredMinLength int, 
  requiredMaxLength int, removeBlankSpaces string) string{

  if(len(data) == 0){
    return "yes"
  }
  if(strings.ToLower(removeBlankSpaces) == "yes"){
     data = strings.TrimSpace(data)
      if(len(data) == 0){
        return "yes"
      }
  }
  if(len(data) < requiredMinLength){
     return "yes"
  }

  if(requiredMaxLength > 0 && len(data) > requiredMaxLength){
     return "yes"
  }
  return "no"

}

func CompareString_I(str1, str2 string)bool{
  str1 = strings.TrimSpace(str1)
  str2 = strings.TrimSpace(str2)
  if(len(str1) > 0 && len(str2) > 0){
    str1 = strings.ToLower(str1) 
    str2 = strings.ToLower(str2) 
    return str1 == str2
  }
  return false;

}