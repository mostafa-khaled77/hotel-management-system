module.exports.STATUS = Object.freeze({
    CONFIRMED: 'confirmed',
    CHECKED_IN: 'checked-in',
    CHECKED_OUT: 'checked-out',
    CANCELLED: 'cancelled',
});

module.exports.PAYMENT_STATUS = Object.freeze({
    UNPAID: 'unpaid',
    PAID: 'paid',
    REFUNDED: 'refunded',
});

module.exports.SOURCE = Object.freeze({
    ONLINE: 'online',
    RECEPTION: 'reception',
});
