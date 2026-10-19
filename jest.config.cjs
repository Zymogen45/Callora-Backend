const quarantined =
  process.env.JEST_RUN_QUARANTINED === "1" ? [] : require("./jest.quarantine.json");

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/?(*.)+(spec|test).ts"],
  // Suites listed in jest.quarantine.json are known-broken (see docs/guides/quarantined-tests.md)
  // and are skipped by default; set JEST_RUN_QUARANTINED=1 to run them.
  testPathIgnorePatterns: ["/node_modules/", ...quarantined.map((f) => "<rootDir>/" + f)],
  transformIgnorePatterns: ["/node_modules/(?!.*uuid)"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node16",
          isolatedModules: true,
        },
      },
    ],
    "^.+\\.js$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node16",
          isolatedModules: true,
          allowJs: true,
        },
      },
    ],
  },
  setupFiles: ["<rootDir>/jest.env-setup.cjs"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
