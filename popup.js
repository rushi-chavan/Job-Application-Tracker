document.getElementById("githubForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(event.target);
  const token = data.get("token");
  const projectNumber = data.get("projectNumber");
  await chrome.runtime
    .sendMessage({
      type: "fetch",
      token: token,
      projectNumber: projectNumber,
    })
    .then((res) => {
      if (res.error == null) {
        document.getElementById("token").value = res.token;
        document.getElementById("projectNumber").value = res.projectNumber;
        document.getElementById("projectName").value = res.projectName;
        document.getElementById("projectId").value = res.projectId;
      } else {
        alert(res.error);
      }
    });
});

window.addEventListener("load", async (event) => {
  console.log("here");
  await chrome.runtime
    .sendMessage({
      type: "local",
    })
    .then((res) => {
      if (res.error == null) {
        console.log(res);
        document.getElementById("token").value = res.token;
        document.getElementById("projectNumber").value = res.projectNumber;
        document.getElementById("projectName").value = res.projectName;
        document.getElementById("projectId").value = res.projectId;
      } else {
        alert("Unable to read locally saved data, please fetch again. :(");
      }
    });
});

console.log("loaded");
