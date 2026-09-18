import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { fileURLToPath } from "url";

import {
    getYouTubeAccount
} from "./youtubeAccountManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.resolve(
    __dirname,
    "../credentials.json"
);

export function getYouTubeClient(
    accountId
) {

    const account =
        getYouTubeAccount(accountId);

    if (!account) {

        throw new Error(
            `YouTube account not found: ${accountId}`
        );
    }

    if (!account.tokens) {

        throw new Error(
            `OAuth tokens missing for account: ${accountId}`
        );
    }

    const credentials =
        JSON.parse(
            fs.readFileSync(
                CREDENTIALS_PATH,
                "utf8"
            )
        );

    const {
        client_id,
        client_secret
    } = credentials.web;

    const oauth2Client =
        new google.auth.OAuth2(
            client_id,
            client_secret,
            "http://localhost:5000/oauth2callback"
        );

    oauth2Client.setCredentials(
        account.tokens
    );

    return oauth2Client;
}