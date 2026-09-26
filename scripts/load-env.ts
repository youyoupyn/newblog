import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 脚本不会像 Next 那样自动读取 .env，
 * 这个模块必须在其他 import 之前引入。
 */
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
