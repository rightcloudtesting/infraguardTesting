#!/bin/bash

# awk BEGIN { 
#    for (i = 0; i < ARGC - 1; ++i) { 
#       printf "ARGV[%d] = %s\n", i, ARGV[i] 
#    } 
# }

echo -e "One Two\nOne Two Three\nOne Two Three Four" | awk 'NF > 2'

awk 'BEGIN { if (match("One Two Three", "ree")) { print RLENGTH } }'
echo "------------"

echo -e "This\nThat\nThere\nTheir\nthese" | awk '/^The/'