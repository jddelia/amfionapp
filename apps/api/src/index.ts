import { buildServer } from "./server";
import { config } from "./config";

const app = buildServer();

app
  .listen({ port: config.PORT, host: config.HOST })
  .then((address) => {
    app.log.info({ address }, "API server listening");
  })
  .catch((error) => {
    app.log.error(error, "Failed to start API server");
    process.exit(1);
  });
