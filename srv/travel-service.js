import cds from '@sap/cds';

const { SELECT, UPDATE } = cds.ql;

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