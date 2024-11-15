document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('userForm');
    const formMessage = document.getElementById('formMessage');
    const formError = document.getElementById('formError');
    const loading = document.getElementById('loading');
    const contactSelect = document.getElementById('contact');
    const phoneLabel = document.getElementById('phoneLabel');
    const phoneInput = document.getElementById('phoneInput');
    const summary = document.getElementById('summary');

    // Toggle phone input based on preferred contact method
    contactSelect.addEventListener('change', () => {
        const isPhoneSelected = contactSelect.value === 'phone';
        phoneLabel.style.display = isPhoneSelected ? 'block' : 'none';
        phoneInput.style.display = isPhoneSelected ? 'block' : 'none';
    });

    // Handle form submission
    form.addEventListener('submit', async (event) => {
        event.preventDefault();  // Prevent default form submission
        loading.style.display = 'block';  // Show loading message
        formMessage.style.display = 'none';
        formError.style.display = 'none';

        // Capture form data
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        console.log('Form data to be sent:', JSON.stringify(data)); // Log the JSON data

        try {
            const response = await fetch('/.netlify/functions/formHandler', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            console.log('Response from server:', result); // Log the response from server

            if (response.ok) {
                displaySuccess();
                updateSummary(data);
                form.reset();  // Reset form on success
            } else {
                console.error('Server response not OK:', result); // Log the server response if not OK
                displayError();
            }
        } catch (error) {
            console.error('Form submission error:', error);
            displayError();
        } finally {
            loading.style.display = 'none';  // Hide loading message
        }
    });

    // Display success message
    function displaySuccess() {
        formMessage.style.display = 'block';
        formError.style.display = 'none';
    }

    // Display error message
    function displayError() {
        formMessage.style.display = 'none';
        formError.style.display = 'block';
    }

    // Update summary section after successful submission
    function updateSummary(data) {
        summary.innerHTML = `
            <strong>Name:</strong> ${data.name} <br>
            <strong>Email:</strong> ${data.email} <br>
            <strong>Contact Method:</strong> ${data.contact} <br>
            ${data.phone ? `<strong>Phone:</strong> ${data.phone}` : ''}
        `;
    }
});
