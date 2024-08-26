chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Background script received message:", request);

    if (request.action === "injectContentScript") {
      console.log("Injecting content script");
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          files: ['content.js']
        }, () => {
          if (chrome.runtime.lastError) {
            console.error("Failed to inject content script:", chrome.runtime.lastError);
            sendResponse({status: "error", message: "Failed to inject content script"});
          } else {
            console.log("Content script injected successfully");
            sendResponse({status: "success"});
          }
        });
      });
      return true; // Keeps the message channel open for asynchronous response
    } else if (request.action === "saveData") {
      console.log("Saving data");
      const jsonData = JSON.stringify(request.data, null, 2);
      const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData);
      
      chrome.downloads.download({
        url: dataUrl,
        filename: "restaurants.json",
        saveAs: true
      }, function(downloadId) {
        if (chrome.runtime.lastError) {
          console.error("Failed to save data:", chrome.runtime.lastError);
          sendResponse({status: "error", message: "Failed to save data"});
        } else {
          console.log("Data saved successfully");
          sendResponse({status: "success"});
        }
      });
      return true; // Keeps the message channel open for asynchronous response
    }
  });