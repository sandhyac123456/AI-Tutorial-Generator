import fs from "fs";
import path from "path";
import { lock, unlock } from "../utils/fileLock.js";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_FILE = path.resolve(
    __dirname,
    "../../generated/uploads/uploadJobs.json"
);
console.log("UPLOAD FILE:", path.resolve(UPLOAD_FILE));
// ----------------------------
// Load Upload Jobs
// ----------------------------
export function loadUploadJobs() {

    if (!fs.existsSync(UPLOAD_FILE)) {
        return [];
    }

    const data = fs.readFileSync(
        UPLOAD_FILE,
        "utf8"
    ).trim();

    return data ? JSON.parse(data) : [];

}

// ----------------------------
// Save Upload Jobs
// ----------------------------
function saveJobs(jobs) {

    const tempFile =
        `${UPLOAD_FILE}.${process.pid}.tmp`;

    fs.writeFileSync(
        tempFile,
        JSON.stringify(jobs, null, 2),
        "utf8"
    );

    let lastError;

    for (let attempt = 1; attempt <= 5; attempt++) {

        try {

            fs.renameSync(
                tempFile,
                UPLOAD_FILE
            );

            console.log(
                `Upload jobs saved successfully. Attempt ${attempt}`
            );

            return;

        } catch (err) {

            lastError = err;

            if (
                err.code !== "EPERM" &&
                err.code !== "EBUSY" &&
                err.code !== "EACCES"
            ) {
                throw err;
            }

            console.log(
                `uploadJobs.json rename failed (${err.code}), retry ${attempt}/5`
            );

            // Small synchronous delay
            const start = Date.now();

            while (Date.now() - start < 300 * attempt) {
                // wait
            }
        }
    }

    throw lastError;
}

// ----------------------------
// Add Upload Job
// ----------------------------
export async function saveUploadJob(job) {

    await lock(UPLOAD_FILE);

    try {

        const jobs = loadUploadJobs();

        const exists = jobs.find(
            j => j.jobId === job.jobId
        );

        if (exists) {

            console.log(
                "Upload Job Already Exists:",
                job.tutorialTitle
            );

            return;
        }

        jobs.push(job);

        saveJobs(jobs);

        console.log(
            `Upload Job Saved: ${job.tutorialTitle} (${job.language})`
        );

    } finally {

        unlock(UPLOAD_FILE);

    }

}

// ----------------------------
// Update Upload Job
// ----------------------------
export async function updateUploadJob(jobId, updates) {

    await lock(UPLOAD_FILE);

    try {

        const jobs = loadUploadJobs();

        const index = jobs.findIndex(
            job => job.jobId === jobId
        );

        if (index === -1) {
            return;
        }

        jobs[index] = {
            ...jobs[index],
            ...updates
        };

        saveJobs(jobs);

    } finally {

        unlock(UPLOAD_FILE);

    }

}

// ----------------------------
// Remove Upload Job
// ----------------------------
export async function removeUploadJob(jobId) {

    await lock(UPLOAD_FILE);

    try {

        const jobs = loadUploadJobs();

        const filtered = jobs.filter(
            job => job.jobId !== jobId
        );

        saveJobs(filtered);

    } finally {

        unlock(UPLOAD_FILE);

    }
}