import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { fileURLToPath } from "url";

import {
    addYouTubeAccount,
    getAllYouTubeAccounts,
    updateYouTubeAccount
} from "./youtubeAccountManager.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.resolve(
    __dirname,
    "../credentials.json"
);

const REDIRECT_URI =
    "http://localhost:5000/oauth2callback";

const SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/userinfo.email"
];

function getOAuthClient() {

    if (!fs.existsSync(CREDENTIALS_PATH)) {
        throw new Error(
            `credentials.json not found: ${CREDENTIALS_PATH}`
        );
    }

    const credentials = JSON.parse(
        fs.readFileSync(
            CREDENTIALS_PATH,
            "utf8"
        )
    );

    const config = credentials.web;

    if (!config) {
        throw new Error(
            "credentials.json does not contain 'web' configuration."
        );
    }

    const {
        client_id,
        client_secret
    } = config;

    return new google.auth.OAuth2(
        client_id,
        client_secret,
        REDIRECT_URI
    );
}


// Generate Google authorization URL
export function getYouTubeAuthorizationUrl() {

    const oauth2Client = getOAuthClient();

    const authUrl =
        oauth2Client.generateAuthUrl({

            access_type: "offline",

            prompt: "consent",

            scope: SCOPES
        });

    return authUrl;
}


// Handle Google OAuth callback
export async function handleYouTubeOAuthCallback(
    code
) {

    if (!code) {
        throw new Error(
            "Authorization code is missing."
        );
    }

    const oauth2Client = getOAuthClient();

    const { tokens } =
        await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    const youtube =
        google.youtube({
            version: "v3",
            auth: oauth2Client
        });

const oauth2 =
    google.oauth2({
        version: "v2",
        auth: oauth2Client
    });

const userInfo =
    await oauth2.userinfo.get();

const email =
    userInfo.data.email;

    console.log("GOOGLE USER INFO:", userInfo.data);
console.log("GOOGLE EMAIL:", email);

    const channelResponse =
        await youtube.channels.list({

            part: ["id", "snippet"],

            mine: true
        });

    const channel =
        channelResponse.data.items?.[0];

    if (!channel) {

        throw new Error(
            "No YouTube channel found for this Google account."
        );
    }

   const existingAccount = getAllYouTubeAccounts().find(
    account => account.email === email
);

let account;

if (existingAccount) {

    account = updateYouTubeAccount(
        existingAccount.accountId,
        {
            channelId: channel.id,
            channelName: channel.snippet.title,
            tokens
        }
    );

    console.log(
        `YouTube account tokens refreshed: ${email}`
    );

} else {

    account = addYouTubeAccount({
        email,
        channelId: channel.id,
        channelName: channel.snippet.title,
        tokens
    });

}

return account;
}