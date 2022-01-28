import simpleGit from "simple-git";
import chalk from "chalk";
import fs from "fs";
import path from "path";
const fsPromise  = fs.promises 
const log = console.log;
const gitBaseUrl = "../we-work-webapp-new";
// const baseBranch = "test-v22.5";
const baseBranch = "dev-v22.5";
// const baseBranch = "custom-yx-test-v22.2";
// const baseBranch = "custom-cjh-test-v22.4.3";
const targetBranch = "quanhai/feature-input-keyboard";

// const targetBranch = "yx/feature-WBZJ-61-round-three-marketing"; 

// const targetBranch = "xsp/feature-wb-9110"; 
// const targetBranch = "quanhai/polish-WB-9328-empty"; 

async function main() {
  // log(chalk.green("开始"));
  try {
    const git = simpleGit(path.resolve(gitBaseUrl));
    // await git.pull("origin");
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
        await ["assets-url-map", "assets-rev"].map(async(file) => {
            const txtPath = path.resolve(`${gitBaseUrl}/${file}`);
            let data = await fsPromise.readFile(txtPath, "utf8");
            let result = data.replace(/<<<<<<<.*[\r\n]/g, "");
            result = result.replace(/=======.*[\r\n]/g, "");
            result = result.replace(/>>>>>>>.*[\r\n]/g, "");
            await fsPromise.writeFile(txtPath, result, "utf8");
            console.log('文件合并完成')
        });
        console.log('git add')
        await git
          .add(statusResult.conflicted)
          .commit(`Merge branch ${targetBranch} into ${baseBranch}`);
      } else {
        mergeSuccess = false;
      }
    }
    if (mergeSuccess) {
      await setTimeout(async()=>{
        await git.push("origin", baseBranch);
      },2000)
      log(chalk.green("git push"));
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


