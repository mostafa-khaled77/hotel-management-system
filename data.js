
const rooms = [
    {
        roomType: 'Single',
        roomNumber: 101,
        price: 100,
        capacity: 1,
        floor: 1,
        description:
            'Standard single room with essential amenities and city view.',
        isAvailable: true,
    },
    {
        roomType: 'Double',
        roomNumber: 102,
        price: 150,
        capacity: 2,
        floor: 1,
        description: 'Comfortable double room with a queen-sized bed.',
        isAvailable: true,
    },
    {
        roomType: 'Double',
        roomNumber: 103,
        price: 220,
        capacity: 3,
        floor: 1,
        description: 'Spacious double room featuring extra seating space.',
        isAvailable: true,
    },
    {
        roomType: 'Single',
        roomNumber: 201,
        price: 110,
        capacity: 1,
        floor: 2,
        description:
            'Cozy single room located on the second floor with a quiet atmosphere.',
        isAvailable: true,
    },
    {
        roomType: 'Double',
        roomNumber: 202,
        price: 170,
        capacity: 2,
        floor: 2,
        description:
            'Deluxe double room with a stunning pool view and modern decor.',
        isAvailable: true,
    },
    {
        roomType: 'Double',
        roomNumber: 203,
        price: 250,
        capacity: 4,
        floor: 2,
        description: 'Large double room with premium furnishings and balcony.',
        isAvailable: true,
    },
    {
        roomType: 'Single',
        roomNumber: 301,
        price: 125,
        capacity: 1,
        floor: 3,
        description:
            'Single room equipped with a high-speed workspace and smart TV.',
        isAvailable: true,
    },
    {
        roomType: 'Double',
        roomNumber: 302,
        price: 190,
        capacity: 2,
        floor: 3,
        description:
            'Twin double room featuring two separate beds and city views.',
        isAvailable: true,
    },
    {
        roomType: 'Double',
        roomNumber: 303,
        price: 280,
        capacity: 3,
        floor: 3,
        description:
            'Top-tier double room with luxury styling and panoramic views.',
        isAvailable: true,
    },
    {
        roomType: 'Single',
        roomNumber: 401,
        price: 130,
        capacity: 1,
        floor: 4,
        description:
            'Top floor single room offering ultimate privacy and comfort.',
        isAvailable: true,
    },
];

const defaultAdmin = {
    userName: 'System Admin',
    email: 'admin@hotel.com',
    role: 'admin',
    googleId: 'admin_seeded_google_id_999',
    profileImage: '',
};

module.exports = {
    defaultAdmin,
    rooms,
}