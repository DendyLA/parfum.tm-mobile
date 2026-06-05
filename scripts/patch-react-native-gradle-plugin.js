const fs = require("fs");
const path = require("path");

const settingsPath = path.join(
    __dirname,
    "..",
    "node_modules",
    "@react-native",
    "gradle-plugin",
    "settings.gradle.kts"
);

if (!fs.existsSync(settingsPath)) {
    console.log("React Native Gradle plugin settings file was not found.");
    process.exit(0);
}

const original = fs.readFileSync(settingsPath, "utf8");
const patched = original.replace(
    'id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0")',
    'id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0")'
);

if (patched !== original) {
    fs.writeFileSync(settingsPath, patched);
    console.log("Patched React Native Gradle plugin foojay resolver to 1.0.0.");
} else {
    console.log("React Native Gradle plugin foojay resolver patch already applied.");
}
