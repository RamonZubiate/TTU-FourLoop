const functions = require('firebase-functions');
const puppeteer = require('puppeteer');
const axios = require('axios');
const { setTimeout } = require("node:timers/promises"); 

const API_KEY = ''; // Use environment variables for sensitive data

// Export the function so that Firebase can deploy it
exports.scrapeWebsite = functions.runWith({memory: '2GB', timeoutSeconds: 120}).https.onRequest(async (req, res) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://events.ttu.edu/');

    // Switch to the first iframe
    const iframeElement1 = await page.$('#trumba\\.spud\\.5\\.iframe');
    const iframe1 = await iframeElement1.contentFrame();

    // Click the button to change the view
    await iframe1.click('#tab2');
    await setTimeout(8000); // Wait for the new content to load

    // Switch to the second iframe
    const iframeElement2 = await page.$('#trumba\\.spud\\.6\\.iframe');
    const iframe2 = await iframeElement2.contentFrame();

    // Scrape the table
    const rows = await iframe2.$$('.twSimpleListGroup tr');

    let events = [];
  
    for (const row of rows) {
        try {
            const titleElement = await row.$('.twDescription a');
            const title = await (await titleElement.getProperty('innerText')).jsonValue();
            const link = await (await titleElement.getProperty('href')).jsonValue();
            const when = await (await (await row.$('.twDetailTime')).getProperty('innerText')).jsonValue();
            const location = await (await (await row.$('.twLocation')).getProperty('innerText')).jsonValue();

            // Get description if available
            let description = 'No description available';
            const descriptionElement = await row.$('table:nth-of-type(2) td:nth-of-type(2) p');
            if (descriptionElement) {
                description = await (await descriptionElement.getProperty('innerText')).jsonValue();
            }

            // Make API call to get coordinates
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${location}+Texas+Tech&key=${API_KEY}`;
            const response = await axios.get(url);
            const locationData = response.data.results[0]?.geometry?.location || { lat: 'N/A', lng: 'N/A' };

            // Check if the coordinates are for the Texas Tech University location, which does not have an actual location
            if (locationData.lng === -101.8746483 && locationData.lat === 33.5845522) {
                locationData.lat = 'N/A';
                locationData.lng = 'N/A';
            }
  
            const event = {
                event_title: title,
                date: when,
                description: description,
                location: location,
                link: link,
                longitude: locationData.lng,
                latitude: locationData.lat,
            };
            events.push(event);
        } catch (error) {
            console.error('Error processing row:', error);
        }
    }

    // Print the events array to the console
    console.log('Scraped Events:', removeDuplicates(events));
    
    // Send the response back
    res.send(removeDuplicates(events)); // Send the scraped events as the response

    await browser.close();
});

function removeDuplicates(arr) {
    const uniqueArr = arr.map(event => JSON.stringify(event)); // Convert objects to strings
    const uniqueSet = new Set(uniqueArr); // Create a Set from the array of strings
    return Array.from(uniqueSet).map(event => JSON.parse(event)); // Convert back to objects
}
