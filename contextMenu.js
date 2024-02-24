chrome.contextMenus.create({
  title: "Save this job",
  contexts: ["selection"],
  id: "selection",
});

saveJob = async (data, tab) => {
  var localData = await chrome.storage.local.get(["GH_DATA"]);

  if (localData.GH_DATA == null) {
    showAlert(tab, "Please update Github credentials in extension settings.");
  } else {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localData.GH_DATA.token,
      },
      body: JSON.stringify({
        query: `
            mutation AddProjectV2DraftIssue {
                addProjectV2DraftIssue(
                    input: {
                        projectId: "${localData.GH_DATA.projectId}"
                        title: "${data.selectionText}"
                        body: "${data.linkUrl == null ? data.pageUrl : data.linkUrl}"
                    }
                ) {
                    projectItem {
                        id
                    }
                }
            }
            `,
      }),
    });

    if (res.status == 200) {
      var json = await res.json();
      if (json.data == null) showAlert(tab, "Failed to save the job :(");
      else showAlert(tab, "Successfully saved the job :)");
    } else {
      showAlert(tab, "Failed to save the job :(");
    }
  }
};

showAlert = (tab, message) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: function (msg) {
      alert(msg);
    },
    args: [message],
  });
};

fetchProjectDetails = async (token, projectNumber) => {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      query: `
              query User {
                viewer {
                    projectV2(number: ${projectNumber}) {
                        id
                        title
                    }
                }
              }
            `,
    }),
  });

  console.log(res, res.status);

  if (res.status == 200) {
    var json = await res.json();
    if (json.data == null) {
      return { error: "Unable to fetch project details :(" };
    } else {
      saveToLocal(token, projectNumber, json.data.viewer.projectV2.title, json.data.viewer.projectV2.id);
      return { token: token, projectNumber: projectNumber, projectName: json.data.viewer.projectV2.title, projectId: json.data.viewer.projectV2.id };
    }
  } else {
    return { error: "Unable to fetch project details :(" };
  }
};

saveToLocal = (token, projectNumber, projectName, projectId) => {
  chrome.storage.local.set({ GH_DATA: { token: token, projectNumber: projectNumber, projectName: projectName, projectId: projectId } });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "local") {
    chrome.storage.local.get(["GH_DATA"]).then((data) => {
      sendResponse(data.GH_DATA);
    });
  }
  if (request.type === "fetch") {
    fetchProjectDetails(request.token, request.projectNumber).then((res) => sendResponse(res));
  }
  return true;
});

chrome.contextMenus.onClicked.addListener(saveJob);
