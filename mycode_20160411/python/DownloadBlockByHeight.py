# based on the api provided by block chain on https://blockchain.info/api
# the api to download block 0 by its height is:
# https://blockchain.info/block-height/0?format=json

import urllib                                                     
import urllib2                                                    
import re

# define the variables
MODE = 0
HEIGHT = 0
MIN = 0
MAX = 0
LOCAL_DIR = "../data/"

tmp_command = raw_input("Range(R) or Single(S)?\n")
#print tmp_command
if tmp_command == 'R':
	MODE = 1
else:
	MODE = 0
#print "mode = " + str(MODE) # debug
if (MODE == 0):
	HEIGHT = int(raw_input("Block at which height do you want? (number only)\n"))
	#print HEIGHT + 1 # debug
else:
	MIN = int(raw_input("from what height (min)? (no negative, integer only)\n"))
	MAX = int(raw_input("to what height (max)? (no negative, integer only)\n"))

def DownloadBlockByHeight(goalheight):
	print "visiting block of height " + str(goalheight)
	goalurl = "https://blockchain.info/block-height/" + str(goalheight) + "?format=json"
	filename = str(goalheight) + ".json"
	print "storing content on " + goalurl + " in " + LOCAL_DIR + filename
	#req = urllib2.Request(goalurl)
	#f = urllib2.urlopen(req)
	#for eachline in f:
	#	print eachline
	#pass
	try:
		urllib.urlretrieve(goalurl, LOCAL_DIR + filename)
	except Exception,e:
		print "error warn:" + goalurl 

if MODE == 0:
	DownloadBlockByHeight(HEIGHT)
else:
	for h in range(MIN, MAX + 1):
		DownloadBlockByHeight(h)