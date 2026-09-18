import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACCOUNTS_FILE = path.join(
    __dirname,
    "accounts.json"
);

// Make sure accounts.json exists
function ensureAccountsFile() {
    if (!fs.existsSync(ACCOUNTS_FILE)) {
        fs.writeFileSync(
            ACCOUNTS_FILE,
            "[]",
            "utf8"
        );
    }
}

// Read all accounts
export function getAllYouTubeAccounts() {

    ensureAccountsFile();

    try {

        const data = fs.readFileSync(
            ACCOUNTS_FILE,
            "utf8"
        ).trim();

        return data ? JSON.parse(data) : [];

    } catch (error) {

        console.error(
            "Failed to read YouTube accounts:",
            error.message
        );

        return [];
    }
}

// Save all accounts
function saveAllYouTubeAccounts(accounts) {

    fs.writeFileSync(
        ACCOUNTS_FILE,
        JSON.stringify(accounts, null, 2),
        "utf8"
    );
}

// Get account by ID
export function getYouTubeAccount(accountId) {

    const accounts = getAllYouTubeAccounts();

    return accounts.find(
        account => account.accountId === accountId
    );
}

// Add new YouTube account
export function addYouTubeAccount({
    email,
    channelId,
    channelName,
    tokens
}) {

    const accounts = getAllYouTubeAccounts();

    const existingAccount = accounts.find(
        account => account.email === email
    );

    if (existingAccount) {

        throw new Error(
            `YouTube account already exists: ${email}`
        );
    }

    const account = {

        accountId: crypto.randomUUID(),

        email,

        channelId,

        channelName,

        tokens,

        connectedAt: new Date().toISOString(),

        updatedAt: new Date().toISOString()
    };

    accounts.push(account);

    saveAllYouTubeAccounts(accounts);

    console.log(
        `YouTube account added: ${email}`
    );

    return account;
}

// Update existing account
export function updateYouTubeAccount(
    accountId,
    updates
) {

    const accounts = getAllYouTubeAccounts();

    const index = accounts.findIndex(
        account =>
            account.accountId === accountId
    );

    if (index === -1) {

        throw new Error(
            `YouTube account not found: ${accountId}`
        );
    }

    accounts[index] = {

        ...accounts[index],

        ...updates,

        updatedAt: new Date().toISOString()
    };

    saveAllYouTubeAccounts(accounts);

    return accounts[index];
}

// Remove account
export function removeYouTubeAccount(
    accountId
) {

    const accounts = getAllYouTubeAccounts();

    const filteredAccounts =
        accounts.filter(
            account =>
                account.accountId !== accountId
        );

    if (
        filteredAccounts.length ===
        accounts.length
    ) {

        throw new Error(
            `YouTube account not found: ${accountId}`
        );
    }

    saveAllYouTubeAccounts(
        filteredAccounts
    );

    console.log(
        `YouTube account removed: ${accountId}`
    );
}

// Check whether account exists
export function hasYouTubeAccount(
    accountId
) {

    return Boolean(
        getYouTubeAccount(accountId)
    );
}

// ==========================================
// Get Available YouTube Accounts
// ==========================================

export function getAvailableYouTubeAccounts(excludedAccountIds = []) {
    const accounts = getAllYouTubeAccounts();

    return accounts.filter(
        account =>
            !excludedAccountIds.includes(account.accountId)
    );
}


// ==========================================
// Get Next YouTube Account
// ==========================================

export function getNextYouTubeAccount(
    currentAccountId,
    excludedAccountIds = []
) {
    const accounts = getAllYouTubeAccounts();

    if (!accounts.length) {
        throw new Error("No YouTube accounts available.");
    }

    const availableAccounts = accounts.filter(
        account =>
            !excludedAccountIds.includes(account.accountId)
    );

    if (!availableAccounts.length) {
        return null;
    }

    const currentIndex = availableAccounts.findIndex(
        account =>
            account.accountId === currentAccountId
    );

    // If current account is not available,
    // start from first available account.
    if (currentIndex === -1) {
        return availableAccounts[0];
    }

    // Move to next account
    const nextIndex =
        (currentIndex + 1) % availableAccounts.length;

    return availableAccounts[nextIndex];
}