

package userMgmt
// version No 1 dated :- 03-Apr-2017
import (
    
    "fmt"
    
     "fileUtil"
     "agentUtil"
    _ "fmt" // for unused variable issue
      "strings" 
      "stringUtil"

)

func AddUser(usrLoginName, preferredShell, pubKey string) string {
   
    removed_dir := "/home/deleted:" + usrLoginName
    home_dir := "/home/" + usrLoginName
    status := ""
      
    if(isUserExist(usrLoginName) == false) {
        if(fileUtil.IsFileExisted(home_dir) == false){
          if(fileUtil.IsFileExisted(removed_dir) == true){
            agentUtil.ExecComand("/bin/mv "+ removed_dir +" "+home_dir, "UserHandler.AddUser() L37")
          }
       }

       if(len(preferredShell) == 0){
          preferredShell =  "/bin/bash"
       }
       
      // Check whether group exists or not, if not, then create it
      
      
      cmd := " /usr/sbin/useradd "+ 
      "-m -d "+home_dir+                       // -d is unnecessary here, but will report error, if omit
      " -s "+preferredShell +
      //" -g "+usrLoginName+
      " "+ usrLoginName
      status = agentUtil.ExecComand(cmd, "UserHandler.AddUser() L60") 

      if(status == "success"){
        msg := "--------- user account "+usrLoginName+" successfully created ---------------"
        fileUtil.WriteIntoLogFile(msg)
        agentUtil.ExecComand("mkdir -p "+home_dir+"/.ssh", "UserHandler.AddUser() L71")
       
        
        fileUtil.WriteIntoFile(home_dir+"/.ssh/authorized_keys", pubKey, false, true)
        status = agentUtil.ExecComand("chmod 700 "+home_dir+"/.ssh; chmod 600 "+home_dir+"/.ssh/authorized_keys", "UserHandler.AddUser() L74")
       // fileUtil.WriteIntoLogFile("status chmod 700 ..."+status)

        status = agentUtil.ExecComand(" chown -R "+ usrLoginName+":"+usrLoginName+ " "+ home_dir, "UserHandler.AddUser() L67")
        //fileUtil.WriteIntoLogFile("status chown ..."+status)

        fmt.Println(msg)
        

      }

    }else{
      fmt.Println("user already existed.")  
      fileUtil.WriteIntoLogFile("----- user already existed. usrLoginName = : "+usrLoginName)
    }
    return status
}

  
func Userdel(userLoginName string,  permanent bool)(string){
 
  removed_dir := "/home/deleted:" + userLoginName
  home_dir := "/home/" + userLoginName
  userId :=  agentUtil.ExecComand("id -u "+userLoginName, "UserHandler.Userdel() L87");
  status := ""
  
  if(userId == "fail"){
    msg := "UserHandler.UserDel(). User does not exist"+userLoginName
    fileUtil.WriteIntoLogFile(msg)
    return "user does not existed"
  }
    
  if(permanent == false ){
    if(fileUtil.IsFileExisted(removed_dir)){
        agentUtil.ExecComand("/bin/rm -rf "+ removed_dir, "UserHandler.Userdel() L96")   
    }

    //Check below line in all version of linux after cross compile
    agentUtil.ExecComand("/usr/bin/pkill -u "+ userId, "UserHandler.Userdel() L100")      
    status = agentUtil.ExecComand("/usr/sbin/userdel "+ userLoginName, "UserHandler.Userdel() L101")      
    agentUtil.ExecComand("/bin/mv "+ home_dir +" "+removed_dir, "UserHandler.Userdel() L102")      
    
  }else{
    status = agentUtil.ExecComand("sudo /usr/sbin/userdel -r "+ userLoginName, "UserHandler.Userdel() L105")      
  }
  Sudoers_del(userLoginName)
  return status
}
 

func Sudoers_del(userLoginName string){
  filePath := "/etc/sudoers.d/" + userLoginName
  if(fileUtil.IsFileExisted(filePath)){
    agentUtil.ExecComand("/bin/rm "+ filePath, "UserHandler.Userdel() L126")
  }
}

/*
  Uses :- To give sudo permission, If user is not a sudo user or a sudo user converted to normal user
*/
func ProcessToChangePrivilege(usrName, privType string) string{
    
    rootPrivGrpName := agentUtil.GetSudo_GrpName() // rootPrivGrpName stores os name i.e On ubuntu, it is 'sudo' & on fedora, it is 'wheel'
    if(len(rootPrivGrpName) == 0){
         msg := "UserHandler.ProcessToChangePrivilege(). Unable to locate sudo/wheel. "+
                    "May be it is commented. Abort further process. L 132."
         fileUtil.WriteIntoLogFile(msg)
         fmt.Println(msg)
         return "1"
    }
    msg := ""
    cmd := ""
    grpOfUser := agentUtil.GetUser_AllGrp(usrName) // grpOfUser stores, all group name in which user is a member
    isUsrHasRootPriv := strings.Contains(grpOfUser, rootPrivGrpName)

     if(privType != "root" && isUsrHasRootPriv == false){
        msg = "User has not sudo permission. "+usrName +" Nothing to do . From ProcessToChangePrivilege(). L150. "
        fileUtil.WriteIntoLogFile(msg)
        return "0"
    }
   
    status := ""
    if(privType == "root"){
      userPwd :=  ChangePwd(usrName)
      
      if(userPwd == "1"){   // 1 indicate unsuccessful execution of create/change user pwd.
          return "1"
      }
      cmd = "usermod -aG "+rootPrivGrpName+" "+usrName
      status = agentUtil.ExecComand(cmd, "UserHandler.ProcessToChangePrivilege() L163")
      
      msg = cmd + " >> Status = : "+status
      fileUtil.WriteIntoLogFile(msg)
      fmt.Println("\n 167. msg = : ", msg)
      if(status == "success"){
          return userPwd
       }
    
    }

    if(privType != "root"){
      cmd = ""
      if(rootPrivGrpName == "wheel"){ // For fedora
        cmd = "gpasswd -d  "+usrName +" "+rootPrivGrpName
        status = agentUtil.ExecComand(cmd, "UserHandler.ProcessToChangePrivilege() L178")
        fileUtil.WriteIntoLogFile("179. status gpasswd -d   = : "+status)
      }

      if(rootPrivGrpName == "sudo"){    // For ubuntu
         cmd = "deluser "+usrName +" "+rootPrivGrpName
         status = agentUtil.ExecComand(cmd, "UserHandler.ProcessToChangePrivilege() L183")
         fileUtil.WriteIntoLogFile("185. status deluser ...   = : "+status)
      }
     
      msg = "\n"+cmd + " >> Status = : "+status
      fileUtil.WriteIntoLogFile(msg)
      fmt.Println("\n\n 194. ****************  msg ", msg)
      if(status == "success"){
        return "0"
      }
    }

   return "1"
}


/*
  Since different distro have different sudo group. e.g in ubuntu it is 'sudo'
  wheaeas  in fedora , sudo group is 'wheel' group
  It is assumed that sudoers group either sudo/wheel are uncommented wherever applicable.
*/


/*func GetSudo_GrpName()string{
  rootPrivGrpName := ""
     status := agentUtil.ExecComand("getent group sudo", "UserHandler.GetSudo_GrpName() L211")
        if(status == "fail"){
            status = agentUtil.ExecComand("getent group wheel", "UserHandler.GetSudo_GrpName() L213")
            if(status != "fail"){
              rootPrivGrpName = "wheel"
            }
        }else{
          rootPrivGrpName = "sudo"
        }
   return rootPrivGrpName    
}

// get all those group name in which user is a member
func getUser_AllGrp(usrName string) string{  
  groupNames := agentUtil.ExecComand("id -nG "+usrName, "UserHandler.getUser_AllGrp() L225")
  return groupNames
}*/


// To become  a root user, user must have a new password
func ChangePwd(usrName string) string{
   userPwd := usrName + stringUtil.GetRandomString(4)
   fmt.Println("randomStr  on 4 = : ", userPwd)
 
   cmd := "usermod --password $(echo "+userPwd+" | openssl passwd -1 -stdin) "+usrName // openssl for encryption
  
   status := agentUtil.ExecComand(cmd, "UserHandler.ChangePwd() L237")
   fmt.Println("239. Status ChangePwd = : ", status)
   msg := cmd +" >> Status = : "+status
  
   fileUtil.WriteIntoLogFile(msg)
   msg = " New Pwd for usrName = : "+usrName + " Is >> "+userPwd


   fileUtil.WriteIntoLogFile("\n"+msg)
   fileUtil.WriteIntoLogFile("\n")


   if(status == "success"){
      return userPwd
   }

   msg = "UserHandler.ChangePwd(). Unable to create/change new pwd. Abort further process. L 246"
   fileUtil.WriteIntoLogFile(msg)
   fmt.Println("166. msg ", msg)
   return "1"

}

func isUserExist(usrName string) bool{
  status := agentUtil.ExecComand("id "+usrName, "UserHandler.isUserExist() L193");
  fmt.Println("33. UserHandler.AddUser()  status = : ", status)

     /* status ='fail' specify error,  'id usrLoginName' returns error due to absence of user existence
        So, below code block process to create new User Account
     */
    if(status == "fail") {
      return false;
    }
    return true;
}



//func UserAccountController(activityName string, nextWork []string, callerLoopCntr int, responseUrl string) (int){
func UserAccountController(activityName string, nextWork []string, callerLoopCntr int, propertyMap map[string]string) (int){
    responseUrl := agentUtil.GetValueFromPropertyMap(propertyMap, "responseUrl_"+activityName)
    if(len(responseUrl) ==0){
       fileUtil.WriteIntoLogFile("There is no response url found for activityName =:"+activityName)
     }
     
    var pubKey, cronUrl,jobName,oldUrl,jobId,scriptName,scriptDesc, rawCommand,rawCommandScript, userName, prefShell, privilege, id string
    var values []string
    if(len(responseUrl) ==0){
       fileUtil.WriteIntoLogFile("Missing response url for activity name = : "+activityName+". >> Abort further process.")
       activityName="" // To ignore processing which is stored in 'activityName' 
    }
    
    if(activityName == "addUser"){
    
        values = stringUtil.SplitData(nextWork[callerLoopCntr+1], agentUtil.Delimiter)
        pubKey = values[1]


        values = stringUtil.SplitData(nextWork[callerLoopCntr+2], agentUtil.Delimiter)
        userName = values[1]
        
        values = stringUtil.SplitData(nextWork[callerLoopCntr+3], agentUtil.Delimiter)
        prefShell = values[1]

        values = stringUtil.SplitData(nextWork[callerLoopCntr+4], agentUtil.Delimiter)
        id = values[1]

      
        msg :=  "Going to add userName = : "+userName
        fmt.Println(msg)
        fileUtil.WriteIntoLogFile(msg)
        status := AddUser(userName, prefShell, pubKey ) 
       
       qryString := "userName="+userName
       agentUtil.SendExecutionStatus(responseUrl, status , id, qryString)
      
        callerLoopCntr += 4
        return callerLoopCntr

    }

    if(activityName == "deleteUser"){
    
        values = stringUtil.SplitData(nextWork[callerLoopCntr+1], agentUtil.Delimiter)
        userName = values[1]

        values = stringUtil.SplitData(nextWork[callerLoopCntr+2], agentUtil.Delimiter)
        id = values[1]

        msg :=  "Going to delete userName = : "+userName
        fmt.Println(msg)
        fileUtil.WriteIntoLogFile(msg)

        status := Userdel(userName, false)
        fmt.Println("status deleteUser  = : ", status)

        qryString := "userName="+userName
        agentUtil.SendExecutionStatus(responseUrl, status , id, qryString)
        callerLoopCntr += 2
        return callerLoopCntr
    }

     if(activityName == "rawCommand"){
	fmt.Println(callerLoopCntr)
	if (len(nextWork) > (callerLoopCntr+1)) {
		i := 0
			for i <= 2 {
				values = stringUtil.SplitData(nextWork[callerLoopCntr+i], agentUtil.Delimiter)
				fileUtil.WriteIntoLogFile("key =: "+values[0])
				switch values[0]{
				case "rawCommand":
					rawCommand = values[1]
					fileUtil.WriteIntoLogFile("rawCommand value =: "+rawCommand)
				case "id":
					id = values[1]
					fileUtil.WriteIntoLogFile("id value =: "+id)
				}
				i = i + 1
			}

		msg :=  "Going to execute command = : "+rawCommand
		fmt.Println(msg)
		fileUtil.WriteIntoLogFile(msg)
		
		status := agentUtil.ExecComand(rawCommand, "AgentUtil.go 328")
		fmt.Println("status rawCommand  = : ", status)

		qryString := status
		agentUtil.SendExecutionStatusForSSH(responseUrl, status , id, qryString)
		callerLoopCntr += 2
	}
        return callerLoopCntr
    }
	
	if(activityName == "rawCommandScript"){
        if (len(nextWork) > (callerLoopCntr+3)) {
				i := 0
				for i <= 4 {
					values = strings.SplitN(nextWork[callerLoopCntr+i], agentUtil.Delimiter, 2)
					fileUtil.WriteIntoLogFile("key =: "+values[0])
					switch values[0]{
					case "script_name":
						scriptName = values[1]
						fileUtil.WriteIntoLogFile("scriptName value =: "+scriptName)
					case "script_desc":
						scriptDesc = values[1]
						fileUtil.WriteIntoLogFile("scriptDesc value =: "+scriptDesc)
					case "script":
						rawCommandScript = values[1]
						fileUtil.WriteIntoLogFile("rawCommandScript value =: "+rawCommandScript)
					case "id":
						id = values[1]
						fileUtil.WriteIntoLogFile("id value =: "+id)
					}
					i = i + 1
				}
			
                status := ""
                msg :=  "Going to execute command = : "+rawCommandScript
                fileUtil.WriteIntoLogFile(msg)
                s := strings.Split(rawCommandScript, "##")
                for i := range s {
                   status += "\n"+agentUtil.ExecComand(s[i], "AgentUtil.go 328")
                }
                fmt.Println("status rawCommandScript  = : ", status)
                qryString := status
                agentUtil.SendExecutionStatusForSSH(responseUrl, status , id, qryString)
				callerLoopCntr += 4
        } 
	 return callerLoopCntr
    }


	
	if(activityName == "createCron"){
		if (len(nextWork) > (callerLoopCntr+3)) {
			i := 0
			for i <= 4 {
				values = stringUtil.SplitData(nextWork[callerLoopCntr+i], agentUtil.Delimiter)
				fileUtil.WriteIntoLogFile("key =: "+values[0])
				switch values[0]{
				case "url":
					cronUrl = values[1]
					fileUtil.WriteIntoLogFile("cronUrl value =: "+cronUrl)
				case "jobName":
					jobName = values[1]
					fileUtil.WriteIntoLogFile("jobName value =: "+jobName)
				case "jobId":
					jobId = values[1]
					fileUtil.WriteIntoLogFile("jobId value =: "+jobId)
				case "id":
					id = values[1]
					fileUtil.WriteIntoLogFile("id value =: "+id)
				}
				i = i + 1
			}
			
			msg :=  "Going to add cron job = : "+cronUrl
			fmt.Println(msg)
			
			fileUtil.WriteIntoCronFile(cronUrl,jobName)
			
			qryString := "abc"
			agentUtil.SendExecutionStatus(responseUrl, "1" , id, qryString)
			callerLoopCntr += 4
		}
		return callerLoopCntr
	}
	
	if(activityName == "editCron"){
		if (len(nextWork) > (callerLoopCntr+4)) {
			i := 0
			for i <= 5 {
				values = stringUtil.SplitData(nextWork[callerLoopCntr+i], agentUtil.Delimiter)
				fileUtil.WriteIntoLogFile("key =: "+values[0])
				switch values[0]{
				case "url":
					cronUrl = values[1]
					fileUtil.WriteIntoLogFile("cronUrl value =: "+cronUrl)
				case "jobName":
					jobName = values[1]
					fileUtil.WriteIntoLogFile("jobName value =: "+jobName)
				case "jobId":
					jobId = values[1]
					fileUtil.WriteIntoLogFile("jobId value =: "+jobId)
				case "oldUrl":
					oldUrl = values[1]
					fileUtil.WriteIntoLogFile("oldUrl value =: "+oldUrl)
				case "id":
					id = values[1]
					fileUtil.WriteIntoLogFile("id value =: "+id)
				}
				i = i + 1
			}
			
			msg :=  "Going to edit cron job = : "+cronUrl
			fmt.Println(msg)
			fileUtil.EditIntoCronFile(cronUrl,oldUrl,jobName)
			
			qryString := "abc"
			agentUtil.SendExecutionStatus(responseUrl, "1" , id, qryString)
			callerLoopCntr += 5
		}
		return callerLoopCntr
	}
	
	if(activityName == "deleteCron"){
		if (len(nextWork) > (callerLoopCntr+3)){
			i := 0
			for i <= 4 {
				values = stringUtil.SplitData(nextWork[callerLoopCntr+i], agentUtil.Delimiter)
				fileUtil.WriteIntoLogFile("key =: "+values[0])
				switch values[0]{
				case "url":
					cronUrl = values[1]
					fileUtil.WriteIntoLogFile("cronUrl value =: "+cronUrl)
				case "jobName":
					jobName = values[1]
					fileUtil.WriteIntoLogFile("jobName value =: "+jobName)
				case "jobId":
					jobId = values[1]
					fileUtil.WriteIntoLogFile("jobId value =: "+jobId)
				case "id":
					id = values[1]
					fileUtil.WriteIntoLogFile("id value =: "+id)
				}
				i = i + 1
			}
			msg :=  "Going to delete cron job = : "+cronUrl
			fmt.Println(msg)
			fileUtil.DeleteCronFile(cronUrl,jobName)
			
			qryString := "abc"
			agentUtil.SendExecutionStatus(responseUrl, "1" , id, qryString)
			callerLoopCntr += 3
		}
		return callerLoopCntr
	}
	
if(activityName == "checkServerStatus"){
	fmt.Println(callerLoopCntr)
	if (len(nextWork) > (callerLoopCntr+1)) {
		i := 0
			for i <= 2 {
				values = stringUtil.SplitData(nextWork[callerLoopCntr+i], agentUtil.Delimiter)
				fileUtil.WriteIntoLogFile("key =: "+values[0])
				switch values[0]{
				case "rawCommand":
					rawCommand = values[1]
					fileUtil.WriteIntoLogFile("rawCommand value =: "+rawCommand)
				case "id":
					id = values[1]
					fileUtil.WriteIntoLogFile("id value =: "+id)
				}
				i = i + 1
			}

		msg :=  "Going to execute command = : "+rawCommand
		fmt.Println(msg)
		fileUtil.WriteIntoLogFile(msg)
		
		status := agentUtil.ExecComand(rawCommand, "AgentUtil.go 328")
		fmt.Println("status rawCommand  = : ", status)

		qryString := status
		agentUtil.SendExecutionStatusForSSH(responseUrl, status , id, qryString)
		callerLoopCntr += 2
	}
        return callerLoopCntr
    }

    if(activityName == "changePrivilege"){
     
      status := ""
      email := ""
        values = stringUtil.SplitData(nextWork[callerLoopCntr+1], agentUtil.Delimiter)
        userName = values[1]

        values = stringUtil.SplitData(nextWork[callerLoopCntr+2], agentUtil.Delimiter)
        privilege = values[1]

        values = stringUtil.SplitData(nextWork[callerLoopCntr+3], agentUtil.Delimiter)
        email = values[1]

        values = stringUtil.SplitData(nextWork[callerLoopCntr+4], agentUtil.Delimiter)
        id = values[1]

        


        
        msg :=  "Going to change privilege for userName = : "+userName+ " Priv = : "+privilege
        fmt.Println(msg)
        fileUtil.WriteIntoLogFile(msg)

        if(isUserExist(userName) == false) {
          msg = "Request to change priviliges for non existed user "+userName +" --> Abort rest process."
          fileUtil.WriteIntoLogFile(msg)
          status = "1"
          
        }else{
           msg := "UserHandler.go L338. ProcessToChangePrivilege. usrName = : "+userName+" >> Requested privilege. Type = : "+privilege
           fmt.Println(msg)
           fileUtil.WriteIntoLogFile(msg)
           status = ProcessToChangePrivilege(userName, privilege)
        }
      
      // if status length is > 4, it means status stores user's new pwd

         msg = "\nUserHandler.go L346. Final status of ProcessToChangePrivilege. status = : "+status
         fmt.Println(msg)
         fileUtil.WriteIntoLogFile(msg)


        if(len(status) > 4){
            qryString := "userName="+userName+"&privilege=root&password="+status
            agentUtil.SendExecutionStatus(responseUrl, "0" , id, qryString) 
            
            urlForEmail_ChangePriv := ""
            DEFAULT_VALUE := agentUtil.GetValueFromPropertyMap(propertyMap, "DEFAULT_VALUE")


            if(email != DEFAULT_VALUE){
              urlForEmail_ChangePriv = agentUtil.GetValueFromPropertyMap(propertyMap, "responseUrl_changePrivEmail")
            }
            
            if(len(email) > 0 || len(urlForEmail_ChangePriv) > 0){
              qryString := "password="+status+"&email="+email
              agentUtil.SendExecutionStatus(urlForEmail_ChangePriv, "0" , id, qryString) 
            }else{
              msg = "Due to missing email/api for email_ChangePriv, unable to send response about mail. "+
                "Email = :  "+email+" >> api for email_ChangePriv = : "+urlForEmail_ChangePriv
               fileUtil.WriteIntoLogFile(msg)
            }
            
        }else{
            qryString := "userName="+userName+"&privilege=normal";
            agentUtil.SendExecutionStatus(responseUrl, status , id, qryString) 
        }
        callerLoopCntr += 4
        return callerLoopCntr
    }


    /*
      ----------------------------------  Lock down server -------------------------------------
      Pssible data format is given below
      activityName:lockDownServer requiredData:{"userList":"ec2-user,pratyush,sampath,piyush,prashant.gyan"} id:5]
    */

     if(activityName == "lockDownServer"){
      
        status := ""
        var userList []string 
        values = stringUtil.SplitData(nextWork[callerLoopCntr+1], agentUtil.Delimiter)
        if(len(values) == 2){
          userList = stringUtil.SplitData(values[1], ",") 
          values = stringUtil.SplitData(nextWork[callerLoopCntr+2], agentUtil.Delimiter)
          id = values[1]
        }
        //lopa ,1000 hai ?
      
       
        fmt.Println("Going to lock Down Server. Deletable users are = : ",userList)
        fileUtil.WriteIntoLogFile("Going to lock Down Server. Following users going to lock = : "+strings.Join(userList,","))
       
        // Below callerLoopCntr is used to control the loop iteration in caller function.
        callerLoopCntr += 2
        unableToLockUserList := ProcessToLockDownServer(userList)
        fmt.Println("L400 unableToLockUserList = : ", unableToLockUserList)
        fileUtil.WriteIntoLogFile("L401 UserHandler unableToLockUserList = : "+ unableToLockUserList)


         if(unableToLockUserList != "0"){
           qryString := "aliveAccount="+unableToLockUserList
           agentUtil.SendExecutionStatus(responseUrl, "0" , id, qryString) 
         }else{
           agentUtil.SendExecutionStatus(responseUrl, "0" , id, "") 
         }
        fmt.Println("334. UserAccountController status lockDownServer  = : ", status) 
        return callerLoopCntr
    }


    if(activityName == "unlockServer"){
        status := ""
        var userList []string 
        values = stringUtil.SplitData(nextWork[callerLoopCntr+1], agentUtil.Delimiter)
        if(len(values) == 2){
          userList = stringUtil.SplitData(values[1], ",") 
          values = stringUtil.SplitData(nextWork[callerLoopCntr+2], agentUtil.Delimiter)
          id = values[1]
        }
    
        fmt.Println("Going to unlock Server. Following users will going to unlock = : ",userList)
        fileUtil.WriteIntoLogFile("Going to lock Down Server. Following users going to unlock = : "+strings.Join(userList,","))
       
        // Below callerLoopCntr is used to control the loop iteration in caller function.
        callerLoopCntr += 2
        unableToUnlockUsers := ProcessToUnlockServer(userList)  
        fmt.Println("L400 unableToUnlockUsers = : ", unableToUnlockUsers)
        fileUtil.WriteIntoLogFile("L401 UserHandler unable To Unlock following users = : "+ unableToUnlockUsers)


         if(unableToUnlockUsers != "0"){
           qryString := "aliveAccount="+unableToUnlockUsers
           agentUtil.SendExecutionStatus(responseUrl, "0" , id, qryString) 
         }else{
           agentUtil.SendExecutionStatus(responseUrl, "0" , id, "") 
         }
        fmt.Println("334. UserAccountController status unlockServer  = : ", status) 
        return callerLoopCntr
    }


    return callerLoopCntr

  }//UserAccountController

  


  func ProcessToLockDownServer(usrList []string ) string{
    unableToLockUserList := ""
     for j := 0; j < len(usrList); j++{
            userName := usrList[j]
           /*
             disallow userName from logging in --> sudo usermod --expiredate 1 userName
             set expiration date of userName to Never :- sudo usermod --expiredate "" userName

             chage -l userNameHere
           */
            status := agentUtil.ExecComand("usermod --expiredate 1 "+ userName, "UserHandler.lockDownServer() L326")
            fmt.Println("status to lock user = : ",status)

            msg :=  "Locking status of user =: "+userName +" is "+status
            fmt.Println(msg)
            fileUtil.WriteIntoLogFile(msg)
            if(status != "success"){
              if(len(unableToLockUserList) == 0){
                unableToLockUserList = userName
              }else{
                unableToLockUserList = unableToLockUserList+ ","+userName
              }
            }

         }


      if(len(unableToLockUserList) == 0){
        return "0"
      }
      return unableToLockUserList


  }//ProcessToLockDownServer

  func ProcessToUnlockServer(usrList []string ) string{
    unableToUnlockUserList := "" // unableToLockUserList
     for j := 0; j < len(usrList); j++{
            userName := usrList[j]
           /*
             disallow userName from logging in --> sudo usermod --expiredate 1 userName
             set expiration date of userName to Never :- sudo usermod --expiredate "" userName
             chage -l userNameHere
           */
            status := agentUtil.ExecComand("usermod --expiredate \"\" "+ userName, "UserHandler.UnlockServer() L504")
            fmt.Println("status to unlock user = : ",status)

            msg :=  "Unlocking status of user =: "+userName +" is "+status
            fmt.Println(msg)
            fileUtil.WriteIntoLogFile(msg)
            if(status != "success"){
              if(len(unableToUnlockUserList) == 0){
                unableToUnlockUserList = userName
              }else{
                unableToUnlockUserList = unableToUnlockUserList+ ","+userName
              }
            }

         }

      if(len(unableToUnlockUserList) == 0){
        return "0"
      }
      return unableToUnlockUserList

  }//ProcessToLockDownServer

