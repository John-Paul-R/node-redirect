import fs, { PathLike } from "fs";
import Path from "path";
import netPath from "path/posix";

type RedirectConfig = {
  target_to_sources: Record<string, string[]>;
  source_to_target: Record<string, string>;
};

const isRedirectConfig = (obj: any): obj is RedirectConfig => {
  return (
    obj.target_to_sources !== undefined && obj.source_to_target !== undefined
  );
};

type RedirectInitReturn = Readonly<{
  findRedirectTarget: (path: string) => string;
}>;

export function initRedirect(configFilePath: PathLike): RedirectInitReturn {
  const fileContents = fs.readFileSync(configFilePath);
  const json = JSON.parse(fileContents.toString());

  if (!isRedirectConfig(json)) {
    throw new Error("redirect config did not mach spec");
  }

  const lookup = {
    ...json.source_to_target,
    ...Object.fromEntries(
      Object.entries(json.target_to_sources).flatMap(([target, sources]) =>
        sources.map((s) => [s, target])
      )
    ),
  };

  return {
    findRedirectTarget: (path) => lookup[path],
  };
}
