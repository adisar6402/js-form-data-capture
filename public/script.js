// Handle form submission
document.getElementById('userForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission
    const formData = new FormData(this); // Capture form data

    // Convert FormData to a plain object
    const data = {};
    formData.forEach((value, key) => {
        data[key] = value;
    });

    // Simple form validation (example)
    if (!data.name || !data.email || !data.contact) {
        document.getElementById('formError').style.display = 'block';
        document.getElementById('formError').textContent = 'Please fill in all required fields.';
        return;
    }

    document.getElementById('loading').style.display = 'block'; // Show loading indicator

    try {
        const response = await fetch('/.netlify/functions/send-email', { // Netlify function endpoint
            method: 'POST',
            body: JSON.stringify(data), // Send as JSON
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json' // Explicitly set to application/json
            }
        });

        document.getElementById('loading').style.display = 'none'; // Hide loading indicator

        if (response.ok) {
            document.getElementById('formMessage').style.display = 'block';
            document.getElementById('formError').style.display = 'none';
            displayFormSummary(data); // Display form submission summary
            this.reset(); // Reset the form after successful submission
        } else {
            const errorText = await response.text();
            console.error('Form submission failed:', response.status, errorText);
            document.getElementById('formError').style.display = 'block';
            document.getElementById('formMessage').style.display = 'none';
        }
    } catch (error) {
        console.error('There was a problem with your submission:', error);
        document.getElementById('formError').style.display = 'block';
        document.getElementById('formMessage').style.display = 'none';
    }
});
