const fs = require("fs");
const path = require("path");
const { src, dest, task, watch, series } = require('gulp');
const Gitdown = require('@gnd/gitdown');
const rename = require("gulp-rename");
const debug = require("gulp-debug");
const pandoc = require("gulp-pandoc");
const replace = require("gulp-replace");

task('static', async () => {
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist");
  }
});

task('gitdown', async () => {
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist");
  }

  const gitdown = Gitdown.readFile(path.join(__dirname, "src", "index.md"));
  gitdown.setConfig({
    deadlink: {
      findDeadURLs: false,
      findDeadFragmentIdentifiers: true
    },
    gitinfo: {
      rootUrl: "",
      gitPath: gitdown.executionContext()
    }
  });
  gitdown.setLogger(console);

  const contents = {
    ref: "#user-content-contents",
    title: "Back to contents"
  };

  gitdown.registerHelper("scroll-up", {
    compile: (config) => {
      const up = {
        ref: config.upRef || contents.ref,
        title: config.upTitle || contents.title
      };

      const down = {
        ref: config.downRef,
        title: config.downTitle
      };

      if (config.downRef) {
        return `<sup>[ [&and;](${up.ref}) _${up.title}_ | _${down.title}_ [&or;](${down.ref}) ]</sup>`;
      } else {
        return `<sup>[ [&and;](${up.ref}) _${up.title}_ ]</sup>`;
      }
    }
  });

  await gitdown.writeFile('dist/_merged.md');
});

task('pandoc', () => {
  return src("dist/_merged.md")
    .pipe(debug({ title: "merged" }))
    .pipe(pandoc({
      from: "gfm",
      to: "gfm",
      args: ['--wrap=none'],
      ext: "md"
    }))
    .pipe(debug({ title: "pandoc output:" }))
    .pipe(rename("output.md"))
    .pipe(replace("# User Content", "# Data Representation in Solidity"))
    .pipe(dest("dist"));
});

task('build', series("static", "gitdown", "pandoc"));

task('watch', series(["build", () => {
  watch('./src', series(['build']));
}]));


task('default', series('build'));
