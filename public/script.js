// Show/Hide phone input based on selected contact method
document.getElementById('contact').addEventListener('change', function () {
    const phoneInput = document.getElementById('phoneInput');
    const phoneLabel = document.getElementById('phoneLabel');
    if (this.value === 'phone') {
        phoneInput.style.display = 'block';  // Show phone input
        phoneLabel.style.display = 'block';  // Show phone label
    } else {
        phoneInput.style.display = 'none';  // Hide phone input
        phoneLabel.style.display = 'none';  // Hide phone label
    }
});

// Handle form submission
document.getElementById('userForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission
    const formData = new FormData(this); // Capture form data
    
    // Simple form validation (example)
    if (!formData.get('name') || !formData.get('email') || !formData.get('contact')) {
        document.getElementById('formError').style.display = 'block';
        document.getElementById('formError').textContent = 'Please fill in all required fields.';
        return;
    }

    document.getElementById('loading').style.display = 'block'; // Show loading indicator

    try {
        // Updated for Netlify function endpoint (no Vercel)
        const response = await fetch('/.netlify/functions/send-email', { // Netlify function endpoint
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
                // 'Content-Type': 'multipart/form-data' // No need to set this header when using FormData
            }
        });

        document.getElementById('loading').style.display = 'none'; // Hide loading indicator

        if (response.ok) {
            document.getElementById('formMessage').style.display = 'block';
            document.getElementById('formError').style.display = 'none';
            displayFormSummary(Object.fromEntries(formData.entries())); // Display form submission summary
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

// Display summary of the form submission
function displayFormSummary(data) {
    const summary = document.getElementById('summary');
    summary.innerHTML = ` 
        <strong>Name:</strong> ${data.name}<br>
        <strong>Email:</strong> ${data.email}<br>
        <strong>Preferred Contact Method:</strong> ${data.contact}${data.contact === 'phone' ? `<br><strong>Phone Number:</strong> ${data.phone}` : ''}<br>
    `;
}

