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
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/", fullStdLib : true,
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

async function handleFileData(file, fileType) {
    const fileContent = await file.text();
    const pyodide = await pyodideReady;

    if (fileType === 'sample') {
        window.sampleSignature = fileContent;
    } else if (fileType === 'genome') {
        window.genomeSignature = fileContent;
    } else if (fileType === 'amplicon') {
        window.ampliconSignature = fileContent;
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

document.getElementById('submitBtn').addEventListener('click', async function() {
    if (!window.sampleSignature) {
        alert('At least one sample file is required.');
        return;
    }
    if (!window.genomeSignature && !window.ampliconSignature) {
        alert('At least one genome or amplicon file is required.');
        return;
    }
    await processSignatures();
});

async function processSignatures() {
    const pyodide = await pyodideReady;
    let result;

    if (window.sampleSignature && window.genomeSignature && window.ampliconSignature) {
        result = await pyodide.runPythonAsync(`
            import json
            sample_sig_str = json.loads("""${window.sampleSignature}""")
            genome_sig_str = json.loads("""${window.genomeSignature}""")
            amplicon_sig_str = json.loads("""${window.ampliconSignature}""")

            sample = Signature(51, SigType.SAMPLE)
            sample.load_from_json_string(json.dumps(sample_sig_str))

            genome = Signature(51, SigType.GENOME)
            genome.load_from_json_string(json.dumps(genome_sig_str))

            amplicon = Signature(51, SigType.AMPLICON)
            amplicon.load_from_json_string(json.dumps(amplicon_sig_str))

            sample.add_reference_signature(genome)
            sample.add_amplicon_signature(amplicon, name='exome')

            {
                "reference_stats": sample.reference_stats.all_stats(),
                "amplicon_stats": sample.amplicon_stats["exome"].all_stats()
            }
        `);
    } else if (window.sampleSignature && window.genomeSignature) {
        result = await pyodide.runPythonAsync(`
            import json
            sample_sig_str = json.loads("""${window.sampleSignature}""")
            genome_sig_str = json.loads("""${window.genomeSignature}""")

            sample = Signature(51, SigType.SAMPLE)
            sample.load_from_json_string(json.dumps(sample_sig_str))

            print(sample)

            genome = Signature(51, SigType.GENOME)
            genome.load_from_json_string(json.dumps(genome_sig_str))

            sample.add_reference_signature(genome)

            {
                "reference_stats": sample.reference_stats.all_stats()
            }
        `);
    } else if (window.sampleSignature && window.ampliconSignature) {
        result = await pyodide.runPythonAsync(`
            import json
            sample_sig_str = json.loads("""${window.sampleSignature}""")
            amplicon_sig_str = json.loads("""${window.ampliconSignature}""")

            sample = Signature(51, SigType.SAMPLE)
            sample.load_from_json_string(json.dumps(sample_sig_str))

            amplicon = Signature(51, SigType.AMPLICON)
            amplicon.load_from_json_string(json.dumps(amplicon_sig_str))

            sample.add_amplicon_signature(amplicon, name='exome')

            {
                "amplicon_stats": sample.amplicon_stats["exome"].all_stats()
            }
        `);
    }

    if (result) {
        console.log(result.toJs());
    }
}

setupDropzone('#samples-dropzone', 'sample');
setupDropzone('#reference-dropzone', 'genome');
setupDropzone('#amplicon-dropzone', 'amplicon');
