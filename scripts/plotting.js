// scripts/plotting.js
function plotData({divId, data, x, y, xTitle, yTitle, mainTitle, xLog, yLog, highlightIds = []}) {
    const uniqueAssayTypes = [...new Set(data.map(d => d.assay_type))];
    
    let traces = uniqueAssayTypes.map(assay_type => {
        return {
            x: data.filter(d => d.assay_type === assay_type).map(d => d[x]),
            y: data.filter(d => d.assay_type === assay_type).map(d => d[y]),
            mode: 'markers',
            type: 'scatter',
            name: assay_type,
            text: data.filter(d => d.assay_type === assay_type).map(d => 
                `Run: ${d.run}, 
                Biosample: ${d.biosample}, 
                Experiment: ${d.experiment}, 
                BioProject: ${d.bioproject}
                Coding_Saturation: ${d.coding_saturation},
                Genomic_Saturation: ${d.genomic_saturation},
                `
                ),
            marker: { size: 10, opacity: 0.5 },
        };
    });

    if (highlightIds.length > 0) {
        const extracted_highlight = document.getElementById('searchBox').value;
        const highlightTrace = {
            x: highlightIds.map(id => data[id][x]),
            y: highlightIds.map(id => data[id][y]),
            mode: 'markers',
            type: 'scatter',
            text: highlightIds.map(id => 
                `Run: ${data[id].run}, 
                Biosample: ${data[id].biosample}, 
                Experiment: ${data[id].experiment}, 
                BioProject: ${data[id].bioproject}
                Coding_Saturation: ${data[id].coding_saturation},
                Genomic_Saturation: ${data[id].genomic_saturation},
                `),
            name: extracted_highlight,
            marker: { color: 'black', size: 14, opacity: 0.8 },
        };
        traces.push(highlightTrace);
    }

    const layout = {
        hovermode: 'closest',
        title: mainTitle,
        xaxis: {title: xTitle, type: xLog ? 'log' : 'linear'},
        yaxis: {title: yTitle, type: yLog ? 'log' : 'linear'},
        autosize: true,
        margin: {l: 50, r: 50, b: 100, t: 100, pad: 4}
    };

    Plotly.newPlot(divId, traces, layout, {responsive: true});
}

function setupSearch(callback) {
    document.getElementById('searchButton').addEventListener('click', function() {
        const searchQuery = document.getElementById('searchBox').value.toLowerCase();
        const highlightIds = window.data.flatMap((d, index) => 
            d.run.toLowerCase().includes(searchQuery) ||
            d.biosample.toLowerCase().includes(searchQuery) ||
            d.experiment.toLowerCase().includes(searchQuery) ||
            d.bioproject && d.bioproject.toLowerCase().includes(searchQuery) ? index : []
        );
        callback(highlightIds);
    });
}

function initializePlot(config) {
    fetch(config.dataUrl)
        .then(response => response.json())
        .then(data => {
            window.data = data;
            plotData({
                divId: config.plotDiv,
                data: data,
                x: config.x,
                y: config.y,
                xTitle: config.xTitle,
                yTitle: config.yTitle,
                mainTitle: config.mainTitle,
                xLog: config.xLog,
                yLog: config.yLog
            });
            setupSearch(highlightIds => {
                plotData({
                    divId: config.plotDiv,
                    data: data,
                    x: config.x,
                    y: config.y,
                    xTitle: config.xTitle,
                    yTitle: config.yTitle,
                    mainTitle: config.mainTitle,
                    xLog: config.xLog,
                    yLog: config.yLog,
                    highlightIds: highlightIds
                });
            });
        });
}

document.getElementById('speciesDropdown').addEventListener('change', function() {
    const species = this.value;
    const plotConfig = {
        plotDiv: 'plot',
        dataUrl: `../data/${species}_data.json`,
        x: 'trimmed_unique_hashes',
        y: 'trimmed_genomic_hashes',
        xTitle: 'Unique Hashes',
        yTitle: 'Genomic Coverage',
        mainTitle: `Unique Hashes vs Genomic Coverage (${species.charAt(0).toUpperCase() + species.slice(1)})`,
        xLog: false,
        yLog: false
    };

    // Autofill genome upload box
    fetch(`../data/${species}_genome.sig`)
        .then(response => response.text())
        .then(data => {
            // Assuming the genomeDropzone is already initialized
            const mockFile = new File([data], `${species}_genome.sig`, { type: 'application/octet-stream' });
            Dropzone.forElement('#reference-dropzone').emit("addedfile", mockFile);
            Dropzone.forElement('#reference-dropzone').emit("complete", mockFile);
        });

    document.getElementById('searchContainer').style.display = 'block';
    document.getElementById('plot').style.display = 'block';
    initializePlot(plotConfig);
});
