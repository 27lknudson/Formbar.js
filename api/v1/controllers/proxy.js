const { fetchImage } = require("@modules/axios");
const { requireQueryParam } = require("@modules/error-wrapper");

module.exports = (router) => {
    router.get("/proxy", async (req, res) => {
        const imageUrl = req.query.url;
        requireQueryParam(imageUrl, "url");

        const upstream = await fetchImage(imageUrl).catch((err) => {
            return res.status(400).json({ success: false, error: { message: err.message } });
        });

        if (!upstream) return res.status(400).json({ success: false, error: { message: "Failed to fetch image" } });

        res.setHeader("Content-Type", upstream.headers["content-type"]);
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
        res.setHeader("X-Content-Type-Options", "nosniff");

        upstream.data.pipe(res);
    });
}