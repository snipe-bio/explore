// main.js
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
genome_name = genome.name
amplicon_name = ""

${ampliconFile ? `
amplicon_sig_str = json.loads("""${ampliconFile}""")
amplicon = Signature(51, SigType.AMPLICON)
amplicon.load_from_json_string(json.dumps(amplicon_sig_str))
print(f"debug:::::: {amplicon.name}")
amplicon_name = amplicon.name
` : ''}
        `);

        for (let sample of sampleFiles) {
            let sampleResult = await pyodide.runPythonAsync(`
import json
sample_sig_str = json.loads("""${sample.content}""")
sample = Signature(51, SigType.SAMPLE)
sample.load_from_json_string(json.dumps(sample_sig_str))
sample.add_reference_signature(genome)
sample_name = sample.name if sample.name else "${sample.name}"

${ampliconFile ? `
sample.add_amplicon_signature(amplicon)
` : ''}

result = {
"sample_stats": sample.all_stats,
"reference_stats": sample.reference_stats.all_stats(),
${ampliconFile ? `"amplicon_stats": sample.amplicon_stats[amplicon_name].all_stats(),` : ''}
"sample_name": sample_name,
"genome_name": genome_name,
"amplicon_name": amplicon_name
}
result
            `);

            const sampleResultJS = sampleResult.toJs();
            console.log('Sample result:', sampleResultJS); // Debugging line
            result[sampleResultJS.get('sample_name')] = sampleResultJS;
        }

        displayResults(result);
    } catch (error) {
        console.error('Error processing signatures:', error);
    }
}

function displayResults(result) {
    const resultsTableBody = document.getElementById('resultsTableBody');
    resultsTableBody.innerHTML = ''; // Clear previous results

    console.log('Displaying results:', result); // Debugging line

    for (const [sampleName, data] of Object.entries(result)) {
        const sampleStats = data.get('sample_stats');
        const referenceStats = data.get('reference_stats');
        const ampliconStats = data.get('amplicon_stats');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sampleName}</td>
            <td>${sampleStats.get('unique_hashes')}</td>
            <td>${sampleStats.get('total_abundance')}</td>
            <td>${referenceStats.get(`${data.get('genome_name')}_saturation`)}</td>
            <td>${referenceStats.get(`${data.get('genome_name')}_total_abundance`)}</td>
            <td>${ampliconStats ? ampliconStats.get(`${data.get('amplicon_name')}_saturation`) : 'N/A'}</td>
            <td>${ampliconStats ? ampliconStats.get(`${data.get('amplicon_name')}_total_abundance`) : 'N/A'}</td>
        `;
        resultsTableBody.appendChild(row);
    }

    document.getElementById('resultsTableContainer').style.display = 'block';
}

setupDropzone('#samples-dropzone', 'sample');
setupDropzone('#reference-dropzone', 'genome');
setupDropzone('#amplicon-dropzone', 'amplicon');

document.getElementById('genomeDropdown').addEventListener('change', function() {
    const genome = this.value;
    const species = document.getElementById('speciesDropdown').value;
    const plotDropdownContainer = document.getElementById('plotDropdownContainer');
    const referencePanel = document.getElementById('referencePanel');
    const searchContainer = document.getElementById('searchContainer');
    const plot = document.getElementById('plot');

    // Hide plot and plot dropdown container initially
    plot.style.display = 'none';
    plotDropdownContainer.style.display = 'none';
    searchContainer.style.display = 'none';
    referencePanel.style.display = 'none';

    // Clear previous files from the reference genome dropzone by mimicking click on remove buttons
    const referenceDropzone = Dropzone.forElement('#reference-dropzone');
    const fileRows = document.querySelectorAll('#reference-dropzone .file-info .remove-file');
    fileRows.forEach(removeButton => removeButton.click());

    if (genome === 'CanFam3.1' || genome === 'HG38') {
        const plotDropdown = document.getElementById('plotDropdown');
        while (plotDropdown.firstChild) {
            plotDropdown.removeChild(plotDropdown.firstChild);
        }

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.textContent = 'Select a plot';
        plotDropdown.appendChild(defaultOption);

        // Add specific plots for the selected genome
        const plotOption = document.createElement('option');
        plotOption.value = 'defaultPlot';
        plotOption.textContent = 'Default Plot';
        plotDropdown.appendChild(plotOption);

        plotDropdownContainer.style.display = 'block';

        fetch(`../data/${species}_genome.sig`)
            .then(response => response.text())
            .then(data => {
                const mockFile = new File([data], `${species}_genome.sig`, { type: 'application/octet-stream' });
                referenceDropzone.emit("addedfile", mockFile);
                referenceDropzone.emit("complete", mockFile);
            });
    } else {
        referencePanel.style.display = 'block';
    }
});

document.getElementById('speciesDropdown').addEventListener('change', function() {
    const genomeDropdownContainer = document.getElementById('genomeDropdownContainer');
    const genomeDropdown = document.getElementById('genomeDropdown');

    genomeDropdownContainer.style.display = 'block';
    while (genomeDropdown.firstChild) {
        genomeDropdown.removeChild(genomeDropdown.firstChild);
    }

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = 'Select a genome';
    genomeDropdown.appendChild(defaultOption);

    if (this.value === 'dog') {
        const option1 = document.createElement('option');
        option1.value = 'CanFam3.1';
        option1.textContent = 'CanFam3.1';
        genomeDropdown.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = 'other';
        option2.textContent = 'Other';
        genomeDropdown.appendChild(option2);
    } else if (this.value === 'human') {
        const option1 = document.createElement('option');
        option1.value = 'HG38';
        option1.textContent = 'HG38';
        genomeDropdown.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = 'other';
        option2.textContent = 'Other';
        genomeDropdown.appendChild(option2);
    }
});




document.getElementById('plotDropdown').addEventListener('change', function() {
    const plot = this.value;
    const species = document.getElementById('speciesDropdown').value;

    const plotConfig = {
        plotDiv: 'plot',
        dataUrl: `../data/${species}_data2.json`,
        x: 'unique_hashes',
        y: 'genomic_saturation',
        xTitle: 'Unique Hashes',
        yTitle: 'Genomic Coverage',
        mainTitle: `Unique Hashes vs Genomic Coverage (${species.charAt(0).toUpperCase() + species.slice(1)})`,
        xLog: false,
        yLog: false
    };

    document.getElementById('searchContainer').style.display = 'block';
    document.getElementById('plot').style.display = 'block';
    initializePlot(plotConfig);
});
