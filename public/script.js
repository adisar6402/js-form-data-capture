// Show/Hide phone input based on selected contact method
document.getElementById('contact').addEventListener('change', function () {
    const phoneInput = document.getElementById('phoneInput');
    const phoneLabel = document.getElementById('phoneLabel');
    if (this.value === 'phone') {
        phoneInput.style.display = 'block'; // Show phone input
        phoneLabel.style.display = 'block'; // Show phone label
    } else {
        phoneInput.style.display = 'none'; // Hide phone input
        phoneLabel.style.display = 'none'; // Hide phone label
    }
});

// Handle form submission
document.getElementById('userForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission
    const formData = new FormData(this); // Capture form data

    // Convert FormData to JSON object
    const formObject = Object.fromEntries(formData.entries());

    // Simple form validation (example)
    if (!formObject.name || !formObject.email || !formObject.contact) {
        document.getElementById('formError').style.display = 'block';
        document.getElementById('formError').textContent = 'Please fill in all required fields.';
        return;
    }

    document.getElementById('loading').style.display = 'block'; // Show loading indicator

    try {
        // Send the data as JSON
        const response = await fetch('/.netlify/functions/send-email', { // Netlify function endpoint
            method: 'POST',
            body: JSON.stringify(formObject), // Convert object to JSON string
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json' // Set Content-Type to application/json
            }
        });

        document.getElementById('loading').style.display = 'none'; // Hide loading indicator

        if (response.ok) {
            document.getElementById('formMessage').style.display = 'block'; // Show success message
            document.getElementById('formError').style.display = 'none';
            displayFormSummary(formObject); // Display form submission summary
            this.reset(); // Reset the form after successful submission
        } else {
            const errorText = await response.text();
            console.error('Form submission failed:', response.status, errorText);
            document.getElementById('formError').textContent = `Error: ${response.status} - ${errorText}`;
            document.getElementById('formError').style.display = 'block'; // Show error message
            document.getElementById('formMessage').style.display = 'none';
        }
    } catch (error) {
        console.error('There was a problem with your submission:', error);
        document.getElementById('formError').textContent = 'An unexpected error occurred. Please try again later.';
        document.getElementById('formError').style.display = 'block'; // Show error message
        document.getElementById('formMessage').style.display = 'none';
    }
});

// Display summary of the form submission
function displayFormSummary(data) {
    const summary = document.getElementById('summary');
    summary.innerHTML = `
        <strong>Name:</strong> ${data.name}<br>
        <strong>Email:</strong> ${data.email}<br>
        <strong>Preferred Contact Method:</strong> ${data.contact}${data.contact === 'phone' ? `<br><strong>Phone Number:</strong> ${data.phone}` : ''}<br>
    `;
}
