document.getElementById('userForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission
    const formData = new FormData(this); // Capture form data
    const formObject = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/.netlify/functions/send-email', {
            method: 'POST',
            body: JSON.stringify(formObject),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        if (response.ok) {
            document.getElementById('formMessage').textContent = 'Form submitted successfully!';
            document.getElementById('formMessage').style.display = 'block';
            document.getElementById('formError').style.display = 'none';
        } else {
            document.getElementById('formError').textContent = `Error: ${result.message}`;
            document.getElementById('formError').style.display = 'block';
            document.getElementById('formMessage').style.display = 'none';
        }
    } catch (error) {
        document.getElementById('formError').textContent = 'An unexpected error occurred. Please try again later.';
        document.getElementById('formError').style.display = 'block';
        document.getElementById('formMessage').style.display = 'none';
    }
});
