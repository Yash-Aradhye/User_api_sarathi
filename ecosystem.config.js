// ecosystem.config.js
export const apps = [{
    name: "user-api",
    script: "src/index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "500M",
    env: {
        NODE_ENV: "production"
    }
}];