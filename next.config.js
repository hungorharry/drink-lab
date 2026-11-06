process.env.WATCHPACK_POLLING = "true";
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "firebase/app": path.resolve(__dirname, "node_modules/firebase/app/dist/esm/index.esm.js"),
      "firebase/auth": path.resolve(__dirname, "node_modules/firebase/auth/dist/esm/index.esm.js"),
      "firebase/firestore": path.resolve(__dirname, "node_modules/firebase/firestore/dist/esm/index.esm.js"),
    };
    return config;
  },
};

module.exports = nextConfig;
