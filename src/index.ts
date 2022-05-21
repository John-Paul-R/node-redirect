import http2, {
  Http2Session,
  OutgoingHttpHeaders,
  IncomingHttpHeaders,
  SecureServerOptions,
  ServerHttp2Stream,
  constants as hc,
} from "http2";
import { initLogger } from "./log_helper";
import Path from "path";
import { initRedirect } from "./redirect_config";

const serverOpts = {
  allowHTTP1: true,
  timeout: 3000,
} as SecureServerOptions;

const logger = initLogger("link.jpcode");

const { findRedirectTarget } = initRedirect(
  Path.join(__dirname, "./redirects.json")
);

//  Create server
const server = http2.createServer(serverOpts);

//  Handle Errors
server.on("error", (err) => logger.error(err));

//  Handle streams (requests are streams)
server.on("stream", (stream, headers) => {
  logger.logStream(headers, stream.session.socket);
  try {
    const successCode = respond(stream, headers);
  } catch (err) {
    logger.error(err);
  }
});

/**
 * Request Handler / Response Generator
 */
async function respond(
  stream: ServerHttp2Stream,
  headers: IncomingHttpHeaders
) {
  stream.setTimeout(3000, () => {
    stream.destroy();
  });
  // stream is a Duplex
  const method = headers[hc.HTTP2_HEADER_METHOD];
  if (method != http2.constants.HTTP2_METHOD_GET) {
    stream.respond({ status: 404 });
    stream.end();
    return;
  }
  const reqUrl = new URL(
    headers[hc.HTTP2_HEADER_PATH] as string,
    "https://www.example.com"
  );
  const path = decodeURIComponent(reqUrl.pathname);
  const query = reqUrl.search;
  const socket = stream.session.socket;
  const encodings = headers[hc.HTTP2_HEADER_ACCEPT_ENCODING];

  const redirectTarget = findRedirectTarget(path);

  if (redirectTarget) {
    stream.respond({
      // "content-type": "text/html; charset=utf-8",
      ":status": 301,
      [hc.HTTP2_HEADER_LOCATION]: redirectTarget,
    });
    stream.end();
  } else {
    stream.respond({
      ":status": 404,
    });
    stream.end();
  }
}

server.listen(8080);
