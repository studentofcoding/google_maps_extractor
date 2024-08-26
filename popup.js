let extractedRestaurants = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log("Popup DOM loaded");
    const extractButton = document.getElementById('extractButton');
    const downloadButton = document.getElementById('downloadButton');
    const statusDiv = document.getElementById('status');
    const restaurantList = document.getElementById('restaurantList');
  
    // Load any previously saved restaurants
    chrome.storage.local.get(['restaurants'], function(result) {
        if (result.restaurants) {
            extractedRestaurants = result.restaurants;
            displayRestaurants(extractedRestaurants);
            downloadButton.style.display = "block";
            statusDiv.textContent = extractedRestaurants.length + " restaurants loaded from storage.";
        }
    });

    extractButton.addEventListener('click', function() {
      console.log("Extract button clicked");
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        if (currentTab.url.includes('google.com/maps')) {
          let updatedUrl = currentTab.url;
          if (!updatedUrl.includes('/search/Restaurants/')) {
            updatedUrl = updatedUrl.replace('/maps/', '/maps/search/Restaurants/');
            chrome.tabs.update(currentTab.id, {url: updatedUrl}, function() {
              console.log("Updated URL to include restaurant search");
              setTimeout(injectAndExtract, 3000); // Wait for 3 seconds before injecting and extracting
            });
          } else {
            injectAndExtract();
          }
        } else {
          statusDiv.textContent = "Please navigate to a Google Maps page.";
        }
      });
    });

    downloadButton.addEventListener('click', function() {
      console.log("Download button clicked");
      if (extractedRestaurants.length > 0) {
        chrome.runtime.sendMessage({action: "saveData", data: extractedRestaurants}, function(response) {
          if (response && response.status === "success") {
            console.log("Data saved successfully");
            statusDiv.textContent = "Data saved successfully!";
          } else {
            console.error("Failed to save data");
            statusDiv.textContent = "Failed to save data. Please try again.";
          }
        });
      } else {
        console.log("No data to download");
        statusDiv.textContent = "No data to download. Please extract restaurants first.";
      }
    });
  
    function injectAndExtract() {
      console.log("Injecting content script");
      chrome.runtime.sendMessage({action: "injectContentScript"}, function(response) {
        if (response && response.status === "success") {
          console.log("Content script injected successfully");
          extractRestaurants();
        } else {
          console.error("Failed to inject content script");
          statusDiv.textContent = "Failed to inject content script. Please try again.";
        }
      });
    }
  
    function extractRestaurants() {
      console.log("Extracting restaurants");
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "extract"}, function(response) {
          if (chrome.runtime.lastError) {
            console.error("Extraction error:", chrome.runtime.lastError);
            statusDiv.textContent = "Error: " + chrome.runtime.lastError.message;
          } else if (response && response.status === "success") {
            console.log("Extraction complete");
            extractedRestaurants = response.data;
            displayRestaurants(extractedRestaurants);
            statusDiv.textContent = "Extraction complete! " + extractedRestaurants.length + " restaurants found.";
            downloadButton.style.display = "block";
            
            // Save to Chrome storage
            chrome.storage.local.set({restaurants: extractedRestaurants}, function() {
              console.log('Restaurants saved to Chrome storage');
            });
          } else {
            console.error("Extraction failed");
            statusDiv.textContent = "Extraction failed. Make sure you're on a Google Maps page with restaurant search results.";
          }
        });
      });
    }

    function displayRestaurants(restaurants) {
      console.log("Displaying restaurants in popup");
      restaurantList.innerHTML = "";
      restaurants.forEach(restaurant => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${restaurant.name}</strong><br>
          Rating: ${restaurant.rating || 'N/A'} (${restaurant.reviews || 0} reviews)<br>
          Price: ${restaurant.price || 'Not listed'}<br>
          Type: ${restaurant.type || 'N/A'}<br>
          Address: ${restaurant.address || 'No address'}<br>
          Description: ${restaurant.description || 'No description'}<br>
          Hours: ${restaurant.hours || 'Not available'}<br>
          Wheelchair Accessible: ${restaurant.wheelchairAccessible ? 'Yes' : 'No information'}
        `;
        restaurantList.appendChild(li);
      });
    }
});