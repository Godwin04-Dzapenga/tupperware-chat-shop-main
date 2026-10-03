import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "change-me",
      cookieSecret: process.env.COOKIE_SECRET || "change-me",
    },
  },
  admin: {
    backendUrl:
      process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/paynow",
            id: "paynow",
            options: {
              integrationId: process.env.PAYNOW_INTEGRATION_ID,
              integrationKey: process.env.PAYNOW_INTEGRATION_KEY,
              returnUrl: process.env.PAYNOW_RETURN_URL || "http://localhost:8080/checkout",
              resultUrl:
                process.env.PAYNOW_RESULT_URL ||
                "http://localhost:9000/hooks/payment/paynow_paynow",
            },
          },
        ],
      },
    },
  ],
})
