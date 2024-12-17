const fs = require('fs');
const { exec } = require('child_process');
const args = process.argv;
let repoPath = args[2];
if (repoPath == undefined) {
    repoPath = "empty"
}

let dataToWrite = "";
let userList = [];
let userListStatus = [];
let data = `<h1>Stats</h1>
<div class="maincontainer"> 
    <div style="font-style: italic; margin-bottom: 30px;">
        <div><strong>Information</strong></div>
        Insertions = total number of added code lines <br>
        Deletions = total number of deleted code lines
    </div>
    <div>Error reading log</div>
</div>
<style>
body {
    margin: 0px;
    font-family: sans-serif;
}

h1 {
    padding: 10px;
    background-color: #181e47;
    color: white;
}

.maincontainer{
    margin:0 auto;
    width:900px;
}
</style>`;


fs.writeFile('index.html', data, (err) => { });


exec("git log --format='%aN' | sort -u", { cwd: '' }, (error, stdout, stderr) => {
    splitText = stdout.trim().split("\n");
    for (let i = 0; i < splitText.length; i++) {
        let username = splitText[i].replace("'", "").replace("'", "");
        userList.push(username);
        userListStatus.push(false);
        getInfo(username, i);
    }

});


function getInfo(name, i) {
    exec(`git log --author="${name}" --shortstat --pretty="%an"`, { cwd: '' }, (error, stdout, stderr) => {
        console.log("Reading data for: " + name)
        
        let formatOutput = stdout.trim().split("\n");
        dataToWrite += "<div><strong>" + name + "</strong></div>";
        totalInsertions = 0;
        totalDeletions = 0;

        for (let i = 0; i < formatOutput.length; i++) {
            if (/^[1-9]/.test(formatOutput[i].trim())) {
                var formatOutputLine = formatOutput[i].split(",")
                //dataToWrite += formatOutputLine[1] + "<br>";

                totalInsertions += parseInt(formatOutputLine[1]);
                if (formatOutputLine.length == 3) {
                    totalDeletions += parseInt(formatOutputLine[2]);
                }
            }
        }
        
        dataToWrite += "Total insertions: " + totalInsertions.toLocaleString() + "<br>";
        dataToWrite += "Total deletions: " + totalDeletions.toLocaleString() + "<br>";
        dataToWrite += "<br>";
        userListStatus[i] = true;
        return stdout;
    });
}

function AppendDataToIndex(dataToAdd) {
    fs.readFile('index.html', function (err, readData) {
        let DataToAddReplace = readData.toString().replace("Error reading log", dataToAdd)

        fs.writeFile('index.html', DataToAddReplace, (err) => {
            process.exit();
        });
    });
}

function validateStatus() {
    for (let i = 0; i < userListStatus.length; i++) {
        if (userListStatus[i] == false) {
            return;
        }
    }
    AppendDataToIndex(dataToWrite);
}

const validateStatusInterval = setInterval(validateStatus, 1000);

