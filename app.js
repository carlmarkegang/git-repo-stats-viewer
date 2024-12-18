const fs = require('fs');
const { exec } = require('child_process');
const args = process.argv;
const path = require('path');

let repoPath = args[2];
let exportPath = args[3];
if (repoPath == undefined) {
    repoPath = "./"
}
if (exportPath == undefined) {
    exportPath = "./"
}
process.chdir(repoPath);
process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');

let totalInsertionsForRepo = 0;
let totalDeletionsForRepo = 0;
let dataToWrite = "";
let userList = [];
let userListStatus = [];
let htmlTemplate = `<h1>Stats for /${path.basename(process.cwd())}/</h1>
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

.maincontainer {
    margin: 0 auto 100px auto;
    width: 900px;
}
</style>`;



function validateBeforeStartProcessing() {
    exec("git rev-parse --is-inside-work-tree", { cwd: '' }, (error, stdout, stderr) => {
        if (stdout.includes("true")) {
            startProcessing();
        } else {
            console.log(stderr.toString());
        }
    });
}

function startProcessing() {
    console.log("Listing users please wait... \n");

    fs.writeFile(exportPath + 'index.html', htmlTemplate, (err) => {
        exec("git log --format='%aN' | sort -u", { cwd: '' }, (error, stdout, stderr) => {
            splitText = stdout.trim().split("\n");
            for (let i = 0; i < splitText.length; i++) {
                let username = splitText[i].replace("'", "").replace("'", "");
                userList.push(username);
                userListStatus.push(false);
            }
            getInfoForUser(userList[0], 0);
            const validateStatusInterval = setInterval(validateStatus, 3000);
        });
    });
}

function getInfoForUser(name, i) {
    var totalCommits = 0;
    var totalInsertions = 0;
    var totalDeletions = 0;

    exec(`git log --author="${name}" --shortstat`, { cwd: '' }, (error, stdout, stderr) => {
        console.log("Reading data for: " + name)
        let formatOutput = stdout.trim().split("\n");

        for (let i = 0; i < formatOutput.length; i++) {
            if (/^[1-9]/.test(formatOutput[i].trim()) && formatOutput[i].includes(" insertion")) {
                totalCommits++;
                var formatOutputLine = formatOutput[i].split(",")
                totalInsertions += parseInt(formatOutputLine[1]);
                totalInsertionsForRepo += parseInt(formatOutputLine[1]);
                if (formatOutputLine.length == 3) {
                    totalDeletions += parseInt(formatOutputLine[2]);
                    totalDeletionsForRepo += parseInt(formatOutputLine[2]);
                }
            }
        }

        dataToWrite += "<div><strong>" + name + " (" + totalCommits + " commits)</strong></div>";
        dataToWrite += "Total insertions: " + totalInsertions.toLocaleString() + "<br>";
        dataToWrite += "Total deletions: " + totalDeletions.toLocaleString() + "<br>";
        dataToWrite += "<br>";
        userListStatus[i] = true;
        if(userList[i+1] != undefined){ 
            getInfoForUser(userList[i+1], i+1)
        }
        return;
    });
}

function validateStatus() {
    for (let i = 0; i < userListStatus.length; i++) {
        if (userListStatus[i] == false) {
            return;
        }
    }

    dataToWrite += "<br><br>"
    dataToWrite += "Total insertions for entire repo: " + totalInsertionsForRepo.toLocaleString() + "<br>";
    dataToWrite += "Total deletions for entire repo: " + totalDeletionsForRepo.toLocaleString() + "<br>";
    AppendDataToIndex(dataToWrite);
}

function AppendDataToIndex(dataToAdd) {
    fs.readFile(exportPath + 'index.html', function (err, readData) {
        let DataToAddReplace = readData.toString().replace("Error reading log", dataToAdd)

        fs.writeFile(exportPath + 'index.html', DataToAddReplace, (err) => {
            openInBrowser(exportPath + 'index.html');
        });
    });
}

function openInBrowser(file) {
    const command = process.platform === 'win32' ? `start "" "${file}"` :
        process.platform === 'darwin' ? `open "${file}"` :
            `xdg-open "${file}"`;

    exec(command, (err) => {
        console.log("\nDone! opening file")
        process.exit();
    });
};





validateBeforeStartProcessing();


