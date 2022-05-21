import http2, { Http2Session, IncomingHttpHeaders } from "http2";
import log4js from "log4js";

import Path from "path";

// Init logger

type Logger = log4js.Logger &
  Readonly<{
    logStream: LogStreamFunc;
  }>;

const initLogger = (logName: string): Logger => {
  const logger = log4js.getLogger();
  log4js.configure({
    appenders: {
      logfile: {
        type: "file",
        filename: Path.join("log", `${logName}.log`), //${Date.now()}
        maxLogSize: 10485760,
        backups: 10,
        compress: true,
      },
      console: { type: "console" },
    },
    categories: {
      default: { appenders: ["logfile", "console"], level: "INFO" },
    },
  });
  logger.info(`Starting ${logName}.`);

  (logger as any).logStream = logStream;
  return logger as Logger;
};

type LogStreamFunc = (
  headers: IncomingHttpHeaders,
  socket: Http2Session["socket"]
) => void;

let logStream: LogStreamFunc = function (
  this: log4js.Logger,
  headers: IncomingHttpHeaders
) {
  this.info(
    "Req: " +
      JSON.stringify([
        headers[http2.constants.HTTP2_HEADER_METHOD],
        headers[http2.constants.HTTP2_HEADER_PATH],
        headers[http2.constants.HTTP2_HEADER_REFERER],
        headers[http2.constants.HTTP2_HEADER_USER_AGENT],
      ])
  );
};

export { initLogger };
