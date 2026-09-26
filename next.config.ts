import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // libsql 是原生依赖，必须交给 Node 直接 require，不能被打包
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
