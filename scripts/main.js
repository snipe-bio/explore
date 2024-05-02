Dropzone.autoDiscover = false;

function setupDropzone(elementId) {
    const dropzone = new Dropzone(elementId, {
        url: "#",
        autoProcessQueue: false,
        uploadMultiple: true,
        clickable: true,
        previewsContainer: false,
        init: function() {
            this.on("addedfile", function(file) {
                createFileRow(file, this, elementId + ' .file-list');
            });
        }
    });

    dropzone.on("totaluploadprogress", function(progress) {
        const fileList = document.querySelector(elementId + ' .file-list');
        if (fileList.childNodes.length === 0) {
            document.querySelector(elementId + ' .dz-message').style.display = 'block';
        } else {
            document.querySelector(elementId + ' .dz-message').style.display = 'none';
        }
    });

    return dropzone;
}

function createFileRow(file, dropzoneInstance, fileListSelector) {
    const fileRow = document.createElement('div');
    fileRow.className = 'file-row';
    const fileName = document.createElement('span');
    fileName.className = 'file-name';
    fileName.textContent = `${file.name} (${file.size} bytes)`;

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = function() {
        dropzoneInstance.removeFile(file);
        fileRow.parentNode.removeChild(fileRow);
        dropzoneInstance.emit("totaluploadprogress");
    };

    fileRow.appendChild(fileName);
    fileRow.appendChild(deleteBtn);

    document.querySelector(fileListSelector).appendChild(fileRow);
    document.querySelector(fileListSelector).parentNode.querySelector('.dz-message').style.display = 'none';
}

setupDropzone("#samples-dropzone");
setupDropzone("#reference-dropzone");
setupDropzone("#amplicon-dropzone");
