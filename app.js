/// <reference path="camera.ts" />
/// <reference path="shaderProgram.ts" />
/// <reference path="model.ts" />
/// <reference path="dat-gui.d.ts" />
/// <reference path="gl-matrix.d.ts" />
function getContext(canvas) {
    var contexts = "webgl2,experimental-webgl2".split(",");
    var gl;
    var ctx;
    for (var i = 0; i < contexts.length; i++) {
        ctx = contexts[i];
        gl = canvas.getContext(contexts[i]);
        if (gl) {
            return gl;
        }
    }
    return null;
}
function getVendors() {
    var vendors = "ms,moz,webkit,o".split(",");
    if (!window.requestAnimationFrame) {
        var vendor;
        for (var i = 0; i < vendors.length; i++) {
            vendor = vendors[i];
            window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
            if (window.requestAnimationFrame) {
                break;
            }
        }
    }
}
var program;
var gl;
var camera;
function resetCamera() {
    camera = new Camera(new Float32Array([2.0, 3.5, 20]));
}
window.onload = function () {
    var stats = new Stats();
    //stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.domElement);
    var canvas = document.getElementById("mycanvas");
    gl = getContext(canvas);
    getVendors();
    resetCamera();
    var dragon = new Model("graveyard.json");
    var lightModel = new Model("sphere.json");
    var planeModel = new Model("plane.json");
    console.log("FINISH");
    gl.enable(gl.DEPTH_TEST);
    var program3 = new ShaderProgram();
    program3.addShader("shaders/ground.vert", gl.VERTEX_SHADER, mode.read_file);
    program3.addShader("shaders/ground.frag", gl.FRAGMENT_SHADER, mode.read_file);
    program3.compile_and_link();
    program3.addAttributes(["position", "normal", "texCoord"]);
    console.log(program3.attribLocations);
    program3.addUniforms(["proj", "view", "model", "texSampler"]);
    var program2 = new ShaderProgram();
    program2.addShader("shaders/light.vert", gl.VERTEX_SHADER, mode.read_file);
    program2.addShader("shaders/light.frag", gl.FRAGMENT_SHADER, mode.read_file);
    program2.compile_and_link();
    program2.addAttributes(["position"]);
    console.log(program2.attribLocations);
    program2.addUniforms(["proj", "view", "model"]);
    var program = new ShaderProgram();
    program.addShader("shaders/shader.vert", gl.VERTEX_SHADER, mode.read_file);
    program.addShader("shaders/shader.frag", gl.FRAGMENT_SHADER, mode.read_file);
    program.compile_and_link();
    program.addAttributes(["position", "normal", "texCoord"]);
    console.log(program.attribLocations);
    program.addUniforms(["proj", "view", "model", "viewPos", "minMaxDist", "fogType", "fogDensity", "texSampler", "LightPosition", "AmbientStrength"]);
    program.addUniforms(["Rim", "OnlyRim"]);
    program.addUniforms(["offset"]);
    program.use();
    var view = camera.GetViewMatrix();
    var projection = camera.GetProjectionMatrix(canvas.width, canvas.height);
    var model = mat4.create();
    var Config = function () {
        this.MinDist = 1.0;
        this.MaxDist = 75.0;
        this.FogType = -1;
        this.FogDensity = 0.04;
        this.AmbientStrength = 0.1;
        this.Rim = true;
        this.OnlyRim = false;
    };
    var config = new Config();
    var gui = new dat.GUI();
    gui.add(config, "MinDist", 1.0, 25.0);
    gui.add(config, "MaxDist", 25.0, 150.0);
    gui.add(config, "FogDensity", 0.001, 0.04);
    gui.add(config, 'FogType', { Normal: -1, Linear: 0, Exp: 1, Exp2: 2 });
    gui.add(config, "AmbientStrength", 0.01, 0.5);
    gui.add(config, "Rim", true);
    gui.add(config, "OnlyRim", false);
    var lightPosition = [0.0, 15.0, 0.0];
    gl.uniformMatrix4fv(program.uniformLocations['view'], false, view);
    gl.uniformMatrix4fv(program.uniformLocations['proj'], false, projection);
    gl.uniform3fv(program.uniformLocations["viewPos"], camera.position);
    gl.uniform2f(program.uniformLocations["minMaxDist"], config.MinDist, config.MaxDist);
    gl.uniform3f(program.uniformLocations["LightPosition"], lightPosition[0], lightPosition[1], lightPosition[2]);
    gl.uniform1i(program.uniformLocations["Rim"], config.Rim);
    gl.uniform1i(program.uniformLocations["OnlyRim"], config.OnlyRim);
    var identityMatrix = mat4.create();
    mat4.identity(identityMatrix);
    var angle = 0;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    var lastTime = Date.now();
    function initTexture(str) {
        var cubeTexture = gl.createTexture();
        var cubeImage = new Image();
        cubeImage.onload = function () { handleTextureLoaded(cubeImage, cubeTexture); };
        cubeImage.src = str;
        return cubeTexture;
    }
    function handleTextureLoaded(image, texture) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, // Level of details
        gl.RGBA, // Format
        gl.RGBA, gl.UNSIGNED_BYTE, // Size of each channel
        image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    var marmolTex = initTexture("marmol_2.jpg");
    var groundTex = initTexture("seamless_dirt_ground_texture_by_hhh316-d4fon0w.jpg");
    var offsets = [];
    var v = 15;
    for (var i = -v; i < v; i++) {
        for (var j = -v; j < v; j++) {
            offsets.push(vec3.fromValues(100 * i, 0.0, 100 * j));
        }
    }
    function randInt(max, min) {
        return ((min | 0) + Math.random() * (max + 1)) | 0;
    }
    function remRandom(arr, newLength) {
        var a = arr.slice();
        while (a.length > newLength)
            a.splice(randInt(a.length - 1), 1);
        return a;
    }
    offsets = remRandom(offsets, offsets.length / 2 - offsets.length / 4);
    //offsets = remRandom(offsets, offsets.length - randInt(offsets.length / 2, 0));
    var deltaTime = 0.0;
    var lightRot = 0.0;
    function updateMatrices() {
        var currentTime = Date.now();
        var timeElapsed = currentTime - lastTime;
        camera.timeElapsed = timeElapsed;
        deltaTime = timeElapsed;
        lastTime = currentTime;
        angle += timeElapsed * 0.001;
        lightRot += timeElapsed * 0.001;
        if (angle >= 180.0) {
            angle = -180.0;
        }
        mat4.translate(model, identityMatrix, vec3.fromValues(0.0, 0.0, 0.0));
        mat4.rotateY(model, model, 90.0 * Math.PI / 180);
        mat4.rotateY(model, model, glMatrix.toRadian(90.0));
        mat4.scale(model, model, vec3.fromValues(0.035, 0.035, 0.035));
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    var render = function (time) {
        updateMatrices();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        program.use();
        gl.uniformMatrix4fv(program.uniformLocations['view'], false, view);
        gl.uniformMatrix4fv(program.uniformLocations['proj'], false, projection);
        gl.uniformMatrix4fv(program.uniformLocations["model"], false, model);
        gl.uniform2f(program.uniformLocations["minMaxDist"], config.MinDist, config.MaxDist);
        gl.uniform1i(program.uniformLocations["fogType"], config.FogType);
        gl.uniform1f(program.uniformLocations["fogDensity"], config.FogDensity);
        gl.uniform1f(program.uniformLocations["AmbientStrength"], config.AmbientStrength);
        gl.uniform1i(program.uniformLocations["Rim"], config.Rim);
        gl.uniform1i(program.uniformLocations["OnlyRim"], config.OnlyRim);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, marmolTex);
        gl.uniform1i(program.uniformLocations["texSampler"], 0);
        lightPosition[0] += Math.cos(lightRot) * 0.6;
        //lightPosition[1] += Math.cos(lightRot) * 0.1;
        lightPosition[2] += Math.sin(lightRot) * 0.6;
        gl.uniform3f(program.uniformLocations["LightPosition"], lightPosition[0], lightPosition[1], lightPosition[2]);
        for (var i = 0; i < offsets.length; i++) {
            gl.uniform3fv(program.uniformLocations["offset"], offsets[i]);
            dragon.render();
        }
        program2.use();
        gl.uniformMatrix4fv(program2.uniformLocations['view'], false, view);
        gl.uniformMatrix4fv(program2.uniformLocations['proj'], false, projection);
        mat4.translate(model, identityMatrix, vec3.fromValues(lightPosition[0], lightPosition[1], lightPosition[2]));
        var lsize = 3.5;
        mat4.scale(model, model, vec3.fromValues(lsize, lsize, lsize));
        gl.uniformMatrix4fv(program2.uniformLocations["model"], false, model);
        lightModel.render();
        program3.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, groundTex);
        gl.uniform1i(program.uniformLocations["texSampler"], 0);
        gl.uniformMatrix4fv(program3.uniformLocations['view'], false, view);
        gl.uniformMatrix4fv(program3.uniformLocations['proj'], false, projection);
        mat4.translate(model, identityMatrix, vec3.fromValues(0.0, 0.0, 0.0));
        var lsize = 6.0;
        mat4.scale(model, model, vec3.fromValues(lsize, lsize, lsize));
        gl.uniformMatrix4fv(program3.uniformLocations["model"], false, model);
        planeModel.render();
    };
    //window.addEventListener('resize', resizeCanvas, false);
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    //resizeCanvas();
    var renderLoop = function (dt) {
        stats.begin();
        /**
        if (gl.NO_ERROR != gl.getError()) {
            console.log(gl.getError());
        }
        /**/
        render(dt);
        window.requestAnimationFrame(renderLoop);
        stats.end();
    };
    document.addEventListener("keydown", function (ev) {
        if (ev.keyCode === 40 || ev.keyCode === 38) {
            ev.preventDefault();
        }
        var key = String.fromCharCode(ev.keyCode);
        var speed = 0.05;
        switch (key) {
            case "W":
                camera.processKeyboard(4, speed);
                break;
            case "S":
                camera.processKeyboard(5, speed);
                break;
            case "A":
                camera.processKeyboard(2, speed);
                break;
            case "D":
                camera.processKeyboard(3, speed);
                break;
            case "E":
                // - .
                camera.processKeyboard(0, speed);
                break;
            case "Q":
                // + .
                camera.processKeyboard(1, speed);
                break;
            case "X":
                resetCamera();
                break;
        }
        switch (ev.keyCode) {
            case 38:
                camera.processMouseMovement(0.0, 2.5);
                break;
            case 40:
                camera.processMouseMovement(0.0, -2.5);
                break;
            case 37:
                camera.processMouseMovement(2.5, 0.0);
                break;
            case 39:
                camera.processMouseMovement(-2.5, 0.0);
                break;
        }
        view = camera.GetViewMatrix();
        projection = camera.GetProjectionMatrix(canvas.width, canvas.height);
        gl.uniformMatrix4fv(program.uniformLocations['view'], false, view);
        gl.uniformMatrix4fv(program.uniformLocations['proj'], false, projection);
        gl.uniform3fv(program.uniformLocations["viewPos"], camera.position);
    });
    renderLoop(0);
};
//# sourceMappingURL=app.js.map