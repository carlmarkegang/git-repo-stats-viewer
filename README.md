# git-repo-stats-viewer

# To do
loop rows in getInfo function 


# Idea
Fetching data for user1...
replace "Error fetching data" with info
set interval "progress" 1/10 done

# Run
node app.js

# compile
npm install -g pkg  
pkg app.js  

# commands

git log --format='%aN' | sort -u

git log --author="USER" --shortstat --pretty="%an" | awk '/^[[:alpha:]]/ {user=$0} /files? changed/ {files+=$1; inserts+=$4; deletes+=$6} END {print user ": " inserts " lines added, " deletes " lines removed"}'