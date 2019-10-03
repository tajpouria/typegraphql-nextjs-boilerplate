module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    forceExit: true,
    verbose: true,
    setupFilesAfterEnv: ["./jest.setup.js"]
};
