import express, { type Express } from "express";
import cors from "cors";
import path from "node:path";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const webDirectory = path.resolve(process.cwd(), "../toddlebee/dist/public");
  app.use(express.static(webDirectory, { index: false }));
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found" });
  });
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(webDirectory, "index.html"));
  });
}

export default app;
