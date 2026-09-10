import cds from '@sap/cds';

const { SELECT, UPDATE } = cds.ql;
const mcpPath = '/mcp/travel';

function getXsuaaUrl() {
    const credentials = cds.env.requires?.auth?.credentials;
    return (process.env.XSUAA_URL || credentials?.url || credentials?.uaaDomain || credentials?.uaadomain || '').replace(/\/$/, '');
}

function getResourceUrl(req) {
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('x-forwarded-host') || req.get('host');
    return `${protocol}://${host}${mcpPath}`;
}

cds.on('bootstrap', (app) => {
    const protectedResourceMetadata = (_req, res) => {
        const xsuaaUrl = getXsuaaUrl();

        if (!xsuaaUrl) {
            return res.status(503).json({
                error: 'XSUAA credentials are not available.'
            });
        }

        return res.json({
            resource: getResourceUrl(_req),
            authorization_servers: [xsuaaUrl]
        });
    };

    app.get('/.well-known/oauth-protected-resource', protectedResourceMetadata);
    app.get(`/.well-known/oauth-protected-resource${mcpPath}`, protectedResourceMetadata);
    app.get(`${mcpPath}/.well-known/oauth-protected-resource`, protectedResourceMetadata);
});

export default (srv) => {
    const { Bookings } = cds.entities('travel');

    srv.on('confirmBooking', async (req) => {
        const booking = await SELECT.one.from(Bookings).where({ ID: req.data.bookingId });

        if (!booking) {
            return req.reject(404, `Booking ${req.data.bookingId} was not found.`);
        }

        await UPDATE(Bookings).set({ status: 'CONFIRMED' }).where({ ID: booking.ID });
        return SELECT.one.from(Bookings).where({ ID: booking.ID });
    });
};