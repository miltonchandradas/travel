using { travel as db } from '../db/schema';

@path: '/odata/v4/travel'
@odata
@mcp: 'travel'
@mcp.instructions: 'Use describe to inspect the travel data model. Use query to find destinations, travelers, trips, and bookings. Filter trips by status or date and bookings by traveler or trip. Use call to invoke confirmBooking with a booking ID.'
service TravelService {
  entity Destinations as projection on db.Destinations;
  entity Travelers    as projection on db.Travelers;
  entity Trips        as projection on db.Trips;
  entity Bookings     as projection on db.Bookings;

  @description: 'Confirm a pending booking and return the updated booking.'
  action confirmBooking(bookingId: UUID not null) returns Bookings;
}