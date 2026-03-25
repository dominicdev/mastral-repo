import { r as require_token_util } from './chunk-CCDCBWFG.mjs';
import { s as __commonJS, t as require_token_error } from './index.mjs';
import '@mastra/core/evals/scoreTraces';
import '@mastra/core/mastra';
import '@mastra/loggers';
import '@mastra/libsql';
import '@mastra/observability';
import '@mastra/core/workflows';
import 'zod';
import '@mastra/core/agent';
import '@mastra/memory';
import './tools/183b61b3-d27e-4eec-8dee-32c86996857e.mjs';
import '@mastra/core/tools';
import './tools/5efd5e46-a7d4-4657-800c-8c4b0cc37113.mjs';
import './tools/115e0e10-133d-471c-bb98-7655c5922971.mjs';
import 'fs/promises';
import 'https';
import 'path';
import 'url';
import 'http';
import 'http2';
import 'stream';
import 'crypto';
import 'fs';
import 'process';
import 'zod/v4';
import 'zod/v3';
import '@mastra/core/schema';
import '@mastra/core/utils/zod-to-json';
import '@mastra/core/workspace';
import '@mastra/core/processors';
import '@mastra/core/error';
import '@mastra/core/features';
import '@mastra/core/llm';
import '@mastra/core/request-context';
import '@mastra/core/evals';
import '@mastra/core/storage';
import '@mastra/core/utils';
import '@mastra/core/a2a';
import 'stream/web';
import '@mastra/core/memory';
import 'child_process';
import 'module';
import 'util';
import 'os';
import '@mastra/core/server';
import 'buffer';
import './tools.mjs';
import '@mastra/core/observability';
import 'async_hooks';

// ../agent-builder/dist/token-APYSY3BW-IQ2CXU3Y.js
var require_token = __commonJS({
  "../../../node_modules/.pnpm/@vercel+oidc@3.1.0/node_modules/@vercel/oidc/dist/token.js"(exports$1, module) {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var token_exports = {};
    __export(token_exports, {
      refreshToken: () => refreshToken
    });
    module.exports = __toCommonJS(token_exports);
    var import_token_error = require_token_error();
    var import_token_util = require_token_util();
    async function refreshToken() {
      const { projectId, teamId } = (0, import_token_util.findProjectInfo)();
      let maybeToken = (0, import_token_util.loadToken)(projectId);
      if (!maybeToken || (0, import_token_util.isExpired)((0, import_token_util.getTokenPayload)(maybeToken.token))) {
        const authToken = await (0, import_token_util.getVercelCliToken)();
        if (!authToken) {
          throw new import_token_error.VercelOidcTokenError(
            "Failed to refresh OIDC token: Log in to Vercel CLI and link your project with `vc link`"
          );
        }
        if (!projectId) {
          throw new import_token_error.VercelOidcTokenError(
            "Failed to refresh OIDC token: Try re-linking your project with `vc link`"
          );
        }
        maybeToken = await (0, import_token_util.getVercelOidcToken)(authToken, projectId, teamId);
        if (!maybeToken) {
          throw new import_token_error.VercelOidcTokenError("Failed to refresh OIDC token");
        }
        (0, import_token_util.saveToken)(maybeToken, projectId);
      }
      process.env.VERCEL_OIDC_TOKEN = maybeToken.token;
      return;
    }
  }
});
var tokenAPYSY3BW = require_token();

export { tokenAPYSY3BW as default };
