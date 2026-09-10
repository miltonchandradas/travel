import cds from '@sap/cds';

const mcpPath = '/mcp/travel';
const metadataPath = `/.well-known/oauth-protected-resource${mcpPath}`;

function getXsuaaUrl() {
    const credentials = cds.env.requires?.auth?.credentials;
    const url = process.env.XSUAA_URL || credentials?.url;
    if (url) return url.replace(/\/$/, '');

    // Binding may expose only the bare UAA domain, e.g. during hybrid testing.
    const domain = credentials?.uaadomain || credentials?.uaaDomain;
    const identityZone = credentials?.identityzone || credentials?.tenantid;
    return domain && identityZone ? `https://${identityZone}.${domain}` : '';
}

function getBaseUrl(req) {
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('x-forwarded-host') || req.get('host');
    return `${protocol}://${host}`;
}

cds.on('bootstrap', (app) => {
    const protectedResourceMetadata = (req, res) => {
        const xsuaaUrl = getXsuaaUrl();
        if (!xsuaaUrl) {
            return res.status(503).json({ error: 'XSUAA credentials are not available.' });
        }

        return res.json({
            resource: `${getBaseUrl(req)}${mcpPath}`,
            authorization_servers: [xsuaaUrl],
            authorization_endpoint: `${xsuaaUrl}/oauth/authorize`,
            token_endpoint: `${xsuaaUrl}/oauth/token`,
            bearer_methods_supported: ['header']
        });
    };

    app.get(metadataPath, protectedResourceMetadata);
    app.get('/.well-known/oauth-protected-resource', protectedResourceMetadata);
    app.get(`${mcpPath}/.well-known/oauth-protected-resource`, protectedResourceMetadata);

    // RFC 9728: 401s must advertise the metadata URL, otherwise MCP clients
    // assume this app is its own authorization server and call /authorize here.
    app.use(mcpPath, (req, res, next) => {
        const writeHead = res.writeHead;
        res.writeHead = function (...args) {
            if (res.statusCode === 401 && !res.headersSent) {
                res.setHeader(
                    'WWW-Authenticate',
                    `Bearer resource_metadata="${getBaseUrl(req)}${metadataPath}"`
                );
            }
            return writeHead.apply(this, args);
        };
        next();
    });
});

export default cds.server;
