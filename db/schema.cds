namespace travel;

using { cuid, managed } from '@sap/cds/common';

entity Destinations : cuid, managed {
  name        : String(100) not null;
  countryCode : String(2) not null;
  city        : String(100);
  description : String(500);
}

entity Travelers : cuid, managed {
  firstName : String(100) not null;
  lastName  : String(100) not null;
  email     : String(255) not null;
  phone     : String(30);
}

entity Trips : cuid, managed {
  title       : String(200) not null;
  description : String(500);
  startDate   : Date not null;
  endDate     : Date not null;
  status      : String(20) default 'PLANNED';
  destination : Association to one Destinations not null;
}

entity Bookings : cuid, managed {
  bookingReference : String(50) not null;
  bookingDate      : Date not null;
  numberOfGuests   : Integer default 1;
  totalAmount      : Decimal(15, 2);
  currencyCode     : String(3) default 'USD';
  status           : String(20) default 'PENDING';
  trip             : Association to one Trips not null;
  traveler         : Association to one Travelers not null;
}