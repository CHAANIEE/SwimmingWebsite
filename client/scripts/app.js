document.addEventListener('DOMContentLoaded', () => {
    const birthDateInput = document.getElementById("birthDate");
    const lessonDateInput = document.getElementById("lessonDate");

    const today = new Date();

    // Set birth date limits (5–100 years old)
    const minBirthDate = new Date(today);
    minBirthDate.setFullYear(today.getFullYear() - 100);

    const maxBirthDate = new Date(today);
    maxBirthDate.setFullYear(today.getFullYear() - 5);

    birthDateInput.min = minBirthDate.toISOString().split('T')[0];
    birthDateInput.max = maxBirthDate.toISOString().split('T')[0];

    // Set lesson date limits (today to 3 months in future)
    const maxLessonDate = new Date(today);
    maxLessonDate.setMonth(maxLessonDate.getMonth() + 3);

    lessonDateInput.min = today.toISOString().split('T')[0];
    lessonDateInput.max = maxLessonDate.toISOString().split('T')[0];

    // Age validation
    birthDateInput.addEventListener('change', () => {
        const birthDate = new Date(birthDateInput.value);
        const age = calculateAge(birthDate);

        if (age < 5) {
            alert("Child must be at least 5 years old.");
            birthDateInput.value = "";
        } else if (age > 100) {
            alert("Please enter a valid birth date.");
            birthDateInput.value = "";
        }
    });

    function calculateAge(birthDate) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    // Form submission
    document.getElementById("bookingForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const firstName = document.getElementById("firstName").value.trim();
        const middleName = document.getElementById("middleName").value.trim();
        const lastName = document.getElementById("lastName").value.trim();
        const birthDate = document.getElementById("birthDate").value;
        const instructor = document.getElementById("instructor").value;
        const lessonDate = document.getElementById("lessonDate").value;

        if (!firstName || !lastName || !birthDate || !instructor || !lessonDate) {
            alert("Please fill in all required fields!");
            return;
        }

        try {
            const response = await fetch("http://localhost:3001/api/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName,
                    middleName,
                    lastName,
                    birthDate,
                    instructor,
                    date: lessonDate
                })
            });

            const result = await response.json();

            if (response.ok) {
                const button = document.querySelector('.cta-button');
                button.classList.add('success');
                setTimeout(() => button.classList.remove('success'), 2000);

                loadBookings();
                e.target.reset();
            } else {
                throw new Error(result.message || 'Booking failed');
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Oops! Something went wrong. Please try again.");
        }
    });

    // Load existing bookings
    async function loadBookings() {
        try {
            const response = await fetch("http://localhost:3001/api/bookings");
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Failed to load bookings");
            }

            const bookings = data.bookings;
            const bookingsList = document.getElementById("bookingsList");
            bookingsList.innerHTML = bookings.map(booking => `
                <div class="booking-card">
                    <p class="name">${booking.firstName} ${booking.middleName ? booking.middleName + ' ' : ''}${booking.lastName}</p>
                    <p class="instructor">With ${booking.instructor}</p>
                    <p class="date">On ${new Date(booking.date).toLocaleDateString()}</p>
                </div>
            `).join("");
        } catch (error) {
            console.error("Error loading bookings:", error);
        }
    }

    // Initial load
    loadBookings();
});
