import express from 'express'
import { google } from 'googleapis'
import dotenv from 'dotenv'

const app = express();

dotenv.config();

const PORT = process.env.PORT || 3000;

//Initialising Credentials for Calendar
const calendar = google.calendar({
    version: "v3",
    auth: process.env.API_KEY
})

//Initialising Credentials for OAuth2
const OAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI,
)

const scopes = [
    'https://www.googleapis.com/auth/calendar'
]

app.get("/rest/v1/calendar/init/", (req, res) => {
    try {
        // Generate the authorization URL

        const url = OAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes
        });

        // Redirect the user to the generated URL

        res.redirect(url);
    } catch (error) {

        // Handle any errors that occur during the execution

        console.error("An error occurred:", error);

        // Send an error response to the client

        res.status(500).send("Internal Server Error");
    }
});

app.get('/rest/v1/calendar/redirect/', async (req, res) => {
    // Get the authorization code from the request query parameters

    const code = req.query.code;

    // Exchange the authorization code for token credentials

    const { tokens } = OAuth2Client.getToken(code)
        .then((data) => data.tokens)
        .then((tokens) => {
            // Set the obtained token credentials to the OAuth2 client

            OAuth2Client.setCredentials(tokens);

            // Redirect the user to the event listing

            res.redirect("/get_events");
        })
        .catch((e) => {
            // Handle any errors that occur during the execution

            console.error("An error occurred:", error);

            // Send an error response to the client

            res.status(500).send("Internal Server Error");
        })

});


function formatEventSummaries(apiResponse) {
    const events = apiResponse.data.items;

    const summaries = events.map((event) => event.summary);

    return summaries;
}

app.get("/get_events", async (req, res) => {


    // Fetching List of Calendar Events

    const data = await calendar.events.list({
        calendarId: "primary",
        // Optional parameters (uncomment and customize as needed)
        // timeMin: now.toISOString(),
        auth: OAuth2Client,
    });

    //Fromatting Event Summary List
    const summaries = formatEventSummaries(data);

    res.send(summaries);
})

app.listen(PORT, () => {
    console.log("Server started on port ", PORT);
})