function plot_depth_per_chromosome(selectedData) {
    console.log('Selected Data:', selectedData);

    // Existing Plotly check
    if (typeof Plotly === 'undefined') {
        console.error('Plotly library is not loaded.');
        alert('Plotly library is not loaded. Please ensure it is included in your project.');
        return;
    }

    // Identify chromosome columns
    const chrColumns = Object.keys(selectedData).filter(key => /^chr[-\dXY]+$/i.test(key));
    console.log('Detected Chromosome Columns:', chrColumns);

    if (chrColumns.length === 0) {
        alert('No chromosome data available for this experiment.');
        return;
    }

    // Extract chromosome labels and their corresponding values
    const chromosomes = chrColumns.map(chr => chr.toUpperCase());
    const values = chrColumns.map(chr => {
        const val = parseFloat(selectedData[chr]);
        return isNaN(val) ? 0 : val;
    });

    console.log('Chromosomes:', chromosomes);
    console.log('Values:', values);

    // Define colors for each chromosome bar (optional: customize as needed)
    const colors = [
        '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b',
        '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#1f77b4', '#ff9896',
        '#98df8a', '#c5b0d5', '#ffbb78', '#c49c94', '#f7b6d2', '#c7c7c7',
        '#dbdb8d', '#9edae5', '#ff9896', '#c49c94', '#c7c7c7', '#dbdb8d',
        '#9edae5', '#bcbd22', '#17becf', '#e377c2', '#9467bd', '#8c564b',
        '#f7b6d2', '#7f7f7f', '#bcbd22', '#ffbb78', '#c5b0d5', '#e377c2',
        '#17becf', '#1f77b4', '#ff7f0e', '#2ca02c'
    ];

    // Create modal elements
    // Check if a modal already exists and remove it to prevent duplicates
    const existingModal = document.getElementById('chromosome-depth-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'chromosome-depth-modal';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '1000';

    // Create modal content container
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#fff';
    modalContent.style.borderRadius = '8px';
    modalContent.style.width = '80%';
    modalContent.style.maxWidth = '1200px';
    modalContent.style.maxHeight = '90%';
    modalContent.style.overflow = 'auto';
    modalContent.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    modalContent.style.position = 'relative';
    modalContent.style.padding = '20px';

    // Create header with title and close button
    const modalHeader = document.createElement('div');
    modalHeader.style.display = 'flex';
    modalHeader.style.justifyContent = 'space-between';
    modalHeader.style.alignItems = 'center';
    modalHeader.style.marginBottom = '10px';

    const modalTitle = document.createElement('h2');
    modalTitle.innerText = `Chromosome-level Depth for Experiment: ${selectedData['Experiment ID'] || 'N/A'}`;
    modalTitle.style.margin = '0';

    const closeButton = document.createElement('span');
    closeButton.innerHTML = '&times;';
    closeButton.style.fontSize = '28px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.color = '#aaa';
    closeButton.onmouseover = () => { closeButton.style.color = '#000'; };
    closeButton.onmouseout = () => { closeButton.style.color = '#aaa'; };
    closeButton.onclick = () => {
        document.body.removeChild(modalOverlay);
    };

    // close when clicking outside the modal
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    };


    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    // Create plot container
    const plotDiv = document.createElement('div');
    plotDiv.id = 'chromosome-depth-plot';
    plotDiv.style.width = '100%';
    plotDiv.style.height = '600px';

    // Create export button
    const exportButton = document.createElement('button');
    exportButton.innerText = 'Export Plot as PNG';
    exportButton.style.marginTop = '20px';
    exportButton.style.padding = '10px 20px';
    exportButton.style.backgroundColor = '#4CAF50';
    exportButton.style.color = '#fff';
    exportButton.style.border = 'none';
    exportButton.style.borderRadius = '5px';
    exportButton.style.cursor = 'pointer';
    exportButton.style.fontSize = '16px';
    exportButton.onmouseover = () => { exportButton.style.backgroundColor = '#45a049'; };
    exportButton.onmouseout = () => { exportButton.style.backgroundColor = '#4CAF50'; };

    // Export functionality
    exportButton.addEventListener('click', () => {
        Plotly.downloadImage(plotDiv, {
            format: 'png',
            filename: `chromosome_depth_${selectedData['Experiment ID'] || 'experiment'}`,
            width: 1200,
            height: 600,
            scale: 2 // To ensure higher resolution
        });
    });

    // Assemble modal content
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(plotDiv);
    modalContent.appendChild(exportButton);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Define Plotly data and layout
    const plotData = [{
        x: chromosomes,
        y: values,
        type: 'bar',
        marker: { color: colors.slice(0, chromosomes.length) }
    }];

    const layout = {
        title: `${selectedData['BioSample'] || 'N/A'}_${selectedData['Experiment ID'] || 'N/A'}`,
        autosize: true,
        width: 1100,
        height: 600,
        margin: {
            l: 60,
            r: 30,
            b: 150,
            t: 50,
            pad: 4
        },
        xaxis: {
            title: 'Chromosome',
            tickangle: -45,
            automargin: true
        },
        yaxis: { title: 'Mean abundance' }
    };

    const config = { responsive: true };

    // Render the plot
    Plotly.newPlot(plotDiv, plotData, layout, config);
}

const hoverColumns = [
    'Experiment ID', 'BioProject', 'Assay type', 'Genome coverage index',
    'Amplicon coverage index', 'Genomic k-mers mean abundance', 'Amplicon k-mers mean abundance',
    'Mapping index', 'Predicted contamination index', 'Sequencing errors index', 'Autosomal k-mer mean abundance CV'
];


function displayDataStatistics() {
    const logInfoDiv = document.getElementById('log-info');
    if (!logInfoDiv) return;

    // Show the log info box
    logInfoDiv.style.display = 'block';

    const totalPoints = data.length;
    const assayTypes = [...new Set(data.map(row => row["Assay type"] || 'Unknown').filter(type => type))];
    const assayTypeCounts = assayTypes.map(type => {
        const count = data.filter(row => row["Assay type"] === type).length;
        return `\t- ${type}: ${count}`;
    }).join('\n'); // Join with newline characters for line breaks

    const uniqueBioProjects = new Set(data.map(row => row["BioProject"])).size;
    const uniqueExperiments = new Set(data.map(row => row["Experiment ID"])).size;

    // Prepare metadata information
    let metadataInfo = '';
    if (snipe_metadata && Object.keys(snipe_metadata).length > 0) {
        metadataInfo = `<details style="margin-top: 0px;">
            <summary><strong>Metadata (click to expand)</strong></summary>
            <pre>${JSON.stringify(snipe_metadata.metadata, null, 2)}</pre></details>
        `;
    }

    // Prepare the main stats as plain text within a <div>
    const logContent = `
- Total Data Points: ${totalPoints}
- BioProjects: ${uniqueBioProjects}
- Experiments: ${uniqueExperiments}
<details style="margin-top: 0px;">
            <summary>Assay types (click to expand)</summary>
            <pre>${assayTypeCounts}</pre>
        </details>${metadataInfo}`;

    logInfoDiv.innerHTML = `
Data Statistics: ${logContent}
    `.trim();
}


// Column Definitions
const columnDefinitions = {
    "Total unique k-mers": "It represents the unique genetic content in the sample",
    "Genomic unique k-mers": "It represents the unique genetic content in the sample that matches the reference genome",
    "Amplicon unique k-mers": "It represents the unique genetic content in the sample that matches the exome",
    "Genome coverage index": "It shows how much of the genome bases are covered",
    "Amplicon coverage index": "It shows how much of the exome bases are covered",
    "k-mer total abundance": "It correlates with the total amount of sequencing",
    "Genomic k-mers total abundance": "It correlates with the total amount of sequencing that aligns to the reference genome",
    "Amplicon k-mers total abundance": "It correlates with the total amount of sequencing that aligns to the exome",
    "Mapping index": "Genomic k-mers total Abundance as a fraction of all k-mer total abundance. It correlates with the mapped sequencing bases to the genomes",
    "Predicted contamination index": "The fraction abundance of non-genomic k-mers if the k-mer count > 1. It represent genetic variance and increase if there is sequence contamination",
    "Empirical contamination index": "The fraction of k-mers matching microbial sequences. It is calcuted by Sourmash software and expected to correlate with Snipe's predicted contamination index",
    "Sequencing errors index": "The fraction abundance of non-genomic k-mers if the k-mer count = 1 (i.e., singletons). It represents sequecning errors",
    "Autosomal k-mer mean abundance CV": "The coefficient of variation (CV) for the mean abundance of k-mers specific to each autosome. A high CV suggests variability, potentially pointing to uneven sequencing",
    "Amplicon enrichment score": "A composite metric for quantifying amplicon enrichment in a sequencing experiment",
    "chrX Ploidy score": "The ratio of the mean abundance of chrX-specific k-mers to autosomal-specific k-mers. It correlates with X chromosome ploidy",
    "chrY Coverage score": "The ratio of sequence coverage for chrY and autosomal chromosomes.",
    "Coverage of 1fold more sequencing": "Expected coverage with 1 fold more sequecning"
};

// Function to populate the modal with column definitions
function populateModalColumnDefinitions() {
    const columnDefinitionsDiv = document.getElementById('modal-column-definitions');
    if (!columnDefinitionsDiv) return;

    let htmlContent = '<dl>';

    const columns = Object.keys(data[0]).filter(col => !col.startsWith('_'));

    columns.forEach(col => {
        if (col in columnDefinitions) {
            const definition = columnDefinitions[col] || "No definition available.";
            htmlContent += `<dt>${col}</dt><dd>${definition}</dd>`;
        }
    });

    htmlContent += '</dl>';
    columnDefinitionsDiv.innerHTML = htmlContent;
}






let driverInstance;
function initOnboardingTour() {
    const driver = window.driver.js.driver; // For Driver.js version 1.0.1

    const steps = [
        {
            element: '.container h1',
            popover: {
                title: 'Welcome to Snipe SRA Exploration Dashboard',
                description: 'This dashboard helps you visualize and analyze the SRA experiments.',
                position: 'bottom'
            }
        },
        {
            element: '.floating-buttons',
            popover: {
                title: 'Control Buttons',
                description: 'Use these buttons to clear selections, export data, and access help.',
                position: 'left'
            }
        },
        {
            element: '.search-container',
            popover: {
                title: 'Search Bar',
                description: 'Search for specific data points by BioProject, BioSample, or Experiment.',
                position: 'bottom'
            }
        },
        {
            element: '.controls',
            popover: {
                title: 'Plot Controls',
                description: 'Use these controls to customize your plot.',
                position: 'bottom'
            }
        },
        {
            element: '.additional-inputs',
            popover: {
                title: 'Plot Details',
                description: 'Add a title and notes for your plot here.',
                position: 'bottom'
            }
        }
    ];

    driverInstance = driver({
        animate: true,
        opacity: 0.75,
        padding: 10,
        allowClose: true,
        overlayClickNext: false,
        doneBtnText: 'Finish',
        closeBtnText: 'Close',
        nextBtnText: '→',
        prevBtnText: '←',
        showButtons: false,
        keyboardControl: true,
        showProgress: true,
        steps: steps,
    });

}

function startTour() {
    driverInstance.drive();
}


function showNotification(message, type = 'success') {
    const notificationContainer = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // Style based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#2ecc71';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f39c12';
            break;
        default:
            notification.style.backgroundColor = '#2ecc71';
    }

    notification.style.color = '#fff';
    notification.style.padding = '15px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    notification.style.opacity = '1';
    notification.style.transition = 'opacity 0.5s ease-out';
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    // Auto-fade and remove the notification after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 500);
    }, 3000);
}


function showModal(title, message) {
    const modal = document.getElementById('search-result-modal');
    const modalTitle = document.getElementById('search-result-title');
    const modalMessage = document.getElementById('search-result-message');
    const closeBtn = document.getElementById('search-result-close');

    modalTitle.textContent = title;
    modalMessage.innerHTML = message;

    modal.style.display = 'flex';

    // Close the modal when clicking on the close button
    closeBtn.onclick = function () {
        modal.style.display = 'none';
    };

    // Close the modal when clicking outside of the modal content
    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}