import simpleGit from "simple-git";
import chalk from "chalk";
import fs from "fs";
import path from "path";
const log = console.log;
const gitBaseUrl = "../we-work-webapp-new";
const baseBranch = "test-v21.53.1";
const targetBranch = "yx/feature-wb-8458-project-add-file-type";
// const targetBranch = "yx/feature-wb-6271-service-merge";
async function main() {
  log(chalk.green("开始"));
  try {
    const git = simpleGit(path.resolve(gitBaseUrl));
    await git.pull("origin");
    await git.checkout(baseBranch);
    await git.pull("origin", baseBranch);
    let mergeSuccess = true;
    try {
      await git.pull("origin", targetBranch);
    } catch (e) {}
    const statusResult = await git.status()
    if (statusResult && statusResult.conflicted && statusResult.conflicted.length !== 0) {
     
      log("冲突文件：", statusResult.conflicted);
     //如果是资源文件冲突，解决冲突 assets-url-map assets-rev
      if (
        new Set([...statusResult.conflicted, ...["assets-url-map", "assets-rev"]])
          .size === 2
      ) {
        ["assets-url-map", "assets-rev"].map((file) => {
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
        });
        git
          .add(statusResult.conflicted)
          .commit(`Merge branch ${targetBranch} into ${baseBranch}`);
      } else {
        mergeSuccess = false;
      }
    }
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


