const socket = io();

// Fetch and display uploaded files
async function fetchAndDisplayFiles() {
    try {
        const response = await fetch('/files');
        const fileUrls = await response.json();
        const container = document.getElementById('file-display-container');
        container.innerHTML = ''; // Clear the container before adding new files

        fileUrls.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Uploaded File';
            img.classList.add('img-thumbnail', 'm-2');
            img.style.maxWidth = '200px';

            // Create Delete Button
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('btn', 'btn-outline', 'btn-danger', 'm-2');
            deleteButton.setAttribute('title', 'Delete');
            deleteButton.innerHTML = `<i class="fa fa-trash"></i> <span class="hidden-xs"> Delete</span>`;

            // Create Download Button
            // Create Download Button
            const downloadButton = document.createElement('a');
            downloadButton.classList.add('btn', 'btn-outline', 'btn-success', 'm-2');
            downloadButton.setAttribute('href', url);
            downloadButton.setAttribute('download', url.split('/').pop()); // This will set the file name as the download name
            downloadButton.setAttribute('title', 'Download');
            downloadButton.innerHTML = `<i class="fa fa-download"></i> <span class="hidden-xs"> Download</span>`;

            // Add event listener for delete functionality (if needed)
            deleteButton.addEventListener('click', async () => {
                const confirmed = await Swal.fire({
                    title: "Are you sure?",
                    text: "This file will be permanently deleted!",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, delete it!",
                    cancelButtonText: "Cancel"
                });

                if (confirmed.isConfirmed) {
                    try {
                        const deleteResponse = await fetch(`/delete?file=${encodeURIComponent(url)}`, {
                            method: "DELETE"
                        });

                        if (deleteResponse.ok) {
                            Swal.fire("Deleted!", "Your file has been deleted.", "success");
                            fetchAndDisplayFiles(); // Refresh the file list
                        } else {
                            Swal.fire("Error", "Failed to delete the file.", "error");
                        }
                    } catch (error) {
                        console.error("Error deleting file:", error);
                        Swal.fire("Error", "Failed to delete the file.", "error");
                    }
                }
            });

            const wrapper = document.createElement('div'); // Wrap image & buttons together
            wrapper.classList.add('d-flex', 'flex-column', 'align-items-center', 'm-2');
            wrapper.appendChild(img);
            wrapper.appendChild(downloadButton);
            wrapper.appendChild(deleteButton);

            container.appendChild(wrapper);
        });
    } catch (error) {
        console.error('Error fetching files:', error);
    }
}

// Real-time text sync
document.getElementById('shared-text-area').addEventListener('input', (e) => {
    socket.emit('text-update', e.target.value);
});

socket.on('text-update', (text) => {
    document.getElementById('shared-text-area').value = text;
});

// Copy to clipboard
document.getElementById('copy-text-btn').addEventListener('click', () => {
    const textToCopy = document.getElementById('shared-text-area').value;
    navigator.clipboard.writeText(textToCopy).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Copied!',
            text: 'Text has been copied to clipboard.',
        });
    }).catch(() => {
        Swal.fire({
            icon: 'error',
            title: 'Copy Failed',
            text: 'Unable to copy text to clipboard.',
        });
    });
});

// Handle file upload
document.getElementById('file-upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Upload Successful!',
                text: 'Your files have been uploaded.',
            });
            fetchAndDisplayFiles();
        } else {
            Swal.fire("Error", "Upload failed!", "error");
        }
    } catch (error) {
        console.error('Error uploading files:', error);
        Swal.fire("Error", "Upload failed!", "error");
    }
});

// Load files when the page loads
window.onload = fetchAndDisplayFiles;