document.getElementById('userForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission

    const formData = new FormData(this); // Capture form data
    const formObject = Object.fromEntries(formData.entries()); // Convert to JSON object

    // Debug: Console log the form object for troubleshooting
    console.log("Form data submitted: ", formObject);

    try {
        const response = await fetch('/api/form-submit', {
            method: 'POST', // Changed to match your endpoint
            body: JSON.stringify(formObject), // Send data as JSON
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json' // Ensure correct header
            }
        });

        const result = await response.json();

        // Success response handling
        if (response.ok) {
            document.getElementById('formMessage').textContent = 'Form submitted successfully!';
            document.getElementById('formMessage').style.display = 'block';
            document.getElementById('formError').style.display = 'none';

            // Optionally clear the form fields after a successful submission
            this.reset();
        } else {
            // Error response handling
            document.getElementById('formError').textContent = `Error: ${result.message || 'Failed to process the form.'}`;
            document.getElementById('formError').style.display = 'block';
            document.getElementById('formMessage').style.display = 'none';
        }
    } catch (error) {
        // Network or unexpected errors
        console.error('Submission error:', error);
        document.getElementById('formError').textContent = 'An unexpected error occurred. Please try again later.';
        document.getElementById('formError').style.display = 'block';
        document.getElementById('formMessage').style.display = 'none';
    }
});
