const MarkdownIt = require('markdown-it');
const sanitizeHtml = require('sanitize-html');

const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
});

function toProxyImageUrl(src) {
    if (String(src).startsWith("/api/v1/proxy?url=")) return src
    else return `/api/v1/proxy?url=${encodeURIComponent(src)}`;
}

/*** Processes a string to format it as markdown.
 * 
 * @param {string} input - The input string to process.
 * @param {boolean} imageAllowed - Whether to allow image tags in the output.
 * @returns {string} The processed string.
 */
function processMarkdown(input, imageAllowed = false) {
    const rawHtml = md.render(String(input) || '');
    return sanitizeHtml(rawHtml, {
        allowedTags: imageAllowed ? ["p", "br", "strong", "em", "ul", "ol", "li", "code", "pre", "a", "blockquote", "img"] : ["p", "br", "strong", "em", "ul", "ol", "li", "code", "pre", "a", "blockquote"],
        allowedAttributes: {
            a: ["href", "title", "target", "rel"],
            img: ["src", "alt", "title", "width", "height"],
        },
        allowedSchemes: ["https", "http", "mailto"],
        allowedSchemesByTag: {
            a: ["https", "http", "mailto"],
            img: ["https"],
        },
        transformTags: {
            a: sanitizeHtml.simpleTransform("a", {
                target: "_blank",
                rel: "noopener noreferrer",
            }),
            img: (tagName, attribs) => {
                const src = String(attribs.src || "");
                return {
                    tagName: "img",
                    attribs: {
                        src: toProxyImageUrl(src),
                        alt: attribs.alt || "",
                        title: attribs.title || "",
                        loading: "lazy",
                        width: attribs.width < 1200 && attribs.width > 10 ? attribs.width : undefined || undefined,
                        height: attribs.height < 1200 && attribs.height > 10 ? attribs.height : undefined || undefined,
                    },
                };
            },
        },
    });
}

module.exports = {
    processMarkdown,
};