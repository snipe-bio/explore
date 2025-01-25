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
    'Experiment ID', 'BioProject', 'Assay type', 'Primitive genome coverage at 1X',
    'Primitive amplicon coverage at 1X', 'Mean depth of genome sequencing', 'Mean depth of amplicon sequencing',
    'Genome mapping rate', 'Non-reference multiplets', 'Non-reference singletons', 'Coverage skewness score'
];

// Column Definitions
const columnDefinitions = {
    "Total unique k-mers": "It represents the unique genetic content in the sample",
    "Genomic unique k-mers": "It represents the unique genetic content in the sample that matches the reference genome",
    "Amplicon unique k-mers": "It represents the unique genetic content in the sample that matches the exome",
    "Primitive genome coverage at 1X": "It shows how much of the genome bases are covered",
    "Primitive amplicon coverage at 1X": "It shows how much of the exome bases are covered",
    "k-mer total abundance": "It correlates with the total amount of sequencing",
    "Genomic k-mers total abundance": "It correlates with the total amount of sequencing that aligns to the reference genome",
    "Amplicon k-mers total abundance": "It correlates with the total amount of sequencing that aligns to the exome",
    "Genome mapping rate": "Genomic k-mers total abundance as a fraction of all k-mer total abundance. It correlates with the mapped sequencing bases to the genomes",
    "Non-reference multiplets": "The fraction abundance of non-genomic k-mers if the k-mer count > 1. It represents genetic variance and increases if there is sequence contamination",
    "Empirical contamination index": "The fraction of k-mers matching microbial sequences. It is calculated by Sourmash software and expected to correlate with Snipe's predicted contamination index",
    "Non-reference singletons": "The fraction abundance of non-genomic k-mers if the k-mer count = 1 (i.e., singletons). It represents sequencing errors",
    "Coverage skewness score": "The coefficient of variation (CV) for the mean abundance of k-mers specific to each autosome. A high CV suggests variability, potentially pointing to uneven sequencing",
    "Amplicon enrichment score": "A composite metric for quantifying amplicon enrichment in a sequencing experiment",
    "chrX Ploidy": "The ratio of the mean abundance of chrX-specific k-mers to autosomal-specific k-mers. It correlates with X chromosome ploidy",
    "chrY Coverage": "The ratio of sequence coverage for chrY and autosomal chromosomes.",
    "Gain in genome coverage with 1 extra fold": "Expected coverage with 1 fold more sequencing"
};

// Function to populate the modal with column definitions
// Ensure the function is available globally
window.populateModalColumnDefinitions = function() {
    const columnDefinitionsDiv = document.getElementById('modal-column-definitions');
    if (!columnDefinitionsDiv) return;

    // Check if data is available
    if (!data || !data[0]) {
        console.error('Data not available for column definitions');
        return;
    }

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
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof populateModalColumnDefinitions === 'function') {
        populateModalColumnDefinitions();
    }
});






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

// -------- SNIPE PLOT FILTERS --------


// Initialize plotFilters globally
let plotFilters = {};
let filterGroupCounter = 0; // Global counter for unique filter indexes

// Function to open the Filter modal
let currentFilterPlotId = null;

function openFilterModal(plotId) {
    currentFilterPlotId = plotId;
    const modal = document.getElementById('filter-modal');
    modal.style.display = 'flex';
    populateFilterGroups(plotId);

    // Allow closing modal by clicking outside of it
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    // Trigger a window resize event after a short delay to ensure modal is rendered
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 300);
}


// Close Filter modal
document.addEventListener('DOMContentLoaded', () => {
    const filterModalClose = document.getElementById('filter-modal-close');
    if (filterModalClose) {
        filterModalClose.addEventListener('click', () => {
            document.getElementById('filter-modal').style.display = 'none';
        });
    }

    // Add Filter Group
    const addFilterGroupBtn = document.getElementById('add-filter-group');
    if (addFilterGroupBtn) {
        addFilterGroupBtn.addEventListener('click', () => {
            addFilterGroup();
        });
    }

    // Apply Filters
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            applyFilters();
            document.getElementById('filter-modal').style.display = 'none';
        });
    }
});

// Function to populate existing filter groups (if any)
function populateFilterGroups(plotId) {
    const filterGroupsContainer = document.getElementById('filter-groups-container');
    filterGroupsContainer.innerHTML = ''; // Clear existing

    const filters = plotFilters[plotId];
    if (filters && filters.length > 0) {
        filters.forEach((filterGroup, index) => {
            // Create the filter group with existing data
            addFilterGroup(filterGroup);

            // Get the newly created filter group
            const groupDiv = filterGroupsContainer.children[index];

            // If this is a categorical filter with values
            if (filterGroup.value && Array.isArray(filterGroup.value)) {
                // Force column select change to create the categorical filter UI
                const columnSelect = groupDiv.querySelector('.column-select');
                if (columnSelect) {
                    // Set the column value
                    columnSelect.value = filterGroup.column;

                    // Trigger change event to create the filter UI
                    columnSelect.dispatchEvent(new Event('change'));

                    // Short delay to ensure UI is created
                    setTimeout(() => {
                        // Get the container where tags should be
                        const valueInputContainer = groupDiv.querySelector('.value-input-container');
                        if (valueInputContainer) {
                            const tagsContainer = valueInputContainer.querySelector('.tags-container');
                            if (tagsContainer) {
                                // Clear any existing tags
                                tagsContainer.innerHTML = '';

                                // Recreate tags for each value
                                filterGroup.value.forEach(value => {
                                    const tag = document.createElement('span');
                                    tag.className = 'tag';
                                    tag.style.display = 'inline-flex';
                                    tag.style.alignItems = 'center';
                                    tag.style.padding = '5px';
                                    tag.style.margin = '2px';
                                    tag.style.backgroundColor = '#007bff';
                                    tag.style.color = '#fff';
                                    tag.style.borderRadius = '3px';
                                    tag.dataset.value = value;
                                    tag.textContent = value;

                                    const removeBtn = document.createElement('span');
                                    removeBtn.textContent = ' ×';
                                    removeBtn.style.cursor = 'pointer';
                                    removeBtn.style.marginLeft = '5px';
                                    removeBtn.addEventListener('click', () => {
                                        tagsContainer.removeChild(tag);
                                        const index = groupDiv.selectedCategories.indexOf(value);
                                        if (index > -1) {
                                            groupDiv.selectedCategories.splice(index, 1);
                                        }
                                        // Update datalist options
                                        const datalist = groupDiv.querySelector('datalist');
                                        if (datalist) {
                                            const input = groupDiv.querySelector('.autocomplete-input');
                                            if (input) {
                                                input.dispatchEvent(new Event('change'));
                                            }
                                        }
                                    });

                                    tag.appendChild(removeBtn);
                                    tagsContainer.appendChild(tag);
                                });

                                // Ensure selectedCategories is properly set
                                groupDiv.selectedCategories = [...filterGroup.value];
                            }
                        }
                    }, 100);
                }
            }
        });
    } else {
        addFilterGroup();
    }
}

// Function to determine if a column is numerical
function isNumerical(column) {
    const uniqueValues = new Set(data.map(row => row[column]));
    if (uniqueValues.size <= 3) {
        return false;
    }

    // Filter out null or undefined values
    const nonNullData = data.filter(row => row[column] !== null && row[column] !== undefined && row[column] !== '');

    const numericCount = nonNullData.filter(row => {
        const value = row[column];
        return !isNaN(parseFloat(value)) && isFinite(value);
    }).length;

    // Ensure there are non-null values to avoid division by zero
    if (nonNullData.length === 0) {
        return false;
    }

    return (numericCount / nonNullData.length) >= 0.9; // 90% or more non-null values are numeric
}

function addFilterGroup(existingGroup = null) {
    const filterGroupsContainer = document.getElementById('filter-groups-container');
    const isFirstGroup = filterGroupsContainer.children.length === 0;

    filterGroupCounter++; // Increment the counter
    const filterIndex = filterGroupCounter; // Assign a unique filterIndex

    const groupDiv = document.createElement('div');
    groupDiv.className = 'filter-group';
    groupDiv.style.border = '1px solid #ccc';
    groupDiv.style.padding = '10px';
    groupDiv.style.marginBottom = '10px';
    groupDiv.style.borderRadius = '5px';
    groupDiv.style.position = 'relative';

    const logicSelect = document.createElement('select');
    logicSelect.className = 'form-control form-control-sm logic-select';
    logicSelect.style.width = '150px';

    if (isFirstGroup) {
        logicSelect.innerHTML = `
                    <option value="">(Select Logic)</option>
                    <option value="NOT">NOT</option>
                `;
        logicSelect.value = existingGroup && existingGroup.logic ? existingGroup.logic : '';
    } else {
        logicSelect.innerHTML = `
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                    <option value="NOT">NOT</option>
                `;
        logicSelect.value = existingGroup && existingGroup.logic ? existingGroup.logic : 'AND';
    }

    // Condition Div
    const conditionDiv = document.createElement('div');
    conditionDiv.className = 'condition-div';

    const columnSelect = document.createElement('select');
    columnSelect.className = 'form-control form-control-sm column-select';
    columnSelect.style.marginRight = '10px';
    columnSelect.innerHTML = `<option value="">Select Column</option>`;
    const columns = Object.keys(data[0]).filter(col => !col.startsWith('_'));
    columns.forEach(col => {
        columnSelect.innerHTML += `<option value="${col}">${col}</option>`;
    });
    if (existingGroup && existingGroup.column) {
        columnSelect.value = existingGroup.column;
    }

    const operatorSelect = document.createElement('select');
    operatorSelect.className = 'form-control form-control-sm operator-select';
    operatorSelect.style.marginRight = '10px';

    const valueInput = document.createElement('div'); // Container for dynamic inputs
    valueInput.className = 'value-input-container';

    conditionDiv.appendChild(columnSelect);
    conditionDiv.appendChild(operatorSelect);
    conditionDiv.appendChild(valueInput);

    const removeButton = document.createElement('button');
    removeButton.className = 'btn btn-danger btn-sm remove-filter-group';
    removeButton.style.position = 'absolute';
    removeButton.style.top = '10px';
    removeButton.style.right = '10px';
    removeButton.innerHTML = '<i class="fa fa-times"></i>';
    removeButton.addEventListener('click', () => {
        filterGroupsContainer.removeChild(groupDiv);
    });

    groupDiv.appendChild(logicSelect);
    groupDiv.appendChild(conditionDiv);
    groupDiv.appendChild(removeButton);

    filterGroupsContainer.appendChild(groupDiv);

    // Function to get min and max of a numerical column
    function getMinMax(column) {
        const values = data.map(row => parseFloat(row[column])).filter(val => !isNaN(val));
        return {
            min: Math.min(...values),
            max: Math.max(...values)
        };
    }

    function createRangeFilter(container, column, existingValues = null) {
        container.innerHTML = ''; // Clear existing content

        const { min, max } = getMinMax(column);

        // Create Bootstrap grid structure
        const outerDiv = document.createElement('div');
        outerDiv.className = 'container-fluid';

        const rowDiv = document.createElement('div');
        rowDiv.className = 'row mt-3 p-3 border rounded';
        rowDiv.style.backgroundColor = '#f9f9f9';

        // Label Column
        const labelCol = document.createElement('div');
        labelCol.className = 'col-12 d-flex justify-content-center align-items-center mb-2';
        const label = document.createElement('label');
        label.className = 'mb-0';
        label.textContent = `${column} Range:`;
        labelCol.appendChild(label);

        // Min Input Column with "Min" label inside input
        const minInputCol = document.createElement('div');
        minInputCol.className = 'col-5';

        const minInputGroup = document.createElement('div');
        minInputGroup.className = 'input-group input-group-sm';

        const minInputLabel = document.createElement('span');
        minInputLabel.className = 'input-group-text';
        minInputLabel.textContent = 'Min';
        minInputLabel.style.fontSize = '0.8rem';

        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.className = 'form-control';
        minInput.placeholder = min;

        minInputGroup.appendChild(minInputLabel);
        minInputGroup.appendChild(minInput);
        minInputCol.appendChild(minInputGroup);

        // Max Input Column with "Max" label inside input
        const maxInputCol = document.createElement('div');
        maxInputCol.className = 'col-5';

        const maxInputGroup = document.createElement('div');
        maxInputGroup.className = 'input-group input-group-sm';

        const maxInputLabel = document.createElement('span');
        maxInputLabel.className = 'input-group-text';
        maxInputLabel.textContent = 'Max';
        maxInputLabel.style.fontSize = '0.8rem';

        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.className = 'form-control';
        maxInput.placeholder = max;

        maxInputGroup.appendChild(maxInputLabel);
        maxInputGroup.appendChild(maxInput);
        maxInputCol.appendChild(maxInputGroup);

        // Slider Column
        const sliderCol = document.createElement('div');
        sliderCol.className = 'col-12 my-2';
        const sliderDiv = document.createElement('div');
        sliderDiv.className = 'range-slider filter-modal-slider';
        sliderDiv.id = `slider-${currentFilterPlotId}-filter-${filterIndex}-range`;
        sliderCol.appendChild(sliderDiv);

        // Assemble the layout
        rowDiv.appendChild(labelCol);
        rowDiv.appendChild(sliderCol);
        rowDiv.appendChild(minInputCol);
        rowDiv.appendChild(maxInputCol);

        // Append row to container
        outerDiv.appendChild(rowDiv);
        container.appendChild(outerDiv);

        // Initialize noUiSlider
        noUiSlider.create(sliderDiv, {
            start: existingValues ? [existingValues.min, existingValues.max] : [min, max],
            connect: true,
            range: {
                'min': min,
                'max': max
            },
            tooltips: [false, false],
            format: {
                to: function (value) {
                    return Number(value).toFixed(2);
                },
                from: function (value) {
                    return Number(value);
                }
            }
        });

        // Set initial values if existing
        if (existingValues) {
            minInput.value = existingValues.min;
            maxInput.value = existingValues.max;
        } else {
            minInput.value = min;
            maxInput.value = max;
        }

        // Synchronize slider with inputs
        sliderDiv.noUiSlider.on('update', (values, handle) => {
            if (handle === 0) {
                minInput.value = values[0];
            } else {
                maxInput.value = values[1];
            }
        });

        // Update slider when inputs change
        minInput.addEventListener('change', () => {
            let val = parseFloat(minInput.value);
            if (isNaN(val)) val = min;
            val = Math.max(val, min);
            val = Math.min(val, parseFloat(maxInput.value) || max); // Ensure min <= max
            sliderDiv.noUiSlider.set([val, null]);
        });

        maxInput.addEventListener('change', () => {
            let val = parseFloat(maxInput.value);
            if (isNaN(val)) val = max;
            val = Math.min(val, max);
            val = Math.max(val, parseFloat(minInput.value) || min); // Ensure max >= min
            sliderDiv.noUiSlider.set([null, val]);
        });
    }

    function createCategoricalFilter(container, column, selectedCategories = []) {
        container.innerHTML = ''; // Clear existing content

        // Create input for autocomplete
        const autocompleteInput = document.createElement('input');
        autocompleteInput.type = 'text';
        autocompleteInput.className = 'form-control form-control-sm autocomplete-input';
        autocompleteInput.placeholder = 'Type to search...';

        // Create container for selected tags
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'tags-container';
        tagsContainer.style.marginTop = '5px';
        tagsContainer.style.display = 'flex';
        tagsContainer.style.flexWrap = 'wrap';

        container.appendChild(autocompleteInput);
        container.appendChild(tagsContainer);

        // Extract unique categories from data
        const categories = Array.from(new Set(data.map(row => row[column]))).sort();

        // Initialize autocomplete (using a simple datalist for demonstration)
        const datalist = document.createElement('datalist');
        datalist.id = `datalist-${currentFilterPlotId}-filter-${filterIndex}`;
        container.appendChild(datalist);
        autocompleteInput.setAttribute('list', datalist.id);

        // Function to update datalist options
        function updateDatalistOptions() {
            const availableCategories = categories.filter(cat => !selectedCategories.includes(cat));

            datalist.innerHTML = '';
            availableCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                datalist.appendChild(option);
            });
        }

        // Function to add a tag
        function addTag(value) {
            if (selectedCategories.includes(value)) return; // Avoid duplicates

            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.style.display = 'inline-flex';
            tag.style.alignItems = 'center';
            tag.style.padding = '5px';
            tag.style.margin = '2px';
            tag.style.backgroundColor = '#007bff';
            tag.style.color = '#fff';
            tag.style.borderRadius = '3px';
            tag.dataset.value = value;

            tag.textContent = value;

            const removeBtn = document.createElement('span');
            removeBtn.textContent = ' ×';
            removeBtn.style.cursor = 'pointer';
            removeBtn.style.marginLeft = '5px';
            removeBtn.addEventListener('click', () => {
                tagsContainer.removeChild(tag);
                const index = selectedCategories.indexOf(value);
                if (index > -1) {
                    selectedCategories.splice(index, 1);
                }
                updateDatalistOptions();
            });

            tag.appendChild(removeBtn);
            tagsContainer.appendChild(tag);
            selectedCategories.push(value);
            updateDatalistOptions();
        }

        if (Array.isArray(selectedCategories) && selectedCategories.length > 0) {
            selectedCategories.forEach(val => {
                if (categories.includes(val)) { // Ensure the value is valid
                    addTag(val);
                }
            });
        }

        // Handle selection from autocomplete
        autocompleteInput.addEventListener('change', () => {
            const value = autocompleteInput.value.trim();
            if (value && categories.includes(value) && !selectedCategories.includes(value)) {
                addTag(value);
                autocompleteInput.value = '';
            }
        });

        // Handle Enter key
        autocompleteInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = autocompleteInput.value.trim();
                if (value && categories.includes(value) && !selectedCategories.includes(value)) {
                    addTag(value);
                    autocompleteInput.value = '';
                }
            }
        });

        // Initialize datalist options
        updateDatalistOptions();
    }


    // Event listener for column selection
    // Event listener for column selection
    columnSelect.addEventListener('change', () => {
        const selectedColumn = columnSelect.value;
        valueInput.innerHTML = ''; // Clear existing content

        if (!selectedColumn) {
            operatorSelect.style.display = 'none'; // Hide operator select if no column is selected
            return;
        }

        if (isNumerical(selectedColumn)) {
            // Hide operator select for numerical columns
            operatorSelect.style.display = 'none';

            // Get existing filter values if any
            let existingValues = null;
            if (existingGroup && existingGroup.value && typeof existingGroup.value === 'object') {
                existingValues = existingGroup.value;
            }
            createRangeFilter(valueInput, selectedColumn, existingValues);
        } else {
            // Show operator select for non-numerical columns
            operatorSelect.style.display = 'block';

            // Set operator options for categorical columns
            operatorSelect.innerHTML = `
                <option value="in">In</option>
                <option value="not_in">Not In</option>
            `;
            if (existingGroup && existingGroup.operator) {
                operatorSelect.value = existingGroup.operator;
            } else {
                operatorSelect.value = 'in'; // Default to 'In' if no existing operator
            }

            // Get existing filter values if any
            let existingValues = [];
            if (existingGroup && existingGroup.value && Array.isArray(existingGroup.value)) {
                existingValues = existingGroup.value;
            }

            // Create a container for storing selected values
            let selectedCategories = existingValues.slice(); // make a copy

            // Assign selectedCategories to groupDiv for later access
            groupDiv.selectedCategories = selectedCategories;

            createCategoricalFilter(valueInput, selectedColumn, selectedCategories);
        }
    });

    // Trigger change event if existingGroup has a column
    if (existingGroup && existingGroup.column) {
        columnSelect.dispatchEvent(new Event('change'));
    }
}

function applyFilters() {
    const filterGroups = [];
    const filterGroupDivs = document.querySelectorAll('#filter-groups-container .filter-group');
    filterGroupDivs.forEach((groupDiv, index) => {
        const logicSelect = groupDiv.querySelector('.logic-select');
        const logic = logicSelect ? logicSelect.value : '';
        const column = groupDiv.querySelector('.column-select').value;
        const operatorSelect = groupDiv.querySelector('.operator-select');
        const operator = operatorSelect && operatorSelect.style.display !== 'none' ? operatorSelect.value : null;
        let value = null;

        if (!column) return; // Skip incomplete filters

        // Determine if the column is numerical
        const isNumericalColumn = isNumerical(column);

        if (isNumericalColumn) {
            // Get slider values
            const slider = groupDiv.querySelector('.range-slider');
            if (slider && slider.noUiSlider) {
                const [min, max] = slider.noUiSlider.get().map(Number);
                value = { min, max };
            }
        } else {
            // Get selected categories
            let selectedCategories = groupDiv.selectedCategories;
            if (selectedCategories && selectedCategories.length > 0) {
                value = selectedCategories.slice(); // make a copy
            } else {
                value = [];
            }
        }

        if (value !== null && value !== undefined && (operator || isNumericalColumn)) {
            filterGroups.push({ logic, column, operator, value });
        }
    });

    if (currentFilterPlotId) {
        setPlotFilters(currentFilterPlotId, filterGroups);
        updatePlot(currentFilterPlotId);
        updateCountsDisplay(currentFilterPlotId);
    }
}

// Function to set filters for a plot
function updateCountsDisplay(plotId) {
    const plotData = getPlotData(plotId);
    const statsContainer = document.querySelector(`#container-${plotId} .plot-stats`);
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-item">Total Points: ${plotData.stats.totalPoints}</div>
            <div class="stat-item">Visible Points: ${plotData.stats.visiblePoints}</div>
            <div class="stat-item">Filters Applied: ${plotData.stats.filters.length}</div>
        `;
    }
}
function setPlotFilters(plotId, filters) {
    const plotData = getPlotData(plotId);
    
    // Store filters
    plotFilters[plotId] = filters.map(filter => {
        const numerical = isNumerical(filter.column);
        if (!numerical) {
            filter.value = Array.isArray(filter.value) ? filter.value : [];
        }
        return filter;
    });

    // Apply filters to raw data
    plotData.filteredData = plotData.rawData.filter(row => {
        return filters.every(filter => {
            const value = row[filter.column];
            if (filter.operator === '=') {
                return filter.value.includes(value);
            } else if (filter.operator === '>') {
                return value > filter.value;
            } else if (filter.operator === '<') {
                return value < filter.value;
            }
            return true;
        });
    });

    // Update plot stats
    updatePlotStats(plotId);
    updateCountsDisplay(plotId);
}

// Ensure that the Filter button is added to each plot
function addFilterButtonsToPlots() {
    for (let i = 1; i <= plotCounter; i++) {
        const plotId = `plot-${i}`;
        
        // Initialize plot data if not already initialized
        const plotData = getPlotData(plotId);
        if (plotData.rawData.length === 0) {
            plotData.rawData = [...data]; // Copy global data
            plotData.filteredData = [...data];
            updatePlotStats(plotId);
        }

        const plotHeader = document.querySelector(`#container-${plotId} .card-header`);
        if (plotHeader && !document.getElementById(`filter-plot-${plotId}`)) {
            const filterButton = document.createElement('button');
            filterButton.id = `filter-plot-${plotId}`;
            filterButton.className = 'btn btn-light btn-sm mr-1';
            filterButton.title = 'Filter';
            filterButton.innerHTML = '<i class="fa fa-filter"></i>';
            plotHeader.appendChild(filterButton);

            // Event listener for Filter button
            filterButton.addEventListener('click', () => {
                openFilterModal(plotId);
            });
        }
    }
}

// Call addFilterButtonsToPlots after plots are initialized
document.addEventListener('DOMContentLoaded', () => {
    addFilterButtonsToPlots();
});



// -------- PLOT INFO MODAL HANDLER --------

// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', function () {
    // Function to open the Plot Info Modal with specific content
    function openPlotInfoModal(plotId) {
        const modal = document.getElementById('plot-info-modal');
        const contentDiv = document.getElementById('plot-info-content');
        const title = document.getElementById('plot-info-title');

        // Fetch or generate content based on plotId
        // Replace this with your actual data fetching or content generation logic
        const plotData = getPlotData(plotId); // Example function

        if (plotData) {
            title.textContent = `Plot Information for Plot ${plotId}`;
            contentDiv.innerHTML = `
                <h3>Parameters</h3>
                <p>${plotData.parameters}</p>
                <h3>Operations Log</h3>
                <pre class="log-info">${plotData.operationsLog}</pre>
                <h3>Filters</h3>
                <p>${plotData.filters}</p>
            `;
        } else {
            title.textContent = 'Plot Information';
            contentDiv.innerHTML = '<p>No data available for this plot.</p>';
        }

        modal.style.display = 'flex';
    }

    // Function to close the Plot Info Modal
    function closePlotInfoModal() {
        const modal = document.getElementById('plot-info-modal');
        modal.style.display = 'none';
    }

    // Sample function to get plot data based on plotId
    // Replace this with your actual data retrieval logic (e.g., AJAX call)
    // Global storage for plot-specific data and stats
const plotDataStore = {};

function getPlotData(plotId) {
    if (!plotDataStore[plotId]) {
        // Initialize new plot data structure
        plotDataStore[plotId] = {
            rawData: [],
            filteredData: [],
            stats: {
                totalPoints: 0,
                visiblePoints: 0,
                filters: []
            },
            operationsLog: [],
            parameters: {}
        };
    }
    return plotDataStore[plotId];
}

function updatePlotStats(plotId) {
    const plotData = getPlotData(plotId);
    plotData.stats.totalPoints = plotData.rawData.length;
    plotData.stats.visiblePoints = plotData.filteredData.length;
    return plotData.stats;
}

    // Assign event listeners to all plot info buttons
    const plotInfoButtons = document.querySelectorAll('.plot-info-button');

    plotInfoButtons.forEach(button => {
        button.addEventListener('click', function () {
            const plotId = this.getAttribute('data-plot-id');
            openPlotInfoModal(plotId);
        });
    });

    // Event Listener to Close the Plot Info Modal via Close Button
    const closeButton = document.getElementById('plot-info-modal-close');
    closeButton.addEventListener('click', closePlotInfoModal);

    // Event Listener to Close the Modal by Clicking Outside the Modal Content
    window.addEventListener('click', function (event) {
        const modal = document.getElementById('plot-info-modal');
        if (event.target === modal) {
            closePlotInfoModal();
        }
    });
});


// -------- SNIPE PLOT EXPORT --------

function exportPlot(plotId) {
    const plotDiv = document.getElementById(plotId);
    Plotly.toImage(plotDiv, { format: 'png', width: 1200, height: 800 }).then(function (dataUrl) {
        const link = document.createElement('a');
        link.download = `${plotId}.png`;
        link.href = dataUrl;
        link.click();
    });
}