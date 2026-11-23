const todayInHotel = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
}).format(new Date());

module.exports = todayInHotel;
