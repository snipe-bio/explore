Dropzone.autoDiscover = false;

function setupDropzone(elementId, fileType) {
    return new Dropzone(elementId, {
        url: '#', // Dummy action as no server interaction is required
        autoProcessQueue: false, // Don't process queue as we're handling files client-side
        clickable: true,
        previewsContainer: false, // Disable preview
        init: function() {
            this.on('addedfile', function(file) {
                if (this.options.maxFiles === 1 && this.files.length > 1) {
                    this.removeFile(this.files[0]); // Keep only the most recent file if only one is allowed
                }
                
                const fileRowContainer = document.querySelector(elementId + ' .file-list');
                if (fileRowContainer) { // Ensure container is found
                    const fileRow = document.createElement('div');
                    fileRow.className = 'file-info row';
                    fileRow.innerHTML = `<div class="col-xs-8">${file.name} - ${(file.size / 1024).toFixed(2)} KB</div>
                                         <div class="col-xs-4 text-right"><button class="btn btn-danger btn-xs remove-file">Remove</button></div>`;
                    
                    fileRow.querySelector('.remove-file').addEventListener('click', () => {
                        this.removeFile(file);
                        fileRowContainer.removeChild(fileRow);
                    });

                    fileRowContainer.appendChild(fileRow);
                }

                // Handle the file data (size, etc.)
                handleFileData(file, fileType);
            });
        }
    });
}

function handleFileData(file, fileType) {
    console.log(`File type: ${fileType}, Size: ${(file.size / 1024).toFixed(2)} KB`);
    // Additional handling based on file type can be added here
}

setupDropzone('#samples-dropzone', 'sample');
setupDropzone('#reference-dropzone', 'genome');
setupDropzone('#amplicon-dropzone', 'amplicon');
