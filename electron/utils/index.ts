import robot from "robotjs";
import { exec } from "child_process";

export async function getPreviousAppName() {
  // 模拟按下 Command + Tab 来切换应用
  robot.keyTap("tab", ["command"]);
  // 模拟释放按键
  robot.keyToggle("tab", "up");
  // 延迟粘贴（让应用先获取焦点）
  setTimeout(() => robot.keyTap("v", ["command"]), 100)
  const active = await getActiveApplication();
  return active;
}

export async function paste() {
  const app = await getPreviousAppName();
  console.log(app);
}

export function getActiveApplication() {
  return new Promise((resolve, reject) => {
    if (process.platform === "darwin") {
      exec(
        'osascript -e "tell application \\"System Events\\" to get name of first process whose frontmost is true"',
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout.trim());
          }
        }
      );
    } else if (process.platform === "win32") {
      exec("tasklist /fo csv /v", (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          const processes = stdout
            .split("\n")
            .map((line) => line.split('","'))
            .map((fields) => ({
              name: fields[0].replace(/"/g, ""),
              title: fields[7].replace(/"/g, ""),
              status: fields[8].replace(/"/g, ""),
            }));

          const activeProcess = processes.find(
            (process) =>
              process.status === "Running" && process.title === "Console"
          );

          if (activeProcess) {
            resolve(activeProcess.name);
          } else {
            resolve(null);
          }
        }
      });
    }
  });
}