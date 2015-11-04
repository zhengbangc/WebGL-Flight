
var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

// Create a place to store terrain geometry
var tVertexPositionBuffer;

//Create a place to store normals for shading
var tVertexNormalBuffer;

// Create a place to store the terrain triangles
var tIndexTriBuffer;

//Create a place to store the traingle edges
var tIndexEdgeBuffer;

// View parameters
var eyePt = vec3.fromValues(0,15,0);
var eyePt_velocity = 1;
var viewDir = vec3.fromValues(0,-0.5,-1);
var up = vec3.fromValues(0,1,0.0);
var right = vec3.fromValues(1.0,0,0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];


//-------------------------------------------------------------------------
/*This is the function to set up the vertex buffer, the face buffer and the normal buffer
 *It calls the function terrainFromIteration im terrainModeling.js which creates a terrain with roughness
 *by implementing the dimondSqaure algorithm which generate random height for each vertex*/
function setupTerrainBuffers() {
    
    var vTerrain=[];
    var fTerrain=[];
    var nTerrain=[];
    var eTerrain=[];
    var gridN= Math.pow(2,7); //the number of grid x axis and y axis are divided into
    var numT = terrainFromIteration(gridN, -30,30,-30,30, vTerrain, fTerrain, nTerrain);
    console.log("Generated ", numT, " triangles"); 
    tVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
    tVertexPositionBuffer.itemSize = 3;
    tVertexPositionBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify normals to be able to do lighting calculations
    tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain),
                  gl.STATIC_DRAW);
    tVertexNormalBuffer.itemSize = 3;
    tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify faces of the terrain 
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain),
                  gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = numT*3;
    
    //Setup Edges
     generateLinesFromIndexedTriangles(fTerrain,eTerrain);  
     tIndexEdgeBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(eTerrain),
                  gl.STATIC_DRAW);
     tIndexEdgeBuffer.itemSize = 1;
     tIndexEdgeBuffer.numItems = eTerrain.length;
    
     
}

//-------------------------------------------------------------------------
/*this is the function to draw the terrain by binding the normal buffer and the vertex position buffer
 *it calls gl.drawElements to draw the terrain using small triangles*/
function drawTerrain(){
 gl.polygonOffset(0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
 gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

//-------------------------------------------------------------------------
/*this is the function to draw the edges on the triangles that construct the whole terrain
 *only called when the radio polygon with edges is checked in the html file*/
function drawTerrainEdges(){
 gl.polygonOffset(1,1);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
 gl.drawElements(gl.LINES, tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

//-------------------------------------------------------------------------
/* this is the function to upload the mvMatrix to the shaderProgram*/
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/* this is the function to upload the projection matrix to the shaderProgram*/
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/* this is the function to upload the normal matrix to the shaderProgram*/

function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/*this is the helper function to push the current matrix onto the model view matrix stack*/
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/*this is the helper function to pop the matrix on top of the stack from the model view matrix 
 stack and set the current model view matrix to this popped matrix*/
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/* this is the helper function to upload the mvMatrix, normal matrix and projection matrix to the shaderProgram*/
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
/* this is a helper function to change a angle in degrees into Radient
    the return value is the radient value equivalen*/

function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/* this is the function to create a gl context, alert if fail to create*/
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
/* this is the function to grab elements from DOM including the fragment shader and the vertex shader
  all our manipulation will be effective on those elements only if we load the shader from DOM*/
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

//----------------------------------------------------------------------------------
/* this function creates a shader program and sets the corresponding elements within the program with the values of
  the elements that we grab from DOM. And prgram will be use to change the shaders after set up*/
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
}


//-------------------------------------------------------------------------
/* this is the function basically upload the light position, ambientlight value, 
  diffuse light value and specular light value to the shader program use later to light 
  the terrain*/
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
/* helper function to setup a terrain buffer, we'll only need the terrain buffer in this case*/
function setupBuffers() {
    setupTerrainBuffers();
}

//----------------------------------------------------------------------------------
/* this is the function, to draw the image, once per tick. It first reset up the view point and the size, then it
  clear the previous color buffer to clear the images previously drawn (terrain in this case). Then it applies a 
  perspective transform the mvMatix. THen it updates the eye position and the view point. Then it regenerates the lookAt matrix.
  Finally, we set the mvMatrix with the correct translation and rotation, which should not be changed in this mp and then draw
  the terrain. */
function draw() { 
    resize(gl);
    var transformVec = vec3.create();
  
    // gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction 
    
    vec3.normalize(viewDir, viewDir);
    var eyePt_velocity_direction = vec3.create();
    eyePt_velocity_direction[0] = viewDir[0] / 100 * eyePt_velocity;
    eyePt_velocity_direction[1] = viewDir[1] / 100 * eyePt_velocity;
    eyePt_velocity_direction[2] = viewDir[2] / 100 * eyePt_velocity;
    vec3.add(eyePt, eyePt, eyePt_velocity_direction);

    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
 
    //Draw Terrain
    mvPushMatrix();
    vec3.set(transformVec,0,0,0);
    mat4.translate(mvMatrix, mvMatrix, transformVec);
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(-90));
    mat4.rotateY(mvMatrix, mvMatrix, degToRad(0));     
    


    setMatrixUniforms();
      // so this uploadLightToShader function is the one you need to fulling consider about
    //the parameters are location of the light source, ambient, diffusion and specular 
    
    if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
    {
      uploadLightsToShader([0,20,0],[0.7,0.39,0.2],[0.19,0.39,0],[0.1,0.1,0.1]);
                            //lightning location
      drawTerrain();
    }
    
    if(document.getElementById("wirepoly").checked){
      uploadLightsToShader([0,20,20],[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]);
      drawTerrainEdges();
    }

    if(document.getElementById("wireframe").checked){
      uploadLightsToShader([0,1,1],[1.0,1.0,1.0],[0.0,0.0,0.0],[0.0,0.0,0.0]);
      drawTerrainEdges();
    }
    mvPopMatrix();
  
}

//----------------------------------------------------------------------------------
/* this is the function we call from the main() js in the html file, it basically start up the js process here*/
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(0.0, 0.5, 0.6, 0.7);
  // gl.clearColor()
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
/* request the animation frame at each tick then it calls the draw function to draw the terrain.
  finally update the matrix by calling animate()*/

function tick() {
    requestAnimFrame(tick);
    draw();
    animate();

     $("#up>span").html("x:"+up[0]+"<br/>y:"+up[1]+"<br/>z:"+up[2]        );
     $("#forward>span").html("x:"+viewDir[0]+"<br/>y:"+viewDir[1]+"<br/>z:"+viewDir[2]        );
     $("#position>span").html("x:"+eyePt[0]+"<br/>y:"+eyePt[1]+"<br/>z:"+eyePt[2]);
     $('#velocity>span').html(eyePt_velocity);
}

//----------------------------------------------------------------------------------

// var last = 0;

// var forward = vec3.create([0, 0.9924753308296204, -0.12244734913110733]);
// var up = vec3.create([0, 0, 1, 0]);
// var position = vec3.create([12, 0, 1.2, 1]);

var angular_velocity_roll = 0;
var angular_velocity_pitch = 0;
var angular_velocity_yaw = 0;
var velocity = 0.002;

//---------------------------------------------------------------------------------
/* thie is the functin we use for animation, it basically update the necessay parameter needed for
  next process of drawing the terrain. We check the roll, pitch and yaw and see if the up, viewDir and right
  vectors are changed at all*/
function animate() {

   roll();
   pitch();
   yaw();
}

/* this is the function to update the up vector and the right vector if the key input specifies that 
  the plane should roll. Quaternion based design is implemented*/
function roll(){
  //in the roll function, we want to rotate the up vector around the viewDir axis
  //so first we need to construct a unit quaternion axis with the same director as viewDir
  var up_quat = quat.fromValues(up[0], up[1], up[2], 0);
  var right_quat = quat.fromValues(right[0], right[1], right[2], 0);
  var rollquat = quat.fromValues(viewDir[0], viewDir[1], viewDir[2], 0);
  quat.normalize(rollquat,rollquat); //then we need to normalize this axis
  //then we want to rotate the up vector (dipicted as a point) around this axis
  quat.setAxisAngle(rollquat, viewDir, degToRad(angular_velocity_roll));
  var rollquatCong = quat.create();
  quat.conjugate(rollquatCong, rollquat); 

  quat.multiply(up_quat, rollquat, up_quat);
  quat.multiply(up_quat, up_quat, rollquatCong);
  quat.multiply(right_quat, rollquat, right_quat);
  quat.multiply(right_quat, right_quat, rollquatCong);

  up[0] = up_quat[0];
  up[1] = up_quat[1];
  up[2] = up_quat[2];
  right[0] = right_quat[0];
  right[1] = right_quat[1];
  right[2] = right_quat[2];
}

/* this is the function to update the up vector and the viewDir vector if the key input specifies that 
  the plane should pitch. Quaternion based design is implemented*/
function pitch(){
  var up_quat = quat.fromValues(up[0], up[1], up[2], 0);
  var viewDir_quat = quat.fromValues(viewDir[0], viewDir[1], viewDir[2], 0);
  var pitchquat = quat.fromValues(right[0], right[1], right[2], 0); //rotate around the right axis

  quat.normalize(pitchquat,pitchquat);

  quat.setAxisAngle(pitchquat, right, degToRad(angular_velocity_pitch));
  var pitchquatCong = quat.create();
  quat.conjugate(pitchquatCong, pitchquat);

  quat.multiply(up_quat, pitchquat, up_quat);
  quat.multiply(up_quat, up_quat, pitchquatCong);
  quat.multiply(viewDir_quat, pitchquat, viewDir_quat);
  quat.multiply(viewDir_quat, viewDir_quat, pitchquatCong);

  up[0] = up_quat[0];
  up[1] = up_quat[1];
  up[2] = up_quat[2];
  viewDir[0] = viewDir_quat[0];
  viewDir[1] = viewDir_quat[1];
  viewDir[2] = viewDir_quat[2];
}
/* this is the function to update the viewDir vector and the right vector if the key input specifies that 
  the plane should yaw. Quaternion based design is implemented*/
function yaw(){
  var right_quat = quat.fromValues(right[0], right[1], right[2], 0);
  var viewDir_quat = quat.fromValues(viewDir[0], viewDir[1], viewDir[2], 0);
  var yawquat = quat.fromValues(up[0], up[1], up[2], 0); //rotate around the up axis

  quat.normalize(yawquat,yawquat);

  quat.setAxisAngle(yawquat, up, degToRad(angular_velocity_yaw));
  var yawquatCong = quat.create();
  quat.conjugate(yawquatCong, yawquat);

  quat.multiply(right_quat, yawquat, right_quat);
  quat.multiply(right_quat, right_quat, yawquatCong);
  quat.multiply(viewDir_quat, yawquat, viewDir_quat);
  quat.multiply(viewDir_quat, viewDir_quat, yawquatCong);

  right[0] = right_quat[0];
  right[1] = right_quat[1];
  right[2] = right_quat[2];
  viewDir[0] = viewDir_quat[0];
  viewDir[1] = viewDir_quat[1];
  viewDir[2] = viewDir_quat[2];
}

//----------------------------------------------------------------------------------
//function written to resize the screen to match the actual window size of the browser plus draw more detailed images
function resize(gl) {
  var realToCSSPixels = window.devicePixelRatio || 1;

  // Lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in
  // device pixels.
  var displayWidth  = Math.floor(gl.canvas.clientWidth  * realToCSSPixels);
  var displayHeight = Math.floor(gl.canvas.clientHeight * realToCSSPixels);

  // Check if the canvas is not the same size.
  if (gl.canvas.width  != displayWidth ||
      gl.canvas.height != displayHeight) {

    // Make the canvas the same size
    gl.canvas.width  = displayWidth;
    gl.canvas.height = displayHeight;

    // Set the viewport to match
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  }
}



//----------------------------------------------------------------------------------
/*jquery function to take in keyboard input*/
$(document).bind('keydown', function(e){
  var key = e.keyCode;

  if(key == 87){ //w
    angular_velocity_pitch = -0.5;
  }
  if(key == 83){ //s
     angular_velocity_pitch = 0.5;
  }
  if(key == 65){ //a
    angular_velocity_roll = -0.5;
  }
  if(key == 68){ //d
    angular_velocity_roll = 0.5;
  }
  if(key == 81){ //Q
    angular_velocity_yaw = 0.5;
  }
  if(key == 69){ //d
    angular_velocity_yaw = -0.5;
  }

  if(key == 189){ // -
    eyePt_velocity += -0.5;
    console.log(eyePt_velocity + "\n");
  }
  if(key == 187){ // +
     eyePt_velocity += 0.5;
  }
});

$(document).bind('keyup', function(e){
  var key = e.keyCode;
  if(key == 83 || key == 87){ //s w
    angular_velocity_pitch = 0;
  }
  if(key == 65 || key == 68){ //a d
    angular_velocity_roll = 0;
  }
  if(key == 81 || key == 69){
    angular_velocity_yaw = 0;
  }
});
