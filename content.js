chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Content script received message:", request);
  
    if (request.action === "extract") {
      console.log("Starting extraction process");
      extractRestaurants().then(data => {
        console.log("Extraction complete, sending data to background script");
        sendResponse({status: "success", data: data});
      }).catch(error => {
        console.error("Extraction failed:", error);
        sendResponse({status: "error"});
      });
      return true; // Indicates that the response is sent asynchronously
    }
  });
  
  async function extractRestaurants() {
    console.log("Extracting restaurants");
    const restaurants = [];
    const listItems = document.querySelectorAll('div.Nv2PK');
    
    for (const item of listItems) {
      const nameElement = item.querySelector('div.qBF1Pd.fontHeadlineSmall');
      if (nameElement) nameElement.style.border = "1px solid red";
      
      const ratingElement = item.querySelector('span.MW4etd');
      if (ratingElement) ratingElement.style.border = "1px solid red";
      
      const reviewsElement = item.querySelector('span.UY7F9');
      if (reviewsElement) reviewsElement.style.border = "1px solid red";
      
      const priceElement = item.querySelector('span[aria-label^="Price:"]');
      if (priceElement) priceElement.style.border = "1px solid red";

      const typeElement = item.querySelector('div.W4Efsd > span:first-child > span:first-child');
      if (typeElement) typeElement.style.border = "1px solid red";

      const wheelchairElement = item.querySelector('div.W4Efsd > span:nth-child(2) > span:last-child[role="img"]');
      if (wheelchairElement) {
        wheelchairElement.style.border = "1px solid red";
      }
      
      const addressElement = item.querySelector(wheelchairElement ? 'div.W4Efsd > span:nth-child(3) > span:last-child' : 'div.W4Efsd > span:nth-child(2) > span:last-child');
      if (addressElement) addressElement.style.border = "1px solid red";
      
      const descriptionElement = item.querySelector('div.W4Efsd:nth-child(2) > span > span');
      let descriptionElementIsAppear = false;
      if (descriptionElement && !/(Open 24 hours|Closes soon|Closed)/.test(descriptionElement.textContent)) {
        descriptionElementIsAppear = true;
        descriptionElement.style.border = "1px solid green";
      }

      const hoursElement = item.querySelector(descriptionElementIsAppear ? 'div.W4Efsd:nth-child(3) > span > span' : 'div.W4Efsd:nth-child(2) > span > span');
      if (hoursElement) {
        hoursElement.style.border = "1px solid blue";
      }
  
      if (nameElement) {
        const restaurant = {
          name: nameElement.textContent.trim(),
          rating: ratingElement ? parseFloat(ratingElement.textContent.trim()) : null,
          reviews: reviewsElement ? parseInt(reviewsElement.textContent.replace(/[()]/g, '').trim()) : null,
          price: priceElement ? priceElement.getAttribute('aria-label').replace('Price: ', '') : null,
          address: addressElement ? addressElement.textContent.trim() : null,
          type: typeElement ? typeElement.textContent.trim() : null,
          description: descriptionElementIsAppear ? descriptionElement.textContent.trim() : null,
          hours: hoursElement ? hoursElement.textContent.trim() : null,
          wheelchairAccessible: !!wheelchairElement
        };
        restaurants.push(restaurant);
      }
    }
  
    console.log("Extracted", restaurants.length, "restaurants");
    return restaurants;
  }