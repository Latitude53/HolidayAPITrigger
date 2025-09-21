function escapeHTML(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
}

// text to display
const successString = 'You may now close this window.';
const notFoundString = 'It may have been deleted.';
const noLongerPendingString = 'Contact your system administrator to change this.';
let otherFailedString = `<b>Something went wrong and the holiday request was not {newStatus}.</b><br>Please refresh the page to try again, or contact your system administrator if the problem persists.`;
let newStatusSafe;

function getResponseString(response, prefix = '') {
  const code = response?.code;
  const message = response?.message;
  const ID = response?.ID;
  prefix = prefix ? `${prefix}:<br>` : '';
  switch (code) {
    case 200: return `${prefix}<b>${message}.</b><br>${successString}`;
    case 404:
      console.warn(`Request not found (ID: ${ID})`);
      return `${prefix}<b>${message}.</b><br>${notFoundString}`;
    case 409:
      console.warn(`Request not pending (ID: ${ID})`);
      return `${prefix}<b>${message}.</b><br>${noLongerPendingString}`;
    default:
      console.warn(`Unhandled code ${code}`);
      console.log(response);
      return `${prefix}${otherFailedString}`;
  }
}

window.onload = function() {
  // extract parameters from URL
  const params = new URLSearchParams(window.location.search);

/*
  for (const [key, value] of params.entries()) {
    console.log(`${key}: ${value}`);
  }
*/
  console.log(params.get('items'));
  const items = JSON.parse(decodeURIComponent(params.get('items')));
  for (const item of items) {
    for (const [key, value] of item.entries()) {
      console.log(`${key}: ${value}`);
    }
  }
  return;

  const apiUrl = decodeURIComponent(params.get('apiUrl')); // this is encoded in Power Apps
  const itemIDsRaw = params.get('itemIDs');
  const itemIDsArray = itemIDsRaw.split(',').map(Number);
  const newStatusRaw = params.get('status');
  newStatusSafe = escapeHTML((newStatusRaw || '').toLowerCase());
  otherFailedString = otherFailedString.replace('{newStatus}', newStatusSafe);

  // do a GET on the URL to trigger the flow and change the text displayed on the site
  fetch(apiUrl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemIDs: itemIDsArray, status: newStatusRaw })
    }
  )
  .then(response => response.json().then(body => {
    if (response.ok) return body;
    return Promise.reject({ status: response.status, body }); // trigger the catch
  }))
  .then(body => {
    console.log('The request succeeded.');
    const firstResponse = body.responses[0];
    if (body.count === 1) {
      document.getElementById('display-text').innerHTML = getResponseString(firstResponse);
    } else {
      console.log('Multiple requests were handled...');
      const otherResponses = body.responses.slice(1);
      if (otherResponses.every(
        response => response.code === firstResponse.code
      )) {
        console.log('All requests had the same response.');
        document.getElementById('display-text').innerHTML = getResponseString(firstResponse);
        otherResponses.forEach(getResponseString); // to log to the console
      } else {
        console.log('The requests had different responses.');
        const prefixes = ['This Year', 'Next Year'];
        document.getElementById('display-text').innerHTML =
          body.responses.map((response, i) => getResponseString(response, prefixes[i])).join('<br><br>');
      }
    }
  })
  .catch(error => {
    console.error('The request failed. Error info:');
    const stringified = JSON.stringify(error, null, 2);
    console.error(stringified === '{}' ? error: stringified);
    document.getElementById('display-text').innerHTML = otherFailedString
  });
}