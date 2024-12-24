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
        event.preventDefault(); // Prevent default form submission
        loading.style.display = 'block'; // Show loading spinner
        formMessage.style.display = 'none';
        formError.style.display = 'none';

        // Capture form data
        const formData = Object.fromEntries(new FormData(form).entries()); // Convert FormData to object

        try {
            const response = await fetch('/.netlify/functions/send-email', { // Endpoint updated to match backend
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData), // Send data as JSON
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Response from server:', result);
                displaySuccess();
                updateSummary(formData); // Update the summary on success
                form.reset(); // Clear the form fields
            } else {
                const errorText = await response.text();
                console.error('Form submission failed:', response.status, errorText);
                displayError(`Error: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            displayError('An error occurred while submitting the form.');
        } finally {
            loading.style.display = 'none'; // Hide loading spinner
        }
    });

    // Display success message
    function displaySuccess() {
        formMessage.style.display = 'block';
        formError.style.display = 'none';
        formMessage.textContent = 'Form submitted successfully!';
    }

    // Display error message
    function displayError(message) {
        formMessage.style.display = 'none';
        formError.style.display = 'block';
        formError.textContent = message || 'An error occurred while processing the request.';
    }

    // Update summary section after successful submission
    function updateSummary(data) {
        summary.innerHTML = `
            <strong>Name:</strong> ${data.name}<br>
            <strong>Email:</strong> ${data.email}<br>
            <strong>Contact Method:</strong> ${data.contact}<br>
            ${data.phone ? `<strong>Phone:</strong> ${data.phone}` : ''}
        `;
    }
});
