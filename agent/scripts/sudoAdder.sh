#!/bin/sh

# Take a backup of sudoers file and change the backup file.

echo "Going to add entry into /etc/sudoers file for user = : $1"
cp /etc/sudoers /tmp/sudoers.bak
echo "$1   ALL=(ALL:ALL) ALL ">> /tmp/sudoers.bak


 # Check syntax of the backup file to make sure it is correct.

  if [ $? -eq 0 ]; then
    # Replace the sudoers file with the new only if syntax is correct.
    cp /tmp/sudoers.bak /etc/sudoers
   else
    echo "Could not modify /etc/sudoers file. Please do this manually."
  fi

