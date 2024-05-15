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
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/", 
            fullStdLib: true
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
            print(dir(SigType))
        `);
        console.log('Python code executed successfully.');

        return pyodide;
    } catch (error) {
        console.error('Failed to load Pyodide or packages:', error);
    } finally {
        showLoadingAnimation(false);
    }
}

let pyodideReady = loadPyodideAndPackages();

let sampleFiles = [];
let genomeFile = null;
let ampliconFile = null;

async function handleFileData(file, fileType) {
    const fileContent = await file.text();

    if (fileType === 'sample') {
        sampleFiles.push({ name: file.name, content: fileContent });
    } else if (fileType === 'genome') {
        genomeFile = fileContent;
    } else if (fileType === 'amplicon') {
        ampliconFile = fileContent;
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
                if (fileType === 'genome' && this.files.length > 1) {
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
                        if (fileType === 'sample') {
                            sampleFiles = sampleFiles.filter(f => f.name !== file.name);
                        } else if (fileType === 'genome') {
                            genomeFile = null;
                        } else if (fileType === 'amplicon') {
                            ampliconFile = null;
                        }
                    });

                    fileRowContainer.appendChild(fileRow);
                }

                handleFileData(file, fileType);
            });
        }
    });
}

document.getElementById('submitBtn').addEventListener('click', async function() {
    if (sampleFiles.length === 0) {
        alert('At least one sample file is required.');
        return;
    }
    if (!genomeFile) {
        alert('A single genome file is required.');
        return;
    }
    await processSignatures();
});

async function processSignatures() {
    const pyodide = await pyodideReady;
    let result = {};

    try {
        await pyodide.runPythonAsync(`
            import json
            genome_sig_str = json.loads("""${genomeFile}""")
            genome = Signature(51, SigType.GENOME)
            genome.load_from_json_string(json.dumps(genome_sig_str))

            ${ampliconFile ? `
                amplicon_sig_str = json.loads("""${ampliconFile}""")
                amplicon = Signature(51, SigType.AMPLICON)
                amplicon.load_from_json_string(json.dumps(amplicon_sig_str))
            ` : ''}
        `);

        for (let sample of sampleFiles) {
            let sampleResult = await pyodide.runPythonAsync(`
                sample_sig_str = json.loads("""${sample.content}""")
                sample = Signature(51, SigType.SAMPLE)
                sample.load_from_json_string(json.dumps(sample_sig_str))

                sample.add_reference_signature(genome)

                ${ampliconFile ? `
                    sample.add_amplicon_signature(amplicon, name='exome')
                ` : ''}

                {
                    "sample_stats": sample.all_stats,
                    "reference_stats": sample.reference_stats.all_stats(),
                    ${ampliconFile ? `"amplicon_stats": sample.amplicon_stats["exome"].all_stats(),` : ''}
                }
            `);

            result[sample.name] = sampleResult.toJs();
        }

        console.log(result);
    } catch (error) {
        console.error('Error processing signatures:', error);
    }
}

setupDropzone('#samples-dropzone', 'sample');
setupDropzone('#reference-dropzone', 'genome');
setupDropzone('#amplicon-dropzone', 'amplicon');
