const fs = require('fs');
const { exec } = require('child_process');
const args = process.argv;


let repoPath = args[2];
let data = '<h1>Test</h1><pre>';

if (repoPath == undefined) {
    repoPath = "empty"
}
console.log("argument: " + repoPath);

fs.writeFile('index.html', data, (err) => {
    if (err) {
        console.error('Error writing to file:', err);
    } else {
        console.log('File written successfully!');
    }
});


exec("git log --format='%aN' | sort -u", { cwd: '' }, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing command: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
    }

    splitText = stdout.split("\n");
    for (let i = 0; i < splitText.length; i++) {
        getInfo(splitText[i].replace("'", "").replace("'", ""));
      }
    
});


function getInfo(name) {
    exec(`git log --author="${name}" --shortstat --pretty="%an"`, { cwd: '' }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }

        AppendDataToIndex(stdout)
        return stdout;
    });

}

function AppendDataToIndex(dataToAdd) {
    fs.appendFile('index.html', dataToAdd, (err) => {
        if (err) {
            console.error('Error appending to file:', err);
        } else {
            console.log('Data appended to file successfully!');
        }
    });
}