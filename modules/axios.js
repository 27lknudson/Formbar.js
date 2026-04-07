const axios = require('axios');
const { getIpAccess } = require("@services/ip-service");

const WHITELISTED_HOSTS = new Set(Object.values( await getIpAccess("whitelist")).map(ip => ip.ip));
const BLACKLISTED_HOSTS = new Set(Object.values(await getIpAccess("blacklist")).map(ip => ip.ip));

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_PROTOCOLS = new Set(["https:"]);

/** Fetches an image from a given URL, ensuring it is valid and meets certain criteria.
 * 
 * @param {string} url - The URL of the image to fetch.
 * @returns {Promise} A promise that resolves with the image data stream if successful, or rejects with an error.
 */
function fetchImage(url) {
    return new Promise(async (resolve, reject) => {
        let target;
        try {
            target = new URL(url);
        } catch {
            reject(new Error("Invalid image URL"));
            return;
        }

        if (!ALLOWED_PROTOCOLS.has(target.protocol)) {
            reject(new Error("Only HTTPS image URLs are allowed"));
            return;
        }

        if (WHITELISTED_HOSTS.size > 0 && !WHITELISTED_HOSTS.has(target.hostname)) {
            reject(new Error("Image host is not allowed"));
            return;
        }

        if (BLACKLISTED_HOSTS.has(target.hostname)) {
            reject(new Error("Image host is blocked"));
            return;
        }

        const upstream = await axios.get(target, {
            responseType: "stream",
            timeout: 8000,
            maxRedirects: 3,
            maxContentLength: MAX_IMAGE_BYTES,
            validateStatus: (s) => s >= 200 && s < 400,
            headers: {
                "User-Agent": "FormbarImageProxy/1.0",
                Accept: "image/*",
            },
        });
        const contentType = upstream.headers["content-type"] || "";
        if (!contentType.startsWith("image/")) {
            upstream.data.destroy();
            reject(new Error("URL does not point to an image"));
            return;
        }

        upstream.data.on("error", (err) => {
            upstream.data.destroy();
            reject(new Error("Error reading image data: " + err.message));
        });

        resolve(upstream);
    });
}

module.exports = {
    fetchImage,
};