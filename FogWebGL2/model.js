var Model = (function () {
    function Model(fileRoute) {
        console.log("Loading file");
        this.loadJSON(fileRoute);
    }
    Model.prototype.render = function () {
        gl.bindVertexArray(this.vao);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    };
    Model.prototype.renderArrayInstance = function (numInstances) {
        gl.bindVertexArray(this.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 100);
        gl.bindVertexArray(null);
    };
    Model.prototype.createBuffer = function (data) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        return buffer;
    };
    Model.prototype.addAttrib = function (attribLocation, buffer, numElems) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(attribLocation, // Attribute location
        numElems, // Number of elements per attribute
        gl.FLOAT, // Type of elements
        false, numElems * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
        0 // Offset from the beginning of a single vertex to this attribute
        );
        gl.enableVertexAttribArray(attribLocation);
    };
    Model.prototype.createVAO = function (model, indicesArray) {
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indicesArray), gl.STATIC_DRAW);
        console.log(model.meshes[0]);
        if (model.meshes[0].vertices)
            this.addAttrib(0, this.createBuffer(model.meshes[0].vertices), 3);
        if (model.meshes[0].normals)
            this.addAttrib(1, this.createBuffer(model.meshes[0].normals), 3);
        if (model.meshes[0].texturecoords)
            this.addAttrib(2, this.createBuffer(model.meshes[0].texturecoords[0]), 2);
        gl.bindVertexArray(null);
    };
    Model.prototype.loadJSON = function (url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, false);
        var self = this;
        request.onload = function () {
            if (request.status < 200 || request.status > 299) {
                console.log('Error: HTTP Status ' + request.status + ' on resource ' + url);
                return {};
            }
            else {
                var modelObj = JSON.parse(request.responseText);
                self.indices = [].concat.apply([], modelObj.meshes[0].faces);
                console.log("Creating VAO");
                self.createVAO(modelObj, self.indices);
                console.log("Finish creating VAO");
            }
        };
        request.send();
    };
    return Model;
}());
;
//# sourceMappingURL=model.js.map