const API_URL = 'http://localhost:5000/api/v1/bookings/online';

const TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhZWE5ODdjODgwNmVjNGI3YjIzMzUzOSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc5NTI3NTUxOCwiZXhwIjoxNzk3ODY3NTE4fQ.J3EUzTT51g4XI4TpRuYwvw4MNi8wRTesxC-x8JROIng';

const bookingData = {
    room: '6b04331505ae35ba16d7403d',
    checkInDate: '2027-01-15',
    checkOutDate: '2027-01-15',
    guestsCount: 1,
};
const sendBookingRequest = async () => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify(bookingData),
        });

        const result = await response.json();

        console.log('HTTP Status:', response.status);
        console.log('Success:', response.ok);
        console.log('Response:', JSON.stringify(result, null, 2));

        if (response.status === 201 && response.ok) {
            console.log('PASS: Booking created successfully.');
        } else {
            console.log('FAIL: Booking request was rejected.');
        }
    } catch (error) {
        console.error('Request Error:', error.message);
    }
};

const runTest = async () => {
    console.log('Starting Cancelled Booking Test...');
    await sendBookingRequest();
};

runTest();
