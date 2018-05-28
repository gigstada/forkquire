process.on("message", async message => {

    if (message.type !== "invoke") return;

    const mod = require(message.modulePath);

    let response = {
        type: "result"
    };

    try {
        response.value = await mod(...message.arguments);
        response.state = "resolved";
    } catch (err) {

        if (err instanceof Error) {
            err = require("errio").stringify(err, {stack: true});
            response.valIsError = true;
        }

        response.value = err;
        response.state = "rejected";
    }
    
    process.send(response, () => {
        process.disconnect();
    });
});