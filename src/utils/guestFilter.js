const guestFilter = (query) => {
    const filter = {};
    if (query.search) {
        const searchTerm = query.search;
        const searchRegex = new RegExp(searchTerm, 'i');
        filter.$or = [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
            { phone: searchRegex },
        ];
    }
    return filter;
};

module.exports = guestFilter;
