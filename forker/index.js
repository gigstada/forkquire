const callSites = require("callsites");
const errio = require("errio");
const fork = require("child_process").fork;
const path = require("path");
const resolve = require("resolve");

function getForkerFn(moduleId) {

    const callerPath = callSites()[1].getFileName();

    const resolveOptions = {
        basedir: path.dirname(callerPath)
    }

    const targetModulePath = resolve.sync(moduleId, resolveOptions);

    const targetModule = require(targetModulePath);

    if (typeof targetModule !== "function") {
        throw new Error(`Module at ${targetModulePath} must export a function to work with forkquire.`);
    }

    function forkerFn(...args) {

        if (args.some(arg => typeof arg === "function")) {
            throw new Error("A function was passed in as an argument to the forkquired function. " + 
            "You should only supply serializable arguments.")
        }

        return new Promise((resolve, reject) => {

            const forkedPath = path.join(__dirname, "../forked");

            const childProcess = fork(forkedPath);

            childProcess.on("message", message => {

                if (message.type !== "result") return;
                
                if (message.state === "resolved") {
                    
                    resolve(message.value);
                } else {
            
                    if (message.valIsError) {
                        message.value = errio.parse(message.value);
                    }
            
                    reject(message.value);
                }
            });

            childProcess.send({
                type: "invoke",
                modulePath: targetModulePath,
                arguments: args
            });
        });
    }

    return forkerFn;
}

module.exports = getForkerFn;