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
let data = `<h1>Test</h1>
<div>Error reading log</div>`;


fs.writeFile('index.html', data, (err) => { });


exec("git log --format='%aN' | sort -u", { cwd: '' }, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing command: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
    }

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
        userListStatus[i] = true;
        let formatOutput = stdout.trim().split("\n");
        dataToWrite += "<div><strong>" + name + "</strong></div>";
        for (let i = 0; i < formatOutput.length; i++) {
            if (formatOutput[i] == "" || formatOutput[i] == name) {
                continue;
            }
            dataToWrite += formatOutput[i] + "<br>";
        }

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

