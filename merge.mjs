import simpleGit from "simple-git";
import chalk from "chalk";
import fs from "fs";
import path from "path";
const log = console.log;
const gitBaseUrl = "../we-work-webapp-new";
const baseBranch = "test-v21.52";
const targetBranch = "yx/feature-wb-6271-service-merge";
async function main() {
  log(chalk.green("开始"));
  try {
    const git = simpleGit(path.resolve(gitBaseUrl));
    await git.pull("origin");
    await git.checkout(baseBranch);
    await git.pull("origin", baseBranch);
    let mergeSuccess = true;
    try {
      await git.merge([targetBranch], (e) => {
        if (e && e.git) {
          //如果是资源文件冲突，解决冲突 assets-url-map assets-rev
          log("冲突文件：", e.git.merges);
          // 冲突只有资源文件
          if (
            new Set([...[e.git.merges], ...["assets-url-map", "assets-rev"]])
              .size === 2
          ) {
            ["assets-url-map", "assets-rev"].map((file) => {
              if (file === "assets-rev") {
                const txtPath = path.resolve(`${gitBaseUrl}/${file}`);
                fs.readFile(txtPath, "utf8", function (err, data) {
                  if (err) {
                    return console.log(err);
                  }
                  let result = data.replace(/<<<<<<<.*[\r\n]/g, "");
                  result = result.replace(/=======.*[\r\n]/g, "");
                  result = result.replace(/>>>>>>>.*[\r\n]/g, "");
                  fs.writeFile(txtPath, result, "utf8", function (err) {
                    if (err) return console.log(err);
                  });
                });
              }
            });
            git
              .add(e.git.merges)
              .commit(`Merge branch ${targetBranch} into ${baseBranch}`);
          } else {
            mergeSuccess = false;
          }
        }
      });
    } catch (e) {}
    if (mergeSuccess) {
      await git.push("origin", baseBranch);
      log(chalk.green("成功"));
    } else {
      log(chalk.red("======merge失败======"));
    }
  } catch (e) {
    log(chalk.red("======git错误======"));
    log(chalk.red(JSON.stringify(e)));
    log(chalk.red(e));
  }
}
main();

// 如果资源文件冲突，自动处理
// const statusResult = await git.status()
// log(statusResult.conflicted)
