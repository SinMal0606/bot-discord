const dns = require("dns");

function configureDNS() {
    dns.setServers([
        "8.8.8.8",
        "8.8.4.4"
    ]);

    console.log("✅ DNS configured");
}

module.exports = configureDNS;