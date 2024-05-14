Dropzone.autoDiscover = false;

function showLoadingAnimation(show) {
    const loader = document.getElementById('loadingAnimation');
    loader.style.display = show ? 'block' : 'none';
}

async function loadPyodideAndPackages() {
    showLoadingAnimation(true);
    try {
        console.log('Loading Pyodide...');
        const pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/"
        });
        console.log('Pyodide loaded successfully.');

        console.log('Loading Python packages...');
        await pyodide.loadPackage(['micropip', 'numpy']);
        console.log('Python packages loaded successfully.');

        console.log('Loading local Python files...');
        const response = await fetch('snipe.py');
        const code = await response.text();
        pyodide.runPython(code);
        console.log('Local Python files loaded successfully.');

        await pyodide.runPythonAsync(`
            print(dir(Signature))
            print(dir(SigType))

        `);
        console.log('Python code executed successfully.');
    } catch (error) {
        console.error('Failed to load Pyodide or packages:', error);
    } finally {
        showLoadingAnimation(false);
    }
}

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
                if (fileRowContainer) {
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

// Load Pyodide and the Python package
loadPyodideAndPackages();
