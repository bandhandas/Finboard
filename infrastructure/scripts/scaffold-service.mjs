#!/usr/bin/env node
/**
 * Scaffolds industry-standard microservice layout.
 * Usage: node infrastructure/scripts/scaffold-service.mjs auth-service auth
 */
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const [serviceName, moduleName] = process.argv.slice(2);
if (!serviceName || !moduleName) {
  console.error("Usage: scaffold-service.mjs <service-name> <module-name>");
  process.exit(1);
}

const root = new URL("../../services/", import.meta.url);
const base = join(root.pathname, serviceName);

const dirs = [
  "src/config",
  "src/bootstrap",
  "src/common/middleware",
  "src/common/helpers",
  "src/common/constants",
  "src/infrastructure/database",
  "src/infrastructure/cache",
  "src/infrastructure/queue",
  "src/infrastructure/providers",
  "src/infrastructure/storage",
  `src/modules/${moduleName}/controllers`,
  `src/modules/${moduleName}/services`,
  `src/modules/${moduleName}/repositories`,
  `src/modules/${moduleName}/models`,
  `src/modules/${moduleName}/routes`,
  `src/modules/${moduleName}/dto`,
  `src/modules/${moduleName}/validators`,
  `src/modules/${moduleName}/events`,
  `src/modules/${moduleName}/jobs`,
  `src/modules/${moduleName}/middleware`,
  `src/modules/${moduleName}/constants`,
  `src/modules/${moduleName}/errors`,
  `src/modules/${moduleName}/utils`,
  "tests/unit",
  "tests/integration",
  "tests/e2e"
];

for (const dir of dirs) {
  mkdirSync(join(base, dir), { recursive: true });
}

const pkgName = `@finboard/${serviceName}`;
const port = {
  "api-gateway": 4000,
  "auth-service": 4001,
  "profile-service": 4002,
  "kyc-service": 4003,
  "ocr-service": 4004,
  "identity-service": 4009,
  "banking-service": 4005,
  "investment-service": 4006,
  "portfolio-service": 4011,
  "notification-service": 4007,
  "audit-service": 4008,
  "admin-service": 4012,
  "search-service": 4013
}[serviceName] || 4099;

if (!existsSync(join(base, "package.json"))) {
  writeFileSync(
    join(base, "package.json"),
    JSON.stringify(
      {
        name: pkgName,
        version: "1.0.0",
        private: true,
        type: "module",
        main: "src/server.js",
        scripts: {
          dev: `PORT=${port} nodemon --env-file ../../.env src/server.js`,
          start: "node --env-file ../../.env src/server.js",
          test: "node --test tests/unit/**/*.test.js"
        },
        dependencies: {
          "@finboard/config": "workspace:*",
          "@finboard/contracts": "workspace:*",
          "@finboard/errors": "workspace:*",
          "@finboard/logger": "workspace:*",
          "@finboard/service-kit": "workspace:*",
          "@finboard/shared": "workspace:*"
        },
        devDependencies: { nodemon: "^3.1.10" }
      },
      null,
      2
    )
  );
}

if (!existsSync(join(base, "README.md"))) {
  writeFileSync(
    join(base, "README.md"),
    `# ${pkgName}\n\nFinboard microservice — \`${moduleName}\` domain.\n\n## Run\n\n\`\`\`bash\npnpm --filter ${pkgName} dev\n\`\`\`\n`
  );
}

if (!existsSync(join(base, "Dockerfile"))) {
  writeFileSync(
    join(base, "Dockerfile"),
    `FROM node:22-alpine\nWORKDIR /app\nCOPY package.json ./\nRUN npm install --omit=dev\nCOPY src ./src\nENV NODE_ENV=production\nCMD ["node", "--env-file", "/app/.env", "src/server.js"]\n`
  );
}

if (!existsSync(join(base, `src/modules/${moduleName}/index.js`))) {
  writeFileSync(join(base, `src/modules/${moduleName}/index.js`), `// ${moduleName} module barrel\n`);
}

console.log(`Scaffolded ${serviceName} (${moduleName})`);
