import { Router } from "express";
import { readFileSync } from "fs";
import path from "path";
import { getEmbeddedAssets } from "../lib/embeddedAssets.js";

const SWAGGER_UI_VERSION = "5.17.14";

const docsHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Callora API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#swagger-ui", deepLinking: true });
    };
  </script>
</body>
</html>`;

/**
 * Public, unauthenticated documentation routes:
 *   GET /              service descriptor (JSON)
 *   GET /api/openapi.json   the OpenAPI 3 contract (docs/openapi.json)
 *   GET /api/docs      Swagger UI rendering of that contract
 */
export function createDocsRouter(): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json({
      success: true,
      service: "callora-backend",
      description: "API gateway, usage metering and billing for the Callora API marketplace",
      docs: "/api/docs",
      openapi: "/api/openapi.json",
      health: "/api/health",
      catalog: "/api/apis",
    });
  });

  router.get("/api/openapi.json", (_req, res) => {
    const spec =
      getEmbeddedAssets()?.openapi ??
      readFileSync(path.resolve(process.cwd(), "docs/openapi.json"), "utf8");
    res.type("application/json").send(spec);
  });

  router.get("/api/docs", (_req, res) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self'",
    );
    res.type("html").send(docsHtml);
  });

  return router;
}
