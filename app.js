const fs = require('fs');
const { exec } = require('child_process');
const args = process.argv;
const path = require('path');
process.stdin.setEncoding('utf8');
process.stdout.setEncoding('utf8');

let repoPath = args[2];
let exportPath = args[3];
let exportFileName = args[4];
if (repoPath == undefined) {
    repoPath = "./"
}
if (exportPath == undefined) {
    exportPath = "./"
}
if (exportFileName == undefined) {
    const date = new Date();
    exportFileName = "export-" + date.getFullYear() + String(date.getMonth() + 1).padStart(2, '0') + String(date.getDate()).padStart(2, '0') + ".html";
}

process.chdir(repoPath);

let datesArrayInsertions = {};
let datesArrayDeletions = {};
let datesArrayFetchStatusString = "Not started";
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
    fs.writeFile(exportPath + exportFileName, htmlTemplate, (err) => {
        exec("git log --format='%aN' | sort -uf", { cwd: '' }, (error, stdout, stderr) => {
            // explation of command - git log of authors names --format='%aN'. After that sort the list with unqiue filter -u, and use case-insensitive with -f
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
                // Commits including insertions and maybe deletions
                totalCommits++;
                var formatOutputLine = formatOutput[i].split(",")
                totalInsertions += parseInt(formatOutputLine[1]);
                totalInsertionsForRepo += parseInt(formatOutputLine[1]);
                if (formatOutputLine.length == 3) {
                    totalDeletions += parseInt(formatOutputLine[2]);
                    totalDeletionsForRepo += parseInt(formatOutputLine[2]);
                }
            } else if (/^[1-9]/.test(formatOutput[i].trim()) && formatOutput[i].includes(" deletion")) {
                // Commits just including deletions
                totalCommits++;
                var formatOutputLine = formatOutput[i].split(",")
                totalDeletions += parseInt(formatOutputLine[1]);
                totalDeletionsForRepo += parseInt(formatOutputLine[1]);
            }
        }

        dataToWrite += "<div><strong>" + name + " (" + totalCommits + " commits)</strong></div>";
        dataToWrite += "Total insertions: " + totalInsertions.toLocaleString() + "<br>";
        dataToWrite += "Total deletions: " + totalDeletions.toLocaleString() + "<br>";
        dataToWrite += "<br>";
        userListStatus[i] = true;

        // Handle next user in list
        if (userList[i + 1] != undefined) {
            getInfoForUser(userList[i + 1], i + 1)
        }
        return;
    });
}

function getInfoForDates() {
    var totalInsertions = 0;
    var totalDeletions = 0;

    console.log("\nFetching date information...")
    exec(`git log --shortstat`, { cwd: '' }, (error, stdout, stderr) => {
        let formatOutput = stdout.trim().split("\n");
        let dateString = "";
        for (let i = 0; i < formatOutput.length; i++) {
            if (formatOutput[i].includes("Date:")) {
                // Get date string
                dateString = formatOutput[i].replace("Date:   ", "").trim().split(" ")[1] + " " + formatOutput[i].replace("Date:   ", "").trim().split(" ")[4];
            }
            if (/^[1-9]/.test(formatOutput[i].trim()) && formatOutput[i].includes(" insertion")) {
                // Commits including insertions and maybe deletions
                var formatOutputLine = formatOutput[i].split(",")
                totalInsertions += parseInt(formatOutputLine[1]);
                if (formatOutputLine.length == 3) {
                    totalDeletions += parseInt(formatOutputLine[2]);
                }
            } else if (/^[1-9]/.test(formatOutput[i].trim()) && formatOutput[i].includes(" deletion")) {
                // Commits just including deletions
                var formatOutputLine = formatOutput[i].split(",")
                totalDeletions += parseInt(formatOutputLine[1]);
            }

            if (dateString != "") {
                datesArrayInsertions[dateString] = totalInsertions.toLocaleString();
                datesArrayDeletions[dateString] = totalDeletions.toLocaleString();
            }
        }

        datesArrayFetchStatusString = "Completed";
        return;
    });
}

function validateStatus() {
    for (let i = 0; i < userListStatus.length; i++) {
        if (userListStatus[i] == false) {
            return;
        }
    }

    if (datesArrayFetchStatusString == "Not started") {
        datesArrayFetchStatusString = "Processing";
        getInfoForDates();
    }

    console.log("...");

    if (datesArrayFetchStatusString != "Completed") {
        return;
    }

    AppendDataToIndex(dataToWrite);
}

function AppendDataToIndex(dataToAdd) {
    dataToAdd += "<br>";
    dataToAdd += "Total insertions for entire repo: " + totalInsertionsForRepo.toLocaleString() + "<br>";
    dataToAdd += "Total deletions for entire repo: " + totalDeletionsForRepo.toLocaleString() + "<br><br>";

    dataToAdd += "<br><div><strong>Insertions for dates</strong></div>"
    for (let key in datesArrayInsertions) {
        dataToAdd += key + ": " + datesArrayInsertions[key] + "<br>";
    }

    dataToAdd += "<br><div><strong>Deletions for dates</strong></div>"
    for (let key in datesArrayDeletions) {
        dataToAdd += key + ": " + datesArrayDeletions[key] + "<br>";
    }

    fs.readFile(exportPath + exportFileName, function (err, readData) {
        let DataToAddReplace = readData.toString().replace("Error reading log", dataToAdd)

        fs.writeFile(exportPath + exportFileName, DataToAddReplace, (err) => {
            openInBrowser(exportPath + exportFileName);
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


