#!/usr/bin/env zx
import simpleGit from "simple-git";
const log = console.log;
const gitBaseUrl = "../we-work-webapp-new";
const baseBranch = "yx/test-auto-merge";
const targetBranch = "yx/test-auto-merge-2";

void (async function () {
  try {
    await cd(gitBaseUrl);
    const git = simpleGit(path.resolve());
    let statusResult = await git.status();
    // log(statusResult)
    // 检测当前分支是否
    if (statusResult) {
      if (statusResult.conflicted.length > 0) {
        await $`exit 101`; // 工作区不干净，先解决冲突
      }
      if (statusResult.files.length > 0) {
        await $`exit 102`; // 工作区不干净，有文件
      }
    }

    await $`git pull origin`;
    await git.checkout(baseBranch);
    await git.pull("origin", baseBranch);
    try {
      await git.pull("origin", targetBranch);
    } catch (e) {}
    statusResult = await git.status();
    let { conflicted = [] } = statusResult;
    //自动合并是否成功
    let isNeedCommit = false;
    await conflicted.forEach(async (file) => {
      if (["assets-url-map", "assets-rev"].includes(file)) {
        isNeedCommit = true;
        const txtPath = path.resolve(`${gitBaseUrl}/${file}`);
        let data = await fs.readFile(txtPath, "utf8");
        let result = data.replace(/<<<<<<<.*[\r\n]/g, "");
        result = result.replace(/=======.*[\r\n]/g, "");
        result = result.replace(/>>>>>>>.*[\r\n]/g, "");
        await fs.writeFile(txtPath, result, "utf8");
        console.log(`${file}文件合并完成`);
        await git.add(file);
      }
    });
    if (
      new Set([...conflicted, ...["assets-url-map", "assets-rev"]]).size === 2
    ) {
      if (isNeedCommit) {
        await git.commit(`Merge branch ${targetBranch} into ${baseBranch}`);
      }
      //   await setTimeout(async()=>{
      //     // await git.push("origin", baseBranch);
      //   },2000)
      log(chalk.green("git push"));
    } else {
      log(chalk.red("======merge失败======"));
    }
  } catch (p) {
    console.log(chalk.red(`===========失败===========`));
    switch (p.exitCode) {
      case 101:
        console.log(chalk.red(`工作区不干净，先解决冲突`));
        break;
      case 102:
        console.log(chalk.red(`工作区不干净，有文件变更`));
        break;
      default:
        log(chalk.red(`Exit code: ${p.exitCode}`));
        log(chalk.red(JSON.stringify(p)));
    }
    console.log(chalk.red(`==========================`));
  }
})();
