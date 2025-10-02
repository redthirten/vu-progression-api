// healthcheck.js
import { get } from "http";

const options = {
    host: "localhost",
    port: process.env.PORT || 3000,
    path: "/",
    timeout: 2000 // ms
};

const req = get(options, (res) => {
    if (res.statusCode === 200) {
        process.exit(0); // healthy
    } else {
        process.exit(1); // unhealthy
    }
});

req.on("error", () => process.exit(1)); // connection failed

req.setTimeout(options.timeout, () => {
    req.destroy();
    process.exit(1);
});
