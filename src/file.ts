import { createReadStream } from "fs";
import { version } from "os";
const readline = require("readline");

// see https://github.com/golang/go/blob/fad67f8a5342f4bc309f26f0ae021ce9d21724e6/src/cmd/vendor/golang.org/x/mod/modfile/rule.go#L85
export interface ModFile {
  module: GoModule | undefined;
  go: Go | undefined;
  require: GoRequire[];
  exclude: GoExclude[];
  replace: GoReplace[];
  retract: GoRetract[];
}

// A Go is the go statement.
export interface Go {
  version: string;
  syntax: number;
}

export interface GoModule {
  mod: Version;
  deprecated: string;
  syntax: number;
}

export interface GoRequire {
  mod: Version;
  indirect: boolean;
  syntax: number;
}

export interface GoExclude {
  mod: Version;
  syntax: number;
}

export interface GoReplace {
  old: Version;
  new: Version;
  syntax: number;
}

export interface GoRetract {
  // A VersionInterval represents a range of versions with upper and lower bounds.
  // Intervals are closed: both bounds are included. When Low is equal to High,
  // the interval may refer to a single version ('v1.2.3') or an interval
  // ('[v1.2.3, v1.2.3]'); both have the same representation.
  low: string;
  high: string;
  rationale: string;
  syntax: number;
}

export interface Version {
  // Path is a module path, like "golang.org/x/text" or "rsc.io/quote/v2".
  path: string;
  // Version is usually a semantic version in canonical form.
  // There are three exceptions to this general rule.
  // First, the top-level target of a build has no specific version
  // and uses Version = "".
  // Second, during MVS calculations the version "none" is used
  // to represent the decision to take no version of a given module.
  // Third, filesystem paths found in "replace" directives are
  // represented by a path with an empty version.
  version: string;
}

export function parseMod(path: string): any {
  let ret: ModFile = {
    module: undefined,
    go: undefined,
    require: [],
    exclude: [],
    replace: [],
    retract: [],
  };
  var fRead = createReadStream(path);
  var objReadline = readline.createInterface({
    input: fRead,
  });
  let i = 0;
  objReadline.on("line", function (line: string) {
    i++;
    if (line.indexOf("\t") !== -1) {
      line = line.trimLeft();
      let lineArr = line.split(" ");
      if (lineArr.length < 2) {
        return;
      }

      let pt = lineArr[0];
      for (let index = lineArr[0].length; index >= 0; index--) {
        if (lineArr[0][index] >= "A" && lineArr[0][index] <= "Z") {
          pt = insertStr(pt, index, "!");
        }
      }
      ret.require.push({
        mod: { path: pt, version: lineArr[1] },
        indirect: line.lastIndexOf("// indirect") !== -1,
        syntax: i,
      });
    }
  });
  return ret;
}

function insertStr(soure: string, start: number, newStr: string): string {
  return soure.slice(0, start) + newStr + soure.slice(start);
}