function escapeHTML(str) {
      return str.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
    }
   
    window.onload = function() {
      const params = new URLSearchParams(window.location.search);
 
      // extract parameters
      const baseUrl = params.get("baseUrl");
      const itemIdRaw = params.get("itemId");
      const statusRaw = params.get("status");
      const statusSafe = escapeHTML((statusRaw || "").toLowerCase());
 
      // buildURL
      const fullUrl = decodeURIComponent(baseUrl) + "&itemId=" + encodeURIComponent(itemIdRaw) + "&status=" + encodeURIComponent(statusRaw);
 
      // text to display
      const successString = `<b>The holiday has been ${statusSafe}.</b><br>You may now close this window.`;
      const noLongerPendingString = `<b>The holiday request has already been {status}.</b><br>You may now close this window.`
      const notFoundString = `<b>The holiday request was not found.</b><br>It may have been deleted.`
      const failedString = `<b>The holiday was not ${statusSafe} as the attempt failed.</b><br>Please try again by refreshing the page, or contact your system administrator if the problem persists.`;
 
      // do a GET on the url to trigger the flow and change the text displayed on the site.
      fetch(fullUrl, { method: "GET" })
        .then(response => {
          console.log(response);
          if (!response.ok) throw response; // trigger the catch
          return response.json();
        })
        .then(body => {
          console.log(body);
          if (body.message === "Item updated successfully.") {
            document.getElementById('display-text').innerHTML = successString;
            console.log("The GET request attempt was successful.");
          }
          else if (body.message === "Item not pending.") {
            const safeItemStatus = escapeHTML(body.itemStatus.toLowerCase());
            document.getElementById('display-text').innerHTML = noLongerPendingString.replace("{status}", safeItemStatus);
            console.log("The GET request attempt was successful - but the item wasn't pending.");
          }
          else {
            console.log("The GET request attempt was successful - but the provided message was unexpected.");
            throw { status: 500, message: "Unexpected message" };
          }
        })
        .catch(err => {
          console.log(err);
          if (err && err.status === 404) {
            document.getElementById('display-text').innerHTML = notFoundString;
            console.log("The GET request attempt failed - the item was not found.");
          }
          else {
            document.getElementById('display-text').innerHTML = failedString;
            console.log("The GET request attempt failed.");
          }
        })
        .finally(() => {
          console.log("The GET request attempt has finished.");
        });
    };
 
