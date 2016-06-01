import json

DATA_DIR = "../data/"

GOAL_HEIGHT = int(raw_input("use height:\n"))

def examineJson(fileid):
	# get file name
	filename = DATA_DIR + str(fileid) + ".json"
	openfile = json.load(file(filename))
	print openfile
	print openfile['blocks'][0]['hash']

examineJson(GOAL_HEIGHT)